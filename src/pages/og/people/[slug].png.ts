/**
 * Per-person social cards: /og/people/<id>.png.
 * Generated for the same set of people that get detail pages.
 */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../../../config/site';
import { renderOgImage, pngResponse } from '../../../lib/og';

export const getStaticPaths = (async () => {
  if (!SITE.features.personDetailPages) return [];
  const entries = await getCollection('people');
  return entries
    .filter((e) => e.data.category === 'pi' || Boolean(e.body && e.body.trim()))
    .map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) => {
  const p = props.entry.data;
  return pngResponse(
    await renderOgImage({
      kicker: SITE.shortName,
      title: p.name,
      meta: p.role,
    })
  );
};
