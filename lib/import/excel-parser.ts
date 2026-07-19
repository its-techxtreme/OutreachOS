import ExcelJS from 'exceljs';

import { MAX_IMPORT_ROWS } from '@/lib/import/constants';
import { ImportFileError } from '@/lib/import/file-guards';
import type { RawImportRow } from '@/lib/import/lead-normalizer';
import { normalizeOoxmlBuffer } from '@/lib/import/normalize-ooxml';

export { assertSafeImportFile, ImportFileError } from '@/lib/import/file-guards';

function cellToValue(cell: ExcelJS.Cell): unknown {
  const { value } = cell;

  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') {
      return value.text;
    }
    if ('result' in value) {
      return value.result ?? null;
    }
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('');
    }
    if ('hyperlink' in value) {
      const link = value as ExcelJS.CellHyperlinkValue;
      return link.text || link.hyperlink;
    }
  }

  return String(value);
}

function rowHasContent(values: unknown[]): boolean {
  return values.some((value) => {
    if (value === null || value === undefined) {
      return false;
    }
    return String(value).trim().length > 0;
  });
}

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  // exceljs accepts Buffer; cast keeps TS happy across Node buffer typings
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  return workbook;
}

/**
 * Parse the first worksheet of an Excel workbook into header-keyed row objects.
 */
export async function parseExcelBuffer(
  buffer: Buffer
): Promise<{ headers: string[]; rows: RawImportRow[] }> {
  let workbook: ExcelJS.Workbook;

  try {
    workbook = await loadWorkbook(buffer);
  } catch {
    try {
      // Some exporters use prefixed spreadsheetml namespaces ExcelJS rejects.
      const normalized = await normalizeOoxmlBuffer(buffer);
      workbook = await loadWorkbook(normalized);
    } catch {
      throw new ImportFileError(
        'Unable to parse Excel file. Upload a valid .xlsx workbook.',
        'parse_failed'
      );
    }
  }

  // Prefixed-namespace workbooks sometimes "load" without throwing but leave
  // worksheets empty — normalize and retry when that happens.
  if (!workbook.worksheets[0]) {
    try {
      const normalized = await normalizeOoxmlBuffer(buffer);
      workbook = await loadWorkbook(normalized);
    } catch {
      throw new ImportFileError('Workbook has no sheets', 'empty');
    }
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new ImportFileError('Workbook has no sheets', 'empty');
  }

  const headerRow = sheet.getRow(1);
  const columnCount = Math.max(headerRow.cellCount, sheet.columnCount);
  const headers: string[] = [];

  for (let col = 1; col <= columnCount; col += 1) {
    const raw = cellToValue(headerRow.getCell(col));
    const label =
      raw !== null && String(raw).trim()
        ? String(raw).trim()
        : `col${col}`;
    headers.push(label);
  }

  if (!headers.some((h) => !h.startsWith('col'))) {
    throw new ImportFileError('Missing header row', 'empty');
  }

  const rows: RawImportRow[] = [];
  const lastRow = sheet.rowCount;

  for (let rowIndex = 2; rowIndex <= lastRow; rowIndex += 1) {
    const excelRow = sheet.getRow(rowIndex);
    const values: unknown[] = [];

    for (let col = 1; col <= headers.length; col += 1) {
      values.push(cellToValue(excelRow.getCell(col)));
    }

    if (!rowHasContent(values)) {
      continue;
    }

    if (rows.length >= MAX_IMPORT_ROWS) {
      throw new ImportFileError(
        `File has more than ${MAX_IMPORT_ROWS} data rows`,
        'too_many_rows'
      );
    }

    const record: RawImportRow = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? null;
    });
    rows.push(record);
  }

  if (rows.length === 0) {
    throw new ImportFileError('No data rows found in the sheet', 'empty');
  }

  return { headers, rows };
}
