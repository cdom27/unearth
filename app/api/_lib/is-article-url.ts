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

export function isLikelyArticleUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;

    const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
    if (!path || nonArticleFileExtensions.test(parsedUrl.pathname)) return false;

    if (
      path
        .split("/")
        .filter(Boolean)
        .some((segment) => nonArticlePathSegments.has(segment.toLowerCase()))
    ) {
      return false;
    }

    return !nonArticlePathPatterns.some((pattern) =>
      pattern.test(parsedUrl.pathname),
    );
  } catch {
    return false;
  }
}
