"use client";

import { useRouter } from "next/navigation";
import CircleNotchIcon from "../../icons/circle-notch";
import CheckIcon from "../../icons/check";
import MagicWandIcon from "../../icons/magic-wand";
import XIcon from "../../icons/x";
import useArticle from "@/app/_hooks/use-article";
import type { UnanalyzedPreview } from "@/app/_lib/types/analyses-previews";
import Tooltip from "../tooltip/tooltip";
import ArticleCardBase from "./article-card-base";

export default function UnanalyzedArticleCard({
  article,
}: {
  article: UnanalyzedPreview;
}) {
  const { analyzeArticle, isAnalyzing, message } = useArticle();
  const router = useRouter();

  async function handleAnalyze() {
    const result = await analyzeArticle(article.article.url);
    if (result.kind === "success") router.push(`/article/${result.slug}`);
  }

  return (
    <Tooltip
      id={`unanalyzed-${article.article.url}`}
      content={isAnalyzing ? "Analyzing" : message || "Analyze Article"}
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
      variant={message ? "secondary" : "default"}
      wrapperClassName="block h-full w-full"
    >
      <button
        type="button"
        onClick={() => void handleAnalyze()}
        className="group flex h-full w-full flex-col rounded-sm hover:cursor-pointer disabled:cursor-not-allowed"
        aria-label={`Analyze: ${article.article.title} by ${article.source.name}`}
        disabled={isAnalyzing}
      >
        <ArticleCardBase
          article={article.article}
          source={article.source}
          badge={
            <span className="bg-clay-600 text-clay-100 py-1 px-4 rounded-full">
              Unanalyzed
            </span>
          }
        />
      </button>
    </Tooltip>
  );
}
