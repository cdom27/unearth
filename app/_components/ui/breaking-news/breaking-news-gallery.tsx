"use client";

import useNewsAPI from "@/app/_hooks/use-news-api";
import { useEffect, useState, useRef, useCallback } from "react";
import BreakingNewsCard from "../article-cards/breaking-news-card";
import ArticleBadge from "../article-cards/article-badge";
import ArticleGallery from "../article-cards/article-gallery";

export default function BreakingNewsGallery() {
  const { isFetching, newsResult, error, fetchNews } = useNewsAPI();

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
      if (observer.current) {
        observer.current.disconnect();
      }

      if (!hasMore || error) return;

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [error, hasMore],
  );

  return (
    <ArticleGallery
      count={breakingNewsArticles.length}
      total={articles.length}
      itemLabel="articles"
      isFetching={isFetching}
      hasItems={breakingNewsArticles.length > 0}
      error={error}
      loadingMessage="Fetching breaking news…"
      emptyMessage="No breaking news available."
      sentinelRef={lastArticleRef}
      showMoreIndicator={hasMore}
    >
      {breakingNewsArticles.map((news) => (
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
    </ArticleGallery>
  );
}
