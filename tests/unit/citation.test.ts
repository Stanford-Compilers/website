import { describe, it, expect } from 'vitest';
import { formatAuthors, bibtexKey, citationString, toBibtex } from '../../src/lib/citation';
import type { PubRecord } from '../../src/lib/publications';

function pub(p: Partial<PubRecord> & { id: string }): PubRecord {
  return {
    id: p.id,
    title: p.title ?? 'Untitled',
    year: p.year ?? 2020,
    month: p.month,
    order: 0,
    authors: p.authors ?? [{ name: 'Fredrik Kjolstad' }],
    venueKey: p.venueKey ?? 'pldi',
    status: p.status ?? 'published',
    award: p.award,
    topics: [],
    software: [],
    featured: false,
    bibtex: p.bibtex,
  };
}

describe('formatAuthors', () => {
  it('formats one, two, and three authors', () => {
    expect(formatAuthors([{ name: 'A' }])).toBe('A');
    expect(formatAuthors([{ name: 'A' }, { name: 'B' }])).toBe('A and B');
    expect(formatAuthors([{ name: 'A' }, { name: 'B' }, { name: 'C' }])).toBe('A, B, and C');
  });
  it('truncates with et al.', () => {
    expect(formatAuthors([{ name: 'A' }, { name: 'B' }, { name: 'C' }], 1)).toBe('A, et al.');
  });
});

describe('bibtexKey', () => {
  it('builds surname+year+firstword and skips stopwords', () => {
    const key = bibtexKey(
      pub({
        id: 'x',
        title: 'The Tensor Algebra Compiler',
        year: 2017,
        authors: [{ name: 'Fredrik Kjolstad' }],
      })
    );
    expect(key).toBe('kjolstad2017tensor');
  });
});

describe('citationString', () => {
  it('produces a readable citation', () => {
    const c = citationString(
      pub({
        id: 'x',
        title: 'DISTAL',
        year: 2022,
        venueKey: 'pldi',
        authors: [{ name: 'Rohan Yadav' }, { name: 'Fredrik Kjolstad' }],
      })
    );
    expect(c).toBe('Rohan Yadav and Fredrik Kjolstad. DISTAL. PLDI, 2022.');
  });
  it('marks to-appear papers', () => {
    const c = citationString(
      pub({ id: 'y', title: 'Deegen', year: 2026, venueKey: 'oopsla', status: 'to-appear' })
    );
    expect(c).toContain('(to appear)');
  });
});

describe('toBibtex', () => {
  it('uses @inproceedings for conferences', () => {
    const b = toBibtex(pub({ id: 'x', title: 'DISTAL', year: 2022, month: 6, venueKey: 'pldi' }));
    expect(b).toMatch(/^@inproceedings\{/);
    expect(b).toContain('booktitle');
    expect(b).toContain('month     = jun');
  });
  it('uses @article for journals', () => {
    const b = toBibtex(pub({ id: 'y', title: 'Simit', year: 2016, venueKey: 'tog' }));
    expect(b).toMatch(/^@article\{/);
    expect(b).toContain('journal');
  });
  it('normalizes the DOI and uses its canonical URL', () => {
    const b = toBibtex(pub({ id: 'z', title: 'TACO', year: 2017, venueKey: 'oopsla' }), {
      doi: 'https://doi.org/10.1145/3133901',
    });
    expect(b).toContain('doi       = {10.1145/3133901}');
    expect(b).toContain('url       = {https://doi.org/10.1145/3133901}');
  });
  it('escapes nothing weird and includes author with " and "', () => {
    const b = toBibtex(
      pub({ id: 'w', title: 'X', year: 2020, authors: [{ name: 'A B' }, { name: 'C D' }] })
    );
    expect(b).toContain('author    = {A B and C D}');
  });
  it('uses verified metadata while normalizing the generated entry', () => {
    const b = toBibtex(
      pub({
        id: 'shape',
        title: 'Compilation of Shape Operators on Sparse Arrays',
        year: 2024,
        month: 10,
        authors: [{ name: 'Alexander J Root' }, { name: 'Bobby Yan' }],
        bibtex: {
          type: 'article',
          fields: {
            author: 'Root, Alexander J and Yan, Bobby',
            title: 'Compilation of Shape Operators on Sparse Arrays',
            year: 2024,
            volume: 8,
            number: 'OOPSLA2',
            url: 'http://dx.doi.org/10.1145/3689752',
            doi: '10.1145/3689752',
            month: 'oct',
            articleno: 312,
            pages: '1162–1188',
            numpages: 27,
          },
        },
      })
    );
    expect(b).toMatch(/^@article\{root2024compilation,/);
    expect(b).toContain('author    = {Root, Alexander J and Yan, Bobby}');
    expect(b).toContain('month     = oct');
    expect(b).toContain('articleno = {312}');
    expect(b).toContain('pages     = {1162--1188}');
    expect(b).toContain('url       = {https://doi.org/10.1145/3689752}');
    expect(b).not.toContain('dx.doi.org');
  });
  it('never puts a self-hosted PDF URL in fallback BibTeX', () => {
    const b = toBibtex(pub({ id: 'pdf', title: 'Paper', year: 2020 }), {
      pdf: 'https://compilers.stanford.edu/publications/paper.pdf',
    });
    expect(b).not.toContain('compilers.stanford.edu');
  });
});
