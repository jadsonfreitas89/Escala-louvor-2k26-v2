import { EscalaData, Notificacao, LoginResult, AuthUser, LouvorItem } from '../types';

const STORAGE_KEY = 'escala_louvor_cache_v2';
const TOKEN_KEY = 'escala_louvor_session_token';

export interface FetchEscalaResult {
  data: EscalaData;
  isFromCache: boolean;
  timestamp: Date;
}

export interface CreateSolicitacaoPayload {
  dataEscala: string;
  substituto: string;
  motivo: string;
  funcao?: string;
  instrumento?: string;
}

export interface ProcessaSolicitacaoPayload {
  dataEscala: string;
  quemPediu: string;
  substituto: string;
  acao: 'APROVAR' | 'RECUSAR' | 'CANCELAR';
  motivoDecisao?: string;
  id?: string;
}

export interface CreateRecadoPayload {
  titulo: string;
  mensagem: string;
  imagemBase64?: string;
  imagemUrl?: string;
}

export interface UpdateRecadoPayload {
  titulo?: string;
  mensagem?: string;
  ativo?: 'SIM' | 'NAO' | string;
  imagemBase64?: string;
  imagemUrl?: string;
}

export interface UpdateEscalaCampoPayload {
  data?: string;
  dataEscala?: string;
  dataCulto?: string;
  campo: 'dirigente' | 'vocal' | 'musicos' | 'mesario' | 'louvores' | 'uniforme' | string;
  valor: string;
  louvores?: string;
  uniforme?: string;
  linkLouvores?: LouvorItem[];
}

export interface UpdateEscalaCompletaPayload {
  data?: string;
  dataEscala?: string;
  dataCulto?: string;
  dirigente?: string;
  vocal?: string;
  musicos?: string;
  mesario?: string;
  louvores?: string;
  uniforme?: string;
  linkLouvores?: LouvorItem[];
}

export interface ApiResponse {
  sucesso: boolean;
  mensagem: string;
}

/**
 * Camada de Serviço de API Centralizada (Web / Express Backend Proxy)
 * - Comunica com os endpoints do backend seguro (/api/*)
 * - Protege o navegador contra vazamento de senhas e contorna CORS/redirecionamento 302 do Google Apps Script
 * - Suporta cache local e PWA
 */
class ApiService {
  /**
   * Realiza login no backend seguro
   */
  public async login(nome: string, senha?: string): Promise<LoginResult> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          nome: nome.trim(),
          senha: senha ? senha.trim() : ''
        })
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        return {
          sucesso: false,
          mensagem: data.mensagem || 'Falha na autenticação. Verifique seu nome e senha.'
        };
      }

      if (data.token) {
        this.saveToken(data.token);
      }

      return {
        sucesso: true,
        token: data.token,
        user: data.user,
        mensagem: data.mensagem
      };
    } catch (err: any) {
      console.error('Erro ao conectar ao serviço de autenticação:', err);
      return {
        sucesso: false,
        mensagem: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
      };
    }
  }

  /**
   * Verifica e restaura a sessão ativa
   */
  public async getMe(token?: string): Promise<{ sucesso: boolean; user?: AuthUser; mensagem?: string }> {
    const activeToken = token || this.getToken();
    if (!activeToken) {
      return { sucesso: false, mensagem: 'Nenhum token de sessão encontrado.' };
    }

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        this.removeToken();
        return { sucesso: false, mensagem: 'Sessão inválida ou expirada.' };
      }

      const data = await response.json();
      return {
        sucesso: true,
        user: data.user
      };
    } catch (err: any) {
      console.warn('Erro ao validar sessão com o servidor:', err);
      return {
        sucesso: false,
        mensagem: 'Falha ao validar sessão com o servidor.'
      };
    }
  }

  /**
   * Encerra a sessão
   */
  public async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        console.warn('Erro silencioso ao revogar token no servidor:', e);
      }
    }
    this.removeToken();
  }

  /**
   * Obtém os dados completos e higienizados da escala em tempo real
   */
  public async fetchEscalaData(forceRefresh: boolean = false): Promise<FetchEscalaResult> {
    try {
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/escala${forceRefresh ? '?t=' + Date.now() : ''}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensagem || `Erro do servidor: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      if (!json || !json.sucesso) {
        throw new Error(json?.mensagem || 'Erro desconhecido ao carregar escala.');
      }

      const data: EscalaData = {
        escala: Array.isArray(json.escala) ? json.escala : [],
        integrantes: Array.isArray(json.integrantes) ? json.integrantes : [],
        solicitacoes: Array.isArray(json.solicitacoes) ? json.solicitacoes : [],
        recados: Array.isArray(json.recados) ? json.recados : [],
        linkLouvores: Array.isArray(json.linkLouvores) && json.linkLouvores.length > 0
          ? json.linkLouvores
          : (Array.isArray(json.link_louvores) ? json.link_louvores : [])
      };

      const now = new Date();
      this.saveToCache(data, now);

      return {
        data,
        isFromCache: false,
        timestamp: now
      };
    } catch (err: any) {
      console.warn('Falha ao buscar dados em tempo real da escala:', err);
      const cached = this.loadFromCache();
      if (cached && cached.data.escala.length > 0) {
        return {
          data: cached.data,
          isFromCache: true,
          timestamp: cached.timestamp
        };
      }
      throw err;
    }
  }

  /**
   * Cria uma nova solicitação de substituição/troca vinculada ao usuário autenticado
   */
  public async createSolicitacao(payload: CreateSolicitacaoPayload): Promise<ApiResponse> {
    const token = this.getToken();
    if (!token) {
      return {
        sucesso: false,
        mensagem: 'Você precisa estar autenticado para solicitar substituição.'
      };
    }

    try {
      const response = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        return {
          sucesso: false,
          mensagem: data.mensagem || 'Não foi possível enviar a solicitação de substituição.'
        };
      }

      return {
        sucesso: true,
        mensagem: data.mensagem || 'Solicitação de substituição enviada com sucesso.'
      };
    } catch (err: any) {
      console.error('Erro ao chamar endpoint de criar solicitação:', err);
      return {
        sucesso: false,
        mensagem: 'Erro de comunicação ao enviar solicitação. Verifique sua conexão.'
      };
    }
  }

  /**
   * Processa a decisão de uma solicitação (Aprovar, Recusar ou Cancelar)
   */
  public async processaSolicitacao(payload: ProcessaSolicitacaoPayload): Promise<ApiResponse> {
    const token = this.getToken();
    if (!token) {
      return {
        sucesso: false,
        mensagem: 'Você precisa estar autenticado para realizar esta ação.'
      };
    }

    try {
      const response = await fetch('/api/solicitacoes/processar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        return {
          sucesso: false,
          mensagem: data.mensagem || 'Não foi possível processar a decisão.'
        };
      }

      return {
        sucesso: true,
        mensagem: data.mensagem || 'Operação realizada com sucesso.'
      };
    } catch (err: any) {
      console.error('Erro ao processar solicitação:', err);
      return {
        sucesso: false,
        mensagem: 'Erro de comunicação ao processar a solicitação.'
      };
    }
  }

  /**
   * Busca notificações do usuário logado diretamente no backend
   */
  public async fetchNotificacoes(): Promise<Notificacao[]> {
    const token = this.getToken();
    if (!token) return [];

    try {
      const response = await fetch('/api/notificacoes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback para cache local de notificações em caso de instabilidade
        return this.loadNotificacoesFromCache();
      }
      
      const json = await response.json();
      const rawList: any[] = Array.isArray(json.notificacoes) ? json.notificacoes : [];
      const cacheList = this.loadNotificacoesFromCache();
      const readIdsInCache = new Set(
        cacheList.filter((c) => c.lida === 'SIM').map((c) => String(c.id).trim())
      );

      const list: Notificacao[] = rawList.map((item) => {
        const cleanId = String(item.id || '').trim();
        const isRead = String(item.lida || '').trim().toUpperCase() === 'SIM' || readIdsInCache.has(cleanId);
        return {
          ...item,
          id: cleanId,
          lida: isRead ? 'SIM' : 'NAO'
        };
      });
      this.saveNotificacoesToCache(list);
      return list;
    } catch (err) {
      console.warn('Falha ao carregar notificações, tentando cache local:', err);
      return this.loadNotificacoesFromCache();
    }
  }

  /**
   * Marca uma notificação como lida no backend
   */
  public async marcarNotificacaoLida(id: string): Promise<ApiResponse> {
    const cleanId = String(id || '').trim();
    const token = this.getToken();
    if (!token) {
      return { sucesso: false, mensagem: 'Autenticação necessária para marcar notificação como lida.' };
    }

    try {
      const response = await fetch(`/api/notificacoes/${encodeURIComponent(cleanId)}/lida`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.sucesso) {
        return {
          sucesso: false,
          mensagem: data.mensagem || 'Não foi possível marcar a notificação como lida.'
        };
      }

      // Atualiza cache local com ID normalizado
      this.updateNotificacaoStatusInCache(cleanId, 'SIM');

      return {
        sucesso: true,
        mensagem: data.mensagem || 'Notificação marcada como lida.'
      };
    } catch (err: any) {
      console.error('Erro ao marcar notificação como lida:', err);
      return {
        sucesso: false,
        mensagem: 'Erro de conexão ao marcar notificação como lida.'
      };
    }
  }

  /**
   * Marca todas as notificações do usuário como lidas no backend
   */
  public async marcarTodasNotificacoesLidas(): Promise<ApiResponse> {
    const token = this.getToken();
    if (!token) {
      return { sucesso: false, mensagem: 'Autenticação necessária para marcar notificações.' };
    }

    try {
      const response = await fetch('/api/notificacoes/marcar-todas-lidas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.sucesso) {
        return {
          sucesso: false,
          mensagem: data.mensagem || 'Não foi possível marcar todas as notificações como lidas.'
        };
      }

      // Atualiza cache local
      this.markAllNotificacoesAsReadInCache();

      return {
        sucesso: true,
        mensagem: data.mensagem || 'Todas as notificações foram marcadas como lidas.'
      };
    } catch (err: any) {
      console.error('Erro ao marcar todas notificações como lidas:', err);
      return {
        sucesso: false,
        mensagem: 'Erro de conexão ao marcar todas notificações como lidas.'
      };
    }
  }

  // --- Cache de Notificações ---

  private saveNotificacoesToCache(notificacoes: Notificacao[]): void {
    try {
      localStorage.setItem('escala_louvor_notificacoes_cache', JSON.stringify(notificacoes));
    } catch (e) {
      console.warn('Erro ao salvar notificações no cache:', e);
    }
  }

  public loadNotificacoesFromCache(): Notificacao[] {
    try {
      const raw = localStorage.getItem('escala_louvor_notificacoes_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            ...item,
            id: String(item.id || '').trim(),
            lida: String(item.lida || '').trim().toUpperCase() === 'SIM' ? 'SIM' : 'NAO'
          }));
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar notificações do cache:', e);
    }
    return [];
  }

  private updateNotificacaoStatusInCache(id: string, lida: 'SIM' | 'NAO'): void {
    try {
      const cleanId = String(id || '').trim();
      const list = this.loadNotificacoesFromCache();
      const updated = list.map((n) => (String(n.id).trim() === cleanId ? { ...n, lida } : n));
      this.saveNotificacoesToCache(updated);
    } catch (e) {
      console.warn('Erro ao atualizar notificação no cache:', e);
    }
  }

  private markAllNotificacoesAsReadInCache(): void {
    try {
      const list = this.loadNotificacoesFromCache();
      const updated = list.map((n) => ({ ...n, lida: 'SIM' as const }));
      this.saveNotificacoesToCache(updated);
    } catch (e) {
      console.warn('Erro ao marcar todas no cache:', e);
    }
  }

  // =========================================================================
  // MÓDULO ADMINISTRATIVO (RECADOS, UPLOAD DE IMAGENS E EDIÇÃO DE ESCALA)
  // =========================================================================

  /**
   * Publica um novo recado no mural (Líder)
   */
  public async createRecado(payload: CreateRecadoPayload): Promise<ApiResponse> {
    const token = this.getToken();
    if (!token) {
      return { sucesso: false, mensagem: 'Você precisa estar autenticado como Líder para publicar recados.' };
    }

    try {
      const response = await fetch('/api/recados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.sucesso) {
        return { sucesso: false, mensagem: data.mensagem || 'Não foi possível publicar o recado.' };
      }

      return { sucesso: true, mensagem: data.mensagem || 'Recado publicado com sucesso.' };
    } catch (err: any) {
      console.error('Erro ao publicar recado:', err);
      return { sucesso: false, mensagem: 'Erro de comunicação ao publicar recado.' };
    }
  }

  /**
   * Atualiza um recado existente (Líder)
   */
  public async updateRecado(id: string, payload: UpdateRecadoPayload): Promise<ApiResponse> {
    const token = this.getToken();
    if (!token) {
      return { sucesso: false, mensagem: 'Você precisa estar autenticado como Líder para editar recados.' };
    }

    try {
      const response = await fetch(`/api/recados/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.sucesso) {
        return { sucesso: false, mensagem: data.mensagem || 'Não foi possível atualizar o recado.' };
      }

      return { sucesso: true, mensagem: data.mensagem || 'Recado atualizado com sucesso.' };
    } catch (err: any) {
      console.error('Erro ao atualizar recado:', err);
      return { sucesso: false, mensagem: 'Erro de comunicação ao atualizar recado.' };
    }
  }

  /**
   * Exclui um recado (Líder)
   */
  public async deleteRecado(id: string): Promise<ApiResponse> {
    const token = this.getToken();
    if (!token) {
      return { sucesso: false, mensagem: 'Você precisa estar autenticado como Líder para excluir recados.' };
    }

    try {
      const response = await fetch(`/api/recados/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.sucesso) {
        return { sucesso: false, mensagem: data.mensagem || 'Não foi possível excluir o recado.' };
      }

      return { sucesso: true, mensagem: data.mensagem || 'Recado excluído com sucesso.' };
    } catch (err: any) {
      console.error('Erro ao excluir recado:', err);
      return { sucesso: false, mensagem: 'Erro de comunicação ao excluir recado.' };
    }
  }

  /**
   * Atualiza um campo individual da escala (Líder / Dirigente)
   */
  public async updateEscalaCampo(payload: UpdateEscalaCampoPayload): Promise<ApiResponse> {
    const token = this.getToken();
    if (!token) {
      return { sucesso: false, mensagem: 'Você precisa estar autenticado para editar a escala.' };
    }

    const effectiveData = (payload.dataEscala || payload.data || payload.dataCulto || '').toString().trim();
    if (!effectiveData) {
      return { sucesso: false, mensagem: 'Data da escala é obrigatória.' };
    }

    const normalizedPayload = {
      ...payload,
      data: effectiveData,
      dataEscala: effectiveData,
      dataCulto: effectiveData
    };

    try {
      const response = await fetch('/api/escala/campo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(normalizedPayload)
      });

      const data = await response.json();
      if (!response.ok || !data.sucesso) {
        return { sucesso: false, mensagem: data.mensagem || 'Não foi possível atualizar a escala.' };
      }

      return { sucesso: true, mensagem: data.mensagem || 'Escala atualizada com sucesso.' };
    } catch (err: any) {
      console.error('Erro ao atualizar campo da escala:', err);
      return { sucesso: false, mensagem: 'Erro de comunicação ao atualizar escala.' };
    }
  }

  /**
   * Atualiza a escala completa de um culto (Líder / Dirigente)
   */
  public async updateEscalaCompleta(payload: UpdateEscalaCompletaPayload): Promise<ApiResponse> {
    const token = this.getToken();
    if (!token) {
      return { sucesso: false, mensagem: 'Você precisa estar autenticado para editar a escala.' };
    }

    const effectiveData = (payload.dataEscala || payload.data || payload.dataCulto || '').toString().trim();
    if (!effectiveData) {
      return { sucesso: false, mensagem: 'Data da escala é obrigatória.' };
    }

    const normalizedPayload = {
      ...payload,
      data: effectiveData,
      dataEscala: effectiveData,
      dataCulto: effectiveData
    };

    try {
      const response = await fetch('/api/escala/completa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(normalizedPayload)
      });

      const data = await response.json();
      if (!response.ok || !data.sucesso) {
        return { sucesso: false, mensagem: data.mensagem || 'Não foi possível atualizar a escala.' };
      }

      return { sucesso: true, mensagem: data.mensagem || 'Escala atualizada com sucesso.' };
    } catch (err: any) {
      console.error('Erro ao atualizar escala completa:', err);
      return { sucesso: false, mensagem: 'Erro de comunicação ao atualizar escala.' };
    }
  }

  /**
   * Dispara a notificação de nova escala para todos os membros (Líder)
   */
  public async notificarNovaEscala(mes?: string): Promise<ApiResponse & { totalEnviadas?: number; jaEnviada?: boolean }> {
    const token = this.getToken();
    if (!token) {
      return { sucesso: false, mensagem: 'Você precisa estar autenticado como Líder para disparar a notificação.' };
    }

    try {
      const response = await fetch('/api/escala/notificar-nova-escala', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ mes })
      });

      const data = await response.json();
      if (!response.ok || !data.sucesso) {
        return {
          sucesso: false,
          jaEnviada: data.jaEnviada,
          mensagem: data.mensagem || 'Não foi possível enviar a notificação de nova escala.'
        };
      }

      return {
        sucesso: true,
        mensagem: data.mensagem || 'Notificação da nova escala enviada a todos com sucesso!',
        totalEnviadas: data.totalEnviadas
      };
    } catch (err: any) {
      console.error('Erro ao disparar notificação de nova escala:', err);
      return {
        sucesso: false,
        mensagem: 'Erro de comunicação ao disparar notificação de nova escala.'
      };
    }
  }

  /**
   * Registra o token FCM do usuário no backend
   */
  public async subscribeToFcm(token: string): Promise<ApiResponse> {
    const sessionToken = this.getToken();
    if (!sessionToken) {
      return { sucesso: false, mensagem: 'Autenticação necessária para registrar notificação.' };
    }

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      if (!response.ok || !data.sucesso) {
        return {
          sucesso: false,
          mensagem: data.mensagem || 'Não foi possível registrar o token FCM.'
        };
      }

      return {
        sucesso: true,
        mensagem: data.mensagem || 'Token FCM registrado com sucesso.'
      };
    } catch (err: any) {
      console.error('Erro ao registrar token FCM:', err);
      return {
        sucesso: false,
        mensagem: 'Erro de conexão ao registrar token FCM.'
      };
    }
  }

  public async testFcm(): Promise<ApiResponse> {
    const sessionToken = this.getToken();
    if (!sessionToken) {
      return { sucesso: false, mensagem: 'Autenticação necessária para testar notificação.' };
    }

    try {
      const response = await fetch('/api/notifications/test-fcm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          sucesso: false,
          mensagem: 'Falha ao realizar teste FCM.'
        };
      }

      return {
        sucesso: true,
        mensagem: `Teste concluído: ${data.sent} sent, ${data.failed} failed.`
      };
    } catch (err: any) {
      console.error('Erro ao realizar teste FCM:', err);
      return {
        sucesso: false,
        mensagem: 'Erro de conexão ao realizar teste FCM.'
      };
    }
  }

  // --- Gerenciamento de Token de Sessão Seguro ---

  public saveToken(token: string): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Erro ao armazenar token de sessão:', e);
    }
  }

  public getToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  public removeToken(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Erro ao remover token de sessão:', e);
    }
  }

  // --- Helpers de Cache Local (Offline / PWA) ---

  private saveToCache(data: EscalaData, timestamp: Date): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(`${STORAGE_KEY}_timestamp`, timestamp.toISOString());
    } catch (e) {
      console.error('Erro ao salvar cache local:', e);
    }
  }

  public loadFromCache(): { data: EscalaData; timestamp: Date } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const rawTime = localStorage.getItem(`${STORAGE_KEY}_timestamp`);
      if (raw) {
        const data = JSON.parse(raw);
        const timestamp = rawTime ? new Date(rawTime) : new Date();
        return { data, timestamp };
      }
    } catch (e) {
      console.error('Erro ao ler cache local:', e);
    }
    return null;
  }
}

export const apiService = new ApiService();
