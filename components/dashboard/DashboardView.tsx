'use client';

import { useCallback, useEffect, useState } from 'react';
import { Network, Table2 } from 'lucide-react';

import { UserMenu } from '@/components/auth/UserMenu';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { DemoTutorialOverlay } from '@/components/dashboard/DemoTutorialOverlay';
import { FilterToolbar } from '@/components/dashboard/FilterToolbar';
import { LeadStickyNotePanel } from '@/components/dashboard/LeadStickyNotePanel';
import { NewAccountDemoTip } from '@/components/dashboard/NewAccountDemoTip';
import { playSound } from '@/lib/sound';
import { GlobalMetricsPanel } from '@/components/dashboard/GlobalMetricsPanel';
import { PaginationControls } from '@/components/dashboard/PaginationControls';
import { ProspectMatrixTable } from '@/components/dashboard/ProspectMatrixTable';
import { VectorVaultView } from '@/components/dashboard/VectorVaultView';
import { QuestBoard } from '@/components/quests/QuestBoard';
import { MascotCallout } from '@/components/mascots/MascotCallout';
import { Button } from '@/components/ui/button';
import { Permission } from '@/lib/auth/rbac';
import { emitTutorialAction } from '@/lib/demo/tutorial-bus';
import { useComputedMetrics } from '@/lib/hooks/useComputedMetrics';
import { useExport } from '@/lib/hooks/useExport';
import { useFilterOptions } from '@/lib/hooks/useFilterOptions';
import { useImport } from '@/lib/hooks/useImport';
import { useLeadFilters } from '@/lib/hooks/useLeadFilters';
import { useLeads } from '@/lib/hooks/useLeads';
import { usePagination } from '@/lib/hooks/usePagination';
import { useRBAC } from '@/lib/hooks/useRBAC';
import type { Lead, LeadStatus } from '@/types/database.types';

type DashboardViewMode = 'table' | 'vector';

export function DashboardView() {
  const [viewMode, setViewMode] = useState<DashboardViewMode>('table');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [scriptsOpen, setScriptsOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const { hasPermission } = useRBAC();
  const canImport = hasPermission(Permission.LEADS_CREATE);
  const { leads, loading, error, refetch, updateLeadStatus } = useLeads();
  const {
    niches: filterOptionNiches,
    countries: filterOptionCountries,
    error: filterOptionsError,
    refetchOptions,
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

  useEffect(() => {
    if (!selectedLead) {
      return;
    }
    const fresh = leads.find((lead) => lead.id === selectedLead.id) ?? null;
    setSelectedLead((prev) => {
      if (!prev) return prev;
      if (!fresh) return null;
      if (
        prev.status === fresh.status &&
        prev.updated_at === fresh.updated_at &&
        prev.name === fresh.name
      ) {
        return prev;
      }
      return fresh;
    });
  }, [leads, selectedLead?.id]);

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
        .then(async () => {
          await refetch();
          await refetchOptions();
        })
        .catch(() => {
          // Error surfaced via importError state
        });
    },
    [importFile, refetch, refetchOptions]
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

  const handleSelectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setScriptsOpen(true);
    playSound('pop');
  }, []);

  const handleStatusChange = useCallback(
    async (leadId: number, status: LeadStatus) => {
      setStatusUpdating(true);
      try {
        await updateLeadStatus(leadId, status);
        playSound('checkpoint');
      } catch {
        playSound('soft');
      } finally {
        setStatusUpdating(false);
      }
    },
    [updateLeadStatus]
  );

  const nicheOptions =
    filterOptionNiches.length > 0 ? filterOptionNiches : availableNiches;
  const countryOptions =
    filterOptionCountries.length > 0
      ? filterOptionCountries
      : availableCountries;

  const isVectorView = viewMode === 'vector';
  const importErrors = importResult?.summary.errors ?? [];

  return (
    <div className="paper-texture relative min-h-screen overflow-x-hidden">
      <DemoTutorialOverlay />
      <LeadStickyNotePanel
        open={scriptsOpen}
        onClose={() => setScriptsOpen(false)}
        selectedLead={selectedLead}
        vaultNiches={nicheOptions}
        onStatusChange={handleStatusChange}
        statusUpdating={statusUpdating}
      />
      <main
        role="main"
        aria-label="Lead Management Dashboard"
        data-testid="dashboard"
        className={
          isVectorView
            ? 'relative mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:p-4 md:p-6'
            : 'relative mx-auto flex w-full max-w-7xl flex-col gap-4 p-3 sm:gap-6 sm:p-4 md:p-6'
        }
      >
        <header className="doodle-border flex flex-col gap-3 bg-paper px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4 md:px-5">
          <div className="min-w-0 flex items-center gap-3">
            <div className="min-w-0">
              <BrandLockup size="md" href={null} />
              <p className="mt-0.5 font-label text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted sm:tracking-[0.16em] md:text-xs">
                {isVectorView
                  ? 'Vector vault — niche & country relationships'
                  : 'Your personal lead sketchbook'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="toggle-vector-view"
              data-tutorial="vector-toggle"
              onClick={() => {
                playSound('whoosh');
                setViewMode((current) => {
                  const next = current === 'table' ? 'vector' : 'table';
                  if (next === 'vector') {
                    emitTutorialAction('toggle-vector');
                  }
                  return next;
                });
              }}
              className="doodle-btn border-ink bg-paper text-ink"
            >
              {isVectorView ? (
                <>
                  <Table2 className="h-4 w-4" />
                  <span className="sm:hidden">Table</span>
                  <span className="hidden sm:inline">Switch to table view</span>
                </>
              ) : (
                <>
                  <Network className="h-4 w-4" />
                  <span className="sm:hidden">Vector</span>
                  <span className="hidden sm:inline">Switch to vector view</span>
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

        <NewAccountDemoTip />

        {!loading && !error && leads.length === 0 && !isVectorView && (
          <div data-testid="empty-leads-state">
            <MascotCallout mascot="adventurer" title="Blank page — for now">
              Your vault is empty. Import an Excel file or wait for agent
              submissions to start filling this sketchbook.
            </MascotCallout>
          </div>
        )}

        {isVectorView ? (
          <VectorVaultView
            leads={filteredLeads}
            isLoading={loading}
            onLeadSelect={handleSelectLead}
          />
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
                data-testid="import-result"
                className="doodle-border-soft border-marker bg-marker/10 px-4 py-3 text-sm text-ink"
              >
                <p>
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
                </p>
                {importErrors.length > 0 && (
                  <details className="mt-2" data-testid="import-errors">
                    <summary className="cursor-pointer text-xs font-medium text-ink">
                      Row details ({importErrors.length})
                    </summary>
                    <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-ink-muted">
                      {importErrors.map((item) => (
                        <li key={`${item.rowNumber}-${item.reason}`}>
                          Row {item.rowNumber}: {item.message}{' '}
                          <span className="text-ink/50">({item.reason})</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            <GlobalMetricsPanel
              totalLeads={metrics.totalLeads}
              filteredLeads={metrics.filteredCount}
              activeSegments={activeSegments}
              isLoading={loading}
            />

            <QuestBoard />

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
              scriptsOpen={scriptsOpen}
              onToggleScripts={() => {
                setScriptsOpen((open) => !open);
                playSound('whoosh');
              }}
            />

            <ProspectMatrixTable
              leads={paginatedLeads}
              isLoading={loading}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={toggleSort}
              onRowClick={handleSelectLead}
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
