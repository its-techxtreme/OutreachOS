'use client';

import { memo, useRef } from 'react';
import Link from 'next/link';
import { Download, Search, StickyNote, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { emitTutorialAction } from '@/lib/demo/tutorial-bus';
import { LEAD_STATUSES } from '@/lib/filter-leads';
import type { LeadStatus } from '@/types/database.types';

export interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedNiche: string | null;
  onNicheChange: (niche: string | null) => void;
  selectedCountry: string | null;
  onCountryChange: (country: string | null) => void;
  selectedStatus?: LeadStatus | null;
  onStatusChange?: (status: LeadStatus | null) => void;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  onDateRangeStartChange?: (value: string) => void;
  onDateRangeEndChange?: (value: string) => void;
  availableNiches: string[];
  availableCountries: string[];
  filteredCount: number;
  onExportCSV: () => void;
  onClearFilters: () => void;
  isExporting?: boolean;
  exportProgress?: number;
  canImport?: boolean;
  onImportFile?: (file: File) => void;
  isImporting?: boolean;
  onToggleScripts?: () => void;
  scriptsOpen?: boolean;
}

export const ALL_FILTER_VALUE = '__all__';

export const FilterToolbar = memo(function FilterToolbar({
  searchQuery,
  onSearchChange,
  selectedNiche,
  onNicheChange,
  selectedCountry,
  onCountryChange,
  selectedStatus = null,
  onStatusChange,
  dateRangeStart = '',
  dateRangeEnd = '',
  onDateRangeStartChange,
  onDateRangeEndChange,
  availableNiches,
  availableCountries,
  filteredCount,
  onExportCSV,
  onClearFilters,
  isExporting = false,
  exportProgress = 0,
  canImport = false,
  onImportFile,
  isImporting = false,
  onToggleScripts,
  scriptsOpen = false,
}: FilterToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedNiche !== null ||
    selectedCountry !== null ||
    selectedStatus !== null ||
    Boolean(dateRangeStart) ||
    Boolean(dateRangeEnd);

  return (
    <section aria-labelledby="filters-heading" className="w-full">
      <h2 id="filters-heading" className="sr-only">
        Lead Filters
      </h2>
      <div
        data-testid="filter-toolbar"
        className="doodle-border flex flex-col gap-3 bg-paper p-3 sm:gap-4 sm:p-4"
      >
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              const next = event.target.value;
              onSearchChange(next);
              if (next.trim().length > 0) {
                emitTutorialAction('search');
              }
            }}
            placeholder="Search leads..."
            aria-label="Search leads"
            data-tutorial="search"
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <label className="flex w-full flex-col gap-1">
            <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Niche
            </span>
            <Select
              value={selectedNiche ?? ALL_FILTER_VALUE}
              onValueChange={(value) => {
                const niche = value === ALL_FILTER_VALUE ? null : value;
                onNicheChange(niche);
                if (niche) {
                  emitTutorialAction('filter-niche');
                }
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-label="Filter by niche"
                data-tutorial="niche"
              >
                <SelectValue placeholder="Niche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Niches</SelectItem>
                {availableNiches.map((niche) => (
                  <SelectItem key={niche} value={niche}>
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex w-full flex-col gap-1">
            <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Country
            </span>
            <Select
              value={selectedCountry ?? ALL_FILTER_VALUE}
              onValueChange={(value) => {
                const country = value === ALL_FILTER_VALUE ? null : value;
                onCountryChange(country);
                if (country) {
                  emitTutorialAction('filter-country');
                }
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-label="Filter by country"
                data-tutorial="country"
              >
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Countries</SelectItem>
                {availableCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex w-full flex-col gap-1">
            <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Status
            </span>
            <Select
              value={selectedStatus ?? ALL_FILTER_VALUE}
              onValueChange={(value) => {
                const status =
                  value === ALL_FILTER_VALUE ? null : (value as LeadStatus);
                onStatusChange?.(status);
                if (status) {
                  emitTutorialAction('filter-status');
                }
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-label="Filter by status"
                data-tutorial="status"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Statuses</SelectItem>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex w-full flex-col gap-1" data-tutorial="date-from">
            <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              From
            </span>
            <Input
              type="date"
              value={dateRangeStart}
              onChange={(event) => onDateRangeStartChange?.(event.target.value)}
              aria-label="Filter from date"
              className="w-full"
            />
          </label>

          <label className="flex w-full flex-col gap-1" data-tutorial="date-to">
            <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              To
            </span>
            <Input
              type="date"
              value={dateRangeEnd}
              onChange={(event) => onDateRangeEndChange?.(event.target.value)}
              aria-label="Filter to date"
              className="w-full"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-ink/15 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p
            className="text-sm tabular-nums text-ink-muted"
            aria-live="polite"
            aria-atomic="true"
            data-tutorial="result-count"
          >
            {filteredCount.toLocaleString()} results
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-tutorial="clear-filters"
                onClick={() => {
                  onClearFilters();
                  emitTutorialAction('clear-filters');
                }}
                aria-label="Clear all filters"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}

            {canImport && onImportFile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="sr-only"
                  aria-hidden
                  tabIndex={-1}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) {
                      onImportFile(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting || isExporting}
                  aria-label="Import leads from Excel"
                  data-tutorial="import"
                  className="flex-1 sm:flex-none"
                >
                  <Upload className="h-4 w-4" />
                  <span className="sm:hidden">{isImporting ? '…' : 'Import'}</span>
                  <span className="hidden sm:inline">
                    {isImporting ? 'Importing...' : 'Import Excel'}
                  </span>
                </Button>
                <Link
                  href="/import-guide"
                  className="text-xs text-marker underline underline-offset-2"
                  data-testid="import-guide-link"
                >
                  Format guide
                </Link>
              </>
            )}

            {onToggleScripts && (
              <Button
                type="button"
                variant="outline"
                data-testid="toggle-scripts"
                aria-pressed={scriptsOpen}
                onClick={onToggleScripts}
                className="flex-1 border-ink sm:flex-none"
              >
                <StickyNote className="h-4 w-4" />
                Scripts
              </Button>
            )}

            <Button
              type="button"
              onClick={() => {
                onExportCSV();
                emitTutorialAction('export-csv');
              }}
              disabled={isExporting || isImporting || filteredCount === 0}
              aria-label="Export filtered leads to CSV"
              data-tutorial="export"
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4" />
              <span className="sm:hidden">{isExporting ? '…' : 'Export'}</span>
              <span className="hidden sm:inline">
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </span>
            </Button>

            {isExporting && exportProgress > 0 && (
              <div
                role="progressbar"
                aria-valuenow={exportProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 w-full overflow-hidden rounded-full bg-paper-deep sm:w-24"
              >
                <div
                  className="h-full bg-marker transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});
