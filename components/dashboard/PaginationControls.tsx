'use client';

import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

export const PaginationControls = memo(function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onNextPage,
  onPreviousPage,
}: PaginationControlsProps) {
  if (totalCount <= pageSize) {
    return null;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <nav
      aria-label="Lead table pagination"
      className="flex flex-col items-center justify-between gap-3 rounded-lg border border-ink bg-paper-deep px-4 py-3 sm:flex-row"
    >
      <p className="text-sm text-ink-muted">
        Showing{' '}
        <span className="font-medium text-ink">
          {start.toLocaleString()}–{end.toLocaleString()}
        </span>{' '}
        of{' '}
        <span className="font-medium text-ink">
          {totalCount.toLocaleString()}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <span className="min-w-24 text-center text-sm tabular-nums text-ink-muted">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>

        {totalPages > 2 && (
          <label className="sr-only" htmlFor="page-jump">
            Jump to page
          </label>
        )}
        {totalPages > 2 && (
          <select
            id="page-jump"
            value={currentPage}
            onChange={(event) => onPageChange(Number.parseInt(event.target.value, 10))}
            className="rounded-md border border-ink bg-paper px-2 py-1 text-sm text-ink"
            aria-label="Jump to page"
          >
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              )
            )}
          </select>
        )}
      </div>
    </nav>
  );
});
