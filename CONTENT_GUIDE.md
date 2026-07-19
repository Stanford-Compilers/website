# Content guide

How to edit the site's content. **You do not need to touch any components** — all content
lives in `src/content/` and `src/config/site.ts`, and everything is validated when the site
builds. After any change, run:

```bash
pnpm run validate:content   # fast cross-reference check
pnpm dev                    # preview at http://localhost:4321
```

Stable **ids** are filenames (for people/software) and the `id:` field (for publications).
Records are linked by id, never by display name — so you can rename a person freely as long
as their id (filename) stays the same, or you update the references.

---

## Add a person

Create `src/content/people/<first-last>.md`. The filename is the person's id.

```markdown
---
name: Ada Lovelace
role: PhD student
category: phd # pi | phd | member | alumni
website: https://example.com/ # optional
github: https://github.com/ada # optional
scholar: https://scholar.google.com/citations?user=... # optional
orcid: https://orcid.org/0000-... # optional
linkedin: https://linkedin.com/in/ada # optional
email: ada@stanford.edu # only if publicly listed & appropriate
coadvisors: # optional
  - name: Some Professor
interests: # optional; only real, verified interests
  - Sparse compilation
order: 100 # optional; lower sorts first, then by surname
---

Optional short biography goes here (Markdown). Leaving the body empty is fine —
the person still appears with a monogram placeholder and links.
```

A person gets a **detail page** (`/people/<id>`) only if they are the PI **or** have a
non-empty bio body; otherwise their name links to their external website. This is controlled
by `SITE.features.personDetailPages`.

To make an author's name in a publication byline link to their person record, use their id in
the publication's `authors` list (see below).

## Move a person to alumni

Edit their file: set `category: alumni`, optionally add a destination and drop the `order`.

```markdown
---
name: Ada Lovelace
role: PhD alum
category: alumni
website: https://example.com/
destination: Some Company # shown as "→ Some Company"
coadvisors:
  - name: Some Professor
---
```

## Add a publication

Add one entry to `src/content/publications.yaml`. Newest entries usually go at the top with
`order: 0` and existing orders bumped — but sorting is by year → month → order, so exact
ordering only matters to break ties within the same month.

```yaml
- id: pldi27-example                # stable, unique; becomes /publications/pldi27-example
  title: "An Example Compiler"
  year: 2027
  month: 6                          # optional (1–12)
  order: 0                          # lower = newer within a tie
  authors:
    - name: "Ada Lovelace"
      id: ada-lovelace              # link to a people record (byline links internally)
    - name: "External Coauthor"
      url: "https://coauthor.example"   # external author: keep their link
    - name: "Fredrik Kjolstad"
      id: fredrik-kjolstad
  venueKey: pldi                    # must exist in src/lib/taxonomy.ts VENUES
  venueDetail: "PACMPL vol. 11, PLDI"   # optional free text
  status: published                 # or: to-appear
  topics:                           # must be keys from TOPIC_KEYS (taxonomy.ts)
    - compiler-ir
  software:                         # optional; ids of related software records
    - taco
  links:
    pdf: "https://…/example.pdf"    # optional
    doi: "https://doi.org/10.1145/…"# optional
    code: "https://github.com/…"    # optional
    project: "https://…"            # optional
    video: "https://youtu.be/…"     # optional
  bibtex:                            # required; verify values against the publisher/DOI record
    type: article                    # article, inproceedings, etc.; omit the leading @
    fields:                          # renderer normalizes field order and formatting
      author: "Lovelace, Ada and Coauthor, External and Kjolstad, Fredrik"
      title: "An Example Compiler"
      year: 2027
      journal: "Proceedings of the ACM on Programming Languages"
      volume: 11
      number: "PLDI"
      url: "https://doi.org/10.1145/…"
      doi: "10.1145/…"
      month: jun                     # month macros render without braces
  featured: false                   # true → eligible for the homepage "selected work"
```

The site generates the BibTeX citation key in Google Scholar style and emits months as standard
lowercase BibTeX macros (`month = jun`). Use `Family, Given` author names and `--` in page
ranges. Keep the values faithful to the publisher or DOI record, but omit empty and redundant
exporter fields. If a DOI exists, set `url` to its canonical `https://doi.org/...` URL; never use
a lab-hosted PDF as the BibTeX `url`.

If you need a **new venue** or a **new research topic**, add it once to `src/lib/taxonomy.ts`
(`VENUES` or `TOPIC_KEYS` / `TOPICS`); it becomes available everywhere, including the filters.

## Add an award

Add an `award` line to the publication entry. Any non-empty string shows an award badge and
makes the paper appear under the "Award winners" filter.

```yaml
award: 'Distinguished Paper Award'
```

## Add or update software

Create/edit `src/content/software/<slug>.md`. The filename is the project id.

```markdown
---
name: 'Example: A New Compiler'
shortName: Example
summary: One factual sentence describing what it does.
category: sparse-compilation # see SOFTWARE_CATEGORY_KEYS in taxonomy.ts
status: Open source under the MIT license. # verified facts only — never "actively maintained" unless confirmed
problem: The problem it addresses, in plain language.
idea: The central research idea.
links:
  repo: https://github.com/org/example
  site: https://example.org
  docs: https://example.org/docs
  paper: https://doi.org/10.1145/…
people: # people ids
  - fredrik-kjolstad
relatedProjects: # software ids
  - taco
publications: # publication ids
  - oopsla17
tags: [C++, CUDA]
featured: true # appears on the homepage software grid
order: 1 # lower sorts first within its category
---

A longer narrative (Markdown) — typically "how it fits the group's work". Links like
[TACO](/software/taco) are encouraged.
```

## Change the lab name

Edit `SITE.name` / `SITE.shortName` (and `tagline`, `url` if needed) in `src/config/site.ts`.
That is the only place the name lives. If the wordmark text on the favicon/social card should
change too, run `pnpm run generate:assets`.

## Change the homepage featured items

- **Featured software:** set `featured: true` in the software file(s). The homepage shows up
  to six, ordered by each project's `order`.
- **Featured publications:** set `featured: true` on the publication entries. The homepage
  shows the five most recent featured papers.
- **People preview:** the homepage shows the PI plus the first five PhD students (by sort
  order). Adjust `order` on people to change who appears.

## Add a portrait

1. Copy the approved image into the person's content area, e.g.
   `src/content/people/portraits/ada-lovelace.jpg` (only use lab-provided/approved images;
   never scrape social media).
2. Reference it in the person's frontmatter:

```markdown
portrait: ./portraits/ada-lovelace.jpg
portraitAlt: Ada Lovelace
```

Astro optimizes and responsively sizes it. Without a portrait, the refined monogram
placeholder is used automatically.

## Validate content

```bash
pnpm run validate:content
```

Catches broken cross-references (a typo'd person/software/publication id, an unknown venue or
topic, a bad category) before they silently drop a link. The full Zod schema is also enforced
on every `pnpm run build` / `pnpm run check`.

## Preview the site locally

```bash
pnpm dev            # hot-reloading dev server
# or, to preview the exact production output:
pnpm run build && pnpm run preview
```

## Deploy a change

1. `pnpm run verify` (format, lint, content validation, types, unit tests, build, links).
2. Commit and push. The GitHub Actions workflow (`.github/workflows/ci.yml`) re-runs all
   checks plus Chromium e2e smoke tests.
3. On merge, your static host rebuilds from `pnpm run build` and publishes `dist/`
   (see [README → Deployment](./README.md#deployment)).
