"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useArticle from "@/app/_hooks/use-article";
import type { RelatedArticle } from "@/app/article/[slug]/related-articles";
import MagicWandIcon from "../../icons/magic-wand";
import CircleNotchIcon from "../../icons/circle-notch";
import XIcon from "../../icons/x";
import CheckIcon from "../../icons/check";
import Tooltip from "../tooltip/tooltip";
import ArticleBadge from "./article-badge";
import ArticleCardBase from "./article-card-base";

interface RelatedArticleCardProps {
  article: RelatedArticle;
}

function formatUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const formattedUrl = `${parsedUrl.hostname}${parsedUrl.pathname}`.replace(
      /\/$/,
      "",
    );

    return formattedUrl.length > 16
      ? `${formattedUrl.slice(0, 16)}...`
      : formattedUrl;
  } catch {
    return url.length > 16 ? `${url.slice(0, 16)}...` : url;
  }
}

export default function RelatedArticleCard({
  article,
}: RelatedArticleCardProps) {
  const { analyzeArticle, isAnalyzing, message } = useArticle();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  async function handleSubmit() {
    const result = await analyzeArticle(article.url);

    if (result.kind === "success") {
      router.push(`/article/${result.slug}`);
      return;
    }

    if (result.kind === "unprocessable") {
      setIsVisible(false);
    }
  }

  if (!isVisible) return null;

  const displayUrl = formatUrl(article.url);

  return (
    <div className="min-w-0">
      <Tooltip
        id={`related-${article.url}`}
        content={
          isAnalyzing ? "Analyzing" : message ? message : "Analyze Article"
        }
        icon={
          isAnalyzing ? (
            <CircleNotchIcon className="size-6 animate-spin" />
          ) : message === "Analysis Complete!" ? (
            <CheckIcon className="size-6" />
          ) : message ? (
            <XIcon className="size-4" />
          ) : (
            <MagicWandIcon className="size-6" />
          )
        }
        variant={
          message === "Unable to process source" ? "secondary" : "default"
        }
      >
        <button
          type="button"
          onClick={() => void handleSubmit()}
          className="group flex w-full min-w-0 rounded-sm hover:cursor-pointer disabled:cursor-not-allowed"
          aria-label={`Analyze: ${article.title ?? "Untitled article"} from ${displayUrl}`}
          disabled={isAnalyzing}
        >
          <ArticleCardBase
            article={{
              title: article.title ?? "Untitled article",
              thumbnailUrl: article.image ?? null,
              publishedAt: article.publishedDate ?? null,
              excerpt: "",
              url: article.url,
            }}
            source={{ name: displayUrl }}
            badge={
              article.publishedDate ? (
                <ArticleBadge
                  variant="time"
                  timeStamp={article.publishedDate}
                />
              ) : null
            }
          />
        </button>
      </Tooltip>
    </div>
  );
}
