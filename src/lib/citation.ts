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

/** Produce a BibTeX entry. Journals -> @article, everything else -> @inproceedings. */
export function toBibtex(pub: PubRecord, links: BibtexLinks = {}): string {
  const kind = VENUES[pub.venueKey]?.kind ?? 'conference';
  const type = kind === 'journal' ? 'article' : 'inproceedings';
  const containerField = kind === 'journal' ? 'journal' : 'booktitle';
  const fields: [string, string][] = [
    ['title', `{${pub.title}}`],
    ['author', pub.authors.map((a) => a.name).join(' and ')],
    [containerField, `{${venueFull(pub.venueKey)}}`],
    ['year', String(pub.year)],
  ];
  if (pub.month && pub.month >= 1 && pub.month <= 12) {
    fields.push(['month', MONTH_ABBR[pub.month - 1]]);
  }
  const doi = links.doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  if (doi) fields.push(['doi', doi]);
  const url = links.arxiv ?? links.pdf;
  if (url && /^https?:\/\//.test(url)) fields.push(['url', url]);

  const body = fields
    .map(([k, v]) => `  ${k.padEnd(9)} = {${v.replace(/^\{|\}$/g, '')}}`)
    .join(',\n');
  return `@${type}{${bibtexKey(pub)},\n${body}\n}`;
}
