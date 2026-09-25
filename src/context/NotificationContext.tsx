import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
import { Notificacao } from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import { requestNotificationPermission, getFcmToken } from '../services/fcmClient';

// Limite de retenção para evitar crescimento infinito do localStorage
const MAX_PRESENTED_IDS = 300;
const POLLING_INTERVAL_MS = 45000; // 45 segundos

/**
 * Janela máxima de retroatividade para disparar popup/notificação em cold start (abertura do PWA)
 * Notificações criadas há mais de 48 horas continuam normalmente na Central de Notificações,
 * mas não geram popup intrusivo ao abrir o aplicativo.
 */
const COLD_START_MAX_AGE_HOURS = 48;
const COLD_START_MAX_AGE_MS = COLD_START_MAX_AGE_HOURS * 60 * 60 * 1000;

interface NotificationContextType {
  notificacoes: Notificacao[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  lastChecked: Date | null;
  activePopup: Notificacao | null;
  browserPermission: NotificationPermission | 'unsupported';
  isWebPushSupported: boolean;
  requestBrowserPermission: () => Promise<boolean>;
  refreshNotificacoes: () => Promise<void>;
  marcarComoLida: (id: string) => Promise<boolean>;
  marcarTodasComoLidas: () => Promise<boolean>;
  dismissPopup: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Normaliza o identificador de notificação
 */
const normalizeId = (id: any): string => {
  return String(id || '').trim();
};

/**
 * Verifica de forma estrita se o registro já está marcado como lido
 */
const isLidaStrict = (lida: any): boolean => {
  const s = String(lida || '').trim().toUpperCase();
  return s === 'SIM' || s === 'TRUE' || s === '1';
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // 1. HISTÓRICO: todas as notificações (lidas e não lidas) para exibição na central
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  // 2. POPUP INTERNO ATIVO
  const [activePopup, setActivePopup] = useState<Notificacao | null>(null);

  // Estados de controle de requisição
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // 3. JÁ APRESENTADAS (Presented Registry): IDs que já geraram popup/notificação nativa
  const presentedIdsRef = useRef<Set<string>>(new Set());
  // 4. JÁ LIDAS (Read Registry): IDs que já foram explicitamente marcadas como lidas
  const readIdsRef = useRef<Set<string>>(new Set());

  // Guards de concorrência e ciclo de vida
  const inFlightRef = useRef<boolean>(false);
  const initialLoadCompletedRef = useRef<boolean>(false);
  const fcmRegisteredRef = useRef<boolean>(false);
  const isRegisteringFcmRef = useRef<boolean>(false);
  const activeUserKeyRef = useRef<string>('');
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const userRef = useRef(user);
  userRef.current = user;
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  // Chaves de armazenamento escopadas por usuário no localStorage
  const storageKey = useMemo(() => {
    const username = user?.nome ? user.nome.trim().toLowerCase().replace(/\s+/g, '_') : 'guest';
    return `escala_louvor_presented_ids_${username}`;
  }, [user?.nome]);

  const readStorageKey = useMemo(() => {
    const username = user?.nome ? user.nome.trim().toLowerCase().replace(/\s+/g, '_') : 'guest';
    return `escala_louvor_read_ids_${username}`;
  }, [user?.nome]);

  // Carrega IDs já apresentados do localStorage para a sessão atual do usuário
  const carregarPresentedIdsDoStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          presentedIdsRef.current = new Set(parsed.map((id) => normalizeId(id)));
          return;
        }
      }
      presentedIdsRef.current = new Set();
    } catch {
      presentedIdsRef.current = new Set();
    }
  }, [storageKey]);

  // Carrega IDs já lidos do localStorage para a sessão atual do usuário
  const carregarReadIdsDoStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(readStorageKey);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          readIdsRef.current = new Set(parsed.map((id) => normalizeId(id)));
          return;
        }
      }
      readIdsRef.current = new Set();
    } catch {
      readIdsRef.current = new Set();
    }
  }, [readStorageKey]);

  // Persiste IDs apresentados aplicando retenção FIFO
  const persistirPresentedIds = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const list = Array.from(presentedIdsRef.current);
      const trimmed = list.slice(-MAX_PRESENTED_IDS);
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
    } catch {
      // Ignora erro de cota de localStorage
    }
  }, [storageKey]);

  // Persiste IDs lidos aplicando retenção FIFO
  const persistirReadIds = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const list = Array.from(readIdsRef.current);
      const trimmed = list.slice(-MAX_PRESENTED_IDS * 2);
      localStorage.setItem(readStorageKey, JSON.stringify(trimmed));
    } catch {
      // Ignora erro de cota de localStorage
    }
  }, [readStorageKey]);

  // 4. PENDENTES: cálculo rigoroso do contador de não lidas
  const unreadCount = useMemo(() => {
    return notificacoes.filter((n) => !isLidaStrict(n.lida)).length;
  }, [notificacoes]);

  const isWebPushSupported = typeof window !== 'undefined' && 'Notification' in window;

  /**
   * Solicita permissão para notificações nativas do navegador
   */
  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (!isWebPushSupported) return false;
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted' && isAuthenticatedRef.current) {
        const token = await requestNotificationPermission();
        if (token) {
          await apiService.subscribeToFcm(token);
          fcmRegisteredRef.current = true;
        }
      }
      return permission === 'granted';
    } catch (e) {
      console.warn('Erro ao solicitar permissão de notificações do navegador:', e);
      return false;
    }
  }, [isWebPushSupported]);


  /**
   * Dispara notificação nativa no navegador via Service Worker ou Notification API
   */
  const triggerBrowserNotification = useCallback((notif: Notificacao) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const title = notif.titulo || 'ESCALA DE LOUVOR';
    const options = {
      body: notif.mensagem || 'Você recebeu uma nova atualização da escala.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `notif-${normalizeId(notif.id)}`,
      data: { url: '/notificacoes', id: normalizeId(notif.id), tipo: notif.tipo }
    };

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, options);
          })
          .catch(() => {
            try {
              new Notification(title, options);
            } catch {}
          });
      } else {
        new Notification(title, options);
      }
    } catch (e) {
      console.warn('Falha ao instanciar notificação nativa:', e);
    }
  }, []);

  /**
   * Helper para verificar se um item já foi apresentado
   * Checa tanto pelo ID quanto pelo EventoId lógico
   */
  const isItemAlreadyPresented = useCallback((id: string, eventoId?: string): boolean => {
    const cleanId = normalizeId(id);
    if (cleanId && presentedIdsRef.current.has(cleanId)) {
      return true;
    }
    if (eventoId) {
      const cleanEvento = normalizeId(eventoId);
      if (cleanEvento && presentedIdsRef.current.has(`evt:${cleanEvento}`)) {
        return true;
      }
    }
    return false;
  }, []);

  /**
   * Apresenta uma notificação nova (Popup Interno ou Nativa) com deduplicação instantânea
   */
  const apresentarNotificacao = useCallback(
    (notif: Notificacao) => {
      const cleanId = normalizeId(notif.id);
      if (!cleanId) return;

      const cleanEvento = notif.eventoId ? normalizeId(notif.eventoId) : '';

      // 1. Marca imediatamente como já apresentada no registro local (por ID e por EventoId)
      presentedIdsRef.current.add(cleanId);
      if (cleanEvento) {
        presentedIdsRef.current.add(`evt:${cleanEvento}`);
      }
      persistirPresentedIds();

      // 2. Propaga para as outras abas para que NÃO apresentem novamente
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'NOTIFICATION_PRESENTED',
          id: cleanId,
          eventoId: cleanEvento
        });
      }

      // 3. Apresentação visual: Sempre aciona o Popup Interno da UI (funciona em PWA e navegador normal)
      setActivePopup(notif);

      // 4. Se houver permissão nativa, dispara também no sistema operacional (útil quando em background)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        triggerBrowserNotification(notif);
      }
    },
    [persistirPresentedIds, triggerBrowserNotification]
  );

  /**
   * Fecha o popup interno atual (Auto-dismiss ou clique no X)
   * O estado 'apresentado' permanece rigidamente persistido no presentedIdsRef e storage
   */
  const dismissPopup = useCallback(() => {
    setActivePopup((current) => {
      if (current && current.id) {
        const cleanId = normalizeId(current.id);
        presentedIdsRef.current.add(cleanId);
        if (current.eventoId) {
          presentedIdsRef.current.add(`evt:${normalizeId(current.eventoId)}`);
        }
        persistirPresentedIds();
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'NOTIFICATION_PRESENTED',
            id: cleanId,
            eventoId: current.eventoId ? normalizeId(current.eventoId) : undefined
          });
        }
      }
      return null;
    });
  }, [persistirPresentedIds]);

  /**
   * Carrega notificações do backend com proteção total contra race conditions e duplicidade
   */
  const loadNotificacoes = useCallback(
    async (isRefresh: boolean = false) => {
      if (!isAuthenticatedRef.current || !userRef.current) {
        setNotificacoes([]);
        setActivePopup(null);
        return;
      }

      // Evita requisições concorrentes sobrepostas
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const list = await apiService.fetchNotificacoes();

        // Higienização e ordenação por data decrescente com retenção estrita do status lido
        const sanitized: Notificacao[] = list.map((item) => {
          const cleanId = normalizeId(item.id);
          const cleanEvento = item.eventoId ? normalizeId(item.eventoId) : '';
          const isExplicitlyRead =
            isLidaStrict(item.lida) ||
            (cleanId && readIdsRef.current.has(cleanId)) ||
            (cleanEvento && readIdsRef.current.has(`evt:${cleanEvento}`));

          if (isExplicitlyRead) {
            if (cleanId) readIdsRef.current.add(cleanId);
            if (cleanEvento) readIdsRef.current.add(`evt:${cleanEvento}`);
          }

          return {
            ...item,
            id: cleanId,
            eventoId: cleanEvento || undefined,
            lida: isExplicitlyRead ? 'SIM' : 'NAO'
          };
        });
        persistirReadIds();

        const sorted = [...sanitized].sort((a, b) => {
          const timeA = a.data ? new Date(a.data).getTime() : 0;
          const timeB = b.data ? new Date(b.data).getTime() : 0;
          return timeB - timeA;
        });

        const nowMs = Date.now();

        // DETECÇÃO DE NOTIFICAÇÕES NOVAS E PENDENTES
        const novasNaoApresentadas = sorted.filter((n) => {
          const cleanId = normalizeId(n.id);
          const isUnread = !isLidaStrict(n.lida);
          const alreadyPresented = isItemAlreadyPresented(cleanId, n.eventoId);
          return cleanId && isUnread && !alreadyPresented;
        });

        if (initialLoadCompletedRef.current) {
          // Em ciclos subsequentes de polling/atualização em tempo real:
          // Se chegou nova notificação não apresentada, apresenta a mais recente
          if (novasNaoApresentadas.length > 0) {
            apresentarNotificacao(novasNaoApresentadas[0]);
          }
        } else {
          // Na inicialização da aplicação (inclusive abertura do PWA / cold start):
          // Apresenta popup apenas se houver notificação não apresentada criada dentro da janela recente
          const candidatasRecentes = novasNaoApresentadas.filter((n) => {
            const notifTime = n.data ? new Date(n.data).getTime() : 0;
            if (!notifTime || isNaN(notifTime)) return false;
            return nowMs - notifTime <= COLD_START_MAX_AGE_MS;
          });

          if (candidatasRecentes.length > 0) {
            apresentarNotificacao(candidatasRecentes[0]);
            // Registra as demais candidatas recentes para não gerar popups em cascata
            candidatasRecentes.slice(1).forEach((n) => {
              if (n.id) presentedIdsRef.current.add(normalizeId(n.id));
              if (n.eventoId) presentedIdsRef.current.add(`evt:${normalizeId(n.eventoId)}`);
            });
            persistirPresentedIds();
          }

          // Para todas as notificações não lidas muito antigas (fora da janela recente),
          // registra silenciosamente no presentedIds para que NUNCA gerem popup
          novasNaoApresentadas.forEach((n) => {
            if (n.id) presentedIdsRef.current.add(normalizeId(n.id));
            if (n.eventoId) presentedIdsRef.current.add(`evt:${normalizeId(n.eventoId)}`);
          });

          // Registra também todas que já constavam como lidas
          sorted.forEach((n) => {
            if (isLidaStrict(n.lida)) {
              if (n.id) presentedIdsRef.current.add(normalizeId(n.id));
              if (n.eventoId) presentedIdsRef.current.add(`evt:${normalizeId(n.eventoId)}`);
            }
          });
          persistirPresentedIds();

          initialLoadCompletedRef.current = true;
        }

        setNotificacoes(sorted);
        setLastChecked(new Date());
      } catch (e) {
        console.warn('Erro na sincronização de notificações:', e);
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [apresentarNotificacao, persistirPresentedIds, persistirReadIds, isItemAlreadyPresented]
  );

  const refreshNotificacoes = useCallback(async () => {
    await loadNotificacoes(true);
  }, [loadNotificacoes]);

  /**
   * Marca notificação individual como lida com resposta otimista imediata e sincronização multi-abas
   */
  const marcarComoLida = useCallback(
    async (id: string): Promise<boolean> => {
      const cleanId = normalizeId(id);
      if (!cleanId) return false;

      const notifItem = notificacoes.find((n) => normalizeId(n.id) === cleanId);
      const cleanEvento = notifItem?.eventoId ? normalizeId(notifItem.eventoId) : '';

      // 1. Atualização Otimista Imediata
      setNotificacoes((prev) =>
        prev.map((n) => (normalizeId(n.id) === cleanId ? { ...n, lida: 'SIM' } : n))
      );

      // 2. Se o popup ativo for desta notificação, fecha imediatamente
      setActivePopup((current) => (current && normalizeId(current.id) === cleanId ? null : current));

      // 3. Marca como apresentada e lida nos registros locais
      presentedIdsRef.current.add(cleanId);
      readIdsRef.current.add(cleanId);
      if (cleanEvento) {
        presentedIdsRef.current.add(`evt:${cleanEvento}`);
        readIdsRef.current.add(`evt:${cleanEvento}`);
      }
      persistirPresentedIds();
      persistirReadIds();

      // 4. Propaga para as demais abas abertas
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'NOTIFICATION_MARKED_READ',
          id: cleanId,
          eventoId: cleanEvento
        });
      }

      // 5. Chamada de persistência no servidor
      try {
        const res = await apiService.marcarNotificacaoLida(cleanId);
        return Boolean(res && res.sucesso);
      } catch (e) {
        console.warn('Erro ao salvar marcação de lida no servidor:', e);
        return false;
      }
    },
    [notificacoes, persistirPresentedIds, persistirReadIds]
  );

  /**
   * Marca todas as notificações como lidas
   */
  const marcarTodasComoLidas = useCallback(async (): Promise<boolean> => {
    // 1. Atualização Otimista Imediata
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: 'SIM' })));
    setActivePopup(null);

    // 2. Registra todos os IDs atuais como apresentados e lidos
    notificacoes.forEach((n) => {
      if (n.id) {
        const cleanId = normalizeId(n.id);
        presentedIdsRef.current.add(cleanId);
        readIdsRef.current.add(cleanId);
      }
      if (n.eventoId) {
        const cleanEvt = normalizeId(n.eventoId);
        presentedIdsRef.current.add(`evt:${cleanEvt}`);
        readIdsRef.current.add(`evt:${cleanEvt}`);
      }
    });
    persistirPresentedIds();
    persistirReadIds();

    // 3. Propaga para outras abas
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'ALL_NOTIFICATIONS_MARKED_READ'
      });
    }

    // 4. Chamada de persistência no servidor
    try {
      const res = await apiService.marcarTodasNotificacoesLidas();
      return Boolean(res && res.sucesso);
    } catch (e) {
      console.warn('Erro ao marcar todas notificações no servidor:', e);
      return false;
    }
  }, [notificacoes, persistirPresentedIds, persistirReadIds]);

  // SINCRONIZAÇÃO MULTI-ABAS VIA BROADCAST CHANNEL & STORAGE FALLBACK
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('escala_louvor_sync_channel');
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          const data = event.data;
          if (!data || !data.type) return;

          if (data.type === 'NOTIFICATION_PRESENTED' && data.id) {
            const cleanId = normalizeId(data.id);
            presentedIdsRef.current.add(cleanId);
            if (data.eventoId) {
              presentedIdsRef.current.add(`evt:${normalizeId(data.eventoId)}`);
            }
            // Se esta aba estava exibindo este mesmo popup, descarta
            setActivePopup((current) => (current && normalizeId(current.id) === cleanId ? null : current));
          } else if (data.type === 'NOTIFICATION_MARKED_READ' && data.id) {
            const cleanId = normalizeId(data.id);
            setNotificacoes((prev) =>
              prev.map((n) => (normalizeId(n.id) === cleanId ? { ...n, lida: 'SIM' } : n))
            );
            setActivePopup((current) => (current && normalizeId(current.id) === cleanId ? null : current));
            presentedIdsRef.current.add(cleanId);
            readIdsRef.current.add(cleanId);
            if (data.eventoId) {
              presentedIdsRef.current.add(`evt:${normalizeId(data.eventoId)}`);
              readIdsRef.current.add(`evt:${normalizeId(data.eventoId)}`);
            }
            persistirPresentedIds();
            persistirReadIds();
          } else if (data.type === 'ALL_NOTIFICATIONS_MARKED_READ') {
            setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: 'SIM' })));
            setActivePopup(null);
            notificacoes.forEach((n) => {
              if (n.id) readIdsRef.current.add(normalizeId(n.id));
              if (n.eventoId) readIdsRef.current.add(`evt:${normalizeId(n.eventoId)}`);
            });
            persistirReadIds();
          }
        };
      } catch (e) {
        console.warn('Falha ao inicializar BroadcastChannel:', e);
      }
    }

    // Fallback: listener de storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed: string[] = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            parsed.forEach((id) => presentedIdsRef.current.add(normalizeId(id)));
          }
        } catch {}
      } else if (e.key === readStorageKey && e.newValue) {
        try {
          const parsed: string[] = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            parsed.forEach((id) => readIdsRef.current.add(normalizeId(id)));
            setNotificacoes((prev) =>
              prev.map((n) =>
                readIdsRef.current.has(normalizeId(n.id)) ||
                (n.eventoId && readIdsRef.current.has(`evt:${normalizeId(n.eventoId)}`))
                  ? { ...n, lida: 'SIM' }
                  : n
              )
            );
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) {
        channel.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [storageKey, readStorageKey, notificacoes, persistirPresentedIds, persistirReadIds]);

  // CICLO DE VIDA DO USUÁRIO & CARGA INICIAL (Estabilizado por nome de usuário)
  useEffect(() => {
    fcmRegisteredRef.current = false;
    if (isAuthenticated && user?.nome) {
      const userKey = user.nome.trim().toLowerCase();
      if (activeUserKeyRef.current !== userKey) {
        // Novo login de usuário diferente: redefine ciclo
        activeUserKeyRef.current = userKey;
        carregarPresentedIdsDoStorage();
        carregarReadIdsDoStorage();
        initialLoadCompletedRef.current = false;
        loadNotificacoes(false);
      } else {
        // Mesmo usuário: sincronização suave sem resetar o cold start guard
        loadNotificacoes(true);
      }
    } else if (!isAuthenticated) {
      activeUserKeyRef.current = '';
      setNotificacoes([]);
      setActivePopup(null);
      presentedIdsRef.current.clear();
      readIdsRef.current.clear();
      initialLoadCompletedRef.current = false;
    }
  }, [isAuthenticated, user?.nome, carregarPresentedIdsDoStorage, carregarReadIdsDoStorage, loadNotificacoes]);

  // Registro automático FCM para usuários já autorizados
  useEffect(() => {
    console.log("FCM DEBUG - EFFECT", {
      isAuthenticated,
      browserPermission,
      nativePermission: Notification.permission,
      fcmRegistered: fcmRegisteredRef.current,
      isRegistering: isRegisteringFcmRef.current
    });

    if (!isAuthenticated) {
      console.log("FCM DEBUG - BLOCKED", { reason: "not authenticated" });
      fcmRegisteredRef.current = false;
      isRegisteringFcmRef.current = false;
      return;
    }

    if (fcmRegisteredRef.current || isRegisteringFcmRef.current) {
      console.log("FCM DEBUG - BLOCKED", { 
        reason: fcmRegisteredRef.current ? "already registered" : "registration in progress" 
      });
      return;
    }

    console.log("FCM DEBUG - CONDITIONS", {
      isAuthenticated,
      browserPermission,
      nativePermission: Notification.permission,
      fcmRegistered: fcmRegisteredRef.current,
      isRegistering: isRegisteringFcmRef.current,
      permissionGranted:
        Notification.permission === "granted" ||
        browserPermission === "granted"
    });

    if (Notification.permission === 'granted' || browserPermission === 'granted') {
      const registerFcm = async () => {
        isRegisteringFcmRef.current = true;

        console.log("FCM DEBUG - WAITING SW");
        await navigator.serviceWorker.ready;
        console.log("FCM DEBUG - SERVICE WORKER READY");

        console.log("FCM DEBUG - GET TOKEN");
        try {
          const token = await getFcmToken();
          
          console.log("FCM DEBUG - TOKEN", {
            obtained: !!token,
            length: token ? token.length : 0,
            first6: token ? token.substring(0, 6) : "",
            last6: token ? token.substring(token.length - 6) : ""
          });
          
          if (token) {
            console.log("FCM DEBUG - SUBSCRIBE");
            await apiService.subscribeToFcm(token);
            console.log("FCM DEBUG - SUBSCRIBE SUCCESS");
            fcmRegisteredRef.current = true;
          } else {
            console.log('FCM DEBUG: Token não obtido');
          }
        } catch (error) {
          console.error("FCM DEBUG - ERROR", error);
        } finally {
          isRegisteringFcmRef.current = false;
        }
      };
      
      registerFcm();
    } else {
      console.log("FCM DEBUG - BLOCKED", { reason: "permission not granted" });
    }
  }, [isAuthenticated, browserPermission]);

  // POLLING CONTROLADO E RESILIENTE
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      // Polling suave periódico
      loadNotificacoes(true);
    }, POLLING_INTERVAL_MS);

    // Sincroniza imediatamente ao retomar a aplicação / focar a aba ou PWA
    const handleResume = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadNotificacoes(true);
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [isAuthenticated, loadNotificacoes]);

  const value = useMemo(
    () => ({
      notificacoes,
      unreadCount,
      isLoading,
      isRefreshing,
      lastChecked,
      activePopup,
      browserPermission,
      isWebPushSupported,
      requestBrowserPermission,
      refreshNotificacoes,
      marcarComoLida,
      marcarTodasComoLidas,
      dismissPopup
    }),
    [
      notificacoes,
      unreadCount,
      isLoading,
      isRefreshing,
      lastChecked,
      activePopup,
      browserPermission,
      isWebPushSupported,
      requestBrowserPermission,
      refreshNotificacoes,
      marcarComoLida,
      marcarTodasComoLidas,
      dismissPopup
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

// Exportamos ambos os nomes para retrocompatibilidade garantida
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser utilizado dentro de um NotificationProvider');
  }
  return context;
};

export const useNotifications = useNotification;
