/**
 * Publication explorer enhancement. Filters the server-rendered list in place
 * using data-* attributes on each item — no re-rendering, no framework. Keeps
 * filter state in the URL, announces the result count via aria-live, and hides
 * empty year groups. Without JS the complete grouped list is already present.
 */

interface State {
  q: string;
  years: string[];
  venues: string[];
  topics: string[];
  award: boolean;
  member: string;
}

const DIAC = /[\u0300-\u036f]/g;
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(DIAC, '');

export function setupExplorer(): void {
  const root = document.querySelector<HTMLElement>('[data-explorer]');
  if (!root || root.dataset.wired === '1') return;
  root.dataset.wired = '1';

  const form = root.querySelector<HTMLFormElement>('[data-filters]');
  const qInput = root.querySelector<HTMLInputElement>('[data-q]');
  const awardInput = root.querySelector<HTMLInputElement>('[data-award]');
  const memberSelect = root.querySelector<HTMLSelectElement>('[data-member]');
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-pub-item]'));
  const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-year-group]'));
  const countEl = root.querySelector<HTMLElement>('[data-count]');
  const emptyEl = root.querySelector<HTMLElement>('[data-empty]');
  const clearBtn = root.querySelector<HTMLElement>('[data-clear]');
  const clearBtn2 = root.querySelector<HTMLElement>('[data-clear-2]');
  const total = items.length;
  if (!form || !qInput) return;

  const checks = (facet: string) =>
    Array.from(form.querySelectorAll<HTMLInputElement>(`input[data-facet="${facet}"]`));

  function readState(): State {
    return {
      q: qInput!.value.trim(),
      years: checks('year')
        .filter((c) => c.checked)
        .map((c) => c.value),
      venues: checks('venue')
        .filter((c) => c.checked)
        .map((c) => c.value),
      topics: checks('topic')
        .filter((c) => c.checked)
        .map((c) => c.value),
      award: Boolean(awardInput?.checked),
      member: memberSelect?.value ?? '',
    };
  }

  function isActive(s: State): boolean {
    return Boolean(
      s.q || s.years.length || s.venues.length || s.topics.length || s.award || s.member
    );
  }

  function matches(item: HTMLElement, s: State, tokens: string[]): boolean {
    const d = item.dataset;
    if (s.years.length && !s.years.includes(d.year!)) return false;
    if (s.venues.length && !s.venues.includes(d.venue!)) return false;
    if (s.topics.length) {
      const t = (d.topics || '').split(' ');
      if (!s.topics.some((x) => t.includes(x))) return false;
    }
    if (s.award && d.award !== '1') return false;
    if (s.member && !(d.members || '').split(' ').includes(s.member)) return false;
    if (tokens.length) {
      const text = d.text || '';
      if (!tokens.every((tok) => text.includes(tok))) return false;
    }
    return true;
  }

  function syncUrl(s: State): void {
    const p = new URLSearchParams();
    if (s.q) p.set('q', s.q);
    if (s.years.length) p.set('year', [...s.years].sort((a, b) => Number(b) - Number(a)).join(','));
    if (s.venues.length) p.set('venue', s.venues.join(','));
    if (s.topics.length) p.set('topic', s.topics.join(','));
    if (s.award) p.set('award', '1');
    if (s.member) p.set('member', s.member);
    const qs = p.toString();
    const url = qs ? `${location.pathname}?${qs}` : location.pathname;
    history.replaceState(null, '', url);
  }

  function apply(): void {
    const s = readState();
    const tokens = s.q ? normalize(s.q).split(/\s+/).filter(Boolean) : [];
    let visible = 0;
    for (const item of items) {
      const show = matches(item, s, tokens);
      item.hidden = !show;
      if (show) visible++;
    }
    for (const g of groups) {
      const anyVisible = g.querySelector('[data-pub-item]:not([hidden])');
      g.hidden = !anyVisible;
    }
    const active = isActive(s);
    if (countEl) {
      countEl.textContent = active
        ? `Showing ${visible} of ${total} publications`
        : `${total} publications`;
    }
    if (emptyEl) emptyEl.hidden = visible !== 0;
    if (clearBtn) clearBtn.hidden = !active;
    syncUrl(s);
  }

  function applyFromUrl(): void {
    const p = new URLSearchParams(location.search);
    qInput!.value = p.get('q') ?? '';
    const setChecks = (facet: string, csv: string | null) => {
      const set = new Set((csv ?? '').split(',').filter(Boolean));
      let any = false;
      for (const c of checks(facet)) {
        c.checked = set.has(c.value);
        if (c.checked) any = true;
      }
      if (any) {
        const details = checks(facet)[0]?.closest('details');
        if (details) details.open = true;
      }
    };
    setChecks('year', p.get('year'));
    setChecks('venue', p.get('venue'));
    setChecks('topic', p.get('topic'));
    if (awardInput) awardInput.checked = p.get('award') === '1';
    if (memberSelect) memberSelect.value = p.get('member') ?? '';
    apply();
  }

  function clearAll(): void {
    qInput!.value = '';
    for (const facet of ['year', 'venue', 'topic'])
      checks(facet).forEach((c) => (c.checked = false));
    if (awardInput) awardInput.checked = false;
    if (memberSelect) memberSelect.value = '';
    apply();
    qInput!.focus();
  }

  let debounce: number | undefined;
  qInput.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(apply, 120);
  });
  form.addEventListener('change', apply);
  clearBtn?.addEventListener('click', clearAll);
  clearBtn2?.addEventListener('click', clearAll);

  applyFromUrl();
}
