import React from 'react';
import {
  CalendarDays,
  Home,
  MessageSquare,
  Repeat,
  User,
  Settings,
  ShieldCheck,
  Music,
  LogOut,
  Sparkles,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';
import { AppRoute } from '../../types';
import { Badge } from '../ui/Badge';

export const DesktopSidebar: React.FC = () => {
  const { currentRoute, navigate } = useNavigation();
  const { user, role, isLider, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems: { label: string; route: AppRoute; icon: React.ReactNode; badge?: string }[] = [
    { label: 'Início', route: '/', icon: <Home size={18} /> },
    { label: 'Escala Geral', route: '/escala', icon: <CalendarDays size={18} /> },
    { label: 'Mural de Recados', route: '/recados', icon: <MessageSquare size={18} /> },
    { label: 'Solicitações', route: '/solicitacoes', icon: <Repeat size={18} /> },
    {
      label: 'Notificações',
      route: '/notificacoes',
      icon: <Bell size={18} />,
      badge: unreadCount > 0 ? `${unreadCount}` : undefined
    },
    { label: 'Meu Perfil', route: '/perfil', icon: <User size={18} /> },
    { label: 'Configurações', route: '/configuracoes', icon: <Settings size={18} /> }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/80 bg-zinc-950/90 h-screen sticky top-0 px-4 py-6 justify-between select-none">
      {/* Brand & Logo */}
      <div className="space-y-6">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-zinc-900/60 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-orange-500/20">
            <Music size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="text-sm font-black tracking-wider text-zinc-100 flex items-center gap-1.5">
              <span>ESCALA DE</span>
              <span className="text-orange-400">LOUVOR</span>
            </div>
            <div className="text-[10px] font-semibold text-zinc-500 tracking-widest uppercase">
              Ministério de Louvor
            </div>
          </div>
        </div>

        {/* User Card */}
        {user ? (
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold text-sm">
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-zinc-200 truncate">{user.nome}</div>
              <div className="mt-0.5">
                <Badge
                  variant={isLider ? 'primary' : 'secondary'}
                  size="sm"
                  className="text-[10px] py-0 px-1.5"
                >
                  {isLider ? 'Líder' : user.funcao || 'Integrante'}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => navigate('/login')}
            className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between cursor-pointer hover:bg-orange-500/15 transition-all"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
              <Sparkles size={14} />
              <span>Entrar no Sistema</span>
            </div>
            <span className="text-[10px] text-orange-400/70 font-medium">Login →</span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
            Navegação Principal
          </div>
          {navItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-orange-400' : 'text-zinc-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-zinc-900 space-y-3">
        <div className="flex items-center justify-between px-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Planilha Conectada
          </span>
          <span className="text-[10px] text-zinc-600">v2.6 Web</span>
        </div>

        {user && (
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={15} />
            <span>Encerrar Sessão</span>
          </button>
        )}
      </div>
    </aside>
  );
};
