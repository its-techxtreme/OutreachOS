import {
  rewritePrefixedSpreadsheetXml,
  workbookUsesPrefixedSpreadsheetMl,
  normalizeOoxmlBuffer,
} from '@/lib/import/normalize-ooxml';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const FIXTURE = path.join(
  __dirname,
  '..',
  'fixtures',
  'prefixed-namespace-leads.xlsx'
);

describe('normalize-ooxml', () => {
  it('detects and rewrites prefixed spreadsheetml namespaces', () => {
    const xml =
      '<?xml version="1.0"?><x:workbook xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><x:sheets><x:sheet name="A" sheetId="1"/></x:sheets></x:workbook>';

    expect(workbookUsesPrefixedSpreadsheetMl(xml)).toBe(true);
    const rewritten = rewritePrefixedSpreadsheetXml(xml);
    expect(rewritten).toContain(
      'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    );
    expect(rewritten).toContain('<workbook');
    expect(rewritten).toContain('<sheets>');
    expect(rewritten).not.toContain('<x:workbook');
  });

  it('leaves standard unprefixed workbook xml unchanged', () => {
    const xml =
      '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="A" sheetId="1"/></sheets></workbook>';
    expect(workbookUsesPrefixedSpreadsheetMl(xml)).toBe(false);
    expect(rewritePrefixedSpreadsheetXml(xml)).toBe(xml);
  });

  it('rewrites xl/*.xml inside a prefixed OOXML zip', async () => {
    const buffer = fs.readFileSync(FIXTURE);
    const before = await JSZip.loadAsync(buffer);
    const beforeWorkbook = await before.file('xl/workbook.xml')!.async('string');
    expect(workbookUsesPrefixedSpreadsheetMl(beforeWorkbook)).toBe(true);

    const normalized = await normalizeOoxmlBuffer(buffer);
    const after = await JSZip.loadAsync(normalized);
    const afterWorkbook = await after.file('xl/workbook.xml')!.async('string');
    expect(workbookUsesPrefixedSpreadsheetMl(afterWorkbook)).toBe(false);
    expect(afterWorkbook).toContain('<workbook');
    expect(afterWorkbook).not.toContain('<x:workbook');
  });
});
