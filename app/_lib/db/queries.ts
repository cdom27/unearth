import { db } from "./client";
import { analyses, articles, sources } from "./schema";
import { eq } from "drizzle-orm";
import type { AnalysisDetails } from "../types/analysis-details";

export async function getAnalysis(
  slug: string,
): Promise<AnalysisDetails | null> {
  const [analysis] = await db
    .select({
      analysis: {
        summary: analyses.summary,
        sentiment: analyses.sentiment,
        framing: analyses.framing,
        claims: analyses.claims,
        factualScore: analyses.factualScore,
        biasScore: analyses.biasScore,
        updatedAt: analyses.updatedAt,
      },
      article: {
        url: articles.url,
        title: articles.title,
        byline: articles.byline,
        publishedTime: articles.publishedTime,
        thumbnailUrl: articles.thumbnailUrl,
      },
      source: {
        name: sources.name,
        url: sources.url,
        bias: sources.bias,
        factualReporting: sources.factualReporting,
        credibility: sources.credibility,
      },
    })
    .from(analyses)
    .innerJoin(articles, eq(analyses.articleId, articles.id))
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(analyses.slug, slug));

  if (!analysis) return null;

  return {
    ...analysis,
    analysis: {
      ...analysis.analysis,
      updatedAt: analysis.analysis.updatedAt.toISOString(),
    },
    article: {
      ...analysis.article,
      publishedTime: analysis.article.publishedTime.toISOString(),
    },
  };
}
