import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppRoute } from '../types';

interface NavigationContextType {
  currentRoute: AppRoute;
  navigate: (route: AppRoute) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('/');

  // Lê a rota inicial a partir do pathname
  useEffect(() => {
    const normalizePath = (path: string): AppRoute => {
      const p = path.toLowerCase();
      if (p.startsWith('/login')) return '/login';
      if (p.startsWith('/escala')) return '/escala';
      if (p.startsWith('/recados')) return '/recados';
      if (p.startsWith('/solicitacoes')) return '/solicitacoes';
      if (p.startsWith('/notificacoes')) return '/notificacoes';
      if (p.startsWith('/perfil')) return '/perfil';
      if (p.startsWith('/configuracoes')) return '/configuracoes';
      if (p.startsWith('/pwa-diagnostic')) return '/pwa-diagnostic';
      return '/';
    };

    setCurrentRoute(normalizePath(window.location.pathname));

    const handlePopState = () => {
      setCurrentRoute(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((route: AppRoute) => {
    setCurrentRoute(route);
    try {
      window.history.pushState({}, '', route);
    } catch (e) {
      console.warn('Erro ao atualizar URL no histórico:', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <NavigationContext.Provider value={{ currentRoute, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation deve ser utilizado dentro de um NavigationProvider');
  }
  return context;
};
