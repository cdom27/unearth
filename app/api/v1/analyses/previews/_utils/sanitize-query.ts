import type { Params } from "@/app/_lib/types/preview-params";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 50;
const DEFAULT_SORT: Params["sorting"] = "newest";
const VALID_SORTS: Params["sorting"][] = ["newest", "oldest", "factualScore"];
const VALID_SENTIMENTS = ["negative", "mixed", "positive"];
const SCORE_MIN = 0;
const SCORE_MAX = 1;
const MAX_SEARCH_LENGTH = 200;

function resolveToNumber(
  value: string | null,
  fallback: number,
  max?: number,
): number {
  const parsed = value ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

function parseArrayParam(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function validateSort(value: string | null): Params["sorting"] {
  if (value && VALID_SORTS.includes(value as Params["sorting"])) {
    return value as Params["sorting"];
  }
  return DEFAULT_SORT;
}

function validateSentiments(value: string | null): string[] | undefined {
  const parsed = parseArrayParam(value);
  if (!parsed) return undefined;
  const filtered = parsed.filter((s) => VALID_SENTIMENTS.includes(s));
  return filtered.length ? filtered : undefined;
}

function resolveScore(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < SCORE_MIN || parsed > SCORE_MAX) {
    return undefined;
  }
  return parsed;
}

function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function resolveDateRange(
  minValue: string | null,
  maxValue: string | null,
): { min?: string; max?: string } {
  const min = minValue && isValidDateString(minValue) ? minValue : undefined;
  const max = maxValue && isValidDateString(maxValue) ? maxValue : undefined;

  // if both present but out of order, drop both rather than guess intent
  if (min && max && new Date(min) > new Date(max)) {
    return {};
  }

  return { min, max };
}

export function sanitizePreviewsQuery(searchParams: URLSearchParams): Params {
  const { min: minPublishedAt, max: maxPublishedAt } = resolveDateRange(
    searchParams.get("minPublishedAt"),
    searchParams.get("maxPublishedAt"),
  );
  const minFactualScore = resolveScore(searchParams.get("minFactualScore"));
  const maxFactualScore = resolveScore(searchParams.get("maxFactualScore"));
  const minBiasScore = resolveScore(searchParams.get("minBiasScore"));
  const maxBiasScore = resolveScore(searchParams.get("maxBiasScore"));

  return {
    search:
      searchParams.get("q")?.trim().slice(0, MAX_SEARCH_LENGTH) || undefined,
    pagination: {
      page: resolveToNumber(searchParams.get("page"), DEFAULT_PAGE),
      pageSize: resolveToNumber(
        searchParams.get("pageSize"),
        DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE,
      ),
    },
    sorting: validateSort(searchParams.get("sort")),
    includeUnanalyzed: searchParams.get("includeUnanalyzed") === "true",
    filters: {
      minFactualScore:
        minFactualScore !== undefined &&
        maxFactualScore !== undefined &&
        minFactualScore > maxFactualScore
          ? undefined
          : minFactualScore,
      maxFactualScore:
        minFactualScore !== undefined &&
        maxFactualScore !== undefined &&
        minFactualScore > maxFactualScore
          ? undefined
          : maxFactualScore,
      minBiasScore:
        minBiasScore !== undefined && maxBiasScore !== undefined && minBiasScore > maxBiasScore
          ? undefined
          : minBiasScore,
      maxBiasScore:
        minBiasScore !== undefined && maxBiasScore !== undefined && minBiasScore > maxBiasScore
          ? undefined
          : maxBiasScore,
      sentiments: validateSentiments(searchParams.get("sentiments")),
      minPublishedAt,
      maxPublishedAt,
      sources: parseArrayParam(searchParams.get("sources")),
      biases: parseArrayParam(searchParams.get("biases")),
      countries: parseArrayParam(searchParams.get("countries")),
      mediaTypes: parseArrayParam(searchParams.get("mediaTypes")),
      credibilities: parseArrayParam(searchParams.get("credibilities")),
    },
  };
}
