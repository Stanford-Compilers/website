/**
 * Central site identity and configuration.
 *
 * This is the single source of truth for the lab's public identity. Renaming the
 * lab, changing the tagline, updating contact details, or adjusting navigation
 * should only ever require editing THIS file — never a component.
 *
 * Kept dependency-free so it can be imported from `astro.config.ts` as well as
 * from components and pages.
 */

export interface NavItem {
  /** Visible label. */
  label: string;
  /** Route path (leading slash, no trailing slash except root). */
  href: string;
  /** Optional one-line description used by the 404 page and menus. */
  description?: string;
}

export interface SocialLink {
  label: string;
  href: string;
  /** Icon key resolved by the Icon component. */
  icon: string;
}

export interface SiteConfig {
  /** Full display name of the lab. */
  name: string;
  /** Short name for tight spaces (nav, wordmark). */
  shortName: string;
  /** One-line positioning statement. */
  tagline: string;
  /** Longer plain-language description used for meta + hero support copy. */
  description: string;
  /** Canonical production origin, no trailing slash. */
  url: string;
  /** Default social-card image path (relative to site root). */
  defaultOgImage: string;
  /** BCP-47 language tag for <html lang>. */
  locale: string;
  institution: {
    name: string;
    department: string;
    /** Short affiliation line for headers/footers. */
    affiliationLine: string;
    url: string;
    /** Official CS PhD admissions page. */
    admissionsUrl: string;
    /** Official CS department contact/visiting page. */
    departmentUrl: string;
  };
  pi: {
    name: string;
    title: string;
    email: string;
    office: string;
    /** Person record id (stable slug) for the PI in the people collection. */
    personId: string;
  };
  contact: {
    /** Primary public contact address. */
    email: string;
    /** Mailing / office line shown in the footer and join page. */
    mailing: string;
  };
  social: SocialLink[];
  /** Primary navigation, in order. */
  nav: NavItem[];
  /**
   * Analytics configuration. Disabled by default (privacy-respecting static site).
   * To enable a privacy-preserving analytics script later, set `enabled: true`
   * and provide `scriptUrl` / `siteId`; the analytics partial reads only this.
   */
  analytics: {
    enabled: boolean;
    provider: 'none' | 'plausible' | 'umami';
    scriptUrl?: string;
    domain?: string;
  };
  /** Feature flags to toggle optional surfaces without touching components. */
  features: {
    /** Show the theme (light/dark) switcher. */
    themeToggle: boolean;
    /** Enable subtle Astro view transitions. */
    viewTransitions: boolean;
    /** Render person detail pages when a person has enough verified content. */
    personDetailPages: boolean;
    /** Show the "Join" call-to-action on the homepage. */
    homeJoinCta: boolean;
  };
}

export const SITE: SiteConfig = {
  name: 'Stanford Compilers Lab',
  shortName: 'Stanford Compilers Lab',
  tagline: 'Languages and compilers across data representations and machines.',
  description:
    'We develop programming languages and compiler systems that let the same high-level ' +
    'computation run across different data representations and different machines — from ' +
    'sparse and structured data to CPUs, GPUs, accelerators, and distributed clusters.',
  url: 'https://compilers.stanford.edu',
  defaultOgImage: '/og/default.png',
  locale: 'en',

  institution: {
    name: 'Stanford University',
    department: 'Department of Computer Science',
    affiliationLine: 'Stanford University · Computer Science',
    url: 'https://www.stanford.edu/',
    admissionsUrl: 'https://cs.stanford.edu/admissions/phd-program',
    departmentUrl: 'https://cs.stanford.edu/',
  },

  pi: {
    name: 'Fredrik Kjolstad',
    title: 'Assistant Professor of Computer Science',
    email: 'kjolstad@cs.stanford.edu',
    office: 'CoDa E456',
    personId: 'fredrik-kjolstad',
  },

  contact: {
    email: 'kjolstad@cs.stanford.edu',
    mailing:
      'Department of Computer Science, Stanford University, 353 Jane Stanford Way, Stanford, CA 94305',
  },

  social: [
    { label: 'GitHub', href: 'https://github.com/fredrikbk', icon: 'github' },
    {
      label: 'Google Scholar',
      href: 'https://scholar.google.com/citations?user=bCCxZ28AAAAJ&hl=en',
      icon: 'scholar',
    },
  ],

  nav: [
    {
      label: 'Research',
      href: '/research',
      description: 'The problem we work on and how we approach it.',
    },
    {
      label: 'Publications',
      href: '/publications',
      description: 'Papers, with search and filters.',
    },
    {
      label: 'Software',
      href: '/software',
      description: 'Systems and compilers the group builds.',
    },
    { label: 'People', href: '/people', description: 'Who is in the group.' },
    { label: 'About', href: '/about', description: 'The group and its research narrative.' },
    { label: 'Join', href: '/join', description: 'For prospective students and collaborators.' },
  ],

  analytics: {
    enabled: false,
    provider: 'none',
  },

  features: {
    themeToggle: true,
    viewTransitions: true,
    personDetailPages: true,
    homeJoinCta: true,
  },
};

/** Absolute URL helper for canonical / OG tags. `path` should start with "/". */
export function absoluteUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
