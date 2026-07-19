/**
 * Static audit: no production passwords/secrets hardcoded in source.
 * Run via: node scripts/audit-no-hardcoded-secrets.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'coverage',
  'dist',
  'Client Outreach Data',
]);

const SKIP_FILES = new Set([
  'package-lock.json',
  'audit-no-hardcoded-secrets.mjs',
]);

const ALLOWED_ENV_EXAMPLE_NAMES = new Set([
  '.env.example',
  '.env.production.example',
]);

/** Patterns that look like real credentials in source (not placeholders). */
const DANGEROUS = [
  {
    id: 'A',
    name: 'hardcoded password assignment',
    re: /(?:password|passwd|pwd)\s*[:=]\s*['"](?!change_me|your_|replace_|demo-pass|secret123|wrong|SecurePassword|hidden|test)[^'"]{8,}['"]/i,
  },
  {
    id: 'A',
    name: 'supabase service role jwt in source',
    re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (SKIP_FILES.has(entry.name)) continue;
    if (entry.name.startsWith('.env') && !ALLOWED_ENV_EXAMPLE_NAMES.has(entry.name)) {
      continue;
    }
    if (!/\.(ts|tsx|js|mjs|jsx|md|json|sql)$/i.test(entry.name)) continue;
    out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const findings = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel.startsWith('__tests__/') || rel.includes('/__tests__/')) continue;
  if (rel.startsWith('playwright/')) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const rule of DANGEROUS) {
    if (rule.re.test(content)) {
      findings.push({ file: rel, rule: rule.name, hypothesisId: rule.id });
    }
  }
}

const encryptionModule = path.join(ROOT, 'lib/crypto/secrets.ts');
const hasEncryption = fs.existsSync(encryptionModule);

const payload = {
  sessionId: '195ef7',
  runId: 'pre-fix',
  hypothesisId: 'A',
  location: 'scripts/audit-no-hardcoded-secrets.mjs',
  message: 'Static secret audit',
  data: {
    filesScanned: files.length,
    findingsCount: findings.length,
    findings: findings.slice(0, 20),
    hasEncryptionModule: hasEncryption,
  },
  timestamp: Date.now(),
};

const logPath = path.join(ROOT, 'debug-195ef7.log');
fs.appendFileSync(logPath, `${JSON.stringify(payload)}\n`);

try {
  await fetch('http://127.0.0.1:7688/ingest/d6a6cd89-f4e7-4e5a-95af-7625b16582a1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '195ef7',
    },
    body: JSON.stringify(payload),
  });
} catch {
  // ingest optional
}

if (findings.length > 0) {
  console.error('HARDCODED SECRET FINDINGS:');
  for (const f of findings) {
    console.error(` - [${f.rule}] ${f.file}`);
  }
  process.exit(1);
}

console.log(
  `OK: scanned ${files.length} files, 0 hardcoded secret findings; encryption module=${hasEncryption}`
);
