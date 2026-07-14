'use client';

import { useCallback, useMemo, useState } from 'react';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UsePaginationResult extends PaginationState {
  totalPages: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  paginateItems: <T>(items: T[]) => T[];
}

export function usePagination(
  totalCount: number,
  pageSize = 100
): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  }, []);

  const paginateItems = useCallback(
    <T,>(items: T[]): T[] => {
      const start = (safePage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
    [pageSize, safePage]
  );

  const paginationState = useMemo(
    (): PaginationState => ({
      currentPage: safePage,
      pageSize,
      totalCount,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    }),
    [pageSize, safePage, totalCount, totalPages]
  );

  return {
    ...paginationState,
    totalPages,
    setPage,
    nextPage,
    previousPage,
    paginateItems,
  };
}
