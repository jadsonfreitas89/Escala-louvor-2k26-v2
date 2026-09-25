import React, { useState } from 'react';
import {
  CalendarDays,
  MessageSquare,
  Repeat,
  Bell,
  Clock,
  Check,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Music
} from 'lucide-react';
import { Notificacao, AppRoute } from '../../types';
import { Badge } from '../ui/Badge';
import { useNavigation } from '../../context/NavigationContext';

interface NotificacaoCardProps {
  notificacao: Notificacao;
  onMarcarLida: (id: string) => Promise<boolean>;
}

export const NotificacaoCard: React.FC<NotificacaoCardProps> = ({
  notificacao,
  onMarcarLida
}) => {
  const { navigate } = useNavigation();
  const [isMarking, setIsMarking] = useState(false);

  const isLida = (notificacao.lida || '').toUpperCase() === 'SIM';
  const tipoUpper = (notificacao.tipo || 'GERAL').toUpperCase();

  // Mapeamento visual por tipo
  const getTypeConfig = () => {
    switch (tipoUpper) {
      case 'CULTO':
      case 'LEMBRETE':
        return {
          icon: <Clock size={16} className="text-amber-400" />,
          badgeVariant: 'warning' as const,
          label: 'Lembrete de Culto',
          targetRoute: '/escala' as AppRoute,
          targetLabel: 'Ver Detalhes do Culto'
        };
      case 'NOVA_ESCALA':
      case 'ESCALA':
        return {
          icon: <CalendarDays size={16} className="text-orange-400" />,
          badgeVariant: 'primary' as const,
          label: 'Nova Escala',
          targetRoute: '/escala' as AppRoute,
          targetLabel: 'Ver Escala'
        };
      case 'NOVO_RECADO':
      case 'RECADO':
        return {
          icon: <MessageSquare size={16} className="text-blue-400" />,
          badgeVariant: 'info' as const,
          label: 'Novo Recado',
          targetRoute: '/recados' as AppRoute,
          targetLabel: 'Ver Mural'
        };
      case 'SOLICITACAO_NOVA':
      case 'SOLICITACAO':
        return {
          icon: <Repeat size={16} className="text-purple-400" />,
          badgeVariant: 'purple' as const,
          label: 'Nova Solicitação',
          targetRoute: '/solicitacoes' as AppRoute,
          targetLabel: 'Ver Solicitações'
        };
      case 'SOLICITACAO_APROVADA':
        return {
          icon: <CheckCircle2 size={16} className="text-emerald-400" />,
          badgeVariant: 'success' as const,
          label: 'Troca Aprovada',
          targetRoute: '/solicitacoes' as AppRoute,
          targetLabel: 'Ver Detalhes'
        };
      case 'SOLICITACAO_RECUSADA':
        return {
          icon: <XCircle size={16} className="text-rose-400" />,
          badgeVariant: 'danger' as const,
          label: 'Troca Recusada',
          targetRoute: '/solicitacoes' as AppRoute,
          targetLabel: 'Ver Detalhes'
        };
      case 'LOUVORES_UNIFORMES':
        return {
          icon: <Music size={16} className="text-emerald-400" />,
          badgeVariant: 'success' as const,
          label: 'Louvores & Uniformes',
          targetRoute: '/escala' as AppRoute,
          targetLabel: 'Ver Repertório'
        };
      default:
        return {
          icon: <Bell size={16} className="text-zinc-400" />,
          badgeVariant: 'secondary' as const,
          label: 'Comunicado',
          targetRoute: '/' as AppRoute,
          targetLabel: 'Início'
        };
    }
  };

  const config = getTypeConfig();

  // Formatação de data/hora no fuso America/Sao_Paulo
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const timeString = d.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (isToday) {
        return `Hoje às ${timeString}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      if (isYesterday) {
        return `Ontem às ${timeString}`;
      }

      const dateString = d.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      return `${dateString} às ${timeString}`;
    } catch {
      return dateStr;
    }
  };

  const handleMarcar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLida || isMarking) return;
    setIsMarking(true);
    try {
      await onMarcarLida(notificacao.id);
    } finally {
      setIsMarking(false);
    }
  };

  const handleNavigate = () => {
    if (!isLida) {
      onMarcarLida(notificacao.id);
    }
    navigate(config.targetRoute);
  };

  return (
    <div
      id={`notificacao-card-${notificacao.id}`}
      onClick={handleNavigate}
      className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
        !isLida
          ? 'bg-zinc-900/90 border-orange-500/30 hover:border-orange-500/60 shadow-md shadow-orange-500/5'
          : 'bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700/80 hover:bg-zinc-900/40 opacity-80 hover:opacity-100'
      }`}
    >
      {/* Unread indicator dot */}
      {!isLida && (
        <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
        </span>
      )}

      <div className="flex items-start gap-3.5">
        {/* Type Icon */}
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            !isLida ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-900 border border-zinc-800/80'
          }`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Header with Type Badge and Date */}
          <div className="flex items-center gap-2 flex-wrap pr-6">
            <Badge variant={config.badgeVariant} size="sm" className="text-[10px] py-0">
              {config.label}
            </Badge>

            {!isLida && (
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider bg-orange-500/10 px-1.5 py-0.2 rounded-md border border-orange-500/20">
                Nova
              </span>
            )}

            <span className="text-[11px] text-zinc-500 font-medium">
              {formatDateTime(notificacao.data)}
            </span>
          </div>

          {/* Title */}
          <h4
            className={`text-sm font-bold tracking-tight leading-snug ${
              !isLida ? 'text-zinc-100' : 'text-zinc-300'
            }`}
          >
            {notificacao.titulo || 'Comunicado'}
          </h4>

          {/* Message */}
          <p className="text-xs text-zinc-400 leading-relaxed break-words whitespace-pre-line">
            {notificacao.mensagem}
          </p>

          {/* Actions Footer */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              <span>{config.targetLabel}</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            {!isLida && (
              <button
                id={`btn-marcar-lida-${notificacao.id}`}
                onClick={handleMarcar}
                disabled={isMarking}
                title="Marcar como lida"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-[11px] font-medium transition-all disabled:opacity-50"
              >
                <Check size={12} className="text-emerald-400" />
                <span>{isMarking ? 'Marcando...' : 'Marcar como lida'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
