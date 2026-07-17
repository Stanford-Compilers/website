/**
 * Pure, framework-free logic for the publication explorer: sorting, grouping,
 * search, faceted filtering, and URL <-> state serialization.
 *
 * Everything here is deterministic and dependency-free so it can be unit-tested
 * directly and shared between the server-rendered list and the client island.
 */

export interface PubAuthor {
  name: string;
  id?: string;
  url?: string;
}

/** Minimal shape the explorer logic needs (a subset of the content schema). */
export interface PubRecord {
  id: string;
  title: string;
  year: number;
  month?: number;
  order: number;
  authors: PubAuthor[];
  venueKey: string;
  status: 'published' | 'to-appear';
  award?: string;
  topics: string[];
  software: string[];
  featured: boolean;
}

export interface FilterState {
  /** Free-text query over title + author names. */
  q: string;
  years: number[];
  venues: string[];
  topics: string[];
  /** Only awarded papers. */
  award: boolean;
  /** A single lab-member author id, or null. */
  member: string | null;
}

export function emptyFilterState(): FilterState {
  return { q: '', years: [], venues: [], topics: [], award: false, member: null };
}

/* ----------------------------- sorting ----------------------------- */

/** Newest first: year desc, then month desc (unknown month last), then source order. */
export function sortPublications<T extends PubRecord>(pubs: readonly T[]): T[] {
  return [...pubs].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    const ma = a.month ?? 0;
    const mb = b.month ?? 0;
    if (ma !== mb) return mb - ma;
    return a.order - b.order;
  });
}

export interface YearGroup<T> {
  year: number;
  items: T[];
}

/** Group sorted publications by year, newest year first. */
export function groupByYear<T extends PubRecord>(pubs: readonly T[]): YearGroup<T>[] {
  const sorted = sortPublications(pubs);
  const groups: YearGroup<T>[] = [];
  for (const pub of sorted) {
    let group = groups[groups.length - 1];
    if (!group || group.year !== pub.year) {
      group = { year: pub.year, items: [] };
      groups.push(group);
    }
    group.items.push(pub);
  }
  return groups;
}

/* ----------------------------- search ------------------------------ */

const DIACRITICS = /[\u0300-\u036f]/g;
function normalize(s: string): string {
  // strip diacritics so "moreto" matches "Moretó"
  return s.toLowerCase().normalize('NFD').replace(DIACRITICS, '');
}

/** True if every whitespace-separated token of `q` appears in title or an author name. */
export function matchesSearch(pub: PubRecord, q: string): boolean {
  const query = q.trim();
  if (!query) return true;
  const haystack = normalize(`${pub.title} ${pub.authors.map((a) => a.name).join(' ')}`);
  return normalize(query)
    .split(/\s+/)
    .every((token) => haystack.includes(token));
}

/* --------------------------- filtering ----------------------------- */

export function matchesFilters(pub: PubRecord, state: FilterState): boolean {
  if (!matchesSearch(pub, state.q)) return false;
  if (state.years.length && !state.years.includes(pub.year)) return false;
  if (state.venues.length && !state.venues.includes(pub.venueKey)) return false;
  if (state.topics.length && !state.topics.some((t) => pub.topics.includes(t))) return false;
  if (state.award && !pub.award) return false;
  if (state.member && !pub.authors.some((a) => a.id === state.member)) return false;
  return true;
}

export function filterPublications<T extends PubRecord>(
  pubs: readonly T[],
  state: FilterState
): T[] {
  return pubs.filter((p) => matchesFilters(p, state));
}

/** Number of active filter dimensions (search counts as one). */
export function countActiveFilters(state: FilterState): number {
  let n = 0;
  if (state.q.trim()) n += 1;
  if (state.years.length) n += 1;
  if (state.venues.length) n += 1;
  if (state.topics.length) n += 1;
  if (state.award) n += 1;
  if (state.member) n += 1;
  return n;
}

export function isFilterActive(state: FilterState): boolean {
  return countActiveFilters(state) > 0;
}

/* ------------------------------ facets ----------------------------- */

export interface Facet<V = string> {
  value: V;
  count: number;
}

export function yearFacets(pubs: readonly PubRecord[]): Facet<number>[] {
  const counts = new Map<number, number>();
  for (const p of pubs) counts.set(p.year, (counts.get(p.year) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.value - a.value);
}

export function venueFacets(pubs: readonly PubRecord[]): Facet[] {
  const counts = new Map<string, number>();
  for (const p of pubs) counts.set(p.venueKey, (counts.get(p.venueKey) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function topicFacets(pubs: readonly PubRecord[]): Facet[] {
  const counts = new Map<string, number>();
  for (const p of pubs) for (const t of p.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** Lab members (author ids) that appear on at least one publication, with counts. */
export function memberFacets(pubs: readonly PubRecord[]): Facet[] {
  const counts = new Map<string, number>();
  for (const p of pubs) {
    const seen = new Set<string>();
    for (const a of p.authors) {
      if (a.id && !seen.has(a.id)) {
        seen.add(a.id);
        counts.set(a.id, (counts.get(a.id) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function awardCount(pubs: readonly PubRecord[]): number {
  return pubs.filter((p) => p.award).length;
}

/* -------------------- URL <-> state serialization ------------------ */

const CSV = (s: string): string[] =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/** Read filter state from URLSearchParams (or a query string). */
export function filterStateFromParams(params: URLSearchParams): FilterState {
  const state = emptyFilterState();
  state.q = params.get('q') ?? '';
  const year = params.get('year');
  if (year)
    state.years = CSV(year)
      .map(Number)
      .filter((n) => Number.isFinite(n));
  const venue = params.get('venue');
  if (venue) state.venues = CSV(venue);
  const topic = params.get('topic');
  if (topic) state.topics = CSV(topic);
  state.award = params.get('award') === '1';
  state.member = params.get('member') || null;
  return state;
}

/** Serialize state to URLSearchParams, omitting empty dimensions for clean URLs. */
export function filterStateToParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set('q', state.q.trim());
  if (state.years.length) params.set('year', [...state.years].sort((a, b) => b - a).join(','));
  if (state.venues.length) params.set('venue', state.venues.join(','));
  if (state.topics.length) params.set('topic', state.topics.join(','));
  if (state.award) params.set('award', '1');
  if (state.member) params.set('member', state.member);
  return params;
}

export function filterStateToQuery(state: FilterState): string {
  const params = filterStateToParams(state);
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** Toggle a value in a list dimension, returning a new array. */
export function toggleValue<V>(list: readonly V[], value: V): V[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
