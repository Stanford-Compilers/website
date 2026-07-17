import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config/site';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  // Static output by default — every primary page is prerendered HTML.
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
    // Inline small stylesheets to cut render-blocking requests; larger ones stay external.
    inlineStylesheets: 'auto',
  },
  // Conservative prefetch: only prefetch links the user is likely to open.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  integrations: [
    sitemap({
      // Detail routes and primary pages are all included automatically.
      changefreq: 'monthly',
      priority: 0.7,
    }),
  ],
  image: {
    // Use the built-in sharp service for responsive images.
    responsiveStyles: true,
  },
  devToolbar: {
    enabled: false,
  },
});
