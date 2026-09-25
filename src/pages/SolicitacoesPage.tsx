import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Shield,
  Filter,
  User,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEscala } from '../context/EscalaContext';
import { useNavigation } from '../context/NavigationContext';
import { SolicitacaoCard } from '../components/solicitacoes/SolicitacaoCard';
import { NovaSolicitacaoModal } from '../components/solicitacoes/NovaSolicitacaoModal';
import { CacheStatusBanner } from '../components/escala/CacheStatusBanner';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { Solicitacao } from '../types';
import { apiService } from '../services/api';
import { normalizarNome } from '../utils/cultoUtils';

export const SolicitacoesPage: React.FC = () => {
  const { user, isLider } = useAuth();
  const {
    data,
    isLoading,
    isRefreshing,
    isFromCache,
    lastUpdated,
    refreshData
  } = useEscala();
  const { navigate } = useNavigation();

  // Estados de Filtro
  const [filterTab, setFilterTab] = useState<'todas' | 'pendentes' | 'aprovadas' | 'recusadas' | 'minhas'>('pendentes');
  const [showNovaModal, setShowNovaModal] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Contadores
  const stats = useMemo(() => {
    const total = data.solicitacoes.length;
    const pendentes = data.solicitacoes.filter((s) => s.status.toUpperCase() === 'PENDENTE').length;
    const aprovadas = data.solicitacoes.filter((s) => ['APROVADA', 'AUTORIZADA'].includes(s.status.toUpperCase())).length;
    const recusadas = data.solicitacoes.filter((s) => ['RECUSADA', 'REPROVADA'].includes(s.status.toUpperCase())).length;
    return { total, pendentes, aprovadas, recusadas };
  }, [data.solicitacoes]);

  // Lista Filtrada
  const solicitacoesFiltradas = useMemo(() => {
    const list = [...data.solicitacoes];
    const userNorm = user ? normalizarNome(user.nome) : '';

    return list.filter((s) => {
      const statusNorm = s.status.toUpperCase();
      if (filterTab === 'pendentes') {
        return statusNorm === 'PENDENTE';
      }
      if (filterTab === 'aprovadas') {
        return statusNorm === 'APROVADA' || statusNorm === 'AUTORIZADA';
      }
      if (filterTab === 'recusadas') {
        return statusNorm === 'RECUSADA' || statusNorm === 'REPROVADA';
      }
      if (filterTab === 'minhas') {
        return normalizarNome(s.quemPediu) === userNorm || normalizarNome(s.substituto) === userNorm;
      }
      return true;
    });
  }, [data.solicitacoes, filterTab, user]);

  // Handler para processar decisão (Aprovar / Recusar / Cancelar)
  const handleProcessar = async (
    solicitacao: Solicitacao,
    acao: 'APROVAR' | 'RECUSAR' | 'CANCELAR',
    motivoDecisao?: string
  ) => {
    const identifier = solicitacao.id || solicitacao.quemPediu;
    setProcessingId(identifier);
    setFeedbackMessage(null);

    try {
      const result = await apiService.processaSolicitacao({
        dataEscala: solicitacao.dataEscala,
        quemPediu: solicitacao.quemPediu,
        substituto: solicitacao.substituto,
        acao,
        motivoDecisao,
        id: solicitacao.id
      });

      if (!result.sucesso) {
        setFeedbackMessage({ type: 'error', text: result.mensagem });
      } else {
        setFeedbackMessage({ type: 'success', text: result.mensagem });
        // Atualiza os dados reais no contexto da aplicação
        await refreshData();
      }
    } catch (err: any) {
      console.error('Erro ao processar solicitação:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Falha de comunicação ao processar a solicitação.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateSuccess = async (msg: string) => {
    setFeedbackMessage({ type: 'success', text: msg });
    await refreshData();
  };

  if (isLoading && data.solicitacoes.length === 0 && !isFromCache) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingState message="Carregando solicitações de substituição..." />
      </div>
    );
  }

  return (
    <div id="solicitacoes-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-100 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-orange-400" />
            Solicitações de Troca
          </h2>
          <p className="text-xs text-zinc-400">
            {isLider
              ? 'Gerencie e autorize os pedidos de substituição de escala do ministério.'
              : 'Solicite e acompanhe seus pedidos de troca de data com aprovação da liderança.'}
          </p>
        </div>

        {user ? (
          <button
            id="btn-nova-solicitacao"
            onClick={() => setShowNovaModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Solicitação</span>
          </button>
        ) : (
          <button
            id="btn-login-to-request"
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
          >
            Fazer Login para Solicitar
          </button>
        )}
      </div>

      {/* Feedback Banner (Success / Error) */}
      {feedbackMessage && (
        <div
          id="solicitacoes-feedback-banner"
          className={`flex items-center justify-between gap-3 p-4 rounded-2xl border text-xs font-semibold animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cache Status Banner */}
      <CacheStatusBanner
        isFromCache={isFromCache}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={refreshData}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-zinc-100">{stats.pendentes}</div>
            <div className="text-[10px] text-zinc-400 font-semibold uppercase">Pendentes</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-zinc-100">{stats.aprovadas}</div>
            <div className="text-[10px] text-zinc-400 font-semibold uppercase">Aprovadas</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center font-bold">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-zinc-100">{stats.recusadas}</div>
            <div className="text-[10px] text-zinc-400 font-semibold uppercase">Recusadas</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-zinc-100">{stats.total}</div>
            <div className="text-[10px] text-zinc-400 font-semibold uppercase">Total Geral</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 self-start text-xs font-bold">
        <button
          id="tab-solicitacoes-pendentes"
          onClick={() => setFilterTab('pendentes')}
          className={`px-3.5 py-1.5 rounded-xl transition-all ${
            filterTab === 'pendentes'
              ? 'bg-orange-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Pendentes ({stats.pendentes})
        </button>

        <button
          id="tab-solicitacoes-todas"
          onClick={() => setFilterTab('todas')}
          className={`px-3.5 py-1.5 rounded-xl transition-all ${
            filterTab === 'todas'
              ? 'bg-orange-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Todas ({stats.total})
        </button>

        {user && (
          <button
            id="tab-solicitacoes-minhas"
            onClick={() => setFilterTab('minhas')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              filterTab === 'minhas'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Minhas Solicitações
          </button>
        )}

        <button
          id="tab-solicitacoes-aprovadas"
          onClick={() => setFilterTab('aprovadas')}
          className={`px-3.5 py-1.5 rounded-xl transition-all ${
            filterTab === 'aprovadas'
              ? 'bg-orange-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Aprovadas ({stats.aprovadas})
        </button>

        <button
          id="tab-solicitacoes-recusadas"
          onClick={() => setFilterTab('recusadas')}
          className={`px-3.5 py-1.5 rounded-xl transition-all ${
            filterTab === 'recusadas'
              ? 'bg-orange-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Recusadas ({stats.recusadas})
        </button>
      </div>

      {/* List of Cards */}
      {solicitacoesFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {solicitacoesFiltradas.map((solicitacao) => {
            const key = solicitacao.id || `${solicitacao.dataEscala}-${solicitacao.quemPediu}-${solicitacao.substituto}`;
            return (
              <SolicitacaoCard
                key={key}
                solicitacao={solicitacao}
                currentUserNome={user?.nome}
                isLider={Boolean(isLider)}
                onProcessar={handleProcessar}
                isProcessing={processingId === (solicitacao.id || solicitacao.quemPediu)}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ArrowRightLeft}
          title="Nenhuma solicitação encontrada"
          description={
            filterTab === 'pendentes'
              ? 'Não há solicitações de troca aguardando aprovação no momento.'
              : 'Nenhum registro de troca de escala para este filtro.'
          }
          actionLabel={user ? 'Fazer Nova Solicitação' : 'Fazer Login'}
          onAction={user ? () => setShowNovaModal(true) : () => navigate('/login')}
        />
      )}

      {/* Modal para criar nova solicitação */}
      {showNovaModal && user && (
        <NovaSolicitacaoModal
          currentUser={user}
          escalas={data.escala}
          integrantes={data.integrantes}
          onClose={() => setShowNovaModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};
