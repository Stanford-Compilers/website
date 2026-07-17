/**
 * Generate raster brand assets from the design system:
 *   - favicon.ico (32px, PNG-in-ICO), favicon-16/32.png
 *   - apple-touch-icon.png (180px)
 *   - og/default.png (1200×630 social card)
 *
 *   pnpm exec tsx scripts/generate-assets.ts
 *
 * Requires `sharp` (already a dependency). Re-run if the wordmark or palette changes.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC = resolve(ROOT, 'public');

const CARDINAL = '#8c1515';
const PAPER = '#faf6ee';
const INK = '#1c1917';

const faviconSvg = readFileSync(resolve(PUBLIC, 'favicon.svg'));

// The sparse-coordinate mark, drawn large for the OG card.
function markSvg(x: number, y: number, scale: number, dot: string, bracket: string): string {
  const s = (n: number) => (n * scale).toFixed(2);
  return `
    <g transform="translate(${x},${y})" fill="none" stroke="${bracket}" stroke-width="${s(1.7)}" stroke-linecap="square">
      <path d="M${s(11)} ${s(6)} H${s(7.5)} V${s(26)} H${s(11)}" />
      <path d="M${s(21)} ${s(6)} H${s(24.5)} V${s(26)} H${s(21)}" />
    </g>
    <g transform="translate(${x},${y})" fill="${dot}">
      <rect x="${s(12.5)}" y="${s(9.5)}" width="${s(2.6)}" height="${s(2.6)}" rx="${s(0.4)}" />
      <rect x="${s(19)}" y="${s(9.5)}" width="${s(2.6)}" height="${s(2.6)}" rx="${s(0.4)}" />
      <rect x="${s(15.75)}" y="${s(15.4)}" width="${s(2.6)}" height="${s(2.6)}" rx="${s(0.4)}" />
      <rect x="${s(12.5)}" y="${s(21.3)}" width="${s(2.6)}" height="${s(2.6)}" rx="${s(0.4)}" />
    </g>`;
}

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect width="1200" height="630" fill="none"/>
  <rect x="0" y="0" width="1200" height="10" fill="${CARDINAL}"/>
  <!-- faint coordinate ticks -->
  <g stroke="${INK}" stroke-opacity="0.08" stroke-width="1">
    ${Array.from({ length: 24 }, (_, i) => `<line x1="${80 + i * 46}" y1="560" x2="${80 + i * 46}" y2="574"/>`).join('')}
  </g>
  <g font-family="'IBM Plex Mono','DejaVu Sans Mono',monospace" fill="${INK}" fill-opacity="0.65" font-size="24" letter-spacing="2">
    <text x="80" y="120">STANFORD UNIVERSITY · COMPUTER SCIENCE</text>
  </g>
  ${markSvg(78, 170, 3.1, CARDINAL, INK)}
  <g font-family="Georgia,'Times New Roman',serif" fill="${INK}">
    <text x="80" y="322" font-size="86" font-weight="600" letter-spacing="-2">Stanford Compilers Lab</text>
  </g>
  <g font-family="Georgia,'Times New Roman',serif" fill="${INK}" fill-opacity="0.82">
    <text x="82" y="410" font-size="46">Languages and compilers across</text>
    <text x="82" y="468" font-size="46">data forms and machines.</text>
  </g>
  <g font-family="'IBM Plex Mono','DejaVu Sans Mono',monospace" fill="${CARDINAL}" font-size="26" letter-spacing="1">
    <text x="80" y="560">[ computation, re-formed ]</text>
  </g>
</svg>`;

async function main() {
  mkdirSync(resolve(PUBLIC, 'og'), { recursive: true });

  // Favicons + apple touch icon from the SVG mark.
  const png32 = await sharp(faviconSvg, { density: 384 }).resize(32, 32).png().toBuffer();
  const png16 = await sharp(faviconSvg, { density: 384 }).resize(16, 16).png().toBuffer();
  writeFileSync(resolve(PUBLIC, 'favicon-32.png'), png32);
  writeFileSync(resolve(PUBLIC, 'favicon-16.png'), png16);
  writeFileSync(resolve(PUBLIC, 'favicon.ico'), pngToIco(png32, 32));

  await sharp(faviconSvg, { density: 512 })
    .resize(180, 180)
    .png()
    .toFile(resolve(PUBLIC, 'apple-touch-icon.png'));

  await sharp(faviconSvg, { density: 512 })
    .resize(512, 512)
    .png()
    .toFile(resolve(PUBLIC, 'icon-512.png'));
  await sharp(faviconSvg, { density: 512 })
    .resize(192, 192)
    .png()
    .toFile(resolve(PUBLIC, 'icon-192.png'));

  // Social card.
  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile(resolve(PUBLIC, 'og', 'default.png'));

  console.log(
    'Generated: favicon.ico, favicon-16/32.png, apple-touch-icon.png, icon-192/512.png, og/default.png'
  );
}

/** Wrap a PNG buffer in a single-image ICO container (ICO supports embedded PNG). */
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
