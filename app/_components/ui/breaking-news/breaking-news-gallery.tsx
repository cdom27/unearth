"use client";

import useNewsAPI from "@/app/_hooks/use-news-api";
import { useEffect, useState, useRef, useCallback } from "react";
import CircleNotchIcon from "../../icons/circle-notch";
import BreakingNewsCard from "../article-cards/breaking-news-card";
import ArticleBadge from "../article-cards/article-badge";
import { ArticleCardBaseSkeleton } from "../article-cards/article-card-base";
import type { BreakingNews } from "@/app/_lib/types/breaking-news";

export default function BreakingNewsGallery() {
  const { isFetching, newsResult, fetchNews } = useNewsAPI();

  const [breakingNewsArticles, setBreakingNewsArticles] = useState<
    BreakingNews[]
  >([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 9;

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    if (!newsResult || !newsResult.articles) return;

    const newArticles = newsResult.articles.slice(
      page * pageSize,
      (page + 1) * pageSize,
    );

    const isDone =
      (newArticles.length === 0 && page > 0) || newArticles.length < pageSize;

    if (newArticles.length === 0 && page > 0) return;

    setTimeout(
      () => {
        if (isDone) setHasMore(false);

        setBreakingNewsArticles((prev) => {
          const existingUrls = new Set(prev.map((bn) => bn.article.url));
          const filteredNewArticles = newArticles.filter(
            (bn) => !existingUrls.has(bn.article.url || ""),
          );
          return [...prev, ...filteredNewArticles];
        });
      },
      Math.floor(Math.random() * (1000 - 200 + 1)) + 200,
    );
  }, [page, newsResult]);

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
                  setBreakingNewsArticles((prev) =>
                    prev.filter(
                      (article) => article.article.url !== news.article.url,
                    ),
                  );
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
            ${newsResult?.articles?.length || 0} articles`}
          </p>
        </div>
      </div>
    </article>
  );
}
