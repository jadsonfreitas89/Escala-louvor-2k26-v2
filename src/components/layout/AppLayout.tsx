import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Header } from './Header';
import { InAppNotificationPopup } from '../notificacoes/InAppNotificationPopup';
import { useNavigation } from '../../context/NavigationContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentRoute } = useNavigation();
  const isLoginPage = currentRoute === '/login';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-orange-500/30 selection:text-orange-200">
      {/* In-App Notification Alert Banner */}
      <InAppNotificationPopup />

      {/* Sidebar for Desktop */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${!isLoginPage ? 'pb-20 md:pb-6' : 'pb-6'}`}>
        <Header />

        <main className={`flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto ${isLoginPage ? 'flex items-center justify-center min-h-[calc(100vh-5rem)]' : ''}`}>
          {children}
        </main>
      </div>

      {/* Bottom Navigation for Mobile (oculta na tela de login) */}
      {!isLoginPage && <MobileBottomNav />}
    </div>
  );
};
