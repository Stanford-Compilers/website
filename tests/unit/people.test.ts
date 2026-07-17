import { describe, it, expect } from 'vitest';
import { surname, initials, monogramHue, sortPeople } from '../../src/lib/people';

describe('surname', () => {
  it('returns the last name token', () => {
    expect(surname('James Dong')).toBe('Dong');
    expect(surname('Sai Gautham Ravipati')).toBe('Ravipati');
    expect(surname('Cher')).toBe('Cher');
  });
});

describe('initials', () => {
  it('builds up to two letters', () => {
    expect(initials('Fredrik Kjolstad')).toBe('FK');
    expect(initials('Bobby Yan')).toBe('BY');
    expect(initials('Cher')).toBe('CH');
    expect(initials('')).toBe('?');
  });
});

describe('monogramHue', () => {
  it('is deterministic and within range', () => {
    const h = monogramHue('Olivia Hsu');
    expect(h).toBe(monogramHue('Olivia Hsu'));
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });
  it('differs across names', () => {
    expect(monogramHue('James Dong')).not.toBe(monogramHue('Scott Kovach'));
  });
});

describe('sortPeople', () => {
  it('sorts by order then surname', () => {
    const people = [
      { name: 'Bobby Yan', order: 100 },
      { name: 'James Dong', order: 100 },
      { name: 'Fredrik Kjolstad', order: 0 },
    ];
    expect(sortPeople(people).map((p) => p.name)).toEqual([
      'Fredrik Kjolstad',
      'James Dong',
      'Bobby Yan',
    ]);
  });
});
