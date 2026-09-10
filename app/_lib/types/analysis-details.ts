import type { Claim } from "@/app/api/v1/articles/_lib/types/claim";
import type { FramingDTO } from "@/app/api/v1/articles/_lib/dtos/framing";
import type { SummaryDTO } from "@/app/api/v1/articles/_lib/dtos/summary";

export type AnalysisDetails = {
  analysis: {
    summary: SummaryDTO | null;
    sentiment: string | null;
    framing: FramingDTO | null;
    claims: Claim[] | null;
    factualScore: number | null;
    biasScore: number | null;
    updatedAt: string;
  };
  article: {
    url: string;
    title: string;
    byline: string;
    publishedTime: string;
    thumbnailUrl: string | null;
  };
  source: {
    name: string;
    url: string;
    bias: string;
    factualReporting: string | null;
    credibility: string | null;
  };
};
