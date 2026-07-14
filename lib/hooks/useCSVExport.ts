'use client';

import { useCallback, useState } from 'react';

import { CSVExportService } from '@/lib/csv-export';
import type { Lead } from '@/types/database.types';

interface UseCSVExportResult {
  exportToCSV: (leads: Lead[], filename?: string) => void;
  isExporting: boolean;
  error: string | null;
}

export function useCSVExport(): UseCSVExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToCSV = useCallback((leads: Lead[], filename = 'leads-export.csv') => {
    setIsExporting(true);
    setError(null);

    try {
      CSVExportService.exportLeads(leads, { filename });
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : 'Failed to export CSV'
      );
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportToCSV, isExporting, error };
}
