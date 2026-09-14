import {
  articles,
  sources,
  analyses,
  rejectedSubmissions,
} from "@/app/_lib/db/schema";
import type { ParsedArticleDTO } from "./dtos/article";
import { parseArticle } from "./utils/parse-article";
import { db } from "@/app/_lib/db/client";
import { slugify } from "./utils/slugify";
import { anthropic } from "./utils/ai/anthropic/anthropic";
import type { AnalysisResultDTO } from "./dtos/analysis-result";
import type { SummaryDTO } from "./dtos/summary";
import type { AnalysisDTO } from "./dtos/analysis";
import { eq, sql } from "drizzle-orm";
import type { ClaimExtractionDTO } from "./dtos/claim-extraction";
import { exaLimiter, search } from "./utils/ai/exa/exa";
import type { Claim } from "./types/claim";
import { inspectMediaSubmission } from "./utils/inspect-media-submission";

async function updateTaskStatus(
  analysisId: string,
  statusColumn:
    | "summaryStatus"
    | "rhetoricalAnalysisStatus"
    | "claimExtractionStatus"
    | "claimVerificationStatus"
    | "factualScoreStatus",
  status: "pending" | "running" | "completed",
) {
  await db
    .update(analyses)
    .set({ [statusColumn]: status })
    .where(eq(analyses.id, analysisId));
}

async function runSummary(analysisId: string, textContent: string) {
  const analysis = await db.query.analyses.findFirst({
    where: (analyses, { eq }) => eq(analyses.id, analysisId),
  });

  if (!analysis || analysis.summaryStatus === "completed") return;

  await updateTaskStatus(analysisId, "summaryStatus", "running");
  const startedAt = performance.now();

  try {
    const response = await anthropic("claude-haiku-4-5", "summarize", textContent);

    if (!response.data) throw new Error("No summary data returned");

    await db
      .update(analyses)
      .set({
        summary: response.data as SummaryDTO,
        summaryStatus: "completed",
        meta: sql`jsonb_set(
          coalesce(${analyses.meta}, '{}'::jsonb),
          '{summary}',
          ${JSON.stringify({
            ...response.meta,
            durationMs:
              Math.round((performance.now() - startedAt) * 100) / 100,
          })}::jsonb,
          true
        )`,
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId));
  } catch (error) {
    await updateTaskStatus(analysisId, "summaryStatus", "pending");
    throw error;
  }
}

async function runRhetoricalAnalysis(analysisId: string, textContent: string) {
  const analysis = await db.query.analyses.findFirst({
    where: (analyses, { eq }) => eq(analyses.id, analysisId),
  });

  if (!analysis || analysis.rhetoricalAnalysisStatus === "completed") return;

  await updateTaskStatus(analysisId, "rhetoricalAnalysisStatus", "running");
  const startedAt = performance.now();

  try {
    const response = await anthropic("claude-sonnet-4-6", "analyze", textContent);

    if (!response.data) throw new Error("No rhetorical analysis data returned");

    const data = response.data as AnalysisDTO;

    await db
      .update(analyses)
      .set({
        sentiment: data.sentiment,
        framing: data.framing,
        biasScore: data.biasScore,
        rhetoricalAnalysisStatus: "completed",
        meta: sql`jsonb_set(
          coalesce(${analyses.meta}, '{}'::jsonb),
          '{analysis}',
          ${JSON.stringify({
            ...response.meta,
            durationMs:
              Math.round((performance.now() - startedAt) * 100) / 100,
          })}::jsonb,
          true
        )`,
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId));
  } catch (error) {
    await updateTaskStatus(analysisId, "rhetoricalAnalysisStatus", "pending");
    throw error;
  }
}

async function runClaimExtraction(analysisId: string, textContent: string) {
  const analysis = await db.query.analyses.findFirst({
    where: (analyses, { eq }) => eq(analyses.id, analysisId),
  });

  if (!analysis || analysis.claimExtractionStatus === "completed") return;

  await updateTaskStatus(analysisId, "claimExtractionStatus", "running");
  const startedAt = performance.now();

  try {
    const response = await anthropic("claude-sonnet-4-6", "extract", textContent);

    if (!response.data) throw new Error("No claim extraction data returned");

    const data = response.data as ClaimExtractionDTO;
    const claims: Claim[] = data.claims.map((content) => ({
      content,
      verification: null,
    }));

    await db
      .update(analyses)
      .set({
        claims,
        claimExtractionStatus: "completed",
        meta: sql`jsonb_set(
          coalesce(${analyses.meta}, '{}'::jsonb),
          '{claimExtraction}',
          ${JSON.stringify({
            ...response.meta,
            claimCount: claims.length,
            durationMs:
              Math.round((performance.now() - startedAt) * 100) / 100,
          })}::jsonb,
          true
        )`,
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId));
  } catch (error) {
    await updateTaskStatus(analysisId, "claimExtractionStatus", "pending");
    throw error;
  }
}

async function runClaimVerification(analysisId: string) {
  const analysis = await db.query.analyses.findFirst({
    where: (analyses, { eq }) => eq(analyses.id, analysisId),
  });

  if (
    !analysis ||
    analysis.claimExtractionStatus !== "completed" ||
    analysis.claimVerificationStatus === "completed"
  ) {
    return;
  }

  await updateTaskStatus(analysisId, "claimVerificationStatus", "running");
  const startedAt = performance.now();

  try {
    const claims = (analysis.claims as Claim[] | null) ?? [];
    const verificationResults: {
      verification: Awaited<ReturnType<typeof search>>["data"];
      meta: Awaited<ReturnType<typeof search>>["meta"];
    }[] = [];

    const results = await Promise.all(
      claims.map((claim) =>
        exaLimiter.schedule(() => search(claim.content)),
      ),
    );

    verificationResults.push(
      ...results.map((result) => ({
        verification: result.data,
        meta: result.meta,
      })),
    );

    const verifiedClaims = claims.map((claim, index) => ({
      ...claim,
      verification: verificationResults[index].verification,
    }));

    await db
      .update(analyses)
      .set({
        claims: verifiedClaims,
        claimVerificationStatus: "completed",
        meta: sql`jsonb_set(
          coalesce(${analyses.meta}, '{}'::jsonb),
          '{claimVerification}',
          ${JSON.stringify({
            model: "deep-lite",
            durationMs:
              Math.round((performance.now() - startedAt) * 100) / 100,
            requestCount: verificationResults.length,
            requests: verificationResults.map((result) => result.meta),
          })}::jsonb,
          true
        )`,
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId));
  } catch (error) {
    await updateTaskStatus(analysisId, "claimVerificationStatus", "pending");
    throw error;
  }
}

async function runFactualScore(analysisId: string) {
  const analysis = await db.query.analyses.findFirst({
    where: (analyses, { eq }) => eq(analyses.id, analysisId),
  });

  if (
    !analysis ||
    analysis.claimVerificationStatus !== "completed" ||
    analysis.factualScoreStatus === "completed"
  ) {
    return;
  }

  await updateTaskStatus(analysisId, "factualScoreStatus", "running");
  const startedAt = performance.now();

  try {
    const claims = (analysis.claims as Claim[] | null) ?? [];
    const verdictScores = {
      true: 1,
      mixed: 0.5,
      false: 0,
    } as const;

    const scores = claims
      .map((claim) => claim.verification?.output?.content?.verdict)
      .filter(
        (verdict): verdict is keyof typeof verdictScores =>
          verdict === "true" || verdict === "mixed" || verdict === "false",
      );

    const factualScore =
      scores.length > 0
        ? Number(
            (
              scores.reduce(
                (sum, verdict) => sum + verdictScores[verdict],
                0,
              ) / scores.length
            ).toFixed(2),
          )
        : -1;

    await db
      .update(analyses)
      .set({
        factualScore,
        factualScoreStatus: "completed",
        meta: sql`jsonb_set(
          coalesce(${analyses.meta}, '{}'::jsonb),
          '{factualScore}',
          ${JSON.stringify({
            durationMs:
              Math.round((performance.now() - startedAt) * 100) / 100,
          })}::jsonb,
          true
        )`,
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, analysisId));
  } catch (error) {
    await updateTaskStatus(analysisId, "factualScoreStatus", "pending");
    throw error;
  }
}

export async function analyzeArticle(url: string): Promise<AnalysisResultDTO> {
  const startedAt = performance.now();
  let parsingDurationMs: number | undefined;

  try {
    const hostname = new URL(url).hostname;

    let article = await db.query.articles.findFirst({
      where: (articles, { eq }) => eq(articles.url, url),
    });

    let parsedData;

    if (!article) {
      const inspection = await inspectMediaSubmission(url);

      if (inspection.rejected) {
        await db.insert(rejectedSubmissions).values({
          submittedUrl: url,
          normalizedUrl: url,
          finalUrl: inspection.finalUrl,
          rejectionReason: inspection.reason,
          detectionSignals: inspection.signals,
        });

        return {
          success: false,
          error:
            inspection.reason === "known_video_platform"
              ? "Video submissions are not supported"
              : "Unable to fetch submitted page",
          status: 422,
        };
      }

      const parsingStartedAt = performance.now();
      parsedData = (await parseArticle(inspection.html)) as ParsedArticleDTO;
      parsingDurationMs =
        Math.round((performance.now() - parsingStartedAt) * 100) / 100;

      if (!parsedData || !parsedData.article) {
        await db.insert(rejectedSubmissions).values({
          submittedUrl: url,
          normalizedUrl: url,
          finalUrl: inspection.finalUrl,
          rejectionReason: "parse_failed",
          detectionSignals: [
            {
              type: "readability_parse",
              value: "no_article_content",
            },
          ],
        });

        return {
          success: false,
          error: "Unable to parse article",
          status: 422,
        };
      }

      let source = await db.query.sources.findFirst({
        where: (sources, { eq }) => eq(sources.url, hostname),
      });

      if (!source) {
        const newSource = await db
          .insert(sources)
          .values({
            name: parsedData.article.siteName || "",
            url: hostname,
            slug: slugify(parsedData.article.siteName || hostname),
          })
          .returning();

        source = newSource[0];
      }

      const newArticle = await db
        .insert(articles)
        .values({
          sourceId: source.id,
          url,
          title: parsedData.article.title || "",
          language: parsedData.article.lang || "",
          byline: parsedData.article.byline || "",
          excerpt: parsedData.article.excerpt || "",
          textContent: parsedData.article.textContent || "",
          publishedTime: parsedData.article.publishedTime
            ? new Date(parsedData.article.publishedTime)
            : new Date(),
          createdAt: new Date(),
          keywords: parsedData.keywords || null,
          thumbnailUrl: parsedData.thumbnailURL || null,
        })
        .returning();

      article = newArticle[0];

      if (!article) {
        return {
          success: false,
          error: "Unexpected error while processing article",
        };
      }
    }

    let analysis = await db.query.analyses.findFirst({
      where: (analyses, { eq }) => eq(analyses.articleId, article.id),
    });

    if (!analysis) {
      const newAnalysis = await db
        .insert(analyses)
        .values({
          articleId: article.id,
          slug: slugify(article.title),
          meta: {
            summary: null,
            analysis: null,
            claimExtraction: null,
            claimVerification: null,
            pipeline: null,
          },
        })
        .returning();

      analysis = newAnalysis[0];
    }

    if (!analysis) {
      return { success: false, error: "Unexpected error" };
    }

    const analysisId = analysis.id;
    const analysisSlug = analysis.slug;
    const textContent = article.textContent;

    const summaryPromise = runSummary(analysisId, textContent);
    const rhetoricalAnalysisPromise = runRhetoricalAnalysis(
      analysisId,
      textContent,
    );
    const verificationPipelinePromise = runClaimExtraction(
      analysisId,
      textContent,
    )
      .then(() => runClaimVerification(analysisId))
      .then(() => runFactualScore(analysisId));

    const results = await Promise.allSettled([
      summaryPromise,
      rhetoricalAnalysisPromise,
      verificationPipelinePromise,
    ]);

    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    const pipelineMeta = {
      totalDurationMs:
        Math.round((performance.now() - startedAt) * 100) / 100,
      ...(parsingDurationMs === undefined ? {} : { parsingDurationMs }),
      completedAtISO: new Date().toISOString(),
    };

    try {
      await db
        .update(analyses)
        .set({
          meta: sql`jsonb_set(
            coalesce(${analyses.meta}, '{}'::jsonb),
            '{pipeline}',
            ${JSON.stringify(pipelineMeta)}::jsonb,
            true
          )`,
          updatedAt: new Date(),
        })
        .where(eq(analyses.id, analysisId));
    } catch (error) {
      console.error("Unable to record analysis timing metrics:", error);
    }

    if (failure) {
      console.error("One or more analysis tasks failed:", failure.reason);
      return { success: false, error: "Unable to complete article analysis" };
    }

    return { success: true, slug: analysisSlug };
  } catch (error) {
    console.error("Unexpected error when processing the URL:", url, error);

    return {
      success: false,
      error: "Unexpected error while processing article",
    };
  }
}
