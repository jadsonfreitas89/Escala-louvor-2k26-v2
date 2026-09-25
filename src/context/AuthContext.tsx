import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthUser, UserRole, AuthSession } from '../types';
import { apiService } from '../services/api';

interface AuthContextType extends AuthSession {
  login: (nome: string, senha?: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restaura sessão no primeiro carregamento através do token seguro
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedToken = apiService.getToken();
      if (!savedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      setToken(savedToken);
      const res = await apiService.getMe(savedToken);
      if (res.sucesso && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (e) {
      console.error('Erro ao restaurar sessão:', e);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const role: UserRole = useMemo(() => {
    if (!user) return 'VISITANTE';
    return user.role || 'INTEGRANTE';
  }, [user]);

  const isLider = role === 'LIDER';
  const isDirigente = role === 'DIRIGENTE';
  const isIntegrante = role === 'INTEGRANTE' || isLider || isDirigente;
  const isAuthenticated = !!user && !!token;

  /**
   * Realiza login no backend seguro
   */
  const login = async (nome: string, senha?: string): Promise<{ sucesso: boolean; mensagem?: string }> => {
    setError(null);
    try {
      const res = await apiService.login(nome, senha);
      if (res.sucesso && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        return { sucesso: true, mensagem: res.mensagem };
      } else {
        const msg = res.mensagem || 'Falha ao autenticar com o servidor.';
        setError(msg);
        return { sucesso: false, mensagem: msg };
      }
    } catch (err: any) {
      const msg = err.message || 'Erro inesperado na tentativa de login.';
      setError(msg);
      return { sucesso: false, mensagem: msg };
    }
  };

  /**
   * Encerra a sessão
   */
  const logout = async () => {
    try {
      await apiService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        role,
        isLider,
        isDirigente,
        isIntegrante,
        login,
        logout,
        isLoading,
        error,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
