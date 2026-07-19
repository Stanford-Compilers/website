/**
 * Citation formatting: human-readable author lists, a plain-text citation string,
 * and BibTeX generation. Pure and unit-testable.
 */
import { venueShort, venueFull, VENUES } from './taxonomy';
import type { PubAuthor, PubRecord } from './publications';

const MONTH_ABBR = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

const BIBTEX_FIELD_ORDER = [
  'author',
  'title',
  'journal',
  'booktitle',
  'year',
  'month',
  'volume',
  'number',
  'series',
  'articleno',
  'pages',
  'numpages',
  'publisher',
  'address',
  'isbn',
  'doi',
  'url',
  'keywords',
] as const;

const BIBTEX_FIELD_RANK = new Map<string, number>(
  BIBTEX_FIELD_ORDER.map((field, index) => [field, index])
);

/** "A, B, and C" — Oxford style. Optionally truncate with "et al.". */
export function formatAuthors(authors: readonly PubAuthor[], max = Infinity): string {
  const names = authors.map((a) => a.name);
  if (names.length > max) {
    return `${names.slice(0, max).join(', ')}, et al.`;
  }
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

function firstTitleWord(title: string): string {
  const word = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .find((w) => w.length > 2 && !['the', 'a', 'an', 'and', 'for', 'of', 'on'].includes(w));
  return word ?? 'paper';
}

/** Stable BibTeX cite key, e.g. "kjolstad2017tensor". */
export function bibtexKey(pub: PubRecord): string {
  const first = surname(pub.authors[0]?.name ?? 'anon')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${first}${pub.year}${firstTitleWord(pub.title)}`;
}

/** Plain-text citation for the "copy citation" action. */
export function citationString(pub: PubRecord): string {
  const authors = formatAuthors(pub.authors);
  const venue = venueShort(pub.venueKey);
  const tail = pub.status === 'to-appear' ? ` (to appear)` : '';
  return `${authors}. ${pub.title}. ${venue}, ${pub.year}${tail}.`;
}

interface BibtexLinks {
  doi?: string;
  pdf?: string;
  arxiv?: string;
}

function normalizeDoi(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  const doi = String(value)
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
  return doi || undefined;
}

function bibtexValue(field: string, value: string | number): string {
  let rendered = String(value);
  if (
    field.toLowerCase() === 'month' &&
    /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i.test(rendered)
  ) {
    return rendered.toLowerCase();
  }
  if (field.toLowerCase() === 'pages') {
    rendered = rendered.replace(/\s*[\u2013\u2014]\s*/g, '--').replace(/(?<=\w)-(?=\w)/g, '--');
  }
  return `{${rendered}}`;
}

function renderBibtex(type: string, key: string, fields: Record<string, string | number>): string {
  const entries = Object.entries(fields).sort(([a], [b]) => {
    const aRank = BIBTEX_FIELD_RANK.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bRank = BIBTEX_FIELD_RANK.get(b) ?? Number.MAX_SAFE_INTEGER;
    return aRank - bRank;
  });
  const width = Math.max(9, ...entries.map(([field]) => field.length));
  const body = entries
    .map(([field, value]) => `  ${field.padEnd(width)} = ${bibtexValue(field, value)}`)
    .join(',\n');
  return `@${type.toLowerCase()}{${key},\n${body}\n}`;
}

/** Produce normalized BibTeX with verified metadata and a Google-Scholar-style cite key. */
export function toBibtex(pub: PubRecord, links: BibtexLinks = {}): string {
  if (pub.bibtex) {
    const fields = { ...pub.bibtex.fields };
    const doi = normalizeDoi(fields.doi ?? links.doi);
    if (doi) {
      fields.doi = doi;
      fields.url = `https://doi.org/${doi}`;
    }
    return renderBibtex(pub.bibtex.type, bibtexKey(pub), fields);
  }

  const kind = VENUES[pub.venueKey]?.kind ?? 'conference';
  const type = kind === 'journal' ? 'article' : 'inproceedings';
  const containerField = kind === 'journal' ? 'journal' : 'booktitle';
  const fields: [string, string][] = [
    ['title', pub.title],
    ['author', pub.authors.map((a) => a.name).join(' and ')],
    [containerField, venueFull(pub.venueKey)],
    ['year', String(pub.year)],
  ];
  if (pub.month && pub.month >= 1 && pub.month <= 12) {
    fields.push(['month', MONTH_ABBR[pub.month - 1]]);
  }
  const doi = normalizeDoi(links.doi);
  if (doi) fields.push(['doi', doi]);
  if (doi) {
    fields.push(['url', `https://doi.org/${doi}`]);
  } else if (links.arxiv) {
    fields.push(['url', links.arxiv]);
  }

  return renderBibtex(type, bibtexKey(pub), Object.fromEntries(fields));
}
