/** Maximum upload size for Excel lead imports (5 MiB). */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

/** Hard cap on data rows processed per upload (excludes header). */
export const MAX_IMPORT_ROWS = 2_000;

/** Tighter row cap for the public demo account. */
export const DEMO_MAX_IMPORT_ROWS = 50;

/** Concurrent lead inserts per import request. */
export const IMPORT_INSERT_CONCURRENCY = 8;

export const ALLOWED_IMPORT_EXTENSIONS = ['.xlsx', '.xls'] as const;

export const ALLOWED_IMPORT_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

/** ZIP local-file header (OOXML .xlsx). */
export const XLSX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/** OLE Compound Document header (legacy .xls). */
export const XLS_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
