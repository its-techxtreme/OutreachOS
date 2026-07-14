#!/usr/bin/env node
/**
 * Pre-deployment validation for OutreachOS Phase 6.
 * Usage: node ./scripts/validate-production.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
let failures = 0;

function pass(msg) {
  console.log(`✅ ${msg}`);
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  failures += 1;
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  return result;
}

console.log('\n🚀 OutreachOS production validation\n');

// 1. Required config files
for (const file of [
  'vercel.json',
  'next.config.ts',
  '.env.production.example',
  'supabase/migrations/003_production_observability.sql',
]) {
  if (existsSync(resolve(root, file))) {
    pass(`Found ${file}`);
  } else {
    fail(`Missing ${file}`);
  }
}

// 2. vercel.json security headers
try {
  const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
  const headers = vercel.headers?.[0]?.headers ?? [];
  const keys = headers.map((h) => h.key);
  for (const required of [
    'Strict-Transport-Security',
    'X-Frame-Options',
    'X-Content-Type-Options',
  ]) {
    if (keys.includes(required)) {
      pass(`vercel.json has ${required}`);
    } else {
      fail(`vercel.json missing ${required}`);
    }
  }
} catch (error) {
  fail(`Could not parse vercel.json: ${error.message}`);
}

// 3. Typecheck
const typecheck = run('npm', ['run', 'type-check']);
if (typecheck.status === 0) {
  pass('TypeScript type-check passed');
} else {
  fail('TypeScript type-check failed');
  if (typecheck.stderr) console.error(typecheck.stderr);
}

// 4. Unit tests (production-focused subset)
const tests = run('npm', [
  'run',
  'test',
  '--',
  '--coverage=false',
  '--testPathPattern=production-monitor|migration-validator|admin-metrics|production-security|production-load|health',
]);
if (tests.status === 0) {
  pass('Production-focused unit tests passed');
} else {
  fail('Production-focused unit tests failed');
  if (tests.stdout) console.log(tests.stdout.slice(-2000));
}

// 5. Build
const build = run('node', ['./node_modules/next/dist/bin/next', 'build']);
if (build.status === 0) {
  pass('Production build succeeded');
} else {
  fail('Production build failed');
  if (build.stderr) console.error(build.stderr.slice(-2000));
}

console.log(
  failures === 0
    ? '\n✅ Production validation passed — ready to deploy\n'
    : `\n❌ Production validation failed (${failures} issue(s))\n`
);

process.exit(failures === 0 ? 0 : 1);
