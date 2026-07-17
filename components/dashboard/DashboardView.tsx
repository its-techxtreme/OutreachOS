'use client';

import { useCallback, useEffect, useState } from 'react';
import { Network, Table2 } from 'lucide-react';

import { UserMenu } from '@/components/auth/UserMenu';
import { FilterToolbar } from '@/components/dashboard/FilterToolbar';
import { GlobalMetricsPanel } from '@/components/dashboard/GlobalMetricsPanel';
import { PaginationControls } from '@/components/dashboard/PaginationControls';
import { ProspectMatrixTable } from '@/components/dashboard/ProspectMatrixTable';
import { VectorVaultView } from '@/components/dashboard/VectorVaultView';
import { MascotCallout } from '@/components/mascots/MascotCallout';
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
    <div className="paper-texture relative min-h-screen overflow-x-hidden">
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
        <header className="doodle-border flex items-start justify-between gap-4 bg-paper px-4 py-3 md:px-5">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Outreach<span className="text-marker">OS</span>
              </h1>
              <p className="mt-0.5 font-label text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted md:text-xs">
                {isVectorView
                  ? 'Vector vault — niche & country relationships'
                  : 'Your personal lead sketchbook'}
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
              className="doodle-btn border-ink bg-paper text-ink"
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
            className="doodle-border-soft border-danger bg-paper-deep px-4 py-3 text-sm text-danger"
          >
            {error}
          </div>
        )}

        {!loading && !error && leads.length === 0 && !isVectorView && (
          <div data-testid="empty-leads-state">
            <MascotCallout mascot="adventurer" title="Blank page — for now">
              Your vault is empty. Import an Excel file or wait for agent
              submissions to start filling this sketchbook.
            </MascotCallout>
          </div>
        )}

        {isVectorView ? (
          <VectorVaultView leads={filteredLeads} isLoading={loading} />
        ) : (
          <>
            {filterOptionsError && (
              <div
                role="alert"
                className="doodle-border-soft border-coral bg-paper-deep px-4 py-3 text-sm text-ink"
              >
                Filter options unavailable: {filterOptionsError}
              </div>
            )}

            {exportError && (
              <div
                role="alert"
                className="doodle-border-soft border-coral bg-paper-deep px-4 py-3 text-sm text-ink"
              >
                Export failed: {exportError}
              </div>
            )}

            {importError && (
              <div
                role="alert"
                className="doodle-border-soft border-danger bg-paper-deep px-4 py-3 text-sm text-danger"
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
                className="doodle-border-soft border-marker bg-marker/10 px-4 py-3 text-sm text-ink"
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
