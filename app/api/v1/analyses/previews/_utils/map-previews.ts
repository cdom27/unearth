import type { DiscoverResult } from "@/app/_lib/types/analyses-previews";

type AnalysisPreviewRow = {
  articleId: string;
  analysisId: string | null;
  slug: string | null;
  sentiment: string | null;
  factualScore: number | null;
  biasScore: number | null;
  articleTitle: string;
  articleExcerpt: string;
  articleUrl: string;
  articleThumbnailUrl: string | null;
  articlePublishedTime: Date;
  sourceName: string;
  sourceBias: string;
};

const BIAS_LABELS: Record<
  string,
  "Left" | "Lean Left" | "Center" | "Lean Right" | "Right"
> = {
  left: "Left",
  "lean-left": "Lean Left",
  center: "Center",
  "lean-right": "Lean Right",
  right: "Right",
};

const VALID_SENTIMENTS = new Set(["negative", "mixed", "positive"]);

function mapSentiment(
  value: string | null,
): "negative" | "mixed" | "positive" | undefined {
  if (value && VALID_SENTIMENTS.has(value)) {
    return value as "negative" | "mixed" | "positive";
  }
  return undefined;
}

function mapBias(
  value: string,
): "Left" | "Lean Left" | "Center" | "Lean Right" | "Right" | null {
  return BIAS_LABELS[value] ?? null;
}

function mapFactualScore(value: number | null): number | undefined {
  if (value === null || value < 0) return undefined;
  return value;
}

export function mapRowToPreview(row: AnalysisPreviewRow): DiscoverResult {
  const baseCard = {
    source: {
      name: row.sourceName,
      bias: mapBias(row.sourceBias),
    },
    article: {
      title: row.articleTitle,
      thumbnailUrl: row.articleThumbnailUrl,
      publishedAt: row.articlePublishedTime.toISOString(),
      excerpt: row.articleExcerpt,
      url: row.articleUrl,
    },
  };

  if (!row.analysisId || !row.slug) {
    return {
      ...baseCard,
      kind: "unanalyzed",
      articleId: row.articleId,
    };
  }

  return {
    ...baseCard,
    kind: "analyzed",
    analysis: {
      slug: row.slug,
      biasScore: row.biasScore ?? undefined,
      factualScore: mapFactualScore(row.factualScore),
      sentiment: mapSentiment(row.sentiment),
    },
  };
}
