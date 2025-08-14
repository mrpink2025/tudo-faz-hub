import { useState, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';

interface PaginationConfig {
  initialPage?: number;
  pageSize?: number;
  totalCount?: number;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

interface PaginationActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  setTotalCount: (count: number) => void;
  reset: () => void;
}

export function usePagination(config: PaginationConfig = {}): [PaginationState, PaginationActions] {
  const {
    initialPage = 1,
    pageSize: initialPageSize = 12,
    totalCount: initialTotalCount = 0
  } = config;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(initialTotalCount);

  const state = useMemo((): PaginationState => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);

    return {
      currentPage,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      startIndex,
      endIndex
    };
  }, [currentPage, pageSize, totalCount]);

  const goToPage = useCallback((page: number) => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const validPage = Math.max(1, Math.min(page, totalPages));
    
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
      logger.info('Page changed', { 
        from: currentPage, 
        to: validPage, 
        totalPages 
      });
    }
  }, [currentPage, totalCount, pageSize]);

  const nextPage = useCallback(() => {
    if (state.hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, state.hasNextPage, goToPage]);

  const previousPage = useCallback(() => {
    if (state.hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, state.hasPreviousPage, goToPage]);

  const handleSetPageSize = useCallback((size: number) => {
    if (size !== pageSize && size > 0) {
      const newTotalPages = Math.ceil(totalCount / size);
      const newCurrentPage = Math.min(currentPage, newTotalPages);
      
      setPageSize(size);
      setCurrentPage(newCurrentPage);
      
      logger.info('Page size changed', { 
        from: pageSize, 
        to: size, 
        newCurrentPage 
      });
    }
  }, [pageSize, currentPage, totalCount]);

  const handleSetTotalCount = useCallback((count: number) => {
    if (count !== totalCount && count >= 0) {
      const newTotalPages = Math.ceil(count / pageSize);
      const newCurrentPage = Math.min(currentPage, Math.max(1, newTotalPages));
      
      setTotalCount(count);
      setCurrentPage(newCurrentPage);
      
      logger.info('Total count updated', { 
        from: totalCount, 
        to: count, 
        newCurrentPage 
      });
    }
  }, [totalCount, currentPage, pageSize]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
    setTotalCount(initialTotalCount);
    
    logger.info('Pagination reset', { 
      page: initialPage, 
      pageSize: initialPageSize, 
      totalCount: initialTotalCount 
    });
  }, [initialPage, initialPageSize, initialTotalCount]);

  const actions: PaginationActions = {
    goToPage,
    nextPage,
    previousPage,
    setPageSize: handleSetPageSize,
    setTotalCount: handleSetTotalCount,
    reset
  };

  return [state, actions];
}

// Hook para URL-based pagination
export function useUrlPagination(
  searchParams: URLSearchParams,
  setSearchParams: (params: URLSearchParams) => void,
  config: PaginationConfig = {}
) {
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialPageSize = parseInt(searchParams.get('pageSize') || String(config.pageSize || 12), 10);
  
  const [state, actions] = usePagination({
    ...config,
    initialPage,
    pageSize: initialPageSize
  });

  const updateUrl = useCallback((page: number, pageSize?: number) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (page === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', String(page));
    }
    
    if (pageSize && pageSize !== 12) {
      newParams.set('pageSize', String(pageSize));
    } else {
      newParams.delete('pageSize');
    }
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const urlActions = {
    ...actions,
    goToPage: (page: number) => {
      actions.goToPage(page);
      updateUrl(page, state.pageSize);
    },
    setPageSize: (size: number) => {
      actions.setPageSize(size);
      updateUrl(1, size); // Reset to page 1 when changing page size
    }
  };

  return [state, urlActions];
}