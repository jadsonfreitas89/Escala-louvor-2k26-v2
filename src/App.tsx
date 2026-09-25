import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EscalaProvider } from './context/EscalaContext';
import { NotificationProvider } from './context/NotificationContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { EscalaPage } from './pages/EscalaPage';
import { RecadosPage } from './pages/RecadosPage';
import { SolicitacoesPage } from './pages/SolicitacoesPage';
import { NotificacoesPage } from './pages/NotificacoesPage';
import { PerfilPage } from './pages/PerfilPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { PwaDiagnosticPage } from './pages/PwaDiagnosticPage';
import { LoginPage } from './pages/LoginPage';
import { LoadingState } from './components/ui/LoadingState';

const AppContent: React.FC = () => {
  const { currentRoute, navigate } = useNavigation();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirecionamento de proteção de rotas privadas
  useEffect(() => {
    if (!isLoading && !isAuthenticated && currentRoute !== '/login') {
      // Se não autenticado e tentar acessar rotas internas
      if (
        currentRoute === '/perfil' ||
        currentRoute === '/solicitacoes' ||
        currentRoute === '/notificacoes'
      ) {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, currentRoute, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <LoadingState message="Verificando sessão segura..." />
      </div>
    );
  }

  // Página de login dedicada
  if (currentRoute === '/login') {
    return (
      <AppLayout>
        <LoginPage />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {currentRoute === '/' && <HomePage />}
      {currentRoute === '/escala' && <EscalaPage />}
      {currentRoute === '/recados' && <RecadosPage />}
      {currentRoute === '/solicitacoes' && <SolicitacoesPage />}
      {currentRoute === '/notificacoes' && <NotificacoesPage />}
      {currentRoute === '/perfil' && <PerfilPage />}
      {currentRoute === '/configuracoes' && <ConfiguracoesPage />}
      {currentRoute === '/pwa-diagnostic' && <PwaDiagnosticPage />}
    </AppLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <EscalaProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </EscalaProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
