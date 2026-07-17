/**
 * Publication explorer enhancement for the ledger layout. Filters the
 * server-rendered list in place using data-* attributes on each row — no
 * re-rendering, no framework. Keeps filter state in the URL, announces the
 * result count via aria-live, and hides empty year groups. Without JS the
 * complete grouped list is already present and the toolbar is hidden.
 *
 * The toolbar's Year / Venue / Topic filters are multi-select checkbox
 * dropdowns and "Awards" is a toggle. Authors are filtered from the search box
 * itself: typing surfaces matching lab members in an autocomplete popup, and
 * picking one adds a removable chip to the active-filters row. Multiple authors
 * combine with AND (papers co-authored by all of them), and every byline bolds
 * the authors currently being filtered by. Each ledger row's BibTeX / Cite
 * disclosures are wired here too.
 */

interface State {
  q: string;
  years: string[];
  venues: string[];
  topics: string[];
  award: boolean;
  authors: string[];
}

/** A searchable lab-member author, injected as JSON by the component. */
interface Author {
  id: string;
  name: string;
  count: number;
  norm: string;
  words: string[];
}

const DIAC = /[\u0300-\u036f]/g;
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(DIAC, '');

// Close glyph for an author chip; static markup, so innerHTML is safe.
const X_SVG =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

export function setupExplorer(): void {
  const root = document.querySelector<HTMLElement>('[data-explorer]');
  if (!root || root.dataset.wired === '1') return;
  root.dataset.wired = '1';

  const form = root.querySelector<HTMLFormElement>('[data-filters]');
  const qInput = root.querySelector<HTMLInputElement>('[data-q]');
  const suggestEl = root.querySelector<HTMLElement>('[data-suggest]');
  const tagsEl = root.querySelector<HTMLElement>('[data-author-tags]');
  const activeRow = root.querySelector<HTMLElement>('[data-active-filters]');
  const awardChip = root.querySelector<HTMLButtonElement>('[data-award-chip]');
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-pub-item]'));
  const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-year-group]'));
  const bylineAuthors = Array.from(root.querySelectorAll<HTMLElement>('[data-author-id]'));
  const countEl = root.querySelector<HTMLElement>('[data-count]');
  const emptyEl = root.querySelector<HTMLElement>('[data-empty]');
  const clearBtn = root.querySelector<HTMLElement>('[data-clear]');
  const clearBtn2 = root.querySelector<HTMLElement>('[data-clear-2]');
  const list = root.querySelector<HTMLElement>('[data-list]');
  const ddButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dd]'));
  const total = items.length;
  if (!form || !qInput || !suggestEl || !tagsEl || !activeRow) return;

  // Author suggestion index (lab members that appear on a paper).
  let authorList: { id: string; name: string; count: number }[] = [];
  try {
    authorList = JSON.parse(root.querySelector<HTMLElement>('[data-authors]')?.textContent || '[]');
  } catch {
    authorList = [];
  }
  const authors: Author[] = authorList.map((a) => {
    const norm = normalize(a.name);
    return { ...a, norm, words: norm.split(/\s+/).filter(Boolean) };
  });
  const authorById = new Map(authors.map((a) => [a.id, a]));

  // Active author-filter ids: the source of truth for the chips + author facet.
  let selectedAuthors: string[] = [];

  const checks = (facet: string) =>
    Array.from(form.querySelectorAll<HTMLInputElement>(`input[data-facet="${facet}"]`));

  /* ---- author autocomplete (search box) -------------------------- */
  let suggestOptions: { el: HTMLElement; id: string }[] = [];
  let suggestActive = -1;

  const openSuggest = () => {
    suggestEl.hidden = false;
    qInput.setAttribute('aria-expanded', 'true');
  };
  const closeSuggest = () => {
    if (suggestEl.hidden) return;
    suggestEl.hidden = true;
    suggestEl.textContent = '';
    suggestOptions = [];
    suggestActive = -1;
    qInput.setAttribute('aria-expanded', 'false');
    qInput.removeAttribute('aria-activedescendant');
  };
  const setActiveSuggestion = (i: number) => {
    if (!suggestOptions.length) return;
    suggestActive = (i + suggestOptions.length) % suggestOptions.length;
    suggestOptions.forEach((o, idx) => {
      const on = idx === suggestActive;
      o.el.classList.toggle('is-active', on);
      o.el.setAttribute('aria-selected', String(on));
    });
    const el = suggestOptions[suggestActive].el;
    qInput.setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView({ block: 'nearest' });
  };
  const renderSuggestions = () => {
    const query = normalize(qInput.value.trim());
    if (!query) {
      closeSuggest();
      return;
    }
    const chosen = new Set(selectedAuthors);
    const matches = authors
      .filter((a) => !chosen.has(a.id) && a.norm.includes(query))
      .sort((a, b) => {
        // Names with a word starting on the query rank first, then by frequency.
        const aw = a.words.some((w) => w.startsWith(query)) ? 0 : 1;
        const bw = b.words.some((w) => w.startsWith(query)) ? 0 : 1;
        if (aw !== bw) return aw - bw;
        return b.count - a.count || a.name.localeCompare(b.name);
      })
      .slice(0, 8);
    if (!matches.length) {
      closeSuggest();
      return;
    }
    suggestEl.textContent = '';
    suggestOptions = matches.map((a, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.className = 'suggest__opt';
      li.id = `pub-suggest-opt-${i}`;
      li.dataset.value = a.id;
      li.setAttribute('aria-selected', 'false');
      const name = document.createElement('span');
      name.className = 'suggest__name';
      name.textContent = a.name;
      const count = document.createElement('span');
      count.className = 'suggest__count';
      count.textContent = String(a.count);
      li.append(name, count);
      suggestEl.append(li);
      return { el: li, id: a.id };
    });
    suggestActive = -1;
    openSuggest();
  };

  /* ---- active author chips + byline emphasis --------------------- */
  const renderAuthorTags = () => {
    tagsEl.textContent = '';
    for (const id of selectedAuthors) {
      const name = authorById.get(id)?.name ?? id;
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-tag';
      btn.dataset.authorTag = id;
      btn.setAttribute('aria-label', `Remove author filter: ${name}`);
      const label = document.createElement('span');
      label.textContent = name;
      const x = document.createElement('span');
      x.className = 'filter-tag__x';
      x.innerHTML = X_SVG;
      btn.append(label, x);
      li.append(btn);
      tagsEl.append(li);
    }
    activeRow.classList.toggle('is-shown', selectedAuthors.length > 0);
  };

  // Bold every byline author currently in the active filter set.
  const syncBylineEmphasis = () => {
    const set = new Set(selectedAuthors);
    for (const el of bylineAuthors) {
      el.classList.toggle('is-filtered', set.has(el.dataset.authorId ?? ''));
    }
  };

  const selectAuthor = (id: string) => {
    if (!id || !authorById.has(id)) return;
    if (!selectedAuthors.includes(id)) selectedAuthors.push(id);
    qInput.value = '';
    closeSuggest();
    renderAuthorTags();
    apply();
    qInput.focus();
  };

  const removeAuthor = (id: string) => {
    selectedAuthors = selectedAuthors.filter((a) => a !== id);
    renderAuthorTags();
    apply();
  };

  /* ---- dropdown open/close --------------------------------------- */
  const closeDropdowns = () => {
    for (const btn of ddButtons) {
      const panel = btn.nextElementSibling as HTMLElement | null;
      if (panel) panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  };
  for (const btn of ddButtons) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = btn.nextElementSibling as HTMLElement | null;
      if (!panel) return;
      const willOpen = panel.hidden;
      closeDropdowns();
      closeSuggest();
      if (willOpen) {
        panel.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }
  // Close checkbox dropdowns when clicking outside any .dd (selecting an option
  // inside keeps the panel open, so multi-select works).
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.dd')) closeDropdowns();
  });

  /* ---- state ----------------------------------------------------- */
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
      award: awardChip?.getAttribute('aria-pressed') === 'true',
      authors: [...selectedAuthors],
    };
  }

  function isActive(s: State): boolean {
    return Boolean(
      s.q || s.years.length || s.venues.length || s.topics.length || s.award || s.authors.length
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
    if (s.authors.length) {
      const mem = (d.members || '').split(' ');
      if (!s.authors.every((id) => mem.includes(id))) return false;
    }
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
    if (s.authors.length) p.set('author', s.authors.join(','));
    const qs = p.toString();
    history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);
  }

  /** Reflect a facet's selection count on its chip: accent state + count badge. */
  function syncChip(facet: string, count: number): void {
    const btn = ddButtons.find((b) => b.dataset.dd === facet);
    if (!btn) return;
    btn.classList.toggle('is-on', count > 0);
    let badge = btn.querySelector<HTMLElement>('.chip__n');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'chip__n';
        btn.insertBefore(badge, btn.querySelector('.chip__chev'));
      }
      badge.textContent = String(count);
    } else if (badge) {
      badge.remove();
    }
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
      g.hidden = !g.querySelector('[data-pub-item]:not([hidden])');
    }

    const active = isActive(s);
    if (countEl) {
      countEl.textContent = active
        ? `Showing ${visible} of ${total} publications`
        : `${total} publications`;
    }
    if (emptyEl) emptyEl.hidden = visible !== 0;
    if (clearBtn) clearBtn.hidden = !active;

    syncChip('year', s.years.length);
    syncChip('venue', s.venues.length);
    syncChip('topic', s.topics.length);
    if (awardChip) awardChip.classList.toggle('is-on', s.award);
    syncBylineEmphasis();

    syncUrl(s);
  }

  function applyFromUrl(): void {
    const p = new URLSearchParams(location.search);
    qInput!.value = p.get('q') ?? '';
    const setChecks = (facet: string, csv: string | null) => {
      const set = new Set((csv ?? '').split(',').filter(Boolean));
      for (const c of checks(facet)) c.checked = set.has(c.value);
    };
    setChecks('year', p.get('year'));
    setChecks('venue', p.get('venue'));
    setChecks('topic', p.get('topic'));
    if (awardChip) awardChip.setAttribute('aria-pressed', String(p.get('award') === '1'));
    // Keep only ids we actually know, so a stale URL can't leave a dangling chip.
    selectedAuthors = (p.get('author') ?? '').split(',').filter((id) => id && authorById.has(id));
    renderAuthorTags();
    apply();
  }

  function clearAll(): void {
    qInput!.value = '';
    for (const facet of ['year', 'venue', 'topic'])
      checks(facet).forEach((c) => (c.checked = false));
    if (awardChip) awardChip.setAttribute('aria-pressed', 'false');
    selectedAuthors = [];
    renderAuthorTags();
    closeDropdowns();
    closeSuggest();
    apply();
    qInput!.focus();
  }

  /* ---- ledger BibTeX / Cite disclosures (delegated) -------------- */
  list?.addEventListener('click', (e) => {
    const toggle = (e.target as HTMLElement).closest<HTMLButtonElement>('.act[data-act]');
    if (!toggle) return;
    const row = toggle.closest('.ledger__row');
    const panel = row?.querySelector<HTMLElement>('[data-panel]');
    if (!row || !panel) return;
    const kind = toggle.dataset.act;
    const box = panel.querySelector<HTMLElement>(`.ledger__panelbox[data-kind="${kind}"]`);
    if (!box) return;
    const willOpen = panel.hidden || box.hidden; // closed, or showing the other kind

    // Collapse every open panel and reset every toggle in the list first.
    root.querySelectorAll<HTMLElement>('[data-panel]').forEach((pl) => {
      pl.hidden = true;
      pl.querySelectorAll<HTMLElement>('.ledger__panelbox').forEach((b) => (b.hidden = true));
    });
    root
      .querySelectorAll('.act[data-act][aria-expanded="true"]')
      .forEach((a) => a.setAttribute('aria-expanded', 'false'));

    if (willOpen) {
      panel.hidden = false;
      box.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    }
  });

  /* ---- wiring ---------------------------------------------------- */
  form.addEventListener('submit', (e) => e.preventDefault());

  let debounce: number | undefined;
  qInput.addEventListener('input', () => {
    renderSuggestions();
    window.clearTimeout(debounce);
    debounce = window.setTimeout(apply, 120);
  });
  qInput.addEventListener('focus', () => {
    if (qInput.value.trim()) renderSuggestions();
  });
  qInput.addEventListener('blur', () => closeSuggest());
  qInput.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (suggestEl.hidden) {
          renderSuggestions();
          if (!suggestEl.hidden) setActiveSuggestion(0);
        } else {
          setActiveSuggestion(suggestActive + 1);
        }
        break;
      case 'ArrowUp':
        if (!suggestEl.hidden) {
          e.preventDefault();
          setActiveSuggestion(suggestActive - 1);
        }
        break;
      case 'Enter':
        if (!suggestEl.hidden && suggestActive >= 0) {
          e.preventDefault();
          selectAuthor(suggestOptions[suggestActive].id);
        }
        break;
      case 'Escape':
        if (!suggestEl.hidden) {
          e.preventDefault();
          closeSuggest();
        }
        break;
    }
  });

  // Keep focus in the input on mousedown so blur doesn't close the popup before
  // the option's click fires; then select on click, and follow the pointer.
  suggestEl.addEventListener('mousedown', (e) => e.preventDefault());
  suggestEl.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('.suggest__opt');
    if (li?.dataset.value) selectAuthor(li.dataset.value);
  });
  suggestEl.addEventListener('mousemove', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('.suggest__opt');
    if (!li) return;
    const idx = suggestOptions.findIndex((o) => o.el === li);
    if (idx >= 0 && idx !== suggestActive) setActiveSuggestion(idx);
  });

  tagsEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-author-tag]');
    if (btn?.dataset.authorTag) removeAuthor(btn.dataset.authorTag);
  });

  form.addEventListener('change', apply);
  awardChip?.addEventListener('click', () => {
    const on = awardChip.getAttribute('aria-pressed') === 'true';
    awardChip.setAttribute('aria-pressed', String(!on));
    apply();
  });
  clearBtn?.addEventListener('click', clearAll);
  clearBtn2?.addEventListener('click', clearAll);

  applyFromUrl();
}
