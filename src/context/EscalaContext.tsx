import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EscalaData } from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface EscalaContextType {
  data: EscalaData;
  isLoading: boolean;
  isRefreshing: boolean;
  isFromCache: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => Promise<void>;
}

const emptyEscalaData: EscalaData = {
  escala: [],
  integrantes: [],
  solicitacoes: [],
  recados: [],
  linkLouvores: []
};

const EscalaContext = createContext<EscalaContextType | undefined>(undefined);

export const EscalaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<EscalaData>(emptyEscalaData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await apiService.fetchEscalaData(isRefresh);
      setData(result.data);
      setIsFromCache(result.isFromCache);
      setLastUpdated(result.timestamp);
    } catch (err: unknown) {
      console.error('Erro ao carregar escala do backend:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Não foi possível conectar ao Google Apps Script. Verifique sua conexão.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  // Recarrega sempre que a sessão for inicializada ou o token mudar (login/logout)
  useEffect(() => {
    if (!authLoading) {
      loadData(false);
    }
  }, [authLoading, token, loadData]);

  return (
    <EscalaContext.Provider
      value={{
        data,
        isLoading,
        isRefreshing,
        isFromCache,
        error,
        lastUpdated,
        refreshData
      }}
    >
      {children}
    </EscalaContext.Provider>
  );
};

export const useEscala = () => {
  const context = useContext(EscalaContext);
  if (!context) {
    throw new Error('useEscala deve ser utilizado dentro de um EscalaProvider');
  }
  return context;
};
