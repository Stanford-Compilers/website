import { describe, it, expect } from 'vitest';
import {
  sortPublications,
  groupByYear,
  matchesSearch,
  matchesFilters,
  filterPublications,
  countActiveFilters,
  emptyFilterState,
  yearFacets,
  venueFacets,
  topicFacets,
  memberFacets,
  awardCount,
  filterStateFromParams,
  filterStateToParams,
  filterStateToQuery,
  toggleValue,
  type PubRecord,
} from '../../src/lib/publications';

function pub(p: Partial<PubRecord> & { id: string }): PubRecord {
  return {
    id: p.id,
    title: p.title ?? 'Untitled',
    year: p.year ?? 2020,
    month: p.month,
    order: p.order ?? 0,
    authors: p.authors ?? [{ name: 'Fredrik Kjolstad', id: 'fredrik-kjolstad' }],
    venueKey: p.venueKey ?? 'pldi',
    status: p.status ?? 'published',
    award: p.award,
    topics: p.topics ?? [],
    software: p.software ?? [],
    featured: p.featured ?? false,
  };
}

const sample: PubRecord[] = [
  pub({
    id: 'a',
    title: 'Sparse Tensor Algebra',
    year: 2024,
    month: 10,
    order: 2,
    venueKey: 'oopsla',
    topics: ['sparse-tensor-algebra'],
    authors: [
      { name: 'Olivia Hsu', id: 'olivia-hsu' },
      { name: 'Fredrik Kjolstad', id: 'fredrik-kjolstad' },
    ],
  }),
  pub({
    id: 'b',
    title: 'Distributed Compilation',
    year: 2024,
    month: 10,
    order: 1,
    venueKey: 'pldi',
    topics: ['distributed'],
    award: 'Distinguished Paper Award',
  }),
  pub({
    id: 'c',
    title: 'The Moretó Machine',
    year: 2026,
    month: 6,
    order: 0,
    venueKey: 'pldi',
    topics: ['accelerators'],
    authors: [{ name: 'Miquel Moretó Planas' }],
  }),
  pub({ id: 'd', title: 'Old Work', year: 2011, order: 5, venueKey: 'icse', status: 'published' }),
];

describe('sortPublications', () => {
  it('sorts newest first by year, then month, then order', () => {
    const ids = sortPublications(sample).map((p) => p.id);
    expect(ids).toEqual(['c', 'b', 'a', 'd']);
  });
  it('does not mutate the input', () => {
    const copy = [...sample];
    sortPublications(sample);
    expect(sample).toEqual(copy);
  });
  it('breaks year+month ties by source order', () => {
    // a (order 2) and b (order 1) share 2024/10 -> b before a
    const ids = sortPublications([sample[0], sample[1]]).map((p) => p.id);
    expect(ids).toEqual(['b', 'a']);
  });
});

describe('groupByYear', () => {
  it('groups into descending years', () => {
    const groups = groupByYear(sample);
    expect(groups.map((g) => g.year)).toEqual([2026, 2024, 2011]);
    expect(groups[1].items.map((p) => p.id)).toEqual(['b', 'a']);
  });
});

describe('matchesSearch', () => {
  it('matches title tokens case-insensitively', () => {
    expect(matchesSearch(sample[0], 'sparse tensor')).toBe(true);
    expect(matchesSearch(sample[0], 'SPARSE algebra')).toBe(true);
  });
  it('matches author names', () => {
    expect(matchesSearch(sample[0], 'hsu')).toBe(true);
  });
  it('requires all tokens (AND)', () => {
    expect(matchesSearch(sample[0], 'sparse distributed')).toBe(false);
  });
  it('is diacritic-insensitive', () => {
    expect(matchesSearch(sample[2], 'moreto')).toBe(true);
    expect(matchesSearch(sample[2], 'Moretó')).toBe(true);
  });
  it('empty query matches everything', () => {
    expect(matchesSearch(sample[3], '   ')).toBe(true);
  });
});

describe('matchesFilters', () => {
  const base = emptyFilterState();
  it('filters by year (OR within, AND across)', () => {
    expect(matchesFilters(sample[0], { ...base, years: [2024] })).toBe(true);
    expect(matchesFilters(sample[0], { ...base, years: [2026] })).toBe(false);
  });
  it('filters by venue', () => {
    expect(matchesFilters(sample[1], { ...base, venues: ['pldi'] })).toBe(true);
    expect(matchesFilters(sample[0], { ...base, venues: ['pldi'] })).toBe(false);
  });
  it('filters by topic (any overlap)', () => {
    expect(
      matchesFilters(sample[0], { ...base, topics: ['sparse-tensor-algebra', 'distributed'] })
    ).toBe(true);
    expect(matchesFilters(sample[0], { ...base, topics: ['accelerators'] })).toBe(false);
  });
  it('filters by award', () => {
    expect(matchesFilters(sample[1], { ...base, award: true })).toBe(true);
    expect(matchesFilters(sample[0], { ...base, award: true })).toBe(false);
  });
  it('filters by member', () => {
    expect(matchesFilters(sample[0], { ...base, member: 'olivia-hsu' })).toBe(true);
    expect(matchesFilters(sample[1], { ...base, member: 'olivia-hsu' })).toBe(false);
  });
  it('combines dimensions with AND', () => {
    const state = { ...base, years: [2024], venues: ['oopsla'], member: 'olivia-hsu' };
    expect(filterPublications(sample, state).map((p) => p.id)).toEqual(['a']);
  });
});

describe('facets', () => {
  it('counts years descending', () => {
    expect(yearFacets(sample)).toEqual([
      { value: 2026, count: 1 },
      { value: 2024, count: 2 },
      { value: 2011, count: 1 },
    ]);
  });
  it('counts venues by frequency', () => {
    const v = venueFacets(sample);
    expect(v[0]).toEqual({ value: 'pldi', count: 2 });
  });
  it('counts topics', () => {
    expect(
      topicFacets(sample)
        .map((t) => t.value)
        .sort()
    ).toEqual(['accelerators', 'distributed', 'sparse-tensor-algebra']);
  });
  it('counts distinct member appearances', () => {
    const m = memberFacets(sample);
    const fk = m.find((x) => x.value === 'fredrik-kjolstad');
    expect(fk?.count).toBe(3); // a, b, d
  });
  it('counts awards', () => {
    expect(awardCount(sample)).toBe(1);
  });
});

describe('countActiveFilters', () => {
  it('counts each active dimension', () => {
    expect(countActiveFilters(emptyFilterState())).toBe(0);
    // q + years + topics + award + member = 5 (venues empty)
    expect(
      countActiveFilters({
        q: 'x',
        years: [2024],
        venues: [],
        topics: ['a'],
        award: true,
        member: 'm',
      })
    ).toBe(5);
  });
});

describe('URL state serialization', () => {
  it('round-trips through params', () => {
    const state = {
      q: 'tensor algebra',
      years: [2024, 2026],
      venues: ['pldi'],
      topics: ['distributed'],
      award: true,
      member: 'olivia-hsu',
    };
    const restored = filterStateFromParams(filterStateToParams(state));
    expect(restored.q).toBe('tensor algebra');
    expect(restored.years.sort()).toEqual([2024, 2026]);
    expect(restored.venues).toEqual(['pldi']);
    expect(restored.topics).toEqual(['distributed']);
    expect(restored.award).toBe(true);
    expect(restored.member).toBe('olivia-hsu');
  });
  it('omits empty dimensions for clean URLs', () => {
    expect(filterStateToQuery(emptyFilterState())).toBe('');
    expect(filterStateToQuery({ ...emptyFilterState(), award: true })).toBe('?award=1');
  });
  it('parses a real query string', () => {
    const s = filterStateFromParams(
      new URLSearchParams('year=2024,2023&topic=distributed&member=x')
    );
    expect(s.years).toEqual([2024, 2023]);
    expect(s.topics).toEqual(['distributed']);
    expect(s.member).toBe('x');
    expect(s.award).toBe(false);
  });
});

describe('toggleValue', () => {
  it('adds and removes', () => {
    expect(toggleValue([1, 2], 3)).toEqual([1, 2, 3]);
    expect(toggleValue([1, 2, 3], 2)).toEqual([1, 3]);
  });
});
