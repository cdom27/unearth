import { db } from "@/app/_lib/db/client";
import { analyses, articles, sources } from "@/app/_lib/db/schema";
import type { Params } from "@/app/_lib/types/preview-params";
import {
  eq,
  gte,
  lte,
  inArray,
  and,
  asc,
  desc,
  count,
  isNotNull,
  sql,
  type SQL,
} from "drizzle-orm";

function buildWhereClause(
  filters: Params["filters"],
  search?: string,
): SQL | undefined {
  const conditions: SQL[] = [];

  if (search) {
    conditions.push(
      sql`(
        setweight(to_tsvector('english', ${articles.title}), 'A') ||
        setweight(to_tsvector('english', ${articles.textContent}), 'B')
      ) @@ websearch_to_tsquery('english', ${search})`,
    );
  }

  if (!filters) return conditions.length ? and(...conditions) : undefined;

  if (filters.minFactualScore !== undefined) {
    conditions.push(gte(analyses.factualScore, filters.minFactualScore));
  }
  if (filters.maxFactualScore !== undefined) {
    conditions.push(lte(analyses.factualScore, filters.maxFactualScore));
  }
  if (filters.minBiasScore !== undefined) {
    conditions.push(gte(analyses.biasScore, filters.minBiasScore));
  }
  if (filters.maxBiasScore !== undefined) {
    conditions.push(lte(analyses.biasScore, filters.maxBiasScore));
  }
  if (filters.sentiments?.length) {
    conditions.push(inArray(analyses.sentiment, filters.sentiments));
  }
  if (filters.minPublishedAt) {
    conditions.push(
      gte(articles.publishedTime, new Date(filters.minPublishedAt)),
    );
  }
  if (filters.maxPublishedAt) {
    conditions.push(
      lte(
        articles.publishedTime,
        new Date(
          /^\d{4}-\d{2}-\d{2}$/.test(filters.maxPublishedAt)
            ? `${filters.maxPublishedAt}T23:59:59.999Z`
            : filters.maxPublishedAt,
        ),
      ),
    );
  }
  if (filters.sources?.length) {
    conditions.push(inArray(sources.slug, filters.sources));
  }
  if (filters.biases?.length) {
    conditions.push(inArray(sources.bias, filters.biases));
  }
  if (filters.countries?.length) {
    conditions.push(inArray(sources.country, filters.countries));
  }
  if (filters.mediaTypes?.length) {
    conditions.push(inArray(sources.mediaType, filters.mediaTypes));
  }
  if (filters.credibilities?.length) {
    conditions.push(inArray(sources.credibility, filters.credibilities));
  }

  return conditions.length ? and(...conditions) : undefined;
}

function getOrderBy(sorting: Params["sorting"]) {
  switch (sorting) {
    case "newest":
      return [desc(articles.publishedTime), desc(articles.id)];
    case "oldest":
      return [asc(articles.publishedTime), asc(articles.id)];
    case "factualScore":
      return [
        sql`CASE WHEN ${analyses.id} IS NULL THEN 1 ELSE 0 END`,
        desc(analyses.factualScore),
        desc(articles.publishedTime),
        desc(articles.id),
      ];
  }
}

export async function queryAnalysesPreviews({
  pagination: { page = 1, pageSize },
  search,
  filters,
  sorting,
  includeUnanalyzed = false,
}: Params) {
  const offset = (page - 1) * pageSize;
  const whereClause = buildWhereClause(filters, search);
  const combinedWhereClause = includeUnanalyzed
    ? whereClause
    : and(whereClause, isNotNull(analyses.id));
  const orderByClause = getOrderBy(sorting);

  const [rows, totalResultsQuery] = await Promise.all([
    db
      .select({
        articleId: articles.id,
        analysisId: analyses.id,
        slug: analyses.slug,
        sentiment: analyses.sentiment,
        factualScore: analyses.factualScore,
        biasScore: analyses.biasScore,
        articleTitle: articles.title,
        articleExcerpt: articles.excerpt,
        articleUrl: articles.url,
        articleThumbnailUrl: articles.thumbnailUrl,
        articlePublishedTime: articles.publishedTime,
        sourceName: sources.name,
        sourceBias: sources.bias,
      })
      .from(articles)
      .leftJoin(analyses, eq(analyses.articleId, articles.id))
      .innerJoin(sources, eq(articles.sourceId, sources.id))
      .where(combinedWhereClause)
      .orderBy(...orderByClause)
      .limit(pageSize)
      .offset(offset),

    db
      .select({ count: count() })
      .from(articles)
      .leftJoin(analyses, eq(analyses.articleId, articles.id))
      .innerJoin(sources, eq(articles.sourceId, sources.id))
      .where(combinedWhereClause),
  ]);

  const totalResults = totalResultsQuery[0]?.count ?? 0;

  return { rows, totalResults };
}
