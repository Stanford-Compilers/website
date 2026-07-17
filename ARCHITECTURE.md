# Architecture note

A short tour of how the site is built and the decisions behind it.

## Principles

1. **Content is data, not markup.** People, publications, and software are typed, validated
   records. Presentation components never hard-code content, and records are linked by stable
   ids, never by matching display strings.
2. **Static first, JS last.** Every page is prerendered HTML. JavaScript is added only where
   interaction genuinely needs it, as a small enhancement over working markup.
3. **One source of truth for identity.** The lab name, URL, contacts, navigation, analytics,
   and feature flags live in `src/config/site.ts` and nowhere else.

## Rendering model

Astro with `output: 'static'`. There is no server at runtime. The only client JavaScript is:

- Astro's **view-transition** runtime (`ClientRouter`, ~4.6 KB gz) — feature-flagged in
  `SITE.features.viewTransitions`.
- Three tiny **inline** enhancement scripts (theme, mobile nav, clipboard) that are delegated,
  idempotent, and survive view-transition swaps.
- One **island** — the publication explorer (`~1 KB gz`) — loaded only on `/publications`.

Total shipped JS for the whole site is ~5 KB gzipped. There is no UI framework.

## Content layer

`src/content.config.ts` defines three collections with Zod schemas:

| Collection     | Loader | Source                          | Body                    |
| -------------- | ------ | ------------------------------- | ----------------------- |
| `people`       | `glob` | `src/content/people/*.md`       | optional short bio      |
| `software`     | `glob` | `src/content/software/*.md`     | "how it fits" narrative |
| `publications` | `file` | `src/content/publications.yaml` | —                       |

`src/lib/taxonomy.ts` holds the shared vocabularies — research **topics**, **venues**,
software **categories**, people **categories** — as keys used by both the schemas and the UI.
Adding a venue or topic once makes it valid everywhere, including the filters.

`src/lib/collections.ts` is the async layer that loads collections, shapes typed view objects,
resolves cross-references (author → person, software ↔ publications), and decides which people
get detail pages. Two integrity layers guard the data:

- **Astro/Zod** validates shapes at build time.
- **`scripts/validate-content.ts`** validates _relationships_ (every referenced id exists,
  every venue/topic/category is known) independently of the build.

### Why a mixed loader strategy

People and software have prose bodies, so Markdown files are natural and pleasant to edit.
Publications are ~50 uniform records best kept in one file for bulk edits and diffing, so a
single validated YAML file with the `file()` loader is used. Detail-page routing works
identically for all three via `getStaticPaths`.

### Legacy import

`scripts/import-legacy-content.ts` parses a committed archive of the previous site
(`scripts/legacy/fredrikbk-home.html`) into `publications.yaml`, merging author-order-preserving
data with a curated table (venue keys, topics, DOIs, software links, person links). It is a
**one-time / manually-invoked** tool — the production site never fetches the old site at runtime.

## The publication explorer

The design goal is: full functionality with JavaScript, and the **complete list without it**.

- The server renders every publication, grouped by year, with `data-*` attributes on each item
  (year, venue, topics, award, member ids, a normalized search string).
- `explorer.ts` reads those attributes and shows/hides items in place — no re-rendering. It
  keeps filter state in the URL (`?q=&year=&venue=&topic=&award=&member=`), announces the
  result count via an `aria-live` region, hides empty year groups, and supports deep links and
  clear-all.
- Without JavaScript, the filter controls are hidden (`html:not(.js)`), and the full grouped
  list — which is already in the DOM — remains the experience.

The pure filtering/sorting/URL logic also lives in `src/lib/publications.ts` and is unit-tested
directly, decoupled from the DOM.

## Progressive enhancement & theming

- **Mobile nav** renders as a plain wrapped list without JS; with JS it collapses behind a
  keyboard-operable toggle (`Escape` closes, focus is managed).
- **Theme** is applied before first paint by an inline script (no flash), respects
  `prefers-color-scheme`, and persists an explicit choice to `localStorage`. Both themes are
  designed, not inverted.
- **Clipboard** copy buttons enhance visible, selectable text; without JS the text is still there.

## SEO & structured data

`BaseLayout` + `SEO.astro` emit unique titles, meta descriptions, canonical URLs, Open Graph
and Twitter cards, and JSON-LD: a site-wide `ResearchOrganization`, `ScholarlyArticle` +
Highwire `citation_*` tags on publication pages (for Google Scholar), `Person` on profiles, and
`CollectionPage` on index pages. `robots.txt` and `site.webmanifest` are generated from
`SITE`. `@astrojs/sitemap` produces the sitemap.

## Testing

- **Unit** (Vitest): publication filtering/sorting/URL round-trips, citation/BibTeX generation,
  people helpers.
- **E2E + a11y** (Playwright across Chromium, Firefox, WebKit, Pixel-5 mobile): route smoke +
  console-error checks, desktop & keyboard mobile nav, theme persistence, the full explorer
  (search, facets, URL sync, clear, empty state, no-JS fallback), software↔publication links,
  the 404 page, reduced-motion, no horizontal overflow at 360 px, and axe scans (WCAG 2.1 A/AA)
  on every primary page in both themes.
- **Static**: `astro check`, ESLint, Prettier, content-integrity validation, internal-link check.

## Build & CI

`.github/workflows/ci.yml` runs, with a frozen lockfile: format check → lint → content
validation → type check → unit tests → build → link check → Chromium e2e smoke.

## Notable decisions

- **Astro, not Next.js.** The site is content-driven and static; Astro's islands give
  near-zero JS without a full application framework. No requirement made Astro unsuitable.
- **No Tailwind, no component kit.** A small custom design system (CSS custom properties)
  keeps the site distinctive and the CSS legible; cards/buttons/nav are hand-built.
- **No MDX.** Long-form pages are authored directly in `.astro` for full layout control;
  Markdown bodies cover the prose that benefits from it. MDX can be added later if needed.
- **PDFs link out** to the PI's existing host rather than being re-hosted, to keep the repo
  light. This is the one runtime dependency on an external host and is flagged in
  `CONTENT_REVIEW.md`.
