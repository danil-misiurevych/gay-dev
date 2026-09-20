import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

/**
 * Build size budget.
 *
 * HTML5 game platforms have hard bundle limits, and going over them only
 * shows up at submission time — the worst possible moment. It is cheaper for
 * the build to fail on the commit that broke the budget than for the team to
 * find out during review.
 *
 * The limits are deliberately tight. If exceeding one is justified, raise the
 * number HERE and record the reason in docs/DECISIONS.md — the point is that
 * growth is a decision, not an accident.
 */
const LIMITS = {
  totalGzip: 700 * 1024,   // the whole bundle, gzipped
  singleGzip: 450 * 1024,  // the largest single file, gzipped
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else out.push({ path: p, bytes: s.size, gzip: gzipSync(readFileSync(p)).length });
  }
  return out;
}

let files;
try {
  files = walk('dist');
} catch {
  console.error('No dist/ directory. Run this first: npm run build');
  process.exit(1);
}

files.sort((a, b) => b.gzip - a.gzip);
const total = files.reduce((n, f) => n + f.gzip, 0);
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

console.log('Build size (gzip):\n');
for (const f of files.slice(0, 12)) {
  console.log(`  ${kb(f.gzip).padStart(10)}  ${f.path}`);
}
console.log(`\n  ${kb(total).padStart(10)}  TOTAL (${files.length} files)\n`);

const problems = [];
if (total > LIMITS.totalGzip) {
  problems.push(`Total ${kb(total)} exceeds the budget of ${kb(LIMITS.totalGzip)}.`);
}
const biggest = files[0];
if (biggest && biggest.gzip > LIMITS.singleGzip) {
  problems.push(`File ${biggest.path} (${kb(biggest.gzip)}) exceeds the limit of ${kb(LIMITS.singleGzip)}.`);
}

if (problems.length) {
  console.error('SIZE BUDGET EXCEEDED:');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nEither bring the size down, or raise the limit in scripts/check-size.mjs');
  console.error('and record the reason in docs/DECISIONS.md.');
  process.exit(1);
}
console.log('Budget OK.');
