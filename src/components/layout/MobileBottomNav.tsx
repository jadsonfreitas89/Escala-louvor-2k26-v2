import React from 'react';
import { Home, CalendarDays, MessageSquare, Repeat, User } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { AppRoute } from '../../types';

export const MobileBottomNav: React.FC = () => {
  const { currentRoute, navigate } = useNavigation();

  const tabs: { label: string; route: AppRoute; icon: React.ReactNode }[] = [
    { label: 'Início', route: '/', icon: <Home size={19} /> },
    { label: 'Escala', route: '/escala', icon: <CalendarDays size={19} /> },
    { label: 'Recados', route: '/recados', icon: <MessageSquare size={19} /> },
    { label: 'Trocas', route: '/solicitacoes', icon: <Repeat size={19} /> },
    { label: 'Perfil', route: '/perfil', icon: <User size={19} /> }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentRoute === tab.route;
          return (
            <button
              key={tab.route}
              onClick={() => navigate(tab.route)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-orange-400 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300 font-medium'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-orange-400" />
              )}
              <div className={`p-1 rounded-lg ${isActive ? 'bg-orange-500/10' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
