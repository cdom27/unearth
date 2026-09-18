import type { BreakingNews } from "@/app/_lib/types/breaking-news";
import {
  ingestArticles,
  type ArticleIngestionCandidate,
} from "@/app/api/_lib/article-ingestion";

export function ingestBreakingNewsArticles(articles: BreakingNews[]) {
  const candidates: ArticleIngestionCandidate[] = articles.map((article) => ({
    url: article.article.url,
    title: article.article.title,
    author: article.article.byline,
    excerpt: article.article.excerpt,
    publishedAt: article.article.publishedAt,
    image: article.article.thumbnailUrl,
    sourceName: article.source.name,
  }));

  return ingestArticles(candidates);
}
