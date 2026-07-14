'use client';

import { useCallback, useState } from 'react';

import {
  CSVExportService,
  type ExportOptions,
  type ExportResult,
} from '@/lib/csv-export';
import type { Lead } from '@/types/database.types';

interface UseExportResult {
  exportLeads: (leads: Lead[], options?: ExportOptions) => Promise<ExportResult>;
  isExporting: boolean;
  exportProgress: number;
  exportError: string | null;
}

const BATCH_SIZE = 1000;

export function useExport(): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportLeads = useCallback(
    async (leads: Lead[], options?: ExportOptions): Promise<ExportResult> => {
      setIsExporting(true);
      setExportProgress(0);
      setExportError(null);

      try {
        const batches = Math.ceil(leads.length / BATCH_SIZE);

        if (batches > 1) {
          const allData: Lead[] = [];

          for (let index = 0; index < batches; index += 1) {
            const start = index * BATCH_SIZE;
            const end = Math.min(start + BATCH_SIZE, leads.length);
            allData.push(...leads.slice(start, end));
            setExportProgress(((index + 1) / batches) * 100);

            await new Promise((resolve) => {
              setTimeout(resolve, 50);
            });
          }

          const result = CSVExportService.exportLeads(allData, options);
          setExportProgress(100);
          return result;
        }

        const result = CSVExportService.exportLeads(leads, options);
        setExportProgress(100);
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Export failed';
        setExportError(message);
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    exportLeads,
    isExporting,
    exportProgress,
    exportError,
  };
}
