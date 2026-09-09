import { Preview } from "@/app/_lib/types/analyses-previews";
import Tooltip from "../tooltip/tooltip";
import ArticleCardBase from "./article-card-base";
import ArticleBadge from "./article-badge";
import InfoIcon from "../../icons/info";
import Scale from "../scale/scale";

interface AnalysisPreviewCardProps {
  preview: Preview;
}

export default function AnalysisPreviewCard({
  preview,
}: AnalysisPreviewCardProps) {
  const sentiment = preview.analysis.sentiment;
  let formattedSentiment = "Unverified";

  if (sentiment) {
    formattedSentiment =
      sentiment.slice(0, 1).toUpperCase() + sentiment.slice(1).toLowerCase();
  }

  return (
    <Tooltip content="Read Story">
      <a
        href={`/article/${preview.analysis.slug}`}
        className="group flex h-full w-full flex-col hover:cursor-pointer"
      >
        <ArticleCardBase
          article={preview.article}
          source={preview.source}
          badge={
            <ArticleBadge
              variant="bias"
              value={preview.source.bias || "Mixed"}
            />
          }
          footerExtension={
            <div className="border-t border-clay-200 flex flex-col gap-6 mt-auto">
              <h4
                className="font-bold pt-6 flex items-center gap-1.5"
                title={`Bias Score (${preview.analysis.biasScore}), Factual Score (${preview.analysis.factualScore}), and Rhetorical Sentiment (${preview.analysis.sentiment}) aim to evaluate an article's specific rhetoric and claims, NOT the source as a whole.`}
              >
                <span>At a glance</span>
                <InfoIcon className="size-3.5 text-clay-500" />
              </h4>

              <Scale
                value={preview.analysis.biasScore || 0.5}
                scaleLabels={["Far Left", "Center", "Far Right"]}
                colors={["left-500", "clay-200", "right-500"]}
              />

              <Scale
                value={preview.analysis.factualScore || 0.5}
                scaleLabels={["Very Low", "Mixed", "Very High"]}
                colors={["rating-low", "rating-mixed", "rating-very-high"]}
              />

              <p>
                Rhetorical Sentiment:{" "}
                <span className="font-bold">{formattedSentiment}</span>
              </p>
            </div>
          }
        />
      </a>
    </Tooltip>
  );
}
