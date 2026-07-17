# Content review

Items on this page were **migrated from verified sources** or are **safe, reversible
placeholders**. Each one should be confirmed, corrected, or approved by the PI or a lab
member before the site is treated as final. Nothing here blocks the site from building,
running, or deploying — these are factual/wording confirmations.

Legend: 🟥 decide before public launch · 🟧 confirm when convenient · 🟩 optional enrichment

---

## 1. Identity & placeholders

| #   | Item                                                                                                                   | Where                                            | Action                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟧  | **Mailing address** uses the standard Stanford CS address (353 Jane Stanford Way)                                      | `src/config/site.ts` → `SITE.contact.mailing`    | Confirm it is the address the group wants shown.                                                                                              |
| 🟩  | **Tagline** "Languages and compilers across data forms and machines." is the temporary tagline supplied for this build | `src/config/site.ts` → `SITE.tagline`            | Approve or replace.                                                                                                                           |

## 2. People — portraits, bios, interests

- 🟥 **Portraits:** No portraits are included. Every person uses a generated monogram
  placeholder (deliberately not photo-like). Portraits were **not** scraped. To add
  approved portraits, see `CONTENT_GUIDE.md`.
- 🟧 **PI bio** (`src/content/people/fredrik-kjolstad.md`): written conservatively from the
  current site's own group description and the public title. The PI should review/approve
  the wording.
- 🟩 **Student & alumni bios:** intentionally omitted (not invented). Add per person if
  desired.
- 🟩 **Research interests:** intentionally omitted for individuals (the brief forbids
  inferring interests from publication titles). Add real interests per person if desired.
- 🟧 **Inferred GitHub handles:** `haoran-xu` → `github.com/sillycross` and `olivia-hsu` →
  `github.com/weiya711` were inferred from their `*.github.io` sites. Confirm or remove.
- 🟧 **Alumni destinations** (Rohan Yadav → Anthropic; Olivia Hsu → Assistant Professor,
  CMU; Trevor Gale → Google DeepMind) were migrated from the current site. Confirm current.
- 🟩 **Co-advisors** are shown by name only (no links). Optionally add links.
- 🟩 **Graduation / start years** are not listed (absent from the source). Add if desired.

## 3. Join page — statements needing PI confirmation

The Join page was written to be conservative and to **avoid promising anything**. Please
confirm these reflect the PI's actual preferences (`src/pages/join.astro`):

- 🟥 Whether prospective PhD students should email before applying (current copy:
  apply through the official process; an individual reply "cannot be guaranteed").
- 🟧 Undergraduate project availability (current copy: "varies").
- 🟧 Remote internships (current copy: "no standing remote-internship program") — this is a
  mild factual claim; confirm it is accurate.
- 🟧 Postdoc openings (current copy: cannot confirm availability here — safe).
- 🟧 The "Please include" contact checklist — confirm it matches how the PI wants to be
  contacted.
- 🟩 Contact method: a plain `mailto:` link is used instead of a form (no backend). Confirm
  this is acceptable.

## 4. Software — status & links to verify

All statuses avoid claiming a project is "actively maintained." Status notes reflect only
facts observed during the verification pass on **2026-07-16**; re-verify if time has passed.

- 🟧 **TACO** (`taco.md`): the project site `https://tensor-compiler.org` presented a TLS
  certificate mismatch (a GitHub Pages cert) on 2026-07-16, which can trigger a browser
  warning. The GitHub repo link is unaffected. Verify the cert before relying on the site link.
- 🟧 **RECUMA** (`recuma.md`): no public source-code repository was found (only a Zenodo
  artifact), so no repo link is shown. Confirm, or supply a repo.
- 🟧 **Scorch** (`scorch.md`): repo `github.com/bobbyyyan/scorch` had no license file and is
  an early prototype. Confirm the repo URL and add a license note if appropriate.
- 🟧 **Deegen** (`deegen.md`): lives inside the `luajit-remake/luajit-remake` repo (no
  dedicated repo). Confirm.
- 🟧 **DISTAL** (`distal.md`): code is on the `DISTAL` branch of `rohany/taco`. Confirm this
  is the canonical link.
- 🟩 Longer narratives / "problem" / "idea" fields are factual summaries of published work;
  the authors should skim for accuracy.

## 5. Publications — metadata gaps

- 🟧 **PDF hosting:** every PDF link points to `https://fredrikbk.com/publications/*.pdf`
  (the PI's current site). If that site is retired, links break. Decide whether to keep
  linking there or self-host the PDFs in this repo.
- 🟩 **Missing PDFs/DOIs:** three papers have no PDF on the source and therefore no PDF link
  — `jssc25` (Onyx, JSSC 2025), `ieeemicro24` (IEEE Micro 2025), `vlsi24` (Onyx, VLSI 2024).
  Add PDFs/DOIs if available.
- 🟩 **DOIs:** DOIs were added for the ~14 papers confirmed during verification; others have
  only PDF links. Add more DOIs when convenient (`src/content/publications.yaml`).
- 🟩 **`avancees18`** "PDF" link is a Google Scholar cluster link (as on the source), not a
  direct PDF. Confirm.
- 🟩 **Abstracts:** none are included (not invented). Add if desired.
- 🟩 **Video links** point to `youtu.be`; confirm they remain valid.

## 6. Copy requiring PI approval (tone/claims)

These are conservative and grounded in the group's public work, but should be read by the PI:

- 🟧 Homepage hero + "research threads" (`src/pages/index.astro`).
- 🟧 Research narrative, incl. the "How we work" / methodology paragraph
  (`src/pages/research.astro`). It describes observable practice (systems + artifacts +
  collaborations) and claims no unverified culture or values.
- 🟧 About-page mission (`src/pages/about.astro`).

---

### How these were verified

- People, publications, and all links were migrated from the archived copy of
  `https://fredrikbk.com/` (`scripts/legacy/fredrikbk-home.html`, committed).
- Software repos, sites, docs, and statuses were verified against official project sites,
  GitHub, and papers on 2026-07-16 (`scripts/legacy/software-verification.json`, committed).
- Referential integrity is enforced on every build by `pnpm run validate:content`.
