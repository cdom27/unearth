import { db } from "@/app/_lib/db/client";
import { isLikelyArticleUrl } from "@/app/api/_lib/is-article-url";
import type { Claim } from "./types/claim";
import {
  ingestArticles,
  type ArticleIngestionCandidate,
} from "@/app/api/_lib/article-ingestion";

type ExaResult = {
  title: string | null;
  url: string;
  publishedDate?: string;
  author?: string;
  image?: string;
};

export async function ingestExaResults(
  slug: string,
  currentArticleUrl: string,
) {
  const analysis = await db.query.analyses.findFirst({
    where: (analyses, { eq }) => eq(analyses.slug, slug),
  });

  if (!analysis) return;

  const results = (analysis.claims as (Claim & {
    verification: {
      results: ExaResult[];
    } | null;
  })[] | null)
    ?.flatMap((claim) => claim.verification?.results ?? [])
    .filter(
      (result) =>
        result.url &&
        result.url !== currentArticleUrl &&
        isLikelyArticleUrl(result.url) &&
        result.title?.trim(),
    ) ?? [];

  const candidatesByUrl = new Map<string, ArticleIngestionCandidate>();
  for (const result of results) {
    candidatesByUrl.set(result.url, {
      url: result.url,
      title: result.title,
      author: result.author,
      publishedAt: result.publishedDate,
      image: result.image,
    });
  }

  await ingestArticles([...candidatesByUrl.values()]);
}
