import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  User,
  ArrowRightLeft,
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Escala, Integrante } from '../../types';
import {
  getTituloCulto,
  getDiaSemanaExtenso,
  isUpcoming,
  isUserInEscala,
  getUserRoleInEscala,
  normalizarNome
} from '../../utils/cultoUtils';
import { apiService } from '../../services/api';

interface NovaSolicitacaoModalProps {
  currentUser: {
    nome: string;
    funcao?: string;
    instrumento?: string;
  };
  escalas: Escala[];
  integrantes: Integrante[];
  initialEscala?: Escala | null;
  onClose: () => void;
  onSuccess: (mensagem: string) => void;
}

export const NovaSolicitacaoModal: React.FC<NovaSolicitacaoModalProps> = ({
  currentUser,
  escalas,
  integrantes,
  initialEscala,
  onClose,
  onSuccess
}) => {
  // Lista de escalas futuras onde o usuário está escalado
  const minhasEscalasFuturas = useMemo(() => {
    return escalas.filter(
      (e) => isUpcoming(e.data) && isUserInEscala(e, currentUser.nome)
    );
  }, [escalas, currentUser.nome]);

  const [selectedData, setSelectedData] = useState<string>(
    initialEscala?.data || minhasEscalasFuturas[0]?.data || ''
  );
  const [selectedSubstituto, setSelectedSubstituto] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Escala atualmente selecionada
  const selectedEscala = useMemo(() => {
    return escalas.find((e) => e.data === selectedData) || null;
  }, [escalas, selectedData]);

  // Função e instrumento do usuário na escala selecionada
  const userRole = useMemo(() => {
    if (!selectedEscala) return '';
    return getUserRoleInEscala(selectedEscala, currentUser.nome, integrantes) || '';
  }, [selectedEscala, currentUser.nome, integrantes]);

  // Integrante autenticado completo
  const memberObj = useMemo(() => {
    return (
      integrantes.find(
        (i) => normalizarNome(i.nome) === normalizarNome(currentUser.nome)
      ) || null
    );
  }, [integrantes, currentUser.nome]);

  const userInstrument = memberObj?.instrumento || currentUser.instrumento || '';

  // Filtro de substitutos compatíveis baseado nas regras do Android e do Apps Script
  const substitutosCompativeis = useMemo(() => {
    if (!selectedEscala) return [];

    const normCurrentUser = normalizarNome(currentUser.nome);

    return integrantes
      .filter((i) => normalizarNome(i.nome) !== normCurrentUser)
      .map((integrante) => {
        // Verifica se o integrante já está escalado nesta data
        const jaEscalado = isUserInEscala(selectedEscala, integrante.nome);
        const funcaoNorm = normalizarNome(integrante.funcao);
        const instrumentoNorm = normalizarNome(integrante.instrumento);

        let isCompativel = true;

        if (userRole.toLowerCase().includes('dirigente')) {
          isCompativel =
            funcaoNorm.includes('dirigente') || funcaoNorm.includes('lider');
        } else if (userRole.toLowerCase().includes('vocal')) {
          isCompativel =
            funcaoNorm.includes('vocal') || funcaoNorm.includes('integrante');
        } else if (userRole.toLowerCase().includes('musico') || userRole.toLowerCase().includes('músico')) {
          if (userInstrument) {
            isCompativel =
              instrumentoNorm.includes(normalizarNome(userInstrument)) ||
              funcaoNorm.includes('musico');
          } else {
            isCompativel = funcaoNorm.includes('musico');
          }
        } else if (userRole.toLowerCase().includes('mesario') || userRole.toLowerCase().includes('mesário')) {
          isCompativel =
            funcaoNorm.includes('mesario') || funcaoNorm.includes('mesário');
        }

        return {
          ...integrante,
          jaEscalado,
          isCompativel
        };
      })
      .sort((a, b) => {
        // Primeiro os compatíveis e não escalados
        if (a.jaEscalado !== b.jaEscalado) {
          return a.jaEscalado ? 1 : -1;
        }
        return a.nome.localeCompare(b.nome);
      });
  }, [selectedEscala, integrantes, currentUser.nome, userRole, userInstrument]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    if (!selectedData) {
      setErrorMessage('Selecione uma data de escala válida.');
      return;
    }

    if (!selectedSubstituto) {
      setErrorMessage('Selecione um substituto para assumir a sua escala.');
      return;
    }

    if (!motivo.trim()) {
      setErrorMessage('Informe o motivo da solicitação de substituição.');
      return;
    }

    // Validação preventiva no cliente
    if (selectedEscala && isUserInEscala(selectedEscala, selectedSubstituto)) {
      setErrorMessage('O substituto selecionado já está escalado nesta data.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.createSolicitacao({
        dataEscala: selectedData,
        substituto: selectedSubstituto,
        motivo: motivo.trim(),
        funcao: userRole,
        instrumento: userInstrument
      });

      if (!response.sucesso) {
        setErrorMessage(response.mensagem);
        setIsSubmitting(false);
        return;
      }

      onSuccess(response.mensagem);
      onClose();
    } catch (err: any) {
      console.error('Erro ao enviar solicitação:', err);
      setErrorMessage(
        err.message || 'Falha de comunicação ao processar a solicitação.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="nova-solicitacao-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="nova-solicitacao-modal"
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-800/80 bg-zinc-900/90">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Módulo de Substituição
            </span>
            <h3 className="text-xl font-black text-zinc-100 mt-1">
              Solicitar Troca de Escala
            </h3>
          </div>

          <button
            id="btn-close-nova-solicitacao"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar"
            className="p-2 rounded-2xl bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {errorMessage && (
            <div
              id="solicitacao-error-box"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Solicitante (Preenchido automaticamente a partir da sessão segura) */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Solicitante (Identificado via Sessão)
            </span>
            <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
              <User className="w-4 h-4 text-orange-400" />
              <span>{currentUser.nome}</span>
            </div>
          </div>

          {/* Seleção de Data da Escala */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Data da Escala:
            </label>

            {minhasEscalasFuturas.length > 0 ? (
              <select
                id="select-escala-data"
                value={selectedData}
                onChange={(e) => {
                  setSelectedData(e.target.value);
                  setSelectedSubstituto('');
                }}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer disabled:opacity-50"
              >
                {minhasEscalasFuturas.map((e) => (
                  <option key={e.data} value={e.data}>
                    {e.data} - {getTituloCulto(e.data)} ({getDiaSemanaExtenso(e.data)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                Você não está escalado em nenhum dos próximos cultos cadastrados.
              </div>
            )}

            {userRole && (
              <p className="text-[11px] font-semibold text-orange-400 mt-1">
                Sua função nesta data: {userRole}
                {userInstrument ? ` • Instrumento: ${userInstrument}` : ''}
              </p>
            )}
          </div>

          {/* Seleção de Substituto */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Escolha o Substituto:
            </label>

            <select
              id="select-substituto"
              value={selectedSubstituto}
              onChange={(e) => setSelectedSubstituto(e.target.value)}
              disabled={isSubmitting || !selectedData}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer disabled:opacity-50"
            >
              <option value="">Selecione um integrante...</option>
              {substitutosCompativeis.map((sub) => {
                return (
                  <option
                    key={sub.nome}
                    value={sub.nome}
                    disabled={sub.jaEscalado}
                  >
                    {sub.nome}
                    {sub.instrumento ? ` (${sub.instrumento})` : ` [${sub.funcao}]`}
                    {sub.jaEscalado ? ' - (JÁ ESCALADO NESTA DATA)' : ''}
                  </option>
                );
              })}
            </select>
            <p className="text-[10px] text-zinc-400">
              Integrantes já escalados nesta data são bloqueados automaticamente.
            </p>
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Motivo da Solicitação:
            </label>
            <textarea
              id="textarea-motivo-solicitacao"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={isSubmitting}
              placeholder="Explique o motivo do pedido de substituição para a liderança..."
              className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              id="btn-cancelar-modal"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="btn-enviar-solicitacao"
              disabled={isSubmitting || minhasEscalasFuturas.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs transition-all shadow-md shadow-orange-500/10 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Enviar Solicitação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
