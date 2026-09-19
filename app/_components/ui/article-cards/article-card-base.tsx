import type { BaseCard } from "@/app/_lib/types/card";
import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import QuoteIcon from "../../icons/quote";
import placeholderImage from "@/app/_assets/images/placeholder.webp";

export interface ArticleCardBaseProps extends BaseCard {
  badge: ReactNode;
  footerExtension?: ReactNode;
}

export function ArticleCardBaseSkeleton() {
  return (
    <article
      className="h-full flex flex-col gap-6 animate-pulse"
      aria-hidden="true"
    >
      <div>
        <div className="aspect-video w-full bg-clay-200 rounded-t-sm" />

        <div className="h-16 bg-clay-900 rounded-b-sm flex items-center justify-center gap-3 p-3">
          <div className="h-6 w-6 rounded-full bg-clay-600" />
          <div className="h-5 w-32 rounded-sm bg-clay-600" />
        </div>
      </div>

      <div className="h-9 w-4/5 rounded-sm bg-clay-200" />
      <div className="space-y-2">
        <div className="h-5 w-full rounded-sm bg-clay-200" />
        <div className="h-5 w-2/3 rounded-sm bg-clay-200" />
      </div>
    </article>
  );
}

function formatSourceName(name: string) {
  if (name.length <= 20) return name;

  const parentheticalStart = name.indexOf(" (");
  const nameWithoutParenthetical =
    parentheticalStart > 0 ? name.slice(0, parentheticalStart) : name;

  if (
    nameWithoutParenthetical.length < name.length &&
    nameWithoutParenthetical.length <= 24
  ) {
    return `${nameWithoutParenthetical}...`;
  }

  return `${name.slice(0, 20).trimEnd()}...`;
}

export default function ArticleCardBase({
  article,
  source,
  badge,
  footerExtension,
}: ArticleCardBaseProps) {
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState<string | null>(
    null,
  );
  let truncatedExcerpt = article.excerpt;
  const thumbnailSrc =
    article.thumbnailUrl && article.thumbnailUrl !== failedThumbnailUrl
      ? article.thumbnailUrl
      : placeholderImage;

  if (article.excerpt) {
    if (article.excerpt.length > 250) {
      truncatedExcerpt = article.excerpt.slice(0, 250) + "...";
    }
  }

  return (
    <article className="h-full w-full flex flex-col gap-6">
      <div>
        <div className="overflow-clip rounded-t-sm">
          <Image
            src={thumbnailSrc}
            alt={article.title ?? "Untitled Report"}
            width={450}
            height={250}
            loading="eager"
            onError={() => {
              if (article.thumbnailUrl) {
                setFailedThumbnailUrl(article.thumbnailUrl);
              }
            }}
            className="aspect-video w-full h-auto object-cover rounded-t-sm group-hover:scale-105 transition-transform duration-250"
          />
        </div>

        <div className="text-clay-50 bg-clay-900 rounded-b-sm min-h-10 flex items-center justify-center gap-3 p-3">
          <div className="flex items-center gap-3">
            <QuoteIcon className="size-6" />
            <span className="text-lg whitespace-nowrap" title={source.name}>
              {formatSourceName(source.name)}
            </span>
          </div>

          {badge && (
            <>
              <div className="bg-clay-50 rounded-full size-1.5" />

              {badge}
            </>
          )}
        </div>
      </div>

      <h3 className="font-serif text-3xl text-left underline decoration-clay-50 group-hover:underline-offset-4 group-hover:decoration-brand-500 transition-colors duration-250">
        {article.title}
      </h3>

      <p className="text-lg text-left">{truncatedExcerpt}</p>

      {footerExtension}
    </article>
  );
}
