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

const nonArticlePathSegments = new Set([
  "archive",
  "archives",
  "author",
  "authors",
  "category",
  "categories",
  "feed",
  "feeds",
  "login",
  "profile",
  "profiles",
  "query",
  "results",
  "search",
  "tag",
  "tags",
  "topics",
  "user",
  "users",
]);

const nonArticlePathPatterns = [
  /(?:^|\/)(?:bill|bills|legislation|roll[-_]?call|votes?|voting)(?:\/|$)/i,
  /(?:^|\/)(?:documents?|downloads?|files?)(?:\/|$)/i,
  /(?:^|\/)(?:press[-_]?release|statements?)(?:\/|$)/i,
];

const nonArticleFileExtensions =
  /\.(?:csv|docx?|gif|jpe?g|json|pdf|png|pptx?|svg|xlsx?|xml|zip)$/i;

function isArticleUrl(url: string): boolean {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;

  const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
  if (!path || nonArticleFileExtensions.test(parsedUrl.pathname)) return false;

  const pathSegments = path.split("/").filter(Boolean);
  if (
    pathSegments.some((segment) =>
      nonArticlePathSegments.has(segment.toLowerCase()),
    )
  ) {
    return false;
  }

  return !nonArticlePathPatterns.some((pattern) =>
    pattern.test(parsedUrl.pathname),
  );
}

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
      !isArticleUrl(result.url) ||
      !hasArticleMetadata(result)
    ) {
      continue;
    }

    seenUrls.add(result.url);
    relatedArticles.push(result);
  }

  return relatedArticles;
}
