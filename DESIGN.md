# Design-system note

The visual concept is **"Computation, re-formed"** — the idea that one high-level computation
is transformed across source, intermediate representation, data layout, and machine. The
language is _editorial and technical_: warm paper, deep ink, a restrained Stanford cardinal,
and compiler motifs (brackets, coordinate ticks, sparse points, arrows). It is meant to read
as a serious research publication, not a startup landing page.

The system is implemented with **CSS custom properties** in `src/styles/` (no framework):
`tokens.css` (variables + theming), `base.css` (reset, elements, utilities, motifs),
`fonts.css`, `print.css`.

## Typography — three roles

| Role              | Face                          | Used for                                              |
| ----------------- | ----------------------------- | ----------------------------------------------------- |
| Editorial display | **Fraunces** (variable serif) | Major headings, hero, wordmark                        |
| Body & interface  | **IBM Plex Sans**             | Running text, UI, navigation                          |
| Technical         | **IBM Plex Mono**             | Years, venues, tags, kickers, code, coordinate labels |

Plex Sans + Plex Mono are a designed superfamily with an engineering heritage that suits a
compilers lab; Fraunces adds editorial character and warmth. All three are **self-hosted,
Latin-subset WOFF2** with `font-display: swap`; the two critical faces are preloaded. A fluid
type scale (`--step--2 … --step-6`) uses `clamp()` so sizes flow with the viewport.

## Colour

Semantic tokens, defined for light and dark:

- `--paper` / `--surface` — warm off-white paper (not pure white); deep warm charcoal in dark.
- `--ink` / `--ink-muted` / `--ink-subtle` — warm near-black text ramp.
- `--accent` — **Stanford cardinal** `#8C1515` (lightened for AA on dark). Used sparingly for
  links, active states, and the bracket/coordinate marks — never as a fill-everything brand wash.
- `--tech` — a cool slate/teal secondary accent reserved for the compiler/dataflow motifs
  (the hero pipeline, IR marks), used very sparingly.
- `--line*` — fine warm hairlines that do much of the compositional work.

Both themes are intentionally designed. Contrast targets WCAG AA for text and non-text; the
axe test suite scans both themes and passes with no serious/critical violations.

## Space, scale, shape

A spacing scale (`--space-3xs … --space-3xl`), restrained radii (2–10 px — editorial, not
pill-shaped), and low, warm shadows. Layout uses a strong grid with generous gutters
(`--gutter`, `--container*`), deliberate asymmetry, and a readable measure (`--measure`) for
prose. Wide content (BibTeX, tables) scrolls inside its own container so the page body never
scrolls horizontally.

## Signature motifs

- **Brackets** `[ … ]` — matrix/tensor brackets appear in the wordmark, kicker labels
  (`.kicker::before/::after`), monograms, and the 404 mark.
- **Coordinate ticks** — a faint repeating tick rule under page headers and the OG card.
- **Sparse points** — scattered "nonzeros" on an implied lattice (the wordmark, the hero's
  structure stage), evoking sparse data.
- **Arrows** `→` — transformation between stages.

## Wordmark

An original mark: a pair of matrix brackets enclosing a sparse coordinate pattern (a few
nonzeros). It reads at favicon size, avoids Stanford's protected seals, and is drawn as vector
so it stays crisp. `Wordmark.astro` renders it inline (brackets in `currentColor`, dots in
accent); `public/favicon.svg` is the standalone cardinal version; `scripts/generate-assets.ts`
rasterizes the favicons, apple-touch icon, and the 1200×630 social card from the same system.

## Key compositions

- **Hero pipeline** (`HeroPipeline.astro`) — four panels showing a tensor contraction
  transformed from source expression → iteration space → sparse coordinate structure →
  partitioned machine mapping. Built from SVG + CSS; it is a complete static composition, and
  its subtle staged pulse is disabled under reduced motion.
- **Transform stack** (`TransformStack.astro`) — the five-layer "abstractions → machines"
  research stack with a coordinate rail, used on the homepage and research page.

## Motion

Transitions use `transform`/`opacity` and are short. There is no scrolljacking, no
mouse-following, no autoplay, and no animation on every element. `prefers-reduced-motion`
disables the hero animation and page transitions globally and provides an equivalent static
experience. Optional Astro view transitions add continuity between pages and can be turned off
via `SITE.features.viewTransitions`.

## Focus & interaction

Every interactive element has a visible `:focus-visible` ring (`--focus`, cardinal), with
`forced-colors` handling for high-contrast modes. Hover and active states are subtle. Touch
targets meet a comfortable minimum size. Custom controls (the filter checkboxes, disclosures)
are built on native elements so keyboard and screen-reader behaviour comes for free.
