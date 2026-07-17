/**
 * Generate raster brand assets from the design system:
 *   - favicon.ico (32px, PNG-in-ICO), favicon-16/32.png
 *   - apple-touch-icon.png (180px), icon-192/512.png
 *
 *   pnpm exec tsx scripts/generate-assets.ts
 *
 * Requires `sharp` (already a dependency). Re-run if the wordmark or palette changes.
 * Social (OG) cards are NOT generated here — they are rendered at build time by
 * the endpoints under `src/pages/og/` via `src/lib/og.ts`.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC = resolve(ROOT, 'public');

const faviconSvg = readFileSync(resolve(PUBLIC, 'favicon.svg'));

async function main() {
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

  console.log('Generated: favicon.ico, favicon-16/32.png, apple-touch-icon.png, icon-192/512.png');
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
