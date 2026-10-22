import type { ReactNode, Ref } from "react";
import CircleNotchIcon from "../../icons/circle-notch";
import { ArticleCardBaseSkeleton } from "./article-card-base";

type ArticleGalleryProps = {
  children: ReactNode;
  count: number;
  total: number;
  itemLabel: string;
  isFetching: boolean;
  hasItems: boolean;
  error: string | null;
  sentinelRef?: Ref<HTMLDivElement>;
  showMoreIndicator?: boolean;
  loadingMessage: string;
  emptyMessage: string;
  skeletonCount?: number;
};

export default function ArticleGallery({
  children,
  count,
  total,
  itemLabel,
  isFetching,
  hasItems,
  error,
  sentinelRef,
  showMoreIndicator = false,
  loadingMessage,
  emptyMessage,
  skeletonCount = 9,
}: ArticleGalleryProps) {
  const showInitialSkeletons = isFetching && !hasItems && !error;
  const statusMessage = error
    ? hasItems
      ? `Showing ${count} of ${total} ${itemLabel} · ${error}`
      : error
    : showInitialSkeletons
      ? loadingMessage
      : hasItems
        ? `Showing ${count} of ${total} ${itemLabel}${isFetching ? " · Fetching more…" : ""}`
        : emptyMessage;

  return (
    <article className="flex flex-col gap-4" aria-busy={isFetching}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
        {showInitialSkeletons
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <ArticleCardBaseSkeleton key={`gallery-skeleton-${index}`} />
            ))
          : children}
      </div>

      <div className="grid grid-cols-1 col-span-3 gap-1.5">
        {(isFetching || showMoreIndicator) && !error && (
          <CircleNotchIcon className="size-6 animate-spin mx-auto" />
        )}
        <div ref={sentinelRef}>
          <p className="text-center" role="status" aria-live="polite">
            {statusMessage}
          </p>
        </div>
      </div>
    </article>
  );
}
