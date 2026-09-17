import { isLikelyArticleUrl } from "@/app/api/_lib/is-article-url";

// filtering out duplicates and non article content from 1-click analysis cards
// normalization and video detection happens in the backend, if caught article should
// be removed from view

export type RelatedArticle = {
  id: string;
  title: string | null;
  url: string;
  publishedDate?: string;
  author?: string;
  image?: string;
};

function hasArticleMetadata(article: RelatedArticle): boolean {
  return Boolean(
    article.title?.trim() && (article.publishedDate || article.author),
  );
}

export function getRelatedArticles(
  results: RelatedArticle[] | null | undefined,
  currentArticleUrl?: string,
): RelatedArticle[] {
  const seenUrls = new Set<string>();
  const relatedArticles: RelatedArticle[] = [];

  for (const result of results ?? []) {
    if (
      !result.url ||
      result.url === currentArticleUrl ||
      seenUrls.has(result.url) ||
      !isLikelyArticleUrl(result.url) ||
      !hasArticleMetadata(result)
    ) {
      continue;
    }

    seenUrls.add(result.url);
    relatedArticles.push(result);
  }

  return relatedArticles;
}
