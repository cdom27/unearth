import { Preview } from "@/app/_lib/types/analyses-previews";
import Tooltip from "../tooltip/tooltip";
import ArticleCardBase from "./article-card-base";
import ArticleBadge from "./article-badge";
import InfoIcon from "../../icons/info";
import Scale from "../scale/scale";
import ExplanationPopover from "../tooltip/explanation-popover";

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
              <ExplanationPopover
                className="self-start pt-6"
                content="Bias Score, Factual Score, and Rhetorical Sentiment are partially AI-assisted estimates of this article's framing, claims, and tone. They evaluate this article, not the source as a whole."
              >
                <h3 className="font-bold flex items-center gap-1.5">
                  <span>At a glance</span>

                  <InfoIcon className="size-3.5 text-clay-500" />
                </h3>
              </ExplanationPopover>

              <div className="flex flex-col gap-0.5">
                <h4 className="text-sm">Bias Score</h4>
                <Scale
                  value={preview.analysis.biasScore || 0.5}
                  scaleLabels={["Far Left", "Center", "Far Right"]}
                  colors={["left-500", "clay-200", "right-500"]}
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <h4 className="text-sm">
                  Factual Score ({(preview.analysis.factualScore || 0.5) * 100}
                  %)
                </h4>
                <Scale
                  value={preview.analysis.factualScore || 0.5}
                  scaleLabels={["Very Low", "Mixed", "Very High"]}
                  colors={["rating-low", "rating-mixed", "rating-very-high"]}
                />
              </div>

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
