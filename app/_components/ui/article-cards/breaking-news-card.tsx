"use client";

import useArticle from "@/app/_hooks/use-article";
import MagicWandIcon from "../../icons/magic-wand";
import Tooltip from "../tooltip/tooltip";
import ArticleCardBase, { ArticleCardBaseProps } from "./article-card-base";
import { useRouter } from "next/navigation";
import CircleNotchIcon from "../../icons/circle-notch";
import XIcon from "../../icons/x";
import CheckIcon from "../../icons/check";

interface BreakingNewsCardProps extends ArticleCardBaseProps {
  onUnprocessable: () => void;
}

export default function BreakingNewsCard({
  onUnprocessable,
  ...props
}: BreakingNewsCardProps) {
  const { analyzeArticle, isAnalyzing, message } = useArticle();
  const router = useRouter();

  async function handleSubmit() {
    try {
      const slug = await analyzeArticle(props.article.url);

      if (slug) {
        router.push(`/article/${slug}`);
      }
      if (!slug) {
        onUnprocessable();
      }
    } catch {
      console.log("Unable to process source");
      console.log(message);
    }
  }

  return (
    <Tooltip
      id={`bn-${props.article.url}`}
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
      variant={message === "Unable to process source" ? "secondary" : "default"}
    >
      <button
        onClick={() => handleSubmit()}
        className="group hover:cursor-pointer rounded-sm flex disabled:cursor-not-allowed"
        aria-label={`Analyze: ${props.article.title} by ${props.source.name}`}
        disabled={message != "" ? true : false}
      >
        <ArticleCardBase {...props} />
      </button>
    </Tooltip>
  );
}
