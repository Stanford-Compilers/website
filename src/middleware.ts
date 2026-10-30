import { defineMiddleware } from 'astro:middleware';
import { COMING_SOON } from './lib/coming-soon';

/**
 * While the site is held behind the coming-soon page, every page except `/` is
 * built as an instant, noindexed redirect to it (307 → zero-delay meta refresh).
 * File routes (OG cards, robots.txt, the web manifest) are left alone.
 */
export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  if (!COMING_SOON || pathname === '/' || /\.[a-z0-9]+$/i.test(pathname)) return next();
  return context.redirect('/', 307);
});
