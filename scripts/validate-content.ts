/**
 * Content integrity validator (runs independently of the Astro build).
 *
 *   pnpm run validate:content
 *
 * Checks referential integrity across collections — every cross-reference (author
 * -> person, publication -> software, software -> people/publications/projects),
 * every venue key and topic, and category enums — so a typo in an id is caught
 * before it silently drops a link. Astro's schema validation covers shapes; this
 * covers the relationships between records.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import { parse } from 'yaml';
import {
  VENUES,
  TOPIC_KEYS,
  SOFTWARE_CATEGORY_KEYS,
  PEOPLE_CATEGORY_KEYS,
} from '../src/lib/taxonomy';
import { SITE } from '../src/config/site';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT = resolve(ROOT, 'src/content');

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

function bareDoi(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').trim() || undefined;
}

function readFrontmatter(file: string): Record<string, unknown> {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) {
    err(`${basename(file)}: missing frontmatter`);
    return {};
  }
  return (parse(m[1]) ?? {}) as Record<string, unknown>;
}

function mdFiles(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith('.md'));
}

// --- Load collections ---------------------------------------------------
const peopleFiles = mdFiles(resolve(CONTENT, 'people'));
const people = peopleFiles.map((f) => ({
  id: f.replace(/\.md$/, ''),
  data: readFrontmatter(resolve(CONTENT, 'people', f)),
}));
const personIds = new Set(people.map((p) => p.id));

const softwareFiles = mdFiles(resolve(CONTENT, 'software'));
const software = softwareFiles.map((f) => ({
  id: f.replace(/\.md$/, ''),
  data: readFrontmatter(resolve(CONTENT, 'software', f)),
}));
const softwareIds = new Set(software.map((s) => s.id));

const pubs = parse(readFileSync(resolve(CONTENT, 'publications.yaml'), 'utf8')) as Array<
  Record<string, any>
>;
const pubIds = new Set(pubs.map((p) => p.id));

const topicSet = new Set<string>(TOPIC_KEYS);
const venueSet = new Set(Object.keys(VENUES));
const swCatSet = new Set<string>(SOFTWARE_CATEGORY_KEYS);
const peopleCatSet = new Set<string>(PEOPLE_CATEGORY_KEYS);

// --- People -------------------------------------------------------------
for (const p of people) {
  const cat = p.data.category as string;
  if (!peopleCatSet.has(cat)) err(`people/${p.id}: invalid category "${cat}"`);
  if (!p.data.name) err(`people/${p.id}: missing name`);
}
if (!personIds.has(SITE.pi.personId))
  err(`site.ts pi.personId "${SITE.pi.personId}" has no matching people record`);

// --- Software -----------------------------------------------------------
for (const s of software) {
  const d = s.data;
  if (!swCatSet.has(d.category as string))
    err(`software/${s.id}: invalid category "${d.category}"`);
  for (const ref of (d.people as Array<string | { id: string }>) ?? []) {
    const id = typeof ref === 'string' ? ref : ref?.id;
    if (id && !personIds.has(id)) err(`software/${s.id}: people ref "${id}" not found`);
  }
  for (const id of (d.relatedProjects as string[]) ?? []) {
    if (!softwareIds.has(id)) err(`software/${s.id}: relatedProjects "${id}" not found`);
  }
  for (const id of (d.publications as string[]) ?? []) {
    if (!pubIds.has(id)) err(`software/${s.id}: publications "${id}" not found`);
  }
  if (!d.summary) err(`software/${s.id}: missing summary`);
}

// --- Publications -------------------------------------------------------
const seen = new Set<string>();
for (const pub of pubs) {
  if (seen.has(pub.id)) err(`publications: duplicate id "${pub.id}"`);
  seen.add(pub.id);
  if (!venueSet.has(pub.venueKey)) err(`pub ${pub.id}: unknown venueKey "${pub.venueKey}"`);
  for (const t of pub.topics ?? []) {
    if (!topicSet.has(t)) err(`pub ${pub.id}: unknown topic "${t}"`);
  }
  for (const id of pub.software ?? []) {
    if (!softwareIds.has(id)) err(`pub ${pub.id}: software ref "${id}" not found`);
  }
  for (const a of pub.authors ?? []) {
    if (a.id && !personIds.has(a.id)) err(`pub ${pub.id}: author id "${a.id}" not found`);
  }
  const bibtex = pub.bibtex as
    { type?: string; fields?: Record<string, string | number> } | undefined;
  if (!bibtex?.type || !bibtex.fields) {
    err(`pub ${pub.id}: missing normalized BibTeX metadata`);
  } else {
    if (bibtex.type !== bibtex.type.toLowerCase()) {
      err(`pub ${pub.id}: BibTeX type must be lowercase`);
    }
    for (const field of Object.keys(bibtex.fields)) {
      if (field !== field.toLowerCase())
        err(`pub ${pub.id}: BibTeX field "${field}" must be lowercase`);
    }
    for (const field of ['author', 'title', 'year']) {
      if (bibtex.fields[field] === undefined) err(`pub ${pub.id}: BibTeX missing ${field}`);
    }
    if (Number(bibtex.fields.year) !== pub.year) {
      err(`pub ${pub.id}: BibTeX year does not match publication year`);
    }
    if (String(bibtex.fields.title ?? '').replace(/[{}]/g, '') !== pub.title) {
      err(`pub ${pub.id}: BibTeX title does not match publication title`);
    }
    const containerField = bibtex.type === 'article' ? 'journal' : 'booktitle';
    if (bibtex.fields[containerField] === undefined) {
      err(`pub ${pub.id}: BibTeX ${bibtex.type} missing ${containerField}`);
    }
    if (
      bibtex.fields.month !== undefined &&
      !/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/.test(String(bibtex.fields.month))
    ) {
      err(`pub ${pub.id}: BibTeX month must be a lowercase month macro`);
    }
    if (
      pub.month !== undefined &&
      bibtex.fields.month !== undefined &&
      bibtex.fields.month !==
        ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][
          pub.month - 1
        ]
    ) {
      err(`pub ${pub.id}: BibTeX month does not match publication month`);
    }
    const linkDoi = bareDoi(pub.links?.doi);
    const bibDoi = bareDoi(bibtex.fields.doi);
    if (linkDoi && bibDoi !== linkDoi) {
      err(`pub ${pub.id}: BibTeX DOI does not match links.doi`);
    }
    if (bibDoi && bibtex.fields.url !== `https://doi.org/${bibDoi}`) {
      err(`pub ${pub.id}: BibTeX URL must be https://doi.org/${bibDoi}`);
    }
    const bibUrl = String(bibtex.fields.url ?? '');
    if (/^(?:https?:\/\/[^/]+)?\/publications\/.*\.pdf(?:$|[?#])/i.test(bibUrl)) {
      err(`pub ${pub.id}: BibTeX must not use a self-hosted PDF URL`);
    }
  }
  if (!pub.topics || pub.topics.length === 0) warn(`pub ${pub.id}: no topics assigned`);
}

// --- Report -------------------------------------------------------------
console.log(
  `Validated ${people.length} people, ${software.length} software, ${pubs.length} publications.`
);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\n✓ All cross-references valid.');
