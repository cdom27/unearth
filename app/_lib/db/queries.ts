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
    analysis: {
      summary: analysis.analysis.summary
        ? {
            tldr: analysis.analysis.summary.tldr?.trim() || null,
            insights: Array.isArray(analysis.analysis.summary.insights)
              ? analysis.analysis.summary.insights.filter(
                  (insight): insight is string =>
                    typeof insight === "string" && insight.trim().length > 0,
                )
              : [],
            quotes: Array.isArray(analysis.analysis.summary.quotes)
              ? analysis.analysis.summary.quotes
                  .map((quote) => ({
                    text: quote?.text?.trim() || null,
                    speaker: quote?.speaker?.trim() || null,
                  }))
                  .filter((quote) => quote.text || quote.speaker)
              : [],
          }
        : null,
      sentiment: analysis.analysis.sentiment?.trim() || null,
      framing: analysis.analysis.framing
        ? {
            narrative: analysis.analysis.framing.narrative?.trim() || null,
            terms: Array.isArray(analysis.analysis.framing.terms)
              ? analysis.analysis.framing.terms
              : [],
            devices: Array.isArray(analysis.analysis.framing.devices)
              ? analysis.analysis.framing.devices
              : [],
            sourcing: analysis.analysis.framing.sourcing
              ? {
                  balance:
                    analysis.analysis.framing.sourcing.balance || null,
                  notes:
                    analysis.analysis.framing.sourcing.notes?.trim() || null,
                }
              : null,
          }
        : null,
      claims: Array.isArray(analysis.analysis.claims)
        ? analysis.analysis.claims.map((claim) => ({
            content: claim.content,
            verification: claim.verification
              ? {
                  output: claim.verification.output
                    ? {
                        content: claim.verification.output.content || null,
                        grounding: Array.isArray(
                          claim.verification.output.grounding,
                        )
                          ? claim.verification.output.grounding
                          : [],
                      }
                    : null,
                }
              : null,
          }))
        : null,
      factualScore: analysis.analysis.factualScore,
      biasScore: analysis.analysis.biasScore,
      updatedAt: analysis.analysis.updatedAt.toISOString(),
    },
    article: {
      ...analysis.article,
      publishedTime: analysis.article.publishedTime.toISOString(),
    },
    source: analysis.source,
  };
}
