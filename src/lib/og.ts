/**
 * Build-time Open Graph card renderer.
 *
 * Renders 1200×630 social cards in the site's editorial style (paper, cardinal
 * bar, Fraunces display serif, Plex mono kicker) via satori → resvg. Fonts are
 * static-instance TTFs in `src/assets/og-fonts/` (satori cannot read woff2), so
 * output is identical on macOS and Linux CI. Consumed by the endpoints under
 * `src/pages/og/`.
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CARDINAL = '#8c1515';
const PAPER = '#faf6ee';
const INK = '#1c1917';
const INK_MUTED = '#57514b';
const INK_SUBTLE = '#6f6961';

export interface OgCard {
  /** Small mono line above the title, e.g. "PLDI · 2026". Uppercased. */
  kicker: string;
  /** Main display-serif line. Wrapped and clamped automatically. */
  title: string;
  /** Supporting line under the title (authors, summary, role). */
  meta?: string;
  /**
   * Right-hand footer line. Defaults to the university affiliation; pass null
   * for cards whose kicker already carries it (the default card).
   */
  footerRight?: string | null;
}

// Fonts are read from the project root: `astro build` always runs there, and
// bundling rewrites import.meta.url so it cannot be used to locate src/.
const FONT_DIR = resolve(process.cwd(), 'src/assets/og-fonts');
const font = (file: string) => readFileSync(resolve(FONT_DIR, file));

const FONTS = [
  {
    name: 'Fraunces',
    data: font('fraunces-600.ttf'),
    weight: 600 as const,
    style: 'normal' as const,
  },
  {
    name: 'Plex Sans',
    data: font('plex-sans-400.ttf'),
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'Plex Sans',
    data: font('plex-sans-500.ttf'),
    weight: 500 as const,
    style: 'normal' as const,
  },
  {
    name: 'Plex Mono',
    data: font('plex-mono-500.ttf'),
    weight: 500 as const,
    style: 'normal' as const,
  },
];

// The sparse-coordinate brand mark (same geometry as favicon.svg / generate-assets).
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <g fill="none" stroke="${INK}" stroke-width="1.7" stroke-linecap="square">
    <path d="M11 6 H7.5 V26 H11"/>
    <path d="M21 6 H24.5 V26 H21"/>
  </g>
  <g fill="${CARDINAL}">
    <rect x="12.5" y="9.5" width="2.6" height="2.6" rx="0.4"/>
    <rect x="19" y="9.5" width="2.6" height="2.6" rx="0.4"/>
    <rect x="15.75" y="15.4" width="2.6" height="2.6" rx="0.4"/>
    <rect x="12.5" y="21.3" width="2.6" height="2.6" rx="0.4"/>
  </g>
</svg>`;
const MARK_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString('base64')}`;

/** Satori element tree node (satori accepts plain React-shaped objects). */
interface Node {
  type: string;
  props: Record<string, unknown> & { children?: Node | Node[] | string };
}

const el = (
  type: string,
  style: Record<string, unknown>,
  children?: Node | Node[] | string,
  extra: Record<string, unknown> = {}
): Node => ({ type, props: { style, children, ...extra } });

/** Display size for the title, stepped down as it gets longer. */
function titleSize(title: string): number {
  const n = title.length;
  if (n <= 30) return 84;
  if (n <= 55) return 68;
  if (n <= 90) return 56;
  return 46;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export async function renderOgImage(card: OgCard): Promise<Uint8Array> {
  const footerRight =
    card.footerRight === undefined ? 'Stanford University · Computer Science' : card.footerRight;

  const tree = el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: PAPER,
      padding: '66px 80px 56px',
      position: 'relative',
      fontFamily: 'Plex Sans',
    },
    [
      // Cardinal top bar.
      el('div', {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1200,
        height: 10,
        backgroundColor: CARDINAL,
        display: 'flex',
      }),
      // Kicker row with the brand mark opposite.
      el(
        'div',
        {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        [
          el(
            'div',
            {
              display: 'flex',
              fontFamily: 'Plex Mono',
              fontWeight: 500,
              fontSize: 26,
              letterSpacing: 3,
              color: INK_MUTED,
              marginTop: 26,
            },
            truncate(card.kicker.toUpperCase(), 58)
          ),
          el('img', { width: 100, height: 100 }, undefined, { src: MARK_DATA_URI }),
        ]
      ),
      // Title + meta, vertically centered in the remaining space.
      el(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexGrow: 1,
          paddingRight: 20,
        },
        [
          el(
            'div',
            {
              display: 'flex',
              fontFamily: 'Fraunces',
              fontWeight: 600,
              fontSize: titleSize(card.title),
              lineHeight: 1.08,
              letterSpacing: -1,
              color: INK,
              lineClamp: 4,
            },
            truncate(card.title, 200)
          ),
          ...(card.meta
            ? [
                el(
                  'div',
                  {
                    display: 'flex',
                    fontFamily: 'Plex Sans',
                    fontWeight: 400,
                    fontSize: 30,
                    lineHeight: 1.4,
                    color: INK_MUTED,
                    marginTop: 26,
                    lineClamp: 2,
                  },
                  truncate(card.meta, 170)
                ),
              ]
            : []),
        ]
      ),
      // Footer: site URL and affiliation.
      el(
        'div',
        {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        },
        [
          el(
            'div',
            {
              display: 'flex',
              fontFamily: 'Plex Mono',
              fontWeight: 500,
              fontSize: 24,
              letterSpacing: 1,
              color: CARDINAL,
            },
            'compilers.stanford.edu'
          ),
          ...(footerRight
            ? [
                el(
                  'div',
                  {
                    display: 'flex',
                    fontFamily: 'Plex Sans',
                    fontWeight: 500,
                    fontSize: 23,
                    color: INK_SUBTLE,
                  },
                  footerRight
                ),
              ]
            : []),
        ]
      ),
    ]
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: FONTS,
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}

/** Standard response wrapper for the static .png endpoints. */
export function pngResponse(png: Uint8Array): Response {
  return new Response(Buffer.from(png), { headers: { 'Content-Type': 'image/png' } });
}
