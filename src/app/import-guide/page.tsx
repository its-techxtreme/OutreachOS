import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { SiteFooter } from '@/components/site/SiteFooter';
import { APP_NAME } from '@/lib/brand';
import {
  DEMO_MAX_IMPORT_ROWS,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_ROWS,
} from '@/lib/import/constants';

export const metadata: Metadata = {
  title: `Import guide | ${APP_NAME}`,
  description:
    'Excel format tips for importing leads into OutreachOS — columns, aliases, and common failure reasons.',
  alternates: {
    canonical: '/import-guide',
  },
};

const COLUMNS = [
  {
    name: 'Business Name',
    required: true,
    aliases: 'Business Name, Company, Name, Lead Name',
    notes: 'Required. Rows without a name are skipped.',
  },
  {
    name: 'Niche',
    required: false,
    aliases: 'Niche, Category, Industry, Vertical, Sector, Type',
    notes:
      'Any text is accepted (Cafe, SaaS, Pet Groomer, …). Empty → “General”. Filters pick up new values after import.',
  },
  {
    name: 'Country',
    required: false,
    aliases: 'Country, Nation, Region, Market',
    notes:
      'Any text is accepted. Empty → “Unknown”. City alone is not treated as country.',
  },
  {
    name: 'Phone',
    required: false,
    aliases: 'Phone, Mobile, Tel, Primary Mobile',
    notes: 'Optional. 10-digit Indian mobiles may be normalized with +91.',
  },
  {
    name: 'Address',
    required: false,
    aliases: 'Address, Full Address, Location, Street',
    notes: 'Optional free text.',
  },
  {
    name: 'Google Maps Link',
    required: false,
    aliases: 'Google Maps Link, Maps URL, Source URL, Google Maps',
    notes:
      'Preferred. If missing, OutreachOS synthesizes a Maps search URL from name + address/country. Duplicates are keyed by maps URL.',
  },
  {
    name: 'Final Status',
    required: false,
    aliases: 'Final Status, Status Filter, Import Status',
    notes:
      'Import exclude flag only. Values REJECT / SKIP / NO / EXCLUDE / N skip the row. Not stored as lead status.',
  },
] as const;

export default function ImportGuidePage() {
  const maxMb = MAX_IMPORT_FILE_BYTES / (1024 * 1024);

  return (
    <div className="paper-texture min-h-screen">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <header className="doodle-border bg-paper px-5 py-5">
          <BrandLockup size="md" href="/" />
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">
            Excel import guide
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Upload any niche or country — OutreachOS does not restrict you to a
            fixed list. Use one sheet, header row 1, and the column names below
            (aliases welcome).
          </p>
          <p className="mt-4">
            <a
              href="/templates/outreachos-leads-import-template.xlsx"
              className="doodle-btn inline-flex items-center rounded-md border-2 border-ink bg-highlighter px-3 py-2 text-sm font-semibold text-ink"
              data-testid="download-import-template"
            >
              Download blank template (.xlsx)
            </a>
          </p>
        </header>

        <section className="doodle-border bg-paper px-5 py-5">
          <h2 className="font-display text-xl font-bold text-ink">
            Best layout
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink">
            <li>File type: <strong>.xlsx</strong> or <strong>.xls</strong> only (not CSV yet).</li>
            <li>First worksheet only is read.</li>
            <li>Row 1 = headers. Data starts on row 2.</li>
            <li>
              Size limits: {maxMb} MB · up to {MAX_IMPORT_ROWS.toLocaleString()}{' '}
              rows (demo account: {DEMO_MAX_IMPORT_ROWS}).
            </li>
            <li>One business per row. Keep Maps links unique.</li>
          </ul>
        </section>

        <section className="doodle-border bg-paper px-5 py-5">
          <h2 className="font-display text-xl font-bold text-ink">Columns</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink/30 text-[11px] uppercase tracking-wider text-ink-muted">
                  <th className="py-2 pr-3">Column</th>
                  <th className="py-2 pr-3">Required</th>
                  <th className="py-2 pr-3">Accepted headers</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {COLUMNS.map((col) => (
                  <tr key={col.name} className="border-b border-ink/10 align-top">
                    <td className="py-3 pr-3 font-semibold text-ink">
                      {col.name}
                    </td>
                    <td className="py-3 pr-3 text-ink-muted">
                      {col.required ? 'Yes' : 'No'}
                    </td>
                    <td className="py-3 pr-3 text-ink-muted">{col.aliases}</td>
                    <td className="py-3 text-ink-muted">{col.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="doodle-border bg-paper px-5 py-5">
          <h2 className="font-display text-xl font-bold text-ink">
            Mistakes that cause skips or failures
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink">
            <li>
              <strong>Missing name</strong> — row skipped (
              <code className="text-xs">missing_name</code>).
            </li>
            <li>
              <strong>Final Status = REJECT / SKIP / …</strong> — row skipped on
              purpose (
              <code className="text-xs">final_status_excluded</code>).
            </li>
            <li>
              <strong>Validation failed</strong> — field too long or empty after
              clean (
              <code className="text-xs">validation_failed</code>).
            </li>
            <li>
              <strong>Duplicate Maps URL</strong> — same link already in your
              vault or twice in the file (counted as duplicate, not created).
            </li>
            <li>
              <strong>Wrong file type / too large</strong> — whole upload
              rejected with a clear error.
            </li>
            <li>
              <strong>Quota exceeded</strong> — free accounts hit storage limits;
              message explains the cap.
            </li>
          </ul>
          <p className="mt-4 text-sm text-ink-muted">
            After a partial import, expand <strong>Row details</strong> on the
            dashboard banner to see each failed or skipped row and its reason.
          </p>
        </section>

        <p className="text-center text-sm text-ink-muted">
          <Link href="/dashboard" className="text-marker underline underline-offset-2">
            Back to vault
          </Link>
          {' · '}
          <Link href="/auth/login" className="underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
