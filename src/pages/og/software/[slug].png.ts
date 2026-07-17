/**
 * Per-project social cards: /og/software/<id>.png.
 */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { getCollection } from 'astro:content';
import { SOFTWARE_CATEGORIES } from '../../../lib/taxonomy';
import { renderOgImage, pngResponse } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const entries = await getCollection('software');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) => {
  const s = props.entry.data;
  return pngResponse(
    await renderOgImage({
      kicker: `Software · ${SOFTWARE_CATEGORIES[s.category].label}`,
      title: s.name,
      meta: s.summary,
    })
  );
};
