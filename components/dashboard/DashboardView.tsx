'use client';

import { useCallback, useEffect, useState } from 'react';
import { Network, Table2 } from 'lucide-react';

import { UserMenu } from '@/components/auth/UserMenu';
import { FilterToolbar } from '@/components/dashboard/FilterToolbar';
import { GlobalMetricsPanel } from '@/components/dashboard/GlobalMetricsPanel';
import { PaginationControls } from '@/components/dashboard/PaginationControls';
import { ProspectMatrixTable } from '@/components/dashboard/ProspectMatrixTable';
import { VectorVaultView } from '@/components/dashboard/VectorVaultView';
import { Button } from '@/components/ui/button';
import { Permission } from '@/lib/auth/rbac';
import { useComputedMetrics } from '@/lib/hooks/useComputedMetrics';
import { useExport } from '@/lib/hooks/useExport';
import { useFilterOptions } from '@/lib/hooks/useFilterOptions';
import { useImport } from '@/lib/hooks/useImport';
import { useLeadFilters } from '@/lib/hooks/useLeadFilters';
import { useLeads } from '@/lib/hooks/useLeads';
import { usePagination } from '@/lib/hooks/usePagination';
import { useRBAC } from '@/lib/hooks/useRBAC';

type DashboardViewMode = 'table' | 'vector';

export function DashboardView() {
  const [viewMode, setViewMode] = useState<DashboardViewMode>('table');
  const { hasPermission } = useRBAC();
  const canImport = hasPermission(Permission.LEADS_CREATE);
  const { leads, loading, error, refetch } = useLeads();
  const {
    niches: filterOptionNiches,
    countries: filterOptionCountries,
    error: filterOptionsError,
  } = useFilterOptions();

  const {
    searchQuery,
    selectedNiche,
    selectedCountry,
    selectedStatus,
    dateRange,
    sortBy,
    sortDirection,
    filteredLeads,
    filteredCount,
    activeSegments,
    filterState,
    availableNiches,
    availableCountries,
    setSearchQuery,
    setSelectedNiche,
    setSelectedCountry,
    setSelectedStatus,
    setDateRange,
    clearFilters,
    toggleSort,
  } = useLeadFilters(leads);

  const metrics = useComputedMetrics(leads, filterState);

  const {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    setPage,
    nextPage,
    previousPage,
    paginateItems,
  } = usePagination(filteredCount, 100);

  const paginatedLeads = paginateItems(filteredLeads);

  useEffect(() => {
    setPage(1);
  }, [filterState, setPage]);

  const { exportLeads, isExporting, exportProgress, exportError } = useExport();
  const {
    importFile,
    isImporting,
    importError,
    importResult,
    clearImportResult,
  } = useImport();

  const handleExport = useCallback(() => {
    void exportLeads(filteredLeads);
  }, [exportLeads, filteredLeads]);

  const handleImportFile = useCallback(
    (file: File) => {
      void importFile(file)
        .then(() => refetch())
        .catch(() => {
          // Error surfaced via importError state
        });
    },
    [importFile, refetch]
  );

  const handleDateRangeStartChange = useCallback(
    (value: string) => {
      setDateRange((previous) => ({
        ...previous,
        start: value ? new Date(`${value}T00:00:00.000Z`) : null,
      }));
    },
    [setDateRange]
  );

  const handleDateRangeEndChange = useCallback(
    (value: string) => {
      setDateRange((previous) => ({
        ...previous,
        end: value ? new Date(`${value}T23:59:59.999Z`) : null,
      }));
    },
    [setDateRange]
  );

  const nicheOptions =
    filterOptionNiches.length > 0 ? filterOptionNiches : availableNiches;
  const countryOptions =
    filterOptionCountries.length > 0
      ? filterOptionCountries
      : availableCountries;

  const isVectorView = viewMode === 'vector';

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/constellation-field.png"
          alt=""
          className="h-full w-full object-cover opacity-25 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/85 to-zinc-950" />
        <div className="ops-grid absolute inset-0 opacity-[0.025]" />
      </div>

      <main
        role="main"
        aria-label="Lead Management Dashboard"
        data-testid="dashboard"
        className={
          isVectorView
            ? 'relative mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-4 md:p-6'
            : 'relative mx-auto flex w-full max-w-7xl flex-col gap-6 p-6'
        }
      >
        <header className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/60 bg-zinc-950/70 px-4 py-3 backdrop-blur-md md:px-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/outreachos-mark.png"
              alt=""
              className="h-9 w-9 object-contain"
            />
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-teal-400 md:text-2xl">
                OutreachOS
              </h1>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500 md:text-xs md:normal-case md:tracking-normal md:text-zinc-400">
                {isVectorView
                  ? 'Vector vault — niche & country relationships'
                  : 'Lead management and outreach dashboard'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="toggle-vector-view"
              onClick={() =>
                setViewMode((current) =>
                  current === 'table' ? 'vector' : 'table'
                )
              }
              className="border-zinc-700 text-zinc-200"
            >
              {isVectorView ? (
                <>
                  <Table2 className="h-4 w-4" />
                  Switch to table view
                </>
              ) : (
                <>
                  <Network className="h-4 w-4" />
                  Switch to vector view
                </>
              )}
            </Button>
            <UserMenu />
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {isVectorView ? (
          <VectorVaultView leads={filteredLeads} isLoading={loading} />
        ) : (
          <>
            {filterOptionsError && (
              <div
                role="alert"
                className="rounded-lg border border-amber-800 bg-amber-950/50 px-4 py-3 text-sm text-amber-300"
              >
                Filter options unavailable: {filterOptionsError}
              </div>
            )}

            {exportError && (
              <div
                role="alert"
                className="rounded-lg border border-amber-800 bg-amber-950/50 px-4 py-3 text-sm text-amber-300"
              >
                Export failed: {exportError}
              </div>
            )}

            {importError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-300"
              >
                Import failed: {importError}
                <button
                  type="button"
                  className="ml-3 underline underline-offset-2"
                  onClick={clearImportResult}
                >
                  Dismiss
                </button>
              </div>
            )}

            {importResult && !importError && (
              <div
                role="status"
                className="rounded-lg border border-teal-800 bg-teal-950/40 px-4 py-3 text-sm text-teal-200"
              >
                Imported {importResult.summary.created} new lead
                {importResult.summary.created === 1 ? '' : 's'}
                {importResult.summary.duplicates > 0
                  ? ` · ${importResult.summary.duplicates} duplicate${importResult.summary.duplicates === 1 ? '' : 's'} skipped`
                  : ''}
                {importResult.summary.skipped > 0
                  ? ` · ${importResult.summary.skipped} row${importResult.summary.skipped === 1 ? '' : 's'} skipped`
                  : ''}
                {importResult.summary.failed > 0
                  ? ` · ${importResult.summary.failed} failed`
                  : ''}
                <button
                  type="button"
                  className="ml-3 underline underline-offset-2"
                  onClick={clearImportResult}
                >
                  Dismiss
                </button>
              </div>
            )}

            <GlobalMetricsPanel
              totalLeads={metrics.totalLeads}
              filteredLeads={metrics.filteredCount}
              activeSegments={activeSegments}
              isLoading={loading}
            />

            <FilterToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedNiche={selectedNiche}
              onNicheChange={setSelectedNiche}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              dateRangeStart={dateRange.start?.toISOString().split('T')[0] ?? ''}
              dateRangeEnd={dateRange.end?.toISOString().split('T')[0] ?? ''}
              onDateRangeStartChange={handleDateRangeStartChange}
              onDateRangeEndChange={handleDateRangeEndChange}
              availableNiches={nicheOptions}
              availableCountries={countryOptions}
              filteredCount={filteredCount}
              onExportCSV={handleExport}
              onClearFilters={clearFilters}
              isExporting={isExporting}
              exportProgress={exportProgress}
              canImport={canImport}
              onImportFile={handleImportFile}
              isImporting={isImporting}
            />

            <ProspectMatrixTable
              leads={paginatedLeads}
              isLoading={loading}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={filteredCount}
              pageSize={pageSize}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onPageChange={setPage}
              onNextPage={nextPage}
              onPreviousPage={previousPage}
            />
          </>
        )}
      </main>
    </div>
  );
}
