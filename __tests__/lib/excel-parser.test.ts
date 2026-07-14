import {
  assertSafeImportFile,
  ImportFileError,
} from '@/lib/import/file-guards';
import { XLSX_MAGIC } from '@/lib/import/constants';

describe('file-guards', () => {
  it('rejects oversized files', () => {
    const buffer = Buffer.concat([XLSX_MAGIC, Buffer.alloc(16)]);
    expect(() =>
      assertSafeImportFile(
        'leads.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        6 * 1024 * 1024,
        buffer
      )
    ).toThrow(ImportFileError);
  });

  it('rejects non-excel extensions', () => {
    const buffer = Buffer.concat([XLSX_MAGIC, Buffer.alloc(16)]);
    expect(() =>
      assertSafeImportFile('leads.csv', 'text/csv', buffer.length, buffer)
    ).toThrow(/Only \.xlsx/);
  });

  it('rejects mismatched magic bytes', () => {
    const buffer = Buffer.from('not-an-excel-file');
    expect(() =>
      assertSafeImportFile(
        'leads.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer.length,
        buffer
      )
    ).toThrow(/do not match/);
  });

  it('accepts valid xlsx magic and extension', () => {
    const buffer = Buffer.concat([XLSX_MAGIC, Buffer.alloc(32)]);
    expect(() =>
      assertSafeImportFile(
        'sample.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer.length,
        buffer
      )
    ).not.toThrow();
  });
});
