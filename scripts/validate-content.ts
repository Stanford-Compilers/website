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
