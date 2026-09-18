import { inArray } from "drizzle-orm";
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

export type ArticleIngestionCandidate = {
  url: string;
  title?: string | null;
  author?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  image?: string | null;
  sourceName?: string | null;
};

type NormalizedCandidate = ArticleIngestionCandidate & {
  submittedUrl: string;
  normalizedUrl: string;
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

async function ingestCandidate(candidate: NormalizedCandidate) {
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
      const sourceName =
        candidate.sourceName || parsedData.article.siteName || hostname;
      const [newSource] = await db
        .insert(sources)
        .values({
          name: sourceName,
          url: hostname,
          slug: slugify(sourceName),
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
        title: parsedData.article.title || candidate.title || "",
        language: parsedData.article.lang || "",
        byline: parsedData.article.byline || candidate.author || "",
        excerpt: parsedData.article.excerpt || candidate.excerpt || "",
        textContent: parsedData.article.textContent || "",
        publishedTime: getDateOrFallback(
          parsedData.article.publishedTime || candidate.publishedAt,
        ),
        keywords: parsedData.keywords || null,
        thumbnailUrl: parsedData.thumbnailURL || candidate.image || null,
      })
      .onConflictDoNothing({ target: articles.url });
  } catch (error) {
    console.error(
      `Unable to ingest article ${candidate.normalizedUrl}:`,
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

async function runWithConcurrency(candidates: NormalizedCandidate[]) {
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

export async function ingestArticles(
  inputCandidates: ArticleIngestionCandidate[],
) {
  const candidatesByUrl = new Map<string, NormalizedCandidate>();

  for (const candidate of inputCandidates) {
    try {
      const normalizedUrl = normalizeURL(candidate.url);

      if (!normalizedUrl) {
        await recordRejection(
          candidate.url,
          candidate.url,
          candidate.url,
          "blocked_url",
          [{ type: "url_normalization", value: "blocked_domain" }],
        );
        continue;
      }

      candidatesByUrl.set(normalizedUrl, {
        ...candidate,
        submittedUrl: candidate.url,
        normalizedUrl,
      });
    } catch (error) {
      await recordRejection(
        candidate.url,
        candidate.url,
        candidate.url,
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
    .where(
      inArray(
        articles.url,
        candidates.map((candidate) => candidate.normalizedUrl),
      ),
    );

  const existingUrls = new Set(existingArticles.map((article) => article.url));
  await runWithConcurrency(
    candidates.filter((candidate) => !existingUrls.has(candidate.normalizedUrl)),
  );
}
