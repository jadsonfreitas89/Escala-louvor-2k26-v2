import React from 'react';
import {
  Calendar,
  User,
  Mic,
  Music2,
  Volume2,
  Shirt,
  Play,
  Sparkles,
  CheckCircle2,
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
  isToday
} from '../../utils/cultoUtils';

interface EscalaCardProps {
  escala: Escala;
  currentUserNome?: string | null;
  integrantes: Integrante[];
  linkLouvores: LouvorItem[];
  isLider?: boolean;
  isDirigente?: boolean;
  onOpenDetails: (escala: Escala) => void;
  onRequestTroca?: (escala: Escala) => void;
  onEditEscala?: (escala: Escala) => void;
}

export const EscalaCard: React.FC<EscalaCardProps> = ({
  escala,
  currentUserNome,
  integrantes,
  linkLouvores,
  isLider = false,
  isDirigente = false,
  onOpenDetails,
  onRequestTroca,
  onEditEscala
}) => {
  const tituloCulto = getTituloCulto(escala.data);
  const diaSemana = getDiaSemanaExtenso(escala.data);
  const hoje = isToday(escala.data);
  const userRole = getUserRoleInEscala(escala, currentUserNome, integrantes);
  const detailedPraises = getLouvoresForEscala(escala.data, linkLouvores, escala.louvores);
  const musicosFormatados = formatMusiciansWithInstrument(escala.musicos, integrantes);

  const canEdit = isLider || (isDirigente && escala.dirigente === currentUserNome);

  return (
    <div
      id={`escala-card-${escala.data.replace(/[^0-9]/g, '')}`}
      className={`relative flex flex-col rounded-3xl p-5 md:p-6 transition-all duration-200 border ${
        userRole
          ? 'bg-zinc-900/90 border-orange-500/40 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20'
          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/90'
      }`}
    >
      {/* Top Badges & Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
            {tituloCulto}
          </span>
          {hoje && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
              Hoje
            </span>
          )}
        </div>

        {/* Destaque da Participação do Usuário */}
        {userRole && (
          <div
            id={`badge-user-scheduled-${escala.data.replace(/[^0-9]/g, '')}`}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-500 text-zinc-950 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>VOCÊ ESTÁ ESCALADO ({userRole})</span>
          </div>
        )}
      </div>

      {/* Date and Day */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl md:text-2xl font-black text-zinc-100 tracking-tight">
            {escala.data}
          </h3>
          <span className="text-xs font-semibold text-zinc-400">
            {diaSemana}
          </span>
        </div>
      </div>

      <div className="h-px bg-zinc-800/80 mb-4" />

      {/* Team Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
        {/* Dirigente */}
        <div className="flex items-start gap-2 text-zinc-300">
          <User className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Dirigente
            </span>
            <span className="font-semibold text-zinc-100">
              {escala.dirigente || 'Não definido'}
            </span>
          </div>
        </div>

        {/* Vocal */}
        <div className="flex items-start gap-2 text-zinc-300">
          <Mic className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Vocal
            </span>
            <span className="font-semibold text-zinc-100">
              {escala.vocal ? escala.vocal.replace(/\s*X\s*/g, ' • ') : 'Não definido'}
            </span>
          </div>
        </div>

        {/* Músicos */}
        <div className="flex items-start gap-2 text-zinc-300 sm:col-span-2">
          <Music2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Músicos
            </span>
            <span className="font-semibold text-zinc-100">
              {musicosFormatados || (escala.musicos ? escala.musicos.replace(/\s*X\s*/g, ' • ') : 'Não definido')}
            </span>
          </div>
        </div>

        {/* Mesário */}
        {escala.mesario && (
          <div className="flex items-start gap-2 text-zinc-300">
            <Volume2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Mesário
              </span>
              <span className="font-semibold text-zinc-100">
                {escala.mesario}
              </span>
            </div>
          </div>
        )}

        {/* Uniforme */}
        {escala.uniforme && (
          <div className="flex items-start gap-2 text-zinc-300">
            <Shirt className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Uniforme
              </span>
              <span className="font-semibold text-zinc-200">
                {escala.uniforme}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-auto pt-2 flex flex-col sm:flex-row gap-2">
        <button
          id={`btn-open-details-${escala.data.replace(/[^0-9]/g, '')}`}
          onClick={() => onOpenDetails(escala)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-zinc-800/80 hover:bg-orange-500 text-orange-400 hover:text-zinc-950 font-bold text-xs transition-all duration-150 border border-zinc-700/50 hover:border-orange-500 shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>
            LOUVORES ({detailedPraises.length})
          </span>
        </button>

        {canEdit && onEditEscala && (
          <button
            id={`btn-editar-escala-${escala.data.replace(/[^0-9]/g, '')}`}
            onClick={() => onEditEscala(escala)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 font-bold text-xs transition-all"
            title="Editar escala do culto"
          >
            <Edit2 className="w-3.5 h-3.5 text-orange-400" />
            <span className="sm:hidden md:inline">Editar</span>
          </button>
        )}

        {userRole && onRequestTroca && (
          <button
            id={`btn-solicitar-troca-${escala.data.replace(/[^0-9]/g, '')}`}
            onClick={() => onRequestTroca(escala)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-xs transition-all"
            title="Solicitar troca para esta data"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="sm:hidden md:inline">Solicitar Troca</span>
          </button>
        )}
      </div>
    </div>
  );
};
