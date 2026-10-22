import type { BreakingNewsResult } from "@/app/_lib/types/breaking-news";

export type NewsFetchResultDTO =
  | {
      success: true;
      data: BreakingNewsResult;
      shouldIngest?: boolean;
    }
  | { success: false; error: string };

export type NewsAPIResponseDTO = {
  status: string;
  code?: string;
  totalResults: number;
  articles: NewsAPIArticleDTO[];
};

export type NewsAPIArticleDTO = {
  source: {
    id: string | null;
    name: string | null;
  };
  author: string | null;
  title: string | null;
  description: string | null;
  url: string | null;
  urlToImage: string | null;
  publishedAt: string | null;
  content: string | null;
};
