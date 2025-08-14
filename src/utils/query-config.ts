import { useCallback } from "react";
import { logger } from "@/utils/logger";

interface QueryConfig {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number | ((failureCount: number, error: Error) => boolean);
}

// Configurações otimizadas para diferentes tipos de dados
export const queryConfigs = {
  // Dados estáticos que mudam raramente
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    cacheTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
    retry: 2,
  } as QueryConfig,

  // Dados que mudam com frequência
  dynamic: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
    retry: 3,
  } as QueryConfig,

  // Dados em tempo real
  realtime: {
    staleTime: 0, // Sempre fresh
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    retry: 5,
  } as QueryConfig,

  // Dados administrativos críticos
  admin: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: true,
    retry: (failureCount: number, error: Error) => {
      logger.warn(`Admin query retry ${failureCount}`, { error: error.message });
      return failureCount < 3;
    },
  } as QueryConfig,
};

// Hook para criar retry function com logging
export function useOptimizedRetry(context: string) {
  return useCallback((failureCount: number, error: Error) => {
    const shouldRetry = failureCount < 3;
    
    logger.warn(`Query retry in ${context}`, {
      failureCount,
      error: error.message,
      willRetry: shouldRetry
    });
    
    return shouldRetry;
  }, [context]);
}

// Helper para criar query keys consistentes
export const createQueryKey = (base: string, params?: Record<string, any>) => {
  if (!params) return [base];
  
  // Remove valores undefined e null para cache consistency
  const cleanParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
  return [base, cleanParams];
};

// Configuração global do React Query
export const defaultQueryConfig = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutos default
    cacheTime: 30 * 60 * 1000, // 30 minutos default
    refetchOnWindowFocus: false,
    retry: (failureCount: number, error: any) => {
      // Não fazer retry em erros de autenticação
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error: any) => {
      logger.error("Query failed", { error: error.message });
    },
  },
  mutations: {
    onError: (error: any) => {
      logger.error("Mutation failed", { error: error.message });
    },
  },
};