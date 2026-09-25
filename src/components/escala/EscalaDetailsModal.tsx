import React from 'react';
import {
  X,
  Calendar,
  User,
  Mic,
  Music2,
  Volume2,
  Shirt,
  Youtube,
  ExternalLink,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Edit2
} from 'lucide-react';
import { Escala, Integrante, LouvorItem } from '../../types';
import {
  getTituloCulto,
  getDiaSemanaExtenso,
  getUserRoleInEscala,
  formatMusiciansWithInstrument,
  getLouvoresForEscala,
  getCleanYouTubeUrl
} from '../../utils/cultoUtils';

interface EscalaDetailsModalProps {
  escala: Escala;
  currentUserNome?: string | null;
  integrantes: Integrante[];
  linkLouvores: LouvorItem[];
  isLider?: boolean;
  isDirigente?: boolean;
  onClose: () => void;
  onRequestTroca?: (escala: Escala) => void;
  onEditEscala?: (escala: Escala) => void;
}

export const EscalaDetailsModal: React.FC<EscalaDetailsModalProps> = ({
  escala,
  currentUserNome,
  integrantes,
  linkLouvores,
  isLider = false,
  isDirigente = false,
  onClose,
  onRequestTroca,
  onEditEscala
}) => {
  const tituloCulto = getTituloCulto(escala.data);
  const diaSemana = getDiaSemanaExtenso(escala.data);
  const userRole = getUserRoleInEscala(escala, currentUserNome, integrantes);
  const detailedPraises = getLouvoresForEscala(escala.data, linkLouvores, escala.louvores);
  const musicosFormatados = formatMusiciansWithInstrument(escala.musicos, integrantes);

  const canEdit = isLider || (isDirigente && escala.dirigente === currentUserNome);

  return (
    <div
      id="escala-details-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="escala-details-modal"
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 md:p-6 border-b border-zinc-800/80 bg-zinc-900/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {tituloCulto}
              </span>
              {userRole && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-zinc-950">
                  Você está escalado ({userRole})
                </span>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-zinc-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              {escala.data}
              <span className="text-xs font-medium text-zinc-400 font-sans">
                ({diaSemana})
              </span>
            </h3>
          </div>

          <button
            id="btn-modal-close-header"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-2xl bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* SEÇÃO 1: LOUVORES DO CULTO */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Músicas / Louvores Cadastrados
              </h4>
              <span className="text-[11px] text-zinc-400 font-medium">
                {detailedPraises.length} {detailedPraises.length === 1 ? 'música' : 'músicas'}
              </span>
            </div>

            {detailedPraises.length > 0 ? (
              <div className="space-y-2">
                {detailedPraises.map((praise, idx) => {
                  const rawUrl = praise.youtubeUrl || praise.link_youtube || praise.linkYoutube || (praise.youtubeVideoId ? `https://www.youtube.com/watch?v=${praise.youtubeVideoId}` : '');
                  const youtubeUrl = getCleanYouTubeUrl(rawUrl) || (praise.youtubeVideoId ? `https://www.youtube.com/watch?v=${praise.youtubeVideoId}` : null);
                  const orderNum = praise.ordem || idx + 1;
                  const praiseTitle = praise.titulo || praise.louvor || 'Louvor sem título';

                  return (
                    <div
                      key={praise.id || `praise-${idx}`}
                      id={`louvor-item-${idx}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="flex items-center justify-center w-6 h-6 rounded-xl bg-orange-500/10 text-orange-400 text-xs font-bold shrink-0 mt-0.5">
                          {orderNum}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-100 break-words">
                            {praiseTitle}
                          </p>
                        </div>
                      </div>

                      {youtubeUrl && (
                        <a
                          id={`btn-youtube-${idx}`}
                          href={youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold transition-all shrink-0 self-start sm:self-center cursor-pointer shadow-sm"
                          title="Ver louvor no YouTube"
                        >
                          <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Ver no YouTube</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70 shrink-0" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-center text-xs text-zinc-400">
                Nenhum louvor cadastrado para este culto no momento.
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* SEÇÃO 2: EQUIPE DO CULTO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Equipe Escalada
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dirigente */}
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>Dirigente</span>
                </div>
                <p className="text-sm font-semibold text-zinc-100">
                  {escala.dirigente || 'Não informado'}
                </p>
              </div>

              {/* Vocal */}
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1">
                  <Mic className="w-3.5 h-3.5 text-orange-400" />
                  <span>Vocal</span>
                </div>
                <p className="text-sm font-semibold text-zinc-100">
                  {escala.vocal ? escala.vocal.replace(/\s*X\s*/g, ' • ') : 'Não informado'}
                </p>
              </div>

              {/* Músicos */}
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 sm:col-span-2">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1">
                  <Music2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Músicos & Instrumentos</span>
                </div>
                <p className="text-sm font-semibold text-zinc-100">
                  {musicosFormatados || (escala.musicos ? escala.musicos.replace(/\s*X\s*/g, ' • ') : 'Não informado')}
                </p>
              </div>

              {/* Mesário */}
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1">
                  <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Mesário de Som</span>
                </div>
                <p className="text-sm font-semibold text-zinc-100">
                  {escala.mesario || 'Não informado'}
                </p>
              </div>

              {/* Uniforme */}
              {escala.uniforme && escala.uniforme.trim().length > 0 && (
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1">
                    <Shirt className="w-3.5 h-3.5 text-orange-400" />
                    <span>Uniforme / Vestimenta</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-200">
                    {escala.uniforme}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-5 border-t border-zinc-800/80 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && onEditEscala && (
              <button
                id="btn-modal-editar-escala"
                onClick={() => {
                  onClose();
                  onEditEscala(escala);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold text-xs transition-all"
              >
                <Edit2 className="w-4 h-4 text-orange-400" />
                <span>Editar Escala</span>
              </button>
            )}

            {userRole && onRequestTroca && (
              <button
                id="btn-modal-solicitar-troca"
                onClick={() => {
                  onClose();
                  onRequestTroca(escala);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 font-bold text-xs transition-all"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Solicitar Troca</span>
              </button>
            )}
          </div>

          <button
            id="btn-modal-close-footer"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-sm transition-all shadow-lg shadow-orange-500/10"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
