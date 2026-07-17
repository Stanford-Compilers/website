/**
 * Per-publication social cards: /og/publications/<id>.png.
 * Generated for the same set of publications that get detail pages.
 */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { loadPublications } from '../../../lib/collections';
import { venueShort } from '../../../lib/taxonomy';
import { renderOgImage, pngResponse } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const pubs = await loadPublications();
  return pubs.filter((p) => p.detail).map((pub) => ({ params: { slug: pub.id }, props: { pub } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) => {
  const { pub } = props;
  const authors = pub.authors.map((a) => a.name).join(', ');
  return pngResponse(
    await renderOgImage({
      kicker: `${venueShort(pub.venueKey)} · ${pub.year}${pub.award ? ` · ${pub.award}` : ''}`,
      title: pub.title,
      meta: authors,
    })
  );
};
