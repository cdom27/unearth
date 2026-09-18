import { useCallback, useState } from "react";
import type { ApiResponse } from "../api/_lib/build-response";
import { normalizeURL } from "../_lib/normalize-url";

export type AnalyzeArticleResult =
  | { kind: "success"; slug: string }
  | { kind: "unprocessable"; message: string }
  | { kind: "rate-limited"; message: string }
  | { kind: "error"; message: string };

export default function useArticle() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState("");

  const analyzeArticle = useCallback(
    async (url: string): Promise<AnalyzeArticleResult> => {
      setIsAnalyzing(true);

      // avoid duplicate analyses and api calls if source in known to be unprocessable
      const normalizedURL = normalizeURL(url);
      if (!normalizedURL) {
        setIsAnalyzing(false);
        setMessage("Unable to process source");
        return { kind: "unprocessable", message: "Unable to process source" };
      }

      try {
        const response = await fetch("/api/v1/articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });

        const result = (await response.json()) as ApiResponse<{ slug: string }>;

        if (result.data && response.ok) {
          setMessage(result.message);
          return { kind: "success", slug: result.data.slug };
        }

        setMessage(result.message);

        if (response.status === 422) {
          return { kind: "unprocessable", message: result.message };
        }

        if (response.status === 429) {
          return { kind: "rate-limited", message: result.message };
        }

        return { kind: "error", message: result.message };
      } catch {
        const errorMessage = "Unexpected error while processing article";
        setMessage(errorMessage);
        return { kind: "error", message: errorMessage };
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  return { analyzeArticle, isAnalyzing, message };
}
