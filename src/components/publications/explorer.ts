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

/** Minimal controller for a value store: what the explorer needs from the member widget. */
interface MemberControl {
  get value(): string;
  set value(v: string);
}

/**
 * Custom themed dropdown replacing the native <select> for "Lab member".
 * Implements the ARIA listbox pattern \u2014 a trigger button plus a popup list \u2014
 * with keyboard navigation (arrows, Home/End, type-ahead, Enter/Escape),
 * outside-click dismissal, and a hidden input that carries the value so the
 * rest of the explorer reads it exactly like the old select. Calls onChange
 * only on user-driven selection; programmatic .value assignment stays silent
 * (the caller runs apply() itself, as it did with the select).
 */
function setupMemberDropdown(root: HTMLElement, onChange: () => void): MemberControl {
  const wrap = root.querySelector<HTMLElement>('[data-member-root]');
  const button = root.querySelector<HTMLButtonElement>('[data-member-button]');
  const list = root.querySelector<HTMLElement>('[data-member-list]');
  const valueEl = root.querySelector<HTMLElement>('[data-member-value]');
  const hidden = root.querySelector<HTMLInputElement>('[data-member]');
  if (!wrap || !button || !list || !valueEl || !hidden) {
    // Degrade to a bare value store; the explorer keeps working without member filtering.
    return { get value() { return hidden?.value ?? ''; }, set value(_v: string) {} };
  }
  const h = hidden;
  const options = Array.from(list.querySelectorAll<HTMLElement>('[role="option"]'));
  options.forEach((o, i) => {
    if (!o.id) o.id = `pub-member-opt-${i}`;
  });

  let open = false;
  let activeIndex = 0;

  const labelFor = (v: string) => {
    const opt = options.find((o) => o.dataset.value === v) ?? options[0];
    return opt?.dataset.label ?? opt?.textContent?.trim() ?? 'Anyone';
  };

  const setValue = (v: string, fire: boolean) => {
    h.value = v;
    valueEl.textContent = labelFor(v);
    for (const o of options) o.setAttribute('aria-selected', String(o.dataset.value === v));
    button.classList.toggle('member__button--placeholder', v === '');
    if (fire) onChange();
  };

  const setActive = (i: number) => {
    activeIndex = Math.max(0, Math.min(i, options.length - 1));
    options.forEach((o, idx) => o.classList.toggle('is-active', idx === activeIndex));
    const el = options[activeIndex];
    if (el) {
      list.setAttribute('aria-activedescendant', el.id);
      el.scrollIntoView({ block: 'nearest' });
    }
  };

  const onDocPointer = (e: Event) => {
    if (!wrap.contains(e.target as Node)) closeList(false);
  };

  // The list is `position: fixed`, so it must be placed against the trigger's
  // viewport rect every time it opens (and re-placed while open, since the rail
  // it lives in scrolls). Flip upward when there isn't room below, and cap the
  // height to the space actually available so it never runs off-screen.
  const GAP = 6;
  const MAX_H = 240; // 15rem, mirrors the CSS max-height
  const MARGIN = 8; // keep clear of the viewport edge
  const positionList = () => {
    const r = button.getBoundingClientRect();
    const vh = window.innerHeight;
    const below = vh - r.bottom - GAP - MARGIN;
    const above = r.top - GAP - MARGIN;
    const wanted = Math.min(MAX_H, list.scrollHeight);
    const up = below < wanted && above > below;
    const avail = Math.max(96, up ? above : below);
    list.style.left = `${Math.round(r.left)}px`;
    list.style.width = `${Math.round(r.width)}px`;
    list.style.maxHeight = `${Math.round(Math.min(MAX_H, avail))}px`;
    if (up) {
      list.style.top = 'auto';
      list.style.bottom = `${Math.round(vh - r.top + GAP)}px`;
    } else {
      list.style.bottom = 'auto';
      list.style.top = `${Math.round(r.bottom + GAP)}px`;
    }
  };

  const openList = () => {
    if (open) return;
    open = true;
    list.hidden = false;
    positionList();
    button.setAttribute('aria-expanded', 'true');
    const sel = options.findIndex((o) => o.dataset.value === h.value);
    setActive(sel < 0 ? 0 : sel);
    list.focus();
    document.addEventListener('pointerdown', onDocPointer, true);
    window.addEventListener('scroll', positionList, true);
    window.addEventListener('resize', positionList);
  };

  const closeList = (focusButton = true) => {
    if (!open) return;
    open = false;
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    list.removeAttribute('aria-activedescendant');
    document.removeEventListener('pointerdown', onDocPointer, true);
    window.removeEventListener('scroll', positionList, true);
    window.removeEventListener('resize', positionList);
    if (focusButton) button.focus();
  };

  // Type-ahead: jump to the next option whose label starts with the typed run.
  let typed = '';
  let typeTimer: number | undefined;
  const typeahead = (key: string) => {
    if (key.length !== 1 || key === ' ') return;
    window.clearTimeout(typeTimer);
    typed += key.toLowerCase();
    typeTimer = window.setTimeout(() => (typed = ''), 500);
    for (let n = 1; n <= options.length; n++) {
      const idx = (activeIndex + (typed.length > 1 ? 0 : n)) % options.length;
      const label = (options[idx].dataset.label ?? '').toLowerCase();
      if (label.startsWith(typed)) {
        setActive(idx);
        return;
      }
    }
  };

  button.addEventListener('click', () => (open ? closeList() : openList()));
  button.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openList();
    }
  });

  list.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(activeIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        setValue(options[activeIndex]?.dataset.value ?? '', true);
        closeList();
        break;
      case 'Escape':
        e.preventDefault();
        closeList();
        break;
      case 'Tab':
        closeList(false);
        break;
      default:
        typeahead(e.key);
    }
  });

  options.forEach((opt, i) => {
    opt.addEventListener('click', () => {
      setActive(i);
      setValue(opt.dataset.value ?? '', true);
      closeList();
    });
    opt.addEventListener('mousemove', () => {
      if (i !== activeIndex) setActive(i);
    });
  });

  setValue(h.value, false);

  return {
    get value() {
      return h.value;
    },
    set value(v: string) {
      setValue(v, false);
    },
  };
}

export function setupExplorer(): void {
  const root = document.querySelector<HTMLElement>('[data-explorer]');
  if (!root || root.dataset.wired === '1') return;
  root.dataset.wired = '1';

  const form = root.querySelector<HTMLFormElement>('[data-filters]');
  const qInput = root.querySelector<HTMLInputElement>('[data-q]');
  const awardInput = root.querySelector<HTMLInputElement>('[data-award]');
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-pub-item]'));
  const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-year-group]'));
  const countEl = root.querySelector<HTMLElement>('[data-count]');
  const emptyEl = root.querySelector<HTMLElement>('[data-empty]');
  const clearBtn = root.querySelector<HTMLElement>('[data-clear]');
  const clearBtn2 = root.querySelector<HTMLElement>('[data-clear-2]');
  const panel = root.querySelector<HTMLDetailsElement>('[data-filters-panel]');
  const activeCountEl = root.querySelector<HTMLElement>('[data-active-count]');
  const total = items.length;
  if (!form || !qInput) return;

  // Custom themed listbox in place of the native <select>; exposes a .value
  // that the rest of this function reads and writes just like the old element.
  const memberDropdown = setupMemberDropdown(root, apply);

  // Filters collapse by default on small screens; expand on wider ones. An inline
  // head-adjacent script sets this before first paint — here we keep it correct
  // after view-transition swaps and across the breakpoint on resize.
  const mobile = window.matchMedia('(max-width: 60rem)');
  const syncPanel = () => {
    if (panel) panel.open = !mobile.matches;
  };
  syncPanel();
  mobile.addEventListener('change', syncPanel);

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
      member: memberDropdown.value,
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
    if (activeCountEl) {
      const n =
        (s.q ? 1 : 0) +
        s.years.length +
        s.venues.length +
        s.topics.length +
        (s.award ? 1 : 0) +
        (s.member ? 1 : 0);
      activeCountEl.textContent = String(n);
      activeCountEl.hidden = n === 0;
    }
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
    memberDropdown.value = p.get('member') ?? '';
    apply();
  }

  function clearAll(): void {
    qInput!.value = '';
    for (const facet of ['year', 'venue', 'topic'])
      checks(facet).forEach((c) => (c.checked = false));
    if (awardInput) awardInput.checked = false;
    memberDropdown.value = '';
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
