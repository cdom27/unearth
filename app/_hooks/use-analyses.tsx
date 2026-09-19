import { useCallback, useRef, useState } from "react";
import type {
  DiscoverResult,
  DiscoverResultsResult,
} from "../_lib/types/analyses-previews";
import type { ApiResponse } from "../api/_lib/build-response";
import type { Params } from "../_lib/types/preview-params";

const DEFAULT_PAGE_SIZE = 9;

export default function useAnalyses(
  pageSize = DEFAULT_PAGE_SIZE,
  sorting: Params["sorting"] = "newest",
  filters: NonNullable<Params["filters"]> = {},
  search = "",
  includeUnanalyzed = false,
) {
  const [isFetching, setIsFetching] = useState(false);
  const [previewsResult, setPreviewsResult] = useState<DiscoverResultsResult>({
    previews: [],
    totalResults: 0,
  });
  const [hasMore, setHasMore] = useState(true);
  const [message, setMessage] = useState("");
  const nextPage = useRef(1);
  const isRequestInFlight = useRef(false);
  const loadedSlugs = useRef(new Set<string>());

  const fetchAnalysisPreviews = useCallback(async () => {
    if (isRequestInFlight.current || !hasMore) return;

    isRequestInFlight.current = true;
    setIsFetching(true);

    try {
      const params = new URLSearchParams({
        page: String(nextPage.current),
        pageSize: String(pageSize),
        sort: sorting,
      });
      if (includeUnanalyzed) params.set("includeUnanalyzed", "true");
      if (search) params.set("q", search);
      const scalarFilters = [
        "minFactualScore",
        "maxFactualScore",
        "minBiasScore",
        "maxBiasScore",
        "minPublishedAt",
        "maxPublishedAt",
      ] as const;
      scalarFilters.forEach((filter) => {
        const value = filters[filter];
        if (value !== undefined && value !== "") {
          params.set(filter, String(value));
        }
      });
      const arrayFilters = ["sources", "sentiments", "credibilities"] as const;
      arrayFilters.forEach((filter) => {
        const values = filters[filter];
        if (values?.length) params.set(filter, values.join(","));
      });
      const response = await fetch(`/api/v1/analyses/previews?${params}`);

      const result =
        (await response.json()) as ApiResponse<DiscoverResultsResult>;

      if (result.data && response.ok) {
        const data = result.data;
        setMessage(result.message);
        nextPage.current += 1;

        const addedPreviews = data.previews.filter(
          (preview: DiscoverResult) =>
            !loadedSlugs.current.has(
              preview.kind === "analyzed"
                ? preview.analysis.slug
                : preview.articleId,
            ),
        );
        addedPreviews.forEach((preview) =>
          loadedSlugs.current.add(
            preview.kind === "analyzed"
              ? preview.analysis.slug
              : preview.articleId,
          ),
        );

        setPreviewsResult((previous) => ({
          previews: [...previous.previews, ...addedPreviews],
          totalResults: data.totalResults,
        }));
        setHasMore(
          data.previews.length > 0 &&
            loadedSlugs.current.size < data.totalResults,
        );
      } else {
        setMessage(result.message || "Unable to fetch analyses.");
      }
    } catch {
      setMessage("An unexpected error has occurred.");
    } finally {
      isRequestInFlight.current = false;
      setIsFetching(false);
    }
  }, [filters, hasMore, includeUnanalyzed, pageSize, search, sorting]);

  return {
    fetchAnalysisPreviews,
    isFetching,
    previewsResult,
    hasMore,
    message,
  };
}
