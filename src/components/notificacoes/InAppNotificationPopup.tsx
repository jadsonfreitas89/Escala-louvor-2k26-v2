import React, { useEffect, useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  ExternalLink,
  Calendar,
  MessageSquare,
  Repeat,
  Music,
  Sparkles,
  Info
} from 'lucide-react';
import { Notificacao } from '../../types';
import { useNavigation } from '../../context/NavigationContext';
import { useNotification } from '../../context/NotificationContext';

export const InAppNotificationPopup: React.FC = () => {
  const { activePopup, dismissPopup, marcarComoLida } = useNotification();
  const { navigate } = useNavigation();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!activePopup) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const duration = 8000; // 8 segundos de exibição automática
    const stepTime = 100;
    const decrement = (stepTime / duration) * 100;

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrement));
    }, stepTime);

    const autoDismissTimeout = setTimeout(() => {
      dismissPopup();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(autoDismissTimeout);
    };
  }, [activePopup, dismissPopup]);

  if (!activePopup) return null;

  const getNotificationIcon = (tipo: string) => {
    const t = (tipo || '').toUpperCase();
    if (t.includes('CULTO') || t.includes('ESCALA')) {
      return <Calendar className="w-5 h-5 text-orange-400" />;
    }
    if (t.includes('RECADO')) {
      return <MessageSquare className="w-5 h-5 text-emerald-400" />;
    }
    if (t.includes('SOLICITACAO') || t.includes('TROCA')) {
      return <Repeat className="w-5 h-5 text-purple-400" />;
    }
    if (t.includes('LOUVOR')) {
      return <Music className="w-5 h-5 text-amber-400" />;
    }
    return <Bell className="w-5 h-5 text-orange-400" />;
  };

  const handleActionClick = () => {
    const tipo = (activePopup.tipo || '').toUpperCase();
    marcarComoLida(activePopup.id);
    dismissPopup();

    if (tipo.includes('CULTO') || tipo.includes('ESCALA')) {
      navigate('/escala');
    } else if (tipo.includes('RECADO')) {
      navigate('/recados');
    } else if (tipo.includes('SOLICITACAO') || tipo.includes('TROCA')) {
      navigate('/solicitacoes');
    } else {
      navigate('/notificacoes');
    }
  };

  const handleMarkAsReadOnly = () => {
    marcarComoLida(activePopup.id);
    dismissPopup();
  };

  return (
    <div
      id="in-app-notification-container"
      className="fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-[9999] max-w-sm w-[calc(100vw-2rem)] sm:w-96 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto"
      role="alert"
      aria-live="assertive"
    >
      <div
        id={`popup-notif-${activePopup.id}`}
        className="relative overflow-hidden rounded-3xl bg-zinc-900/95 backdrop-blur-md border border-orange-500/40 shadow-2xl shadow-orange-500/10 p-4.5 text-zinc-100 flex flex-col gap-3"
      >
        {/* Barra de Progresso de Auto-dismiss */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Cabeçalho do Alerta */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-orange-500/15 border border-orange-500/30 shrink-0">
              {getNotificationIcon(activePopup.tipo)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                  Nova Notificação
                </span>
                {activePopup.origem && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {activePopup.origem === 'GOOGLE_SHEETS' ? 'Sheets' : 'App'}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-black text-zinc-100 truncate leading-tight mt-0.5">
                {activePopup.titulo}
              </h4>
            </div>
          </div>

          <button
            id="btn-dismiss-popup"
            onClick={dismissPopup}
            className="p-1 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors shrink-0"
            title="Fechar aviso"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo da Mensagem */}
        <p className="text-xs text-zinc-300 leading-relaxed font-medium line-clamp-3">
          {activePopup.mensagem}
        </p>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
          <button
            id="btn-popup-mark-read"
            onClick={handleMarkAsReadOnly}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Marcar lida</span>
          </button>

          <button
            id="btn-popup-action"
            onClick={handleActionClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer"
          >
            <span>Ver detalhes</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
