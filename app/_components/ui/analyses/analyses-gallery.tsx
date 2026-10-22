"use client";

import useAnalyses from "@/app/_hooks/use-analyses";
import type { Params } from "@/app/_lib/types/preview-params";
import { useDiscover } from "@/app/discover/_components/discover-provider";
import { useCallback, useEffect, useRef } from "react";
import AnalysisPreviewCard from "../article-cards/analysis-preview-card";
import UnanalyzedArticleCard from "../article-cards/unanalyzed-article-card";
import ArticleGallery from "../article-cards/article-gallery";

type AnalysesGalleryResultsProps = {
  sorting: Params["sorting"];
  filters: NonNullable<Params["filters"]>;
  search: string;
  includeUnanalyzed: boolean;
};

export default function AnalysesGallery() {
  const { search, sorting, filters, includeUnanalyzed, resultsVersion } =
    useDiscover();

  return (
    <AnalysesGalleryResults
      key={`${sorting}-${JSON.stringify(filters)}-${resultsVersion}`}
      sorting={sorting}
      filters={filters}
      search={search}
      includeUnanalyzed={includeUnanalyzed}
    />
  );
}

function AnalysesGalleryResults({
  sorting,
  filters,
  search,
  includeUnanalyzed,
}: AnalysesGalleryResultsProps) {
  const { isFetching, previewsResult, hasMore, error, fetchAnalysisPreviews } =
    useAnalyses(9, sorting, filters, search, includeUnanalyzed);

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetchAnalysisPreviews();
  }, [fetchAnalysisPreviews]);

  const lastAnalysisRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) {
        observer.current.disconnect();
      }

      if (!hasMore || isFetching || error) return;

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchAnalysisPreviews();
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [error, fetchAnalysisPreviews, hasMore, isFetching],
  );

  return (
    <ArticleGallery
      count={previewsResult.previews.length}
      total={previewsResult.totalResults}
      itemLabel="stories"
      isFetching={isFetching}
      hasItems={previewsResult.previews.length > 0}
      error={error}
      loadingMessage="Fetching stories…"
      emptyMessage="No stories found."
      sentinelRef={lastAnalysisRef}
      showMoreIndicator={hasMore}
    >
      {previewsResult.previews.map((ap) => (
        ap.kind === "analyzed" ? (
          <AnalysisPreviewCard key={ap.analysis.slug} preview={ap} />
        ) : (
          <UnanalyzedArticleCard key={ap.articleId} article={ap} />
        )
      ))}
    </ArticleGallery>
  );
}
