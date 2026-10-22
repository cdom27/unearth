import type { BreakingNews } from "@/app/_lib/types/breaking-news";
import type {
  NewsFetchResultDTO,
  NewsAPIResponseDTO,
} from "@/app/api/v1/breaking-news/_lib/dtos/news-api";
import { db } from "@/app/_lib/db/client";
import { articles, sources } from "@/app/_lib/db/schema";
import { desc, eq } from "drizzle-orm";

async function fetchRecentArticlesFromDatabase(): Promise<NewsFetchResultDTO> {
  const recentArticles = await db
    .select({
      sourceName: sources.name,
      title: articles.title,
      url: articles.url,
      thumbnailUrl: articles.thumbnailUrl,
      publishedTime: articles.publishedTime,
      excerpt: articles.excerpt,
      byline: articles.byline,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .orderBy(desc(articles.publishedTime), desc(articles.createdAt))
    .limit(90);

  const structuredArticles: BreakingNews[] = recentArticles.map((article) => ({
    source: {
      name: article.sourceName,
      bias: null,
    },
    article: {
      title: article.title,
      thumbnailUrl: article.thumbnailUrl,
      publishedAt: article.publishedTime.toISOString(),
      excerpt: article.excerpt,
      byline: article.byline,
      url: article.url,
    },
  }));

  return {
    success: true,
    data: {
      articles: structuredArticles,
      totalResults: structuredArticles.length,
    },
    shouldIngest: false,
  };
}

export async function fetchBreakingNews(
  pageSize: number = 100,
): Promise<NewsFetchResultDTO> {
  try {
    const sources =
      "associated-press,reuters,politico,the-washington-post,the-wall-street-journal,cnn,fox-news,bbc-news,breitbart-news,axios,nbc-news,cbc-news,the-guardian-uk,abc-news,al-jazeera-english,the-hindu,the-globe-and-mail,msnbc";

    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?sources=${sources}&pageSize=${Math.min(pageSize, 100)}&apiKey=${process.env.NEWS_API_KEY}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const result = (await response.json()) as NewsAPIResponseDTO;

    if (result.status === "error" && result.code === "rateLimited") {
      return await fetchRecentArticlesFromDatabase();
    }

    if (!response.ok || !result.articles) {
      return {
        success: false,
        error: "Unexpected error while fetching breaking news",
      };
    }

    if (pageSize > 100 && result.totalResults > 100) {
      const totalPages = Math.ceil(result.totalResults / 100);
      const pagesToFetch = Math.min(Math.ceil(pageSize / 100), totalPages);

      const additionalArticles: typeof result.articles = [];

      for (let page = 2; page <= pagesToFetch; page++) {
        try {
          const additionalResponse = await fetch(
            `https://newsapi.org/v2/top-headlines?sources=${sources}&pageSize=100&page=${page}&apiKey=${process.env.NEWS_API_KEY}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          const additionalResult =
            (await additionalResponse.json()) as NewsAPIResponseDTO;

          if (additionalResult.articles) {
            additionalArticles.push(...additionalResult.articles);
          }
        } catch (error) {
          console.error(`Error fetching page ${page} of breaking news:`, error);
          break;
        }
      }

      result.articles.push(...additionalArticles);
    }

    const structuredArticles: BreakingNews[] = result.articles
      .filter((a) => a.title && a.url)
      .map((article) => ({
        source: {
          name: article.source.name ?? "Unnamed Source",
          bias: null,
        },
        article: {
          title: article.title!,
          thumbnailUrl: article.urlToImage ?? null,
          publishedAt: article.publishedAt ?? null,
          excerpt: article.description ?? null,
          byline: article.author ?? null,
          url: article.url!,
        },
      }));

    return {
      success: true,
      data: {
        articles: structuredArticles,
        totalResults: result.totalResults,
      },
    };
  } catch (error) {
    console.error("Unexpected error while fetching breaking news: ", error);

    return {
      success: false,
      error: "Unexpected error while fetching breaking news",
    };
  }
}
