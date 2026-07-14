'use client';

import { memo, useRef } from 'react';
import { Download, Search, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
        className="flex flex-col gap-4 rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-4 backdrop-blur-sm md:flex-row md:items-center"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search leads..."
            aria-label="Search leads"
            className="pl-9"
          />
        </div>

        <Select
          value={selectedNiche ?? ALL_FILTER_VALUE}
          onValueChange={(value) =>
            onNicheChange(value === ALL_FILTER_VALUE ? null : value)
          }
        >
          <SelectTrigger className="w-full md:w-44" aria-label="Filter by niche">
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

        <Select
          value={selectedCountry ?? ALL_FILTER_VALUE}
          onValueChange={(value) =>
            onCountryChange(value === ALL_FILTER_VALUE ? null : value)
          }
        >
          <SelectTrigger
            className="w-full md:w-44"
            aria-label="Filter by country"
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

        <Select
          value={selectedStatus ?? ALL_FILTER_VALUE}
          onValueChange={(value) =>
            onStatusChange?.(value === ALL_FILTER_VALUE ? null : (value as LeadStatus))
          }
        >
          <SelectTrigger className="w-full md:w-40" aria-label="Filter by status">
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

        <Input
          type="date"
          value={dateRangeStart}
          onChange={(event) => onDateRangeStartChange?.(event.target.value)}
          aria-label="Filter from date"
          className="w-full md:w-40"
        />

        <Input
          type="date"
          value={dateRangeEnd}
          onChange={(event) => onDateRangeEndChange?.(event.target.value)}
          aria-label="Filter to date"
          className="w-full md:w-40"
        />

        <div className="flex items-center gap-2 md:ml-auto">
          <p
            className="text-sm tabular-nums text-zinc-400"
            aria-live="polite"
            aria-atomic="true"
          >
            {filteredCount.toLocaleString()} results
          </p>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
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
              >
                <Upload className="h-4 w-4" />
                {isImporting ? 'Importing...' : 'Import Excel'}
              </Button>
            </>
          )}

          <Button
            type="button"
            onClick={onExportCSV}
            disabled={isExporting || isImporting || filteredCount === 0}
            aria-label="Export filtered leads to CSV"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>

          {isExporting && exportProgress > 0 && (
            <div
              role="progressbar"
              aria-valuenow={exportProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 w-24 overflow-hidden rounded-full bg-zinc-800"
            >
              <div
                className="h-full bg-indigo-500 transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
