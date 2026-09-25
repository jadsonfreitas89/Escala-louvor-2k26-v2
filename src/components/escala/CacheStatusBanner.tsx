import React from 'react';
import { Database, RefreshCw, WifiOff, CheckCircle2 } from 'lucide-react';

interface CacheStatusBannerProps {
  isFromCache: boolean;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const CacheStatusBanner: React.FC<CacheStatusBannerProps> = ({
  isFromCache,
  lastUpdated,
  isRefreshing,
  onRefresh
}) => {
  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const formattedDate = lastUpdated
    ? lastUpdated.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : null;

  if (isFromCache) {
    return (
      <div
        id="cache-status-warning"
        className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
          <div className="truncate">
            <span className="font-bold">Modo Offline / Cache:</span>{' '}
            <span>
              Exibindo escala salva localmente
              {formattedTime && ` (Atualizada em ${formattedTime})`}.
            </span>
          </div>
        </div>
        <button
          id="btn-sync-cache"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="cache-status-online"
      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 text-xs"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>
          Dados reais sincronizados com o Google Sheets
          {formattedTime && ` • Atualizado às ${formattedTime}`}
        </span>
      </div>
      <button
        id="btn-refresh-escala"
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Atualizar escalas agora"
        className="flex items-center gap-1 text-zinc-400 hover:text-orange-400 transition-colors shrink-0 disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
      </button>
    </div>
  );
};
