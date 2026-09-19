import type { BaseCard } from "./card";

export type Preview = BaseCard & {
  analysis: {
    slug: string;
    biasScore?: number;
    factualScore?: number;
    sentiment?: "negative" | "mixed" | "positive";
  }
}

export type PreviewsResult = {
  previews: Preview[];
  totalResults: number;
}

export type UnanalyzedPreview = BaseCard & {
  kind: "unanalyzed";
  articleId: string;
};

export type DiscoverResult = (Preview & { kind: "analyzed" }) | UnanalyzedPreview;

export type DiscoverResultsResult = {
  previews: DiscoverResult[];
  totalResults: number;
};
