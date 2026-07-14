import Papa from 'papaparse';

import type { Lead } from '@/types/database.types';

export interface ExportOptions {
  filename?: string;
  fields?: (keyof Lead)[];
  includeHeaders?: boolean;
}

export interface ExportResult {
  recordCount: number;
  filename: string;
  timestamp: string;
}

const DEFAULT_FIELDS: (keyof Lead)[] = [
  'name',
  'niche',
  'country',
  'phone',
  'address',
  'status',
];

const FIELD_LABELS: Partial<Record<keyof Lead, string>> = {
  name: 'Business Name',
  niche: 'Niche',
  country: 'Region',
  phone: 'Phone',
  address: 'Address',
  maps_url: 'Maps URL',
  status: 'Status',
  created_at: 'Created At',
};

export class CSVExportService {
  static exportLeads(leads: Lead[], options: ExportOptions = {}): ExportResult {
    const {
      filename = `leads-export-${new Date().toISOString().split('T')[0]}.csv`,
      fields = DEFAULT_FIELDS,
      includeHeaders = true,
    } = options;

    const exportData = leads.map((lead) => {
      const row: Record<string, string> = {};

      for (const field of fields) {
        let value = lead[field];

        if (field === 'created_at' && value) {
          value = new Date(String(value)).toISOString().split('T')[0];
        }

        if (field === 'phone' && value) {
          value = String(value).replace(/[^\d+\-()\s]/g, '');
        }

        const label = FIELD_LABELS[field] ?? field;
        row[label] = value != null ? String(value) : '';
      }

      return row;
    });

    const csv = Papa.unparse(exportData, {
      header: includeHeaders,
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
    });

    this.downloadFile(csv, filename);

    return {
      recordCount: leads.length,
      filename,
      timestamp: new Date().toISOString(),
    };
  }

  static exportForOutreach(leads: Lead[]): ExportResult {
    return this.exportLeads(leads, {
      filename: `outreach-list-${Date.now()}.csv`,
      fields: ['name', 'phone', 'address', 'niche'],
      includeHeaders: true,
    });
  }

  private static downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download === undefined) {
      return;
    }

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
