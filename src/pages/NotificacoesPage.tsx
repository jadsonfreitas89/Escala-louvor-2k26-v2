import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  RotateCw,
  Search,
  Filter,
  CalendarDays,
  MessageSquare,
  Repeat,
  Sparkles,
  Smartphone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { NotificacaoCard } from '../components/notificacoes/NotificacaoCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';

type FilterTab = 'TODAS' | 'NAO_LIDAS' | 'ESCALA' | 'RECADO' | 'SOLICITACAO';

export const NotificacoesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    notificacoes,
    unreadCount,
    isLoading,
    isRefreshing,
    lastChecked,
    browserPermission,
    isWebPushSupported,
    requestBrowserPermission,
    refreshNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>('TODAS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  // Filtra as notificações por aba e termo de busca
  const filteredNotificacoes = useMemo(() => {
    return notificacoes.filter((notif) => {
      const isLida = (notif.lida || '').toUpperCase() === 'SIM';
      const tipo = (notif.tipo || '').toUpperCase();

      // Filtro de aba
      if (activeTab === 'NAO_LIDAS' && isLida) return false;
      if (
        activeTab === 'ESCALA' &&
        tipo !== 'ESCALA' &&
        tipo !== 'NOVA_ESCALA' &&
        tipo !== 'CULTO' &&
        tipo !== 'LEMBRETE' &&
        tipo !== 'LOUVORES_UNIFORMES'
      )
        return false;
      if (activeTab === 'RECADO' && tipo !== 'RECADO' && tipo !== 'NOVO_RECADO') return false;
      if (
        activeTab === 'SOLICITACAO' &&
        tipo !== 'SOLICITACAO' &&
        tipo !== 'SOLICITACAO_NOVA' &&
        tipo !== 'SOLICITACAO_APROVADA' &&
        tipo !== 'SOLICITACAO_RECUSADA'
      )
        return false;

      // Filtro de busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitulo = (notif.titulo || '').toLowerCase().includes(term);
        const matchesMensagem = (notif.mensagem || '').toLowerCase().includes(term);
        const matchesTipo = tipo.toLowerCase().includes(term);
        return matchesTitulo || matchesMensagem || matchesTipo;
      }

      return true;
    });
  }, [notificacoes, activeTab, searchTerm]);

  const handleMarcarTodas = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      const success = await marcarTodasComoLidas();
      if (success) {
        setFeedback('Todas as notificações foram marcadas como lidas.');
        setTimeout(() => setFeedback(null), 3500);
      }
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleEnableBrowserNotifications = async () => {
    const granted = await requestBrowserPermission();
    if (granted) {
      setFeedback('Notificações no navegador ativadas com sucesso!');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-black text-zinc-100 tracking-tight">
              Central de Notificações
            </h2>
            {unreadCount > 0 && (
              <Badge variant="primary" size="sm" className="font-bold">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Acompanhe avisos da escala, comunicados e solicitações de substituição em tempo real.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              id="btn-marcar-todas-lidas"
              variant="outline"
              size="sm"
              onClick={handleMarcarTodas}
              isLoading={isMarkingAll}
              leftIcon={<CheckCheck size={14} className="text-emerald-400" />}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}

          <Button
            id="btn-sincronizar-notificacoes"
            variant="secondary"
            size="sm"
            onClick={refreshNotificacoes}
            isLoading={isRefreshing}
            leftIcon={<RotateCw size={14} />}
            className="text-xs"
          >
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Browser Notification Permission Card (if applicable) */}
      {isWebPushSupported && browserPermission === 'default' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-100">Ativar Notificações no Navegador</h4>
              <p className="text-[11px] text-zinc-400">
                Receba alertas de novas escalas e avisos mesmo quando não estiver com o site aberto.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={handleEnableBrowserNotifications}
            className="shrink-0 text-xs py-1.5"
          >
            Ativar Alertas
          </Button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 shrink-0">
            <button
              onClick={() => setActiveTab('TODAS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'TODAS'
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todas ({notificacoes.length})
            </button>
            <button
              onClick={() => setActiveTab('NAO_LIDAS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'NAO_LIDAS'
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Não lidas</span>
              {unreadCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeTab === 'NAO_LIDAS'
                      ? 'bg-zinc-950 text-orange-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ESCALA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ESCALA'
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Escala
            </button>
            <button
              onClick={() => setActiveTab('RECADO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'RECADO'
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Recados
            </button>
            <button
              onClick={() => setActiveTab('SOLICITACAO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'SOLICITACAO'
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Trocas
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[180px] max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-12">
          <LoadingState message="Consultando notificações do servidor..." />
        </div>
      ) : filteredNotificacoes.length > 0 ? (
        <div className="space-y-3">
          {filteredNotificacoes.map((notif) => (
            <NotificacaoCard
              key={`notif-${notif.id}`}
              notificacao={notif}
              onMarcarLida={marcarComoLida}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title={
            activeTab === 'NAO_LIDAS'
              ? 'Tudo em dia!'
              : searchTerm
              ? 'Nenhum resultado encontrado'
              : 'Nenhuma notificação no momento'
          }
          description={
            activeTab === 'NAO_LIDAS'
              ? 'Você não possui notificações não lidas. Que a paz e a graça do Senhor estejam com você!'
              : searchTerm
              ? `Nenhuma notificação corresponde à busca "${searchTerm}".`
              : 'Quando houver alterações na escala ou novos comunicados, você será notificado aqui.'
          }
          actionLabel={searchTerm || activeTab !== 'TODAS' ? 'Ver Todas as Notificações' : undefined}
          onAction={() => {
            setActiveTab('TODAS');
            setSearchTerm('');
          }}
        />
      )}

      {/* Sync footer info */}
      {lastChecked && (
        <div className="text-center pt-4 text-[11px] text-zinc-600">
          Última sincronização de notificações:{' '}
          {lastChecked.toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      )}
    </div>
  );
};
