/**
 * Social cards for the site root and top-level pages: /og/default.png,
 * /og/research.png, etc. `default` is referenced by SITE.defaultOgImage and is
 * the fallback for any page without a card of its own.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { SITE } from '../../config/site';
import { renderOgImage, pngResponse, type OgCard } from '../../lib/og';

const CARDS: Record<string, OgCard> = {
  default: {
    kicker: 'Stanford University · Computer Science',
    title: SITE.name,
    meta: SITE.tagline,
    footerRight: null,
  },
  research: {
    kicker: `${SITE.shortName} · Research`,
    title: 'One computation, many data representations, many machines',
    meta: 'The problem we work on and how we approach it.',
  },
  publications: {
    kicker: `${SITE.shortName} · Publications`,
    title: 'Publications',
    meta: 'Papers from the group, with search and filters by topic, venue, and author.',
  },
  software: {
    kicker: `${SITE.shortName} · Software`,
    title: 'Software',
    meta: 'Compilers and systems the group builds, most of them open source.',
  },
  people: {
    kicker: `${SITE.shortName} · People`,
    title: 'People',
    meta: 'The students, researchers, and alumni of the group.',
  },
  about: {
    kicker: `${SITE.shortName} · About`,
    title: 'About the lab',
    meta: SITE.tagline,
  },
  join: {
    kicker: `${SITE.shortName} · Join`,
    title: 'Join the lab',
    meta: 'For prospective PhD students, current Stanford students, and collaborators.',
  },
};

export const getStaticPaths = (() =>
  Object.keys(CARDS).map((page) => ({ params: { page } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  pngResponse(await renderOgImage(CARDS[params.page!]));
