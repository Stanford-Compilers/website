/**
 * One-time / manually-invoked legacy import.
 *
 *   pnpm exec tsx scripts/import-legacy-content.ts
 *
 * Parses the archived copy of the previous website (scripts/legacy/fredrikbk-home.html)
 * and regenerates src/content/publications.yaml. The production site does NOT depend on
 * fredrikbk.com at runtime — this script reads the committed local archive.
 *
 * Author order is preserved exactly as published. Structured metadata that is not present
 * in the source (venue keys, research topics, related software, DOIs, person links,
 * featured flags) is supplied by the curated CURATION table below and merged in. Existing
 * verified BibTeX and outbound links are preserved so a re-import cannot discard the audit.
 *
 * Re-run this whenever the archive is refreshed; then hand-review the diff.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const HTML = resolve(ROOT, 'scripts/legacy/fredrikbk-home.html');
const OUT = resolve(ROOT, 'src/content/publications.yaml');

/* -------------------------------------------------------------- *
 * Lab-member name → stable people-collection id.
 * When an author matches, we emit an internal `id` link and drop
 * the external url (their person page carries the outbound links).
 * -------------------------------------------------------------- */
const PERSON_IDS: Record<string, string> = {
  'Fredrik Kjolstad': 'fredrik-kjolstad',
  'James Dong': 'james-dong',
  'Christophe Gyurgyik': 'christophe-gyurgyik',
  'Scott Kovach': 'scott-kovach',
  'Rubens Lacouture': 'rubens-lacouture',
  'Katherine Mohr': 'katherine-mohr',
  'Sai Gautham Ravipati': 'sai-gautham-ravipati',
  'Alexander Root': 'alexander-root',
  'Alexander J Root': 'alexander-root',
  'Shiv Sundram': 'shiv-sundram',
  'Haoran Xu': 'haoran-xu',
  'Bobby Yan': 'bobby-yan',
  'Rohan Yadav': 'rohan-yadav',
  'Olivia Hsu': 'olivia-hsu',
  'Trevor Gale': 'trevor-gale',
};

type Curation = {
  venueKey: string;
  venueDetail?: string;
  topics: string[];
  software?: string[];
  doi?: string;
  arxiv?: string;
  featured?: boolean;
};

/** Keyed by publication slug (detail-page filename without extension). */
const CURATION: Record<string, Curation> = {
  pldi26relations: {
    venueKey: 'pldi',
    venueDetail: 'PACMPL vol. 10, PLDI',
    topics: ['relational', 'compiler-ir'],
  },
  pldi26bonsai: {
    venueKey: 'pldi',
    venueDetail: 'PACMPL vol. 10, PLDI',
    topics: ['relational', 'compiler-ir'],
    featured: true,
  },
  pldi26scion: {
    venueKey: 'pldi',
    venueDetail: 'PACMPL vol. 10, PLDI',
    topics: ['array-programming', 'compiler-ir'],
  },
  osdi26twill: { venueKey: 'osdi', topics: ['autoscheduling', 'compiler-ir'] },
  oopsla26deegen: {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 10, OOPSLA',
    topics: ['meta-compilation'],
    software: ['deegen'],
    doi: 'https://doi.org/10.1145/3798246',
    featured: true,
  },
  asplos2026fuseflow: {
    venueKey: 'asplos',
    topics: ['sparse-tensor-algebra', 'accelerators', 'compiler-ir'],
  },
  cgo26scorch: {
    venueKey: 'cgo',
    topics: ['autoscheduling', 'sparse-tensor-algebra'],
    software: ['scorch'],
    arxiv: 'https://arxiv.org/abs/2405.16883',
  },
  cgo26ember: { venueKey: 'cgo', topics: ['accelerators', 'compiler-ir'] },
  oopsla25: {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 9, OOPSLA',
    topics: ['recurrences', 'autoscheduling'],
    software: ['recuma'],
  },
  micro25: {
    venueKey: 'micro',
    topics: ['sparse-tensor-algebra', 'accelerators', 'autoscheduling'],
  },
  jssc25: { venueKey: 'jssc', topics: ['accelerators'] },
  ieeemicro24: { venueKey: 'ieeemicro', topics: ['accelerators', 'sparse-tensor-algebra'] },
  'asplos25-tracing': { venueKey: 'asplos', topics: ['distributed'] },
  'asplos25-fusion': { venueKey: 'asplos', topics: ['distributed'] },
  cgo25stardust: {
    venueKey: 'cgo',
    topics: ['sparse-tensor-algebra', 'accelerators'],
    software: ['sam'],
  },
  oopsla24recurrences: {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 8, OOPSLA',
    topics: ['recurrences', 'array-programming'],
    software: ['recuma'],
    doi: 'https://doi.org/10.1145/3649820',
  },
  oopsla24shapes: {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 8, OOPSLA',
    topics: ['array-programming', 'sparse-tensor-algebra'],
    doi: 'https://doi.org/10.1145/3689752',
  },
  oopsla24convolutions: {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 8, OOPSLA',
    topics: ['sparse-tensor-algebra', 'array-programming'],
  },
  isca24dam: {
    venueKey: 'isca',
    topics: ['accelerators', 'compiler-ir'],
    software: ['dam'],
    doi: 'https://doi.org/10.1109/ISCA59077.2024.00046',
    featured: true,
  },
  pldi24: {
    venueKey: 'pldi',
    venueDetail: 'PACMPL vol. 8, PLDI',
    topics: ['sparse-tensor-algebra', 'compiler-ir'],
    software: ['taco'],
  },
  vlsi24: { venueKey: 'vlsi', topics: ['accelerators'] },
  hpca24: { venueKey: 'hpca', topics: ['accelerators', 'dsl'] },
  'sc23-legate-sparse': {
    venueKey: 'sc',
    topics: ['distributed', 'sparse-tensor-algebra'],
    software: ['legate-sparse'],
    doi: 'https://doi.org/10.1145/3581784.3607033',
    featured: true,
  },
  'pldi23-etch': {
    venueKey: 'pldi',
    venueDetail: 'PACMPL vol. 7, PLDI',
    topics: ['compiler-ir', 'sparse-tensor-algebra', 'relational'],
    software: ['etch'],
    doi: 'https://doi.org/10.1145/3591268',
  },
  'pldi23-mosaic': {
    venueKey: 'pldi',
    venueDetail: 'PACMPL vol. 7, PLDI',
    topics: ['sparse-tensor-algebra', 'compiler-ir'],
    software: ['mosaic', 'taco'],
    doi: 'https://doi.org/10.1145/3591236',
    featured: true,
  },
  'asplos23-baco': { venueKey: 'asplos', topics: ['autoscheduling'] },
  'asplos23-sam': {
    venueKey: 'asplos',
    topics: ['accelerators', 'sparse-tensor-algebra', 'compiler-ir'],
    software: ['sam'],
    doi: 'https://doi.org/10.1145/3582016.3582051',
    featured: true,
  },
  cgo23: {
    venueKey: 'cgo',
    topics: ['compiler-ir', 'sparse-tensor-algebra'],
    software: ['looplets'],
    doi: 'https://doi.org/10.1145/3579990.3580020',
  },
  'taco23-ubuffer': { venueKey: 'taco', topics: ['accelerators'] },
  aha23: { venueKey: 'tecs', topics: ['accelerators'] },
  'sc22-spdistal': {
    venueKey: 'sc',
    topics: ['distributed', 'sparse-tensor-algebra'],
    software: ['distal'],
  },
  'taco22-mlir-sparse': {
    venueKey: 'taco',
    topics: ['sparse-tensor-algebra', 'compiler-ir'],
    software: ['taco'],
  },
  'pldi22-distal': {
    venueKey: 'pldi',
    topics: ['distributed', 'sparse-tensor-algebra'],
    software: ['distal'],
    doi: 'https://doi.org/10.1145/3519939.3523437',
    featured: true,
  },
  'pldi22-autoscheduling': {
    venueKey: 'pldi',
    topics: ['autoscheduling', 'sparse-tensor-algebra'],
    software: ['taco'],
  },
  'copy-and-patch': {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 5, OOPSLA',
    topics: ['meta-compilation'],
    software: ['copy-and-patch'],
    doi: 'https://doi.org/10.1145/3485513',
    featured: true,
  },
  oopsla21array: {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 5, OOPSLA',
    topics: ['array-programming', 'sparse-tensor-algebra'],
    software: ['taco'],
  },
  oopsla20: {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 4, OOPSLA',
    topics: ['sparse-tensor-algebra', 'autoscheduling', 'compiler-ir'],
    software: ['taco'],
  },
  aha20: { venueKey: 'dac', topics: ['accelerators', 'foundations'] },
  spaa20: {
    venueKey: 'spaa',
    venueDetail: 'brief announcement',
    topics: ['sparse-tensor-algebra'],
    software: ['taco'],
  },
  pldi20: {
    venueKey: 'pldi',
    topics: ['sparse-tensor-algebra', 'array-programming'],
    software: ['taco'],
  },
  cgo19: { venueKey: 'cgo', topics: ['sparse-tensor-algebra', 'compiler-ir'], software: ['taco'] },
  oopsla18: {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 2, OOPSLA',
    topics: ['sparse-tensor-algebra', 'array-programming'],
    software: ['taco'],
  },
  avancees18: {
    venueKey: 'avancees',
    venueDetail: 'Volume 12',
    topics: ['sparse-tensor-algebra'],
    software: ['taco'],
  },
  ase17: {
    venueKey: 'ase',
    venueDetail: 'tools paper',
    topics: ['sparse-tensor-algebra'],
    software: ['taco'],
  },
  oopsla17: {
    venueKey: 'oopsla',
    venueDetail: 'PACMPL vol. 1, OOPSLA',
    topics: ['sparse-tensor-algebra'],
    software: ['taco'],
    doi: 'https://doi.org/10.1145/3133901',
    featured: true,
  },
  tog16a: {
    venueKey: 'siggraph',
    venueDetail: 'presented at SIGGRAPH 2016',
    topics: ['dsl'],
    software: ['simit'],
    doi: 'https://doi.org/10.1145/2866569',
    featured: true,
  },
  tog16b: {
    venueKey: 'tog',
    venueDetail: 'perspective',
    topics: ['dsl', 'foundations'],
    software: ['simit'],
  },
  eurompi13: { venueKey: 'eurompi', topics: ['foundations', 'meta-compilation'] },
  ppopp12: { venueKey: 'ppopp', venueDetail: 'short paper', topics: ['foundations'] },
  icse11: { venueKey: 'icse', topics: ['foundations'] },
  cap10: { venueKey: 'workshop', venueDetail: 'SPLASH 2010 CAP workshop', topics: ['foundations'] },
  paraplop10: { venueKey: 'workshop', venueDetail: 'ParaPLoP 2010', topics: ['foundations'] },
};

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function clean(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/,\s*$/, '');
}

function absolutizePdf(href: string): string {
  if (/^https?:\/\//i.test(href)) return decodeEntities(href);
  const path = href.startsWith('/') ? href : `/${href}`;
  return `https://fredrikbk.com${path}`;
}

type ParsedAuthor = { name: string; id?: string; url?: string };

function parseAuthors(segment: string): ParsedAuthor[] {
  const authors: ParsedAuthor[] = [];
  const re = /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>|<font[^>]*>([\s\S]*?)<\/font>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(segment)) !== null) {
    const url = m[1] ? decodeEntities(m[1]) : undefined;
    const name = clean(m[2] ?? m[3] ?? '');
    if (!name || /^and$/i.test(name)) continue;
    const id = PERSON_IDS[name];
    if (id) authors.push({ name, id });
    else if (url) authors.push({ name, url });
    else authors.push({ name });
  }
  return authors;
}

function main() {
  const html = readFileSync(HTML, 'utf8');
  const existingRecords = parse(readFileSync(OUT, 'utf8')) as Array<Record<string, unknown>>;
  const existingById = new Map(existingRecords.map((record) => [record.id, record]));
  const start = html.indexOf('Publications</h2>');
  const tableStart = html.indexOf('<table', start);
  const tableEnd = html.indexOf('</table>', tableStart);
  const table = html.slice(tableStart, tableEnd);

  const rows = table.split(/<tr>/).slice(1);
  const records: Record<string, unknown>[] = [];
  const missing: string[] = [];

  rows.forEach((row, index) => {
    const titleMatch = row.match(/<b><a href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/b>/);
    if (!titleMatch) return;
    const href = titleMatch[1];
    const slug = href.replace(/\.html$/, '').replace(/\.md$/, '');
    const title = clean(titleMatch[2]);

    // Author segment: after the title </b> up to the first venue <i>.
    const afterTitle = row.slice(row.indexOf('</b>', titleMatch.index ?? 0) + 4);
    const venueIdx = afterTitle.indexOf('<i>');
    const authorSeg = afterTitle.slice(0, venueIdx);
    const authors = parseAuthors(authorSeg);

    // Venue + date: <i>VENUE</i>, [Month] Year
    const venueMatch = afterTitle.match(/<i>([\s\S]*?)<\/i>,\s*([A-Za-z]+)?\.?\s*(\d{4})/);
    const year = venueMatch ? Number(venueMatch[3]) : 0;
    const monthName = venueMatch?.[2]?.toLowerCase();
    const month = monthName ? MONTHS[monthName] : undefined;

    const award = (() => {
      const a = row.match(/<i><b>\s*([\s\S]*?)\s*<\/b><\/i>/);
      return a ? clean(a[1]) : undefined;
    })();
    const toAppear = /\(to appear\)/i.test(row);

    const pdf = row.match(/<a href="([^"]+)"><img[^>]*alt="pdf"/);
    const video = row.match(/<a href="([^"]+)"><img[^>]*alt="youtube"/);

    const cur = CURATION[slug];
    if (!cur) missing.push(slug);

    const previous = existingById.get(slug);
    const links: Record<string, string> = {
      ...((previous?.links as Record<string, string> | undefined) ?? {}),
    };
    if (pdf) links.pdf = absolutizePdf(pdf[1]);
    if (video) links.video = decodeEntities(video[1]);
    if (cur?.doi) links.doi = cur.doi;
    if (cur?.arxiv) links.arxiv = cur.arxiv;

    const record: Record<string, unknown> = {
      id: slug,
      title,
      year,
      ...(month ? { month } : {}),
      order: index,
      authors,
      venueKey: cur?.venueKey ?? 'workshop',
      ...(cur?.venueDetail ? { venueDetail: cur.venueDetail } : {}),
      status: toAppear ? 'to-appear' : 'published',
      ...(award ? { award } : {}),
      topics: cur?.topics ?? [],
      ...(cur?.software?.length ? { software: cur.software } : {}),
      links,
      ...(previous?.bibtex ? { bibtex: previous.bibtex } : {}),
      ...(cur?.featured ? { featured: true } : {}),
    };
    records.push(record);
  });

  writeFileSync(OUT, toYaml(records) + '\n', 'utf8');

  console.log(`Parsed ${records.length} publications → ${OUT}`);
  const linked = records.filter((r) => (r.authors as ParsedAuthor[]).some((a) => a.id)).length;
  console.log(`  ${linked} publications have at least one linked lab author.`);
  if (missing.length) {
    console.warn(`  WARNING: ${missing.length} slugs missing curation: ${missing.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log('  All publications have curated metadata.');
  }
}

/* -------------------------------------------------------------- *
 * Minimal, deterministic YAML emitter for the record shape above.
 * Emits block style; quotes every string to keep unicode/colons safe.
 * Returns an array of fully-indented lines.
 * -------------------------------------------------------------- */
function yamlString(s: string): string {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function scalar(v: unknown): string {
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return yamlString(String(v));
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Render an object's key/value lines at the given indent level. */
function renderObject(obj: Record<string, unknown>, indent: number): string[] {
  const pad = '  '.repeat(indent);
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      if (v.length === 0) lines.push(`${pad}${k}: []`);
      else {
        lines.push(`${pad}${k}:`);
        lines.push(...renderArray(v, indent + 1));
      }
    } else if (isPlainObject(v)) {
      if (Object.keys(v).length === 0) {
        lines.push(`${pad}${k}: {}`);
      } else {
        lines.push(`${pad}${k}:`);
        lines.push(...renderObject(v, indent + 1));
      }
    } else {
      lines.push(`${pad}${k}: ${scalar(v)}`);
    }
  }
  return lines;
}

/** Render an array's item lines at the given indent level. */
function renderArray(arr: unknown[], indent: number): string[] {
  const pad = '  '.repeat(indent);
  const lines: string[] = [];
  for (const item of arr) {
    if (isPlainObject(item)) {
      const block = renderObject(item, indent + 1);
      // Inline the first key after the "- " marker, keep the rest indented.
      const first = block[0].slice((indent + 1) * 2);
      lines.push(`${pad}- ${first}`);
      lines.push(...block.slice(1));
    } else {
      lines.push(`${pad}- ${scalar(item)}`);
    }
  }
  return lines;
}

function toYaml(records: Record<string, unknown>[]): string {
  return renderArray(records, 0).join('\n');
}

main();
