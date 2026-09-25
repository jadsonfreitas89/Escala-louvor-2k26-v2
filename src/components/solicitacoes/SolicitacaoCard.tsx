import React, { useState } from 'react';
import {
  Calendar,
  User,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Shield,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { Solicitacao, Integrante } from '../../types';
import { getTituloCulto, getDiaSemanaExtenso } from '../../utils/cultoUtils';

interface SolicitacaoCardProps {
  solicitacao: Solicitacao;
  currentUserNome?: string | null;
  isLider: boolean;
  onProcessar: (
    solicitacao: Solicitacao,
    acao: 'APROVAR' | 'RECUSAR' | 'CANCELAR',
    motivoDecisao?: string
  ) => Promise<void>;
  isProcessing: boolean;
}

export const SolicitacaoCard: React.FC<SolicitacaoCardProps> = ({
  solicitacao,
  currentUserNome,
  isLider,
  onProcessar,
  isProcessing
}) => {
  const [showRecusarPrompt, setShowRecusarPrompt] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const tituloCulto = getTituloCulto(solicitacao.dataEscala);
  const diaSemana = getDiaSemanaExtenso(solicitacao.dataEscala);
  const isMyRequest =
    Boolean(currentUserNome) &&
    solicitacao.quemPediu.trim().toLowerCase() === (currentUserNome || '').trim().toLowerCase();

  const isPending = solicitacao.status.toUpperCase() === 'PENDENTE';

  const renderStatusBadge = () => {
    switch (solicitacao.status.toUpperCase()) {
      case 'APROVADA':
      case 'AUTORIZADA':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovada
          </span>
        );
      case 'RECUSADA':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Recusada
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Ban className="w-3.5 h-3.5" />
            Cancelada
          </span>
        );
      case 'PENDENTE':
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-500/15 text-orange-400 border border-orange-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Aguardando Aprovação
          </span>
        );
    }
  };

  return (
    <div
      id={`solicitacao-card-${solicitacao.id || solicitacao.dataEscala.replace(/[^0-9]/g, '')}`}
      className={`rounded-3xl p-5 md:p-6 border transition-all duration-200 ${
        isPending
          ? 'bg-zinc-900/90 border-orange-500/30 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/10'
          : 'bg-zinc-900/60 border-zinc-800/80'
      }`}
    >
      {/* Top row: Date & Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {tituloCulto}
            </span>
            {isMyRequest && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                Sua Solicitação
              </span>
            )}
          </div>
          <h3 className="text-lg md:text-xl font-black text-zinc-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            {solicitacao.dataEscala}
            <span className="text-xs font-medium text-zinc-400 font-sans">
              ({diaSemana})
            </span>
          </h3>
        </div>

        <div>{renderStatusBadge()}</div>
      </div>

      <div className="h-px bg-zinc-800/80 mb-4" />

      {/* Grid: Solicitante & Substituto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Quem pediu */}
        <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Solicitante
          </span>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-100 truncate">
                {solicitacao.quemPediu}
              </p>
              {(solicitacao.funcao || solicitacao.instrumento) && (
                <p className="text-[11px] text-zinc-400 truncate">
                  {solicitacao.funcao}
                  {solicitacao.instrumento ? ` (${solicitacao.instrumento})` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Substituto */}
        <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
          <span className="block text-[11px] font-bold text-emerald-400/90 uppercase tracking-wider mb-0.5">
            Substituto Indicado
          </span>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-sm font-bold text-zinc-100 truncate">
              {solicitacao.substituto}
            </p>
          </div>
        </div>
      </div>

      {/* Motivo da Solicitação */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-xs mb-4">
        <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[11px] uppercase tracking-wider mb-1">
          <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
          Motivo informado:
        </div>
        <p className="text-zinc-200 leading-relaxed italic">
          "{solicitacao.motivo || 'Motivo não informado'}"
        </p>
      </div>

      {/* Resposta da Decisão (se já foi aprovada/recusada) */}
      {(solicitacao.motivoDecisao || solicitacao.decididoPor || solicitacao.dataDecisao) && (
        <div
          className={`p-3.5 rounded-2xl border text-xs mb-4 ${
            solicitacao.status.toUpperCase() === 'RECUSADA'
              ? 'bg-red-500/10 border-red-500/20 text-red-200'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            Decisão da Liderança
            {solicitacao.decididoPor && ` (${solicitacao.decididoPor})`}:
          </div>
          {solicitacao.motivoDecisao && (
            <p className="text-zinc-200 italic mb-1">
              "{solicitacao.motivoDecisao}"
            </p>
          )}
          {solicitacao.dataDecisao && (
            <span className="text-[10px] text-zinc-400 block mt-1">
              Processado em: {solicitacao.dataDecisao}
            </span>
          )}
        </div>
      )}

      {/* AÇÕES DE LIDERANÇA (Para o Líder em solicitações PENDENTES) */}
      {isLider && isPending && (
        <div className="pt-2 border-t border-zinc-800/80 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            Painel da Liderança: Ação Necessária
          </div>

          {!showRecusarPrompt ? (
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                id={`btn-aprovar-${solicitacao.id || solicitacao.quemPediu}`}
                onClick={() => onProcessar(solicitacao, 'APROVAR')}
                disabled={isProcessing}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>AUTORIZAR TROCA</span>
              </button>

              <button
                id={`btn-recusar-${solicitacao.id || solicitacao.quemPediu}`}
                onClick={() => setShowRecusarPrompt(true)}
                disabled={isProcessing}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold text-xs transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>RECUSAR...</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-red-500/30 space-y-2.5">
              <label className="block text-xs font-bold text-red-300">
                Motivo da recusa (opcional):
              </label>
              <input
                type="text"
                value={motivoRecusa}
                onChange={(e) => setMotivoRecusa(e.target.value)}
                placeholder="Ex: Substituto já tem compromisso..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecusarPrompt(false)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onProcessar(solicitacao, 'RECUSAR', motivoRecusa);
                    setShowRecusarPrompt(false);
                  }}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar Recusa
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AÇÃO DO SOLICITANTE (Cancelar se ainda estiver pendente) */}
      {!isLider && isMyRequest && isPending && (
        <div className="pt-2 border-t border-zinc-800/80">
          {!showConfirmCancel ? (
            <button
              id={`btn-cancelar-pedido-${solicitacao.id || solicitacao.quemPediu}`}
              onClick={() => setShowConfirmCancel(true)}
              disabled={isProcessing}
              className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors"
            >
              Cancelar esta solicitação
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
              <span className="text-red-300 font-medium">Deseja realmente cancelar?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfirmCancel(false)}
                  disabled={isProcessing}
                  className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 font-semibold"
                >
                  Não
                </button>
                <button
                  onClick={() => {
                    onProcessar(solicitacao, 'CANCELAR');
                    setShowConfirmCancel(false);
                  }}
                  disabled={isProcessing}
                  className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Cancelando...' : 'Sim, Cancelar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
