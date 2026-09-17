import { inArray } from "drizzle-orm";
import type { BreakingNews } from "@/app/_lib/types/breaking-news";
import { normalizeURL } from "@/app/_lib/normalize-url";
import { db } from "@/app/_lib/db/client";
import {
  articles,
  rejectedSubmissions,
  sources,
} from "@/app/_lib/db/schema";
import { inspectMediaSubmission } from "@/app/api/v1/articles/_lib/utils/inspect-media-submission";
import { parseArticle } from "@/app/api/v1/articles/_lib/utils/parse-article";
import { slugify } from "@/app/api/v1/articles/_lib/utils/slugify";

const MAX_CONCURRENT_INGESTIONS = 5;

type IngestionCandidate = {
  submittedUrl: string;
  normalizedUrl: string;
  article: BreakingNews["article"];
  sourceName: string;
};

function getDateOrFallback(value: string | null | undefined) {
  if (!value) return new Date();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function recordRejection(
  submittedUrl: string,
  normalizedUrl: string,
  finalUrl: string | null,
  reason: string,
  signals: { type: string; value: string }[],
) {
  await db.insert(rejectedSubmissions).values({
    submittedUrl,
    normalizedUrl,
    finalUrl,
    rejectionReason: reason,
    detectionSignals: signals,
  });
}

async function ingestCandidate(candidate: IngestionCandidate) {
  try {
    const inspection = await inspectMediaSubmission(candidate.normalizedUrl);

    if (inspection.rejected) {
      await recordRejection(
        candidate.submittedUrl,
        candidate.normalizedUrl,
        inspection.finalUrl,
        inspection.reason,
        inspection.signals,
      );
      return;
    }

    const parsedData = await parseArticle(inspection.html);

    if (!parsedData?.article) {
      await recordRejection(
        candidate.submittedUrl,
        candidate.normalizedUrl,
        inspection.finalUrl,
        "parse_failed",
        [{ type: "readability_parse", value: "no_article_content" }],
      );
      return;
    }

    const hostname = new URL(candidate.normalizedUrl).hostname;
    let source = await db.query.sources.findFirst({
      where: (source, { eq }) => eq(source.url, hostname),
    });

    if (!source) {
      const [newSource] = await db
        .insert(sources)
        .values({
          name: candidate.sourceName || parsedData.article.siteName || hostname,
          url: hostname,
          slug: slugify(candidate.sourceName || parsedData.article.siteName || hostname),
        })
        .returning();

      source = newSource;
    }

    if (!source) {
      throw new Error(`Unable to create source for ${candidate.normalizedUrl}`);
    }

    await db
      .insert(articles)
      .values({
        sourceId: source.id,
        url: candidate.normalizedUrl,
        title: parsedData.article.title || candidate.article.title,
        language: parsedData.article.lang || "",
        byline: parsedData.article.byline || candidate.article.byline || "",
        excerpt:
          parsedData.article.excerpt || candidate.article.excerpt || "",
        textContent: parsedData.article.textContent || "",
        publishedTime: getDateOrFallback(
          parsedData.article.publishedTime || candidate.article.publishedAt,
        ),
        keywords: parsedData.keywords || null,
        thumbnailUrl:
          parsedData.thumbnailURL || candidate.article.thumbnailUrl || null,
      })
      .onConflictDoNothing({ target: articles.url });
  } catch (error) {
    console.error(
      `Unable to ingest breaking news article ${candidate.normalizedUrl}:`,
      error,
    );

    await recordRejection(
      candidate.submittedUrl,
      candidate.normalizedUrl,
      null,
      "ingestion_failed",
      [
        {
          type: "error",
          value: error instanceof Error ? error.message : "unknown_error",
        },
      ],
    );
  }
}

async function runWithConcurrency(candidates: IngestionCandidate[]) {
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < candidates.length) {
      const candidate = candidates[nextIndex++];
      await ingestCandidate(candidate);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(MAX_CONCURRENT_INGESTIONS, candidates.length) },
      worker,
    ),
  );
}

export async function ingestBreakingNewsArticles(articlesToIngest: BreakingNews[]) {
  const candidatesByUrl = new Map<string, IngestionCandidate>();

  for (const article of articlesToIngest) {
    try {
      const normalizedUrl = normalizeURL(article.article.url);

      if (!normalizedUrl) {
        await recordRejection(
          article.article.url,
          article.article.url,
          article.article.url,
          "blocked_url",
          [{ type: "url_normalization", value: "blocked_domain" }],
        );
        continue;
      }

      candidatesByUrl.set(normalizedUrl, {
        submittedUrl: article.article.url,
        normalizedUrl,
        article: article.article,
        sourceName: article.source.name,
      });
    } catch (error) {
      await recordRejection(
        article.article.url,
        article.article.url,
        article.article.url,
        "invalid_url",
        [
          {
            type: "url_normalization",
            value: error instanceof Error ? error.message : "unknown_error",
          },
        ],
      );
    }
  }

  const candidates = [...candidatesByUrl.values()];
  if (!candidates.length) return;

  const existingArticles = await db
    .select({ url: articles.url })
    .from(articles)
    .where(inArray(articles.url, candidates.map((candidate) => candidate.normalizedUrl)));

  const existingUrls = new Set(existingArticles.map((article) => article.url));
  await runWithConcurrency(
    candidates.filter((candidate) => !existingUrls.has(candidate.normalizedUrl)),
  );
}
