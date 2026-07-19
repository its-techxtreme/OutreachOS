'use client';

import { memo, useCallback } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react';
import { List, type RowComponentProps } from 'react-window';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StatusBadge } from '@/components/dashboard/StatusChips';
import type { LeadSortColumn, SortDirection } from '@/lib/filter-leads';
import { emitTutorialAction } from '@/lib/demo/tutorial-bus';
import { getNicheVariant } from '@/lib/niche-colors';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types/database.types';

export interface ProspectMatrixTableProps {
  leads: Lead[];
  isLoading?: boolean;
  sortBy?: LeadSortColumn;
  sortDirection?: SortDirection;
  onSort: (column: LeadSortColumn) => void;
  onRowClick?: (lead: Lead) => void;
  /** Stacked detail cards for narrow side panels (no horizontal scroll). */
  variant?: 'table' | 'panel';
}

const ROW_HEIGHT = 56;
const TABLE_HEIGHT = 600;

interface VirtualRowProps {
  leads: Lead[];
  onRowClick?: (lead: Lead) => void;
}

function SortIndicator({
  column,
  sortBy,
  sortDirection,
}: {
  column: LeadSortColumn;
  sortBy?: LeadSortColumn;
  sortDirection?: SortDirection;
}) {
  if (sortBy !== column) {
    return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" aria-hidden="true" />;
  }

  return sortDirection === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3 w-3 text-marker" aria-hidden="true" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3 text-marker" aria-hidden="true" />
  );
}

function VirtualRow({
  index,
  style,
  ariaAttributes,
  leads,
  onRowClick,
}: RowComponentProps<VirtualRowProps>) {
  const lead = leads[index];

  if (!lead) {
    return null;
  }

  return (
    <div
      style={style}
      {...ariaAttributes}
      className={cn(
        'grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto] items-center border-b border-ink px-4 text-sm transition-colors hover:bg-paper-deep/50 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto_auto]',
        index % 2 === 1 && 'bg-paper-deep',
        onRowClick && 'cursor-pointer'
      )}
      onClick={() => onRowClick?.(lead)}
      onKeyDown={(event) => {
        if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onRowClick(lead);
        }
      }}
      tabIndex={onRowClick ? 0 : undefined}
      data-selected={onRowClick ? undefined : undefined}
    >
      <div className="min-w-0">
        <div className="truncate font-semibold text-ink">{lead.name}</div>
        <div className="mt-0.5 md:hidden">
          <StatusBadge status={lead.status} />
        </div>
      </div>
      <div className="hidden md:block">
        <Badge variant={getNicheVariant(lead.niche)}>{lead.niche}</Badge>
      </div>
      <div className="truncate text-ink-muted">{lead.country}</div>
      <div className="hidden lg:block">
        {lead.phone ? (
          <a
            href={`tel:${lead.phone}`}
            className="font-mono tabular-nums text-marker hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {lead.phone}
          </a>
        ) : (
          <span className="text-ink-muted">—</span>
        )}
      </div>
      <div className="hidden xl:block truncate text-ink-muted">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">{lead.address ?? '—'}</span>
          </TooltipTrigger>
          {lead.address && (
            <TooltipContent>{lead.address}</TooltipContent>
          )}
        </Tooltip>
      </div>
      <div className="hidden md:flex justify-center">
        <StatusBadge status={lead.status} />
      </div>
      <div>
        <a
          href={lead.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${lead.name} on maps`}
          data-tutorial="maps-link"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-deep hover:text-marker"
          onClick={(event) => {
            event.stopPropagation();
            emitTutorialAction('open-maps');
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function PanelLeadCard({
  lead,
  onClick,
}: {
  lead: Lead;
  onClick?: (lead: Lead) => void;
}) {
  return (
    <article
      data-testid="panel-lead-card"
      className={cn(
        'rounded-lg border border-ink bg-paper-deep p-4',
        onClick && 'cursor-pointer hover:border-marker'
      )}
      onClick={() => onClick?.(lead)}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick(lead);
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-ink break-words">
            {lead.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={getNicheVariant(lead.niche)}>{lead.niche}</Badge>
            <StatusBadge status={lead.status} />
          </div>
        </div>
        <a
          href={lead.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${lead.name} on maps`}
          data-tutorial="maps-link"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ink text-ink-muted transition-colors hover:border-marker hover:bg-paper-deep hover:text-marker"
          onClick={() => emitTutorialAction('open-maps')}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
            Region
          </dt>
          <dd className="mt-1 text-ink">{lead.country}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
            Phone
          </dt>
          <dd className="mt-1">
            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                className="font-mono tabular-nums text-marker hover:underline"
              >
                {lead.phone}
              </a>
            ) : (
              <span className="text-ink-muted">—</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
            Address
          </dt>
          <dd className="mt-1 break-words leading-relaxed text-ink-muted">
            {lead.address ?? '—'}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function PanelLeadList({
  leads,
  sortBy,
  sortDirection,
  onSort,
  onRowClick,
}: {
  leads: Lead[];
  sortBy?: LeadSortColumn;
  sortDirection?: SortDirection;
  onSort: (column: LeadSortColumn) => void;
  onRowClick?: (lead: Lead) => void;
}) {
  const handleSort = useCallback(
    (column: LeadSortColumn) => () => onSort(column),
    [onSort]
  );

  return (
    <section aria-labelledby="table-heading" className="w-full">
      <h2 id="table-heading" className="sr-only">
        Lead Directory
      </h2>
      <div
        data-testid="prospect-table"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-ink pb-3">
          <span className="mr-1 text-[11px] uppercase tracking-wider text-ink-muted">
            Sort
          </span>
          {(
            [
              ['name', 'Name'],
              ['niche', 'Niche'],
              ['country', 'Region'],
            ] as const
          ).map(([column, label]) => (
            <button
              key={column}
              type="button"
              onClick={handleSort(column)}
              className={cn(
                'inline-flex items-center rounded-md border px-2.5 py-1 text-xs transition-colors',
                sortBy === column
                  ? 'border-marker bg-marker/15 text-marker'
                  : 'border-ink text-ink-muted hover:border-marker hover:text-ink'
              )}
            >
              {label}
              <SortIndicator
                column={column}
                sortBy={sortBy}
                sortDirection={sortDirection}
              />
            </button>
          ))}
        </div>

        {leads.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-muted">
            No leads match the current filters.
          </div>
        ) : (
          leads.map((lead) => (
            <PanelLeadCard key={lead.id} lead={lead} onClick={onRowClick} />
          ))
        )}
      </div>
    </section>
  );
}

export const ProspectMatrixTable = memo(function ProspectMatrixTable({
  leads,
  isLoading = false,
  sortBy = 'created_at',
  sortDirection = 'desc',
  onSort,
  onRowClick,
  variant = 'table',
}: ProspectMatrixTableProps) {
  const handleSort = useCallback(
    (column: LeadSortColumn) => () => onSort(column),
    [onSort]
  );

  if (isLoading) {
    return (
      <section aria-labelledby="table-heading" className="w-full">
        <h2 id="table-heading" className="sr-only">
          Lead Directory
        </h2>
        <div
          data-testid="prospect-table"
          className="overflow-hidden rounded-lg border border-ink"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="mb-2 h-12 w-full rounded-none" />
          ))}
        </div>
      </section>
    );
  }

  if (variant === 'panel') {
    return (
      <PanelLeadList
        leads={leads}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onRowClick}
      />
    );
  }

  return (
    <TooltipProvider>
      <section aria-labelledby="table-heading" className="w-full">
        <h2 id="table-heading" className="sr-only">
          Lead Directory
        </h2>
        <div
          data-testid="prospect-table"
          className="overflow-hidden rounded-lg border border-ink bg-paper"
        >
          <Table role="table" aria-label="Lead information table">
            <TableHeader className="sticky top-0 z-10 bg-paper-deep">
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col">
                  <button
                    type="button"
                    className="inline-flex items-center uppercase tracking-wider"
                    onClick={handleSort('name')}
                  >
                    Business Name
                    <SortIndicator
                      column="name"
                      sortBy={sortBy}
                      sortDirection={sortDirection}
                    />
                  </button>
                </TableHead>
                <TableHead scope="col" className="hidden md:table-cell">
                  <button
                    type="button"
                    className="inline-flex items-center uppercase tracking-wider"
                    onClick={handleSort('niche')}
                  >
                    Niche
                    <SortIndicator
                      column="niche"
                      sortBy={sortBy}
                      sortDirection={sortDirection}
                    />
                  </button>
                </TableHead>
                <TableHead scope="col">
                  <button
                    type="button"
                    className="inline-flex items-center uppercase tracking-wider"
                    onClick={handleSort('country')}
                  >
                    Region
                    <SortIndicator
                      column="country"
                      sortBy={sortBy}
                      sortDirection={sortDirection}
                    />
                  </button>
                </TableHead>
                <TableHead scope="col" className="hidden lg:table-cell">
                  Phone
                </TableHead>
                <TableHead scope="col" className="hidden xl:table-cell">
                  Address
                </TableHead>
                <TableHead scope="col" className="hidden md:table-cell">
                  Status
                </TableHead>
                <TableHead scope="col">Actions</TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          {leads.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">
              No leads match the current filters.
            </div>
          ) : (
            <List
              rowCount={leads.length}
              rowHeight={ROW_HEIGHT}
              rowComponent={VirtualRow}
              rowProps={{ leads, onRowClick }}
              style={{ height: TABLE_HEIGHT, width: '100%' }}
              className="scrollbar-thin"
              role="list"
              aria-label="Lead rows"
            />
          )}
        </div>
      </section>
    </TooltipProvider>
  );
});
