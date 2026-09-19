import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

/**
 * Budzet rozmiaru builda.
 *
 * Platformy z grami HTML5 maja twarde limity paczki, a przekroczenie
 * wychodzi dopiero przy wysylce — czyli w najgorszym momencie. Taniej
 * jest, zeby build sie wysypal przy commicie, ktory przekroczyl budzet,
 * niz zeby zespol dowiedzial sie o tym przy weryfikacji.
 *
 * Limity sa celowo ciasne. Jesli przekroczenie jest uzasadnione, podnies
 * liczbe TU i dopisz powod w docs/DECISIONS.md — chodzi o to, zeby wzrost
 * byl decyzja, a nie przypadkiem.
 */
const LIMITS = {
  totalGzip: 700 * 1024,   // cala paczka po gzipie
  singleGzip: 450 * 1024,  // najwiekszy pojedynczy plik po gzipie
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
  console.error('Brak katalogu dist/. Uruchom najpierw: npm run build');
  process.exit(1);
}

files.sort((a, b) => b.gzip - a.gzip);
const total = files.reduce((n, f) => n + f.gzip, 0);
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

console.log('Rozmiar builda (gzip):\n');
for (const f of files.slice(0, 12)) {
  console.log(`  ${kb(f.gzip).padStart(10)}  ${f.path}`);
}
console.log(`\n  ${kb(total).padStart(10)}  RAZEM (${files.length} plików)\n`);

const problems = [];
if (total > LIMITS.totalGzip) {
  problems.push(`Całość ${kb(total)} przekracza budżet ${kb(LIMITS.totalGzip)}.`);
}
const biggest = files[0];
if (biggest && biggest.gzip > LIMITS.singleGzip) {
  problems.push(`Plik ${biggest.path} (${kb(biggest.gzip)}) przekracza limit ${kb(LIMITS.singleGzip)}.`);
}

if (problems.length) {
  console.error('BUDŻET PRZEKROCZONY:');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nAlbo zbij rozmiar, albo podnieś limit w scripts/check-size.mjs');
  console.error('i dopisz uzasadnienie w docs/DECISIONS.md.');
  process.exit(1);
}
console.log('Budżet OK.');
