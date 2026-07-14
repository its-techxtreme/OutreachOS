import {
  ALLOWED_IMPORT_EXTENSIONS,
  ALLOWED_IMPORT_MIME_TYPES,
  MAX_IMPORT_FILE_BYTES,
  XLS_MAGIC,
  XLSX_MAGIC,
} from '@/lib/import/constants';

export class ImportFileError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'too_large'
      | 'invalid_type'
      | 'invalid_magic'
      | 'empty'
      | 'too_many_rows'
      | 'parse_failed'
  ) {
    super(message);
    this.name = 'ImportFileError';
  }
}

function hasMagic(buffer: Buffer, magic: Buffer): boolean {
  if (buffer.length < magic.length) {
    return false;
  }
  return magic.equals(buffer.subarray(0, magic.length));
}

export function assertSafeImportFile(
  filename: string,
  mimeType: string,
  size: number,
  buffer: Buffer
): void {
  if (size <= 0) {
    throw new ImportFileError('Uploaded file is empty', 'empty');
  }

  if (size > MAX_IMPORT_FILE_BYTES) {
    throw new ImportFileError(
      `File exceeds the ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB limit`,
      'too_large'
    );
  }

  const lowerName = filename.toLowerCase().trim();
  const hasAllowedExtension = ALLOWED_IMPORT_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );

  if (!hasAllowedExtension) {
    throw new ImportFileError(
      'Only .xlsx and .xls Excel files are allowed',
      'invalid_type'
    );
  }

  const normalizedMime = mimeType.toLowerCase().split(';')[0]?.trim() ?? '';
  if (
    normalizedMime &&
    !ALLOWED_IMPORT_MIME_TYPES.has(normalizedMime) &&
    normalizedMime !== 'application/zip'
  ) {
    throw new ImportFileError(
      'File MIME type is not an allowed Excel format',
      'invalid_type'
    );
  }

  const isXlsx = lowerName.endsWith('.xlsx');
  const magicOk = isXlsx
    ? hasMagic(buffer, XLSX_MAGIC)
    : hasMagic(buffer, XLS_MAGIC) || hasMagic(buffer, XLSX_MAGIC);

  if (!magicOk) {
    throw new ImportFileError(
      'File contents do not match a valid Excel document',
      'invalid_magic'
    );
  }
}
