# Kjolstad Lab website

The website for Fredrik Kjolstad's research group in the Stanford University Department of
Computer Science. A fast, accessible, statically-generated site that presents the group's
research, people, publications, and software.

> **"Kjolstad Lab" is a temporary name** and the canonical URL is a placeholder. Both — and
> everything else about the lab's identity — live in a single file, `src/config/site.ts`.
> See [Renaming the lab](#renaming-the-lab) and [`CONTENT_REVIEW.md`](./CONTENT_REVIEW.md).

---

## Project overview

- **What it is:** an editorial, research-first lab site with a searchable/filterable
  publication explorer, a connected software catalogue, a people directory, and a research
  narrative — built around the theme _"computation, re-formed."_
- **Content model:** all content is local, typed, and validated (Astro content collections +
  Zod). No CMS or database; a CMS can be layered on later without touching presentation.
- **Performance:** ~5 KB of gzipped JavaScript for the whole site; static HTML for every page.
- **Accessibility:** targets WCAG 2.2 AA; tested with axe + manual review.

## Technical stack

| Area          | Choice                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------- |
| Framework     | [Astro](https://astro.build) 5 (static output), strict TypeScript                             |
| Styling       | Hand-built design system — CSS custom properties + Astro scoped CSS. No UI kit, no Tailwind.  |
| Interactivity | Tiny vanilla-TS islands only (publication explorer, theme, nav, clipboard). No React/Vue/etc. |
| Fonts         | Self-hosted, Latin-subset WOFF2 (Fraunces, IBM Plex Sans, IBM Plex Mono)                      |
| Content       | Astro content collections: `people` & `software` (Markdown), `publications` (validated YAML)  |
| Tests         | Vitest (unit), Playwright + axe-core (e2e/a11y) across Chromium, Firefox, WebKit, mobile      |
| Tooling       | pnpm, ESLint 9, Prettier, `astro check`                                                       |

## Prerequisites

- **Node** ≥ 20.11 (`.nvmrc` pins 20.11.0)
- **pnpm** (pinned via `packageManager` in `package.json`; run `corepack enable`)

## Installation

```bash
corepack enable          # makes the pinned pnpm available
pnpm install             # installs from the committed lockfile
```

## Local development

```bash
pnpm dev                 # http://localhost:4321 with hot reload
```

## Tests & checks

```bash
pnpm run verify          # format + lint + content validation + types + unit + build + links
# individually:
pnpm run format:check    # Prettier
pnpm run lint            # ESLint
pnpm run validate:content# cross-reference integrity (author↔person, pub↔software, …)
pnpm run check           # astro check (TypeScript across .astro/.ts)
pnpm run test:unit       # Vitest unit tests (filtering, citations, people helpers)
pnpm run build           # production build
pnpm run check:links     # internal-link checker (runs against dist/)

pnpm run test:e2e:install# one-time: install Playwright browsers
pnpm run test:e2e        # Playwright e2e + axe accessibility across all browsers
```

## Production build

```bash
pnpm run build           # outputs static site to ./dist
```

## Preview

```bash
pnpm run preview         # serves ./dist at http://localhost:4321
```

## Deployment

The output is a plain static site (`dist/`). Any static host works.

**Netlify / Cloudflare Pages** (config already included):

- Build command: `pnpm run build` · Publish directory: `dist`
- `netlify.toml` sets the Node version and base headers.
- `public/_headers` ships the security headers + a Content-Security-Policy and long-cache
  rules for hashed assets and fonts. `public/_redirects` holds legacy redirects.

**GitHub Pages / university static hosting / any bucket:** upload the contents of `dist/`.
On hosts that don't read `_headers`/`_redirects`, replicate the headers from `public/_headers`
in your server/CDN config (they are also mirrored in `netlify.toml`).

Before the first public deploy, set the real domain in `src/config/site.ts` (`SITE.url`) so
canonical URLs, the sitemap, and `robots.txt` are correct.

## Content editing

All content lives in `src/content/`. Full instructions — adding a person, moving someone to
alumni, adding a publication or award, adding/updating software, adding a portrait, changing
homepage featured items — are in [`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md). Every change is
schema-validated at build time; run `pnpm run validate:content` for a fast pre-check.

## Renaming the lab

Edit **one file** — `src/config/site.ts`:

```ts
export const SITE = {
  name: 'Kjolstad Lab', // ← the display name
  shortName: 'Kjolstad Lab', // ← used in the wordmark & nav
  tagline: '…',
  url: 'https://…', // ← canonical domain
  // …
};
```

If the wordmark text in the favicon / social image should also change, re-run
`pnpm run generate:assets`. Nothing else references the name directly.

## Accessibility approach

Targets **WCAG 2.2 AA**. Semantic landmarks, a logical heading order, a skip link, visible
focus states, full keyboard operation, `prefers-reduced-motion` support, AA-contrast light
**and** dark themes, and a no-JavaScript fallback for the publication list (the complete
grouped list is always present; only live filtering needs JS). Verified with automated
axe-core scans in Playwright plus manual review; see `/accessibility` and the
[testing notes](./ARCHITECTURE.md#testing).

## Performance approach

Static HTML for every page; no framework runtime. Total JS is ~5 KB gzipped (Astro's
view-transition runtime plus a ~1 KB publication-filter island loaded only on the
publications page). Self-hosted subset fonts with `font-display: swap` and preloading of the
two critical faces; no third-party requests, analytics, or embeds by default. Lighthouse
(mobile) scores 98–100 across Performance, Accessibility, Best Practices, and SEO.

## Repository structure

```
src/
  config/site.ts          Single source of truth for lab identity, nav, analytics, flags
  content/                Local content (validated by src/content.config.ts)
    people/*.md           One file per person (bio in body, facts in frontmatter)
    software/*.md         One file per project (narrative in body, facts in frontmatter)
    publications.yaml     All publications (one validated entry each)
  components/             UI, global, navigation, home, people, publications, software, research
  layouts/                BaseLayout (shell + SEO), PageLayout (page header)
  lib/                    Pure logic: publications (filter/sort/URL), citation, people, taxonomy, collections
  pages/                  Routes (incl. [slug] detail pages, robots.txt, site.webmanifest)
  styles/                 Design tokens, base, fonts, print
  assets/, public/        Fonts, favicons, OG image
scripts/
  import-legacy-content.ts  One-time: parse the archived old site → publications.yaml
  generate-assets.ts        Generate favicons + OG image from the design system
  validate-content.ts       Cross-reference integrity checker
  check-links.ts            Internal-link checker (against dist/)
  legacy/                   Committed archive of the source site + software verification
tests/
  unit/                   Vitest unit tests
  e2e/                    Playwright e2e + axe accessibility
```

## Further reading

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the site is put together and why.
- [`DESIGN.md`](./DESIGN.md) — the design system: type, colour, motifs, theming.
- [`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md) — day-to-day content editing.
- [`CONTENT_REVIEW.md`](./CONTENT_REVIEW.md) — facts & wording awaiting human confirmation.
