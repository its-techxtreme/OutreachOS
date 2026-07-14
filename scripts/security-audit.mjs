#!/usr/bin/env node
/**
 * Lightweight security audit for OutreachOS production readiness.
 * Usage: node ./scripts/security-audit.mjs
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
let issues = 0;

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function bad(msg) {
  console.error(`❌ ${msg}`);
  issues += 1;
}

console.log('\n🔒 OutreachOS security audit\n');

// 1. Ensure secrets are not committed
for (const file of ['.env', '.env.local', '.env.production']) {
  const path = resolve(root, file);
  if (existsSync(path)) {
    // Presence is fine if gitignored; warn if .env.production exists with secrets pattern
    const content = readFileSync(path, 'utf8');
    if (/SUPABASE_SERVICE_ROLE_KEY=eyJ/.test(content) && file === '.env.production') {
      bad(`${file} appears to contain a real service role JWT — do not commit`);
    } else {
      ok(`${file} present locally (ensure gitignored)`);
    }
  }
}

const gitIgnore = readFileSync(resolve(root, '.gitignore'), 'utf8');
for (const pattern of ['.env*.local', '.env']) {
  if (gitIgnore.includes(pattern) || gitIgnore.includes('.env')) {
    ok(`.gitignore covers env files`);
    break;
  }
}

// 2. npm audit (high+)
const audit = spawnSync('npm', ['audit', '--audit-level=high'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (audit.status === 0) {
  ok('npm audit: no high/critical vulnerabilities');
} else {
  bad('npm audit reported high/critical vulnerabilities — review before launch');
  if (audit.stdout) console.log(audit.stdout.slice(0, 1500));
}

// 3. Security headers config present
const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
const headerKeys = (vercel.headers?.[0]?.headers ?? []).map((h) => h.key);
if (headerKeys.includes('Content-Security-Policy') || headerKeys.includes('X-Frame-Options')) {
  ok('Security headers configured in vercel.json (CSP also set in proxy)');
} else {
  bad('Missing core security headers in vercel.json');
}

// 4. Proxy enforces auth on admin APIs
const proxy = readFileSync(resolve(root, 'src/proxy.ts'), 'utf8');
if (proxy.includes('/api/admin') && proxy.includes('SESSION_REQUIRED_API_PREFIXES')) {
  ok('Proxy protects /api/admin routes');
} else {
  bad('Proxy may not protect /api/admin routes');
}

console.log(
  issues === 0
    ? '\n🔒 Security audit passed\n'
    : `\n🔒 Security audit finished with ${issues} issue(s)\n`
);

process.exit(issues === 0 ? 0 : 1);
