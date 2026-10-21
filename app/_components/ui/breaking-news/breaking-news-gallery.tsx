"use client";

import useNewsAPI from "@/app/_hooks/use-news-api";
import { useEffect, useState, useRef, useCallback } from "react";
import CircleNotchIcon from "../../icons/circle-notch";
import BreakingNewsCard from "../article-cards/breaking-news-card";
import ArticleBadge from "../article-cards/article-badge";
import { ArticleCardBaseSkeleton } from "../article-cards/article-card-base";

export default function BreakingNewsGallery() {
  const { isFetching, newsResult, fetchNews } = useNewsAPI();

  const [excludedArticleUrls, setExcludedArticleUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const [page, setPage] = useState(0);
  const pageSize = 9;
  const articles = newsResult?.articles ?? [];
  const loadedArticles = articles.slice(0, (page + 1) * pageSize);
  const seenUrls = new Set(excludedArticleUrls);
  const breakingNewsArticles = loadedArticles.filter((news) => {
    if (seenUrls.has(news.article.url)) return false;
    seenUrls.add(news.article.url);
    return true;
  });
  const hasMore = newsResult ? (page + 1) * pageSize < articles.length : true;

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const lastArticleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!hasMore) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [hasMore],
  );

  return (
    <article className="flex flex-col gap-4" aria-busy={isFetching}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
        {isFetching && breakingNewsArticles.length === 0
          ? Array.from({ length: 9 }, (_, index) => (
              <ArticleCardBaseSkeleton
                key={`breaking-news-skeleton-${index}`}
              />
            ))
          : breakingNewsArticles.map((news) => (
              <BreakingNewsCard
                key={news.article.title.concat(", ", news.source.name)}
                article={news.article}
                source={news.source}
                onUnprocessable={() => {
                  setExcludedArticleUrls((previous) => {
                    const next = new Set(previous);
                    next.add(news.article.url);
                    return next;
                  });
                }}
                badge={
                  <ArticleBadge
                    variant="time"
                    timeStamp={news.article.publishedAt || ""}
                  />
                }
              />
            ))}
      </div>

      <div className="grid grid-cols-1 col-span-3 gap-1.5">
        {hasMore && <CircleNotchIcon className="size-6 animate-spin mx-auto" />}
        <div ref={lastArticleRef}>
          <p className="text-center" role="status" aria-live="polite">
            {isFetching
              ? "Fetching articles"
              : `Showing ${breakingNewsArticles.length} of
              ${articles.length} articles`}
          </p>
        </div>
      </div>
    </article>
  );
}
