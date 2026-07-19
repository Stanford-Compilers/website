import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { TOPIC_KEYS, SOFTWARE_CATEGORY_KEYS, PEOPLE_CATEGORY_KEYS } from './lib/taxonomy';

/* ------------------------------------------------------------------ *
 * People
 * ------------------------------------------------------------------ *
 * One markdown file per person in src/content/people/. The markdown body is the
 * (optional) short biography. All structured fields live in frontmatter. Every
 * field except name/role/category is optional so the directory stays attractive
 * even when records are sparse.
 */
const coadvisor = z.object({
  name: z.string(),
  url: z.string().url().optional(),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      category: z.enum(PEOPLE_CATEGORY_KEYS),
      /** Portrait must be a real, approved image copied into the project. */
      portrait: image().optional(),
      portraitAlt: z.string().optional(),
      interests: z.array(z.string()).default([]),
      website: z.string().url().optional(),
      email: z.string().email().optional(),
      github: z.string().url().optional(),
      scholar: z.string().url().optional(),
      orcid: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      coadvisors: z.array(coadvisor).default([]),
      startYear: z.number().int().optional(),
      gradYear: z.number().int().optional(),
      /** Alumni: current position / destination, e.g. "Anthropic". */
      destination: z.string().optional(),
      /** Lower sorts first within a category; ties break alphabetically by first name. */
      order: z.number().default(100),
      featured: z.boolean().default(false),
    }),
});

/* ------------------------------------------------------------------ *
 * Publications
 * ------------------------------------------------------------------ *
 * A single validated YAML file (src/content/publications.yaml) — a flat array
 * where each entry carries a stable `id`. Adding a publication = adding one entry.
 */
const author = z.object({
  name: z.string(),
  /** Stable people-collection id, when this author is a lab member. */
  id: z.string().optional(),
  /** External profile URL for non-lab authors (from the legacy site). */
  url: z.string().url().optional(),
});

const publications = defineCollection({
  loader: file('./src/content/publications.yaml'),
  schema: z
    .object({
      title: z.string(),
      /** Optional explicit slug; falls back to the entry id. */
      slug: z.string().optional(),
      year: z.number().int(),
      /** 1–12, when known. */
      month: z.number().int().min(1).max(12).optional(),
      authors: z.array(author).min(1),
      /** Stable venue key from taxonomy.ts VENUES. */
      venueKey: z.string(),
      /** Free-text venue detail, e.g. "Volume 10, Issue PLDI" or "brief announcement". */
      venueDetail: z.string().optional(),
      status: z.enum(['published', 'to-appear']).default('published'),
      award: z.string().optional(),
      /** Source order (lower = newer). Stabilizes sorting when year+month tie. */
      order: z.number().default(0),
      topics: z.array(z.enum(TOPIC_KEYS)).default([]),
      /** Related software ids (software-collection references). */
      software: z.array(z.string()).default([]),
      links: z
        .object({
          pdf: z.string().optional(),
          doi: z.string().url().optional(),
          arxiv: z.string().url().optional(),
          code: z.string().url().optional(),
          project: z.string().url().optional(),
          video: z.string().url().optional(),
          slides: z.string().url().optional(),
        })
        .default({}),
      /** Verified BibTeX fields; keys, ordering, and formatting are normalized at render time. */
      bibtex: z.object({
        type: z.string().regex(/^[a-z]+$/i),
        fields: z.record(z.string(), z.union([z.string(), z.number()])),
      }),
      /** Whether this appears in the homepage "selected work" list. */
      featured: z.boolean().default(false),
      /** Whether a standalone detail page is generated (needs enough metadata). */
      detail: z.boolean().default(true),
    })
    .transform((data) => ({ ...data, slug: data.slug ?? undefined })),
});

/* ------------------------------------------------------------------ *
 * Software
 * ------------------------------------------------------------------ *
 * One markdown file per project. The body holds the longer narrative
 * ("how it relates to the lab's research"); structured fields are frontmatter.
 */
const software = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/software' }),
  schema: z.object({
    name: z.string(),
    shortName: z.string().optional(),
    /** One-sentence factual summary. */
    summary: z.string(),
    category: z.enum(SOFTWARE_CATEGORY_KEYS),
    /** Verified status note only (e.g. "Last commit 2024"). Never claim "actively maintained" unverified. */
    status: z.string().optional(),
    /** The problem this project addresses (plain language). */
    problem: z.string().optional(),
    /** The central research idea. */
    idea: z.string().optional(),
    links: z
      .object({
        repo: z.string().url().optional(),
        site: z.string().url().optional(),
        docs: z.string().url().optional(),
        install: z.string().url().optional(),
        paper: z.string().url().optional(),
      })
      .default({}),
    /** Related people (people-collection references). */
    people: z.array(reference('people')).default([]),
    /** Related software (self references by id). */
    relatedProjects: z.array(z.string()).default([]),
    /** Related publications by publication id. */
    publications: z.array(z.string()).default([]),
    /** Language / technology tags. */
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(100),
  }),
});

export const collections = { people, publications, software };
