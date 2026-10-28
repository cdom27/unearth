const DEFAULT_MIN_WORDS = 120;
const NAV_PROMO_PATTERNS = [
  /\b(sign up|subscribe|newsletter|cookie settings|privacy policy|terms of service|all rights reserved|follow us|download our app|advertisement|sponsored content)\b/gi,
];

export type ContentQuality = {
  accepted: boolean;
  wordCount: number;
  failedCheck: string | null;
  signals: { type: string; value: string }[];
};

export function checkContentQuality(text: string): ContentQuality {
  const normalized = text.replace(/\s+/g, " ").trim();
  const words = normalized.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
  const wordCount = words.length;
  const minimum = Math.max(1, Number(process.env.ARTICLE_MIN_WORD_COUNT) || DEFAULT_MIN_WORDS);
  const boilerplateCount = NAV_PROMO_PATTERNS.reduce(
    (count, pattern) => count + (normalized.match(pattern) ?? []).length,
    0,
  );
  const boilerplateRatio = wordCount ? boilerplateCount / wordCount : 0;
  const repeatedLineCount = normalized.split(/(?<=[.!?])\s+/).filter((line, i, all) => line.length > 30 && all.indexOf(line) !== i).length;
  const failedCheck = !wordCount
    ? "empty_text"
    : wordCount < minimum
      ? "below_minimum_word_count"
      : boilerplateRatio > 0.08
        ? "boilerplate_dominated"
        : repeatedLineCount >= 3
          ? "repeated_boilerplate"
          : null;
  return {
    accepted: failedCheck === null,
    wordCount,
    failedCheck,
    signals: [
      { type: "content_word_count", value: String(wordCount) },
      { type: "minimum_word_count", value: String(minimum) },
      { type: "boilerplate_phrase_count", value: String(boilerplateCount) },
      { type: "boilerplate_ratio", value: boilerplateRatio.toFixed(4) },
      { type: "repeated_line_count", value: String(repeatedLineCount) },
      ...(failedCheck ? [{ type: "failed_check", value: failedCheck }] : []),
    ],
  };
}
