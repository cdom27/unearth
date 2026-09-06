import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import type { ParsedArticleDTO } from "../dtos/article";
import nlp from "compromise";
import { slugify } from "./slugify";

function extractOgImage(html: string): string | null {
  const match =
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    );
  return match?.[1] ?? null;
}

function extractKeywords(title: string) {
  const doc = nlp(title);

  let nouns: string[] = doc.nouns().out("array");
  nouns = nouns.filter((w) => !/^(he|she|they|it|we|I)$/i.test(w));

  const keywordArray = Array.from(new Set([...nouns]));
  return keywordArray.join(" ").toLowerCase();
}

export async function parseArticle(html: string) {
  const { document } = parseHTML(html);
  const article = new Readability(document).parse();
  const thumbnailURL = extractOgImage(html);

  if (!article) {
    return null;
  }

  const keywords = article.title ? extractKeywords(article.title) : "";
  const slug = slugify(article.title ?? "");

  return {
    thumbnailURL,
    article,
    keywords,
    slug,
  } as ParsedArticleDTO;
}
