import { CSVExportService } from '@/lib/csv-export';
import { createMockLead, createMockLeads } from '@/__tests__/utils/lead-test-utils';

describe('CSVExportService', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports leads with default fields', () => {
    const leads = createMockLeads(3);
    const result = CSVExportService.exportLeads(leads);

    expect(result.recordCount).toBe(3);
    expect(result.filename).toMatch(/leads-export-\d{4}-\d{2}-\d{2}\.csv/);
  });

  it('exports outreach-focused columns', () => {
    const leads = createMockLeads(2);
    const result = CSVExportService.exportForOutreach(leads);

    expect(result.recordCount).toBe(2);
    expect(result.filename).toMatch(/outreach-list-\d+\.csv/);
  });

  it('formats phone numbers and created_at values during export', () => {
    const leads = [
      createMockLead({
        phone: '+1 (555) 010-0#',
        created_at: '2026-01-15T12:00:00.000Z',
      }),
    ];

    const result = CSVExportService.exportLeads(leads, {
      fields: ['name', 'phone', 'created_at'],
      filename: 'formatted.csv',
    });

    expect(result.recordCount).toBe(1);
    expect(result.filename).toBe('formatted.csv');
  });
});
