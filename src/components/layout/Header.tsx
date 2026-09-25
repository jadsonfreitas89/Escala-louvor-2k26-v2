import React from 'react';
import { RotateCw, Sparkles, User, Settings, Music, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEscala } from '../../context/EscalaContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigation } from '../../context/NavigationContext';
import { Badge } from '../ui/Badge';

export const Header: React.FC = () => {
  const { user, isLider, role } = useAuth();
  const { isRefreshing, refreshData, lastUpdated } = useEscala();
  const { unreadCount } = useNotifications();
  const { currentRoute, navigate } = useNavigation();

  const getRouteTitle = () => {
    switch (currentRoute) {
      case '/':
        return 'Visão Geral';
      case '/escala':
        return 'Escalas de Louvor';
      case '/recados':
        return 'Mural de Recados';
      case '/solicitacoes':
        return 'Solicitações de Troca';
      case '/notificacoes':
        return 'Notificações & Avisos';
      case '/perfil':
        return 'Meu Perfil';
      case '/configuracoes':
        return 'Configurações do Sistema';
      case '/login':
        return 'Acesso ao Sistema';
      default:
        return 'ESCALA DE LOUVOR';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile Brand / Desktop Title */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => navigate('/')}
          className="md:hidden flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-zinc-950 font-black shadow-sm">
            <Music size={16} className="stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-sm text-zinc-100 tracking-wider">
            ESCALA DE <span className="text-orange-400">LOUVOR</span>
          </span>
        </div>

        <div className="hidden md:block">
          <h1 className="text-lg font-black text-zinc-100 tracking-tight">{getRouteTitle()}</h1>
          <p className="text-[11px] text-zinc-500 font-medium">
            {lastUpdated
              ? `Última sincronização: ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Conectado à nuvem Google'}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Notifications Bell */}
        {user && (
          <button
            id="header-btn-notificacoes"
            onClick={() => navigate('/notificacoes')}
            title="Ver notificações"
            className={`relative p-2 rounded-xl border transition-all ${
              currentRoute === '/notificacoes'
                ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500 text-zinc-950 font-black text-[9px] shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Refresh Button */}
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          title="Sincronizar dados"
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          <RotateCw size={16} className={isRefreshing ? 'animate-spin text-orange-400' : ''} />
        </button>

        {/* User Account or Login Button */}
        {user ? (
          <div
            onClick={() => navigate('/perfil')}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
          >
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-zinc-200 max-w-[120px] truncate hidden sm:inline">
              {user.nome.split(' ')[0]}
            </span>
            <Badge variant={isLider ? 'primary' : 'secondary'} size="sm" className="hidden sm:inline-flex text-[10px]">
              {isLider ? 'Líder' : 'Membro'}
            </Badge>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-zinc-950 font-bold text-xs hover:bg-orange-400 transition-all shadow-sm"
          >
            <User size={14} />
            <span>Entrar</span>
          </button>
        )}
      </div>
    </header>
  );
};
