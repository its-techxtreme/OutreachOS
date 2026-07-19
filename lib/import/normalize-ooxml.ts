import JSZip from 'jszip';

const SPREADSHEETML_NS =
  'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

/**
 * Some exporters (OpenXML SDKs, custom writers) emit spreadsheetml with a
 * prefixed default namespace (`xmlns:x=...`, `<x:workbook>`). ExcelJS expects
 * the unprefixed form (`xmlns=...`, `<workbook>`) and fails with
 * "Cannot read properties of undefined (reading 'sheets')".
 *
 * Rewrite xl/*.xml parts in-place inside the OOXML zip when needed.
 */
export function rewritePrefixedSpreadsheetXml(xml: string): string {
  const prefixes: string[] = [];
  const xmlnsRe = /xmlns:([A-Za-z0-9_]+)="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = xmlnsRe.exec(xml))) {
    if (match[2] === SPREADSHEETML_NS) {
      prefixes.push(match[1]);
    }
  }

  if (prefixes.length === 0) {
    return xml;
  }

  let out = xml;
  for (const prefix of prefixes) {
    out = out
      .split(`xmlns:${prefix}="${SPREADSHEETML_NS}"`)
      .join(`xmlns="${SPREADSHEETML_NS}"`);
    out = out.split(`</${prefix}:`).join('</');
    out = out.split(`<${prefix}:`).join('<');
  }
  return out;
}

export function workbookUsesPrefixedSpreadsheetMl(xml: string): boolean {
  return /xmlns:[A-Za-z0-9_]+="http:\/\/schemas\.openxmlformats\.org\/spreadsheetml\/2006\/main"/.test(
    xml
  );
}

/**
 * Returns the original buffer when no rewrite is needed.
 */
export async function normalizeOoxmlBuffer(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const workbookFile = zip.file('xl/workbook.xml');
  if (!workbookFile) {
    return buffer;
  }

  const workbookXml = await workbookFile.async('string');
  if (!workbookUsesPrefixedSpreadsheetMl(workbookXml)) {
    return buffer;
  }

  const out = new JSZip();
  const entries = Object.entries(zip.files);

  for (const [name, file] of entries) {
    if (file.dir) {
      continue;
    }
    if (name.startsWith('xl/') && name.endsWith('.xml')) {
      const text = await file.async('string');
      out.file(name, rewritePrefixedSpreadsheetXml(text));
    } else {
      out.file(name, await file.async('nodebuffer'));
    }
  }

  return Buffer.from(
    await out.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    })
  );
}
