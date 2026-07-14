'use client';

import { useCallback, useRef, useState } from 'react';

import { MAX_IMPORT_FILE_BYTES } from '@/lib/import/constants';

export interface ImportSummary {
  totalRows: number;
  created: number;
  duplicates: number;
  skipped: number;
  failed: number;
  errors: Array<{ rowNumber: number; message: string; reason: string }>;
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  requestId?: string;
}

interface UseImportResult {
  importFile: (file: File) => Promise<ImportResult>;
  isImporting: boolean;
  importError: string | null;
  importResult: ImportResult | null;
  clearImportResult: () => void;
}

function validateClientFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
    return 'Only .xlsx or .xls Excel files are allowed';
  }

  if (file.size <= 0) {
    return 'File is empty';
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return `File exceeds the ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB limit`;
  }

  return null;
}

export function useImport(): UseImportResult {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const inFlightRef = useRef(false);

  const clearImportResult = useCallback(() => {
    setImportResult(null);
    setImportError(null);
  }, []);

  const importFile = useCallback(async (file: File): Promise<ImportResult> => {
    if (inFlightRef.current) {
      throw new Error('An import is already in progress');
    }

    const clientError = validateClientFile(file);
    if (clientError) {
      setImportError(clientError);
      throw new Error(clientError);
    }

    inFlightRef.current = true;
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body,
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        requestId?: string;
        summary?: ImportSummary;
      };

      if (!response.ok || !payload.success || !payload.summary) {
        const message = payload.error ?? 'Import failed';
        setImportError(message);
        throw new Error(message);
      }

      const result: ImportResult = {
        success: true,
        summary: payload.summary,
        requestId: payload.requestId,
      };
      setImportResult(result);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Import failed';
      setImportError(message);
      throw error;
    } finally {
      inFlightRef.current = false;
      setIsImporting(false);
    }
  }, []);

  return {
    importFile,
    isImporting,
    importError,
    importResult,
    clearImportResult,
  };
}
