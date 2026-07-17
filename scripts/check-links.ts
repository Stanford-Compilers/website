/**
 * Internal link checker. Crawls the built dist/ output, extracts every internal
 * href/src, and verifies each target exists on disk. Fails the build if any
 * internal link is broken.
 *
 *   pnpm run build && pnpm run check:links
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `pnpm run build` first.');
  process.exit(1);
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Map an internal link to the file that should satisfy it. */
function resolveTarget(link: string): string | null {
  const path = link.split('#')[0].split('?')[0];
  if (!path.startsWith('/')) return null; // relative or external handled elsewhere
  if (path === '') return null;
  const last = path.split('/').pop() ?? '';
  if (extname(last)) {
    return join(DIST, path); // has a file extension → literal file
  }
  // Route → directory index.
  return join(DIST, path.replace(/\/$/, ''), 'index.html');
}

const htmlFiles = walk(DIST);
const broken: { file: string; link: string }[] = [];
let checked = 0;
const attrRe = /(?:href|src)="([^"]+)"/g;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(html)) !== null) {
    const link = m[1];
    if (
      /^(https?:)?\/\//.test(link) ||
      link.startsWith('mailto:') ||
      link.startsWith('tel:') ||
      link.startsWith('data:') ||
      link.startsWith('#')
    ) {
      continue;
    }
    const target = resolveTarget(link);
    if (!target) continue;
    checked++;
    if (!existsSync(target)) {
      broken.push({ file: file.replace(DIST, ''), link });
    }
  }
}

console.log(`Checked ${checked} internal links across ${htmlFiles.length} pages.`);
if (broken.length) {
  console.error(`\n${broken.length} broken internal link(s):`);
  const seen = new Set<string>();
  for (const b of broken) {
    const key = `${b.link}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.error(`  ✗ ${b.link}  (e.g. in ${b.file})`);
  }
  process.exit(1);
}
console.log('✓ No broken internal links.');
