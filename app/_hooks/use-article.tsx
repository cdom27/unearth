import { useCallback, useState } from "react";
import type { ApiResponse } from "../api/_lib/build-response";
import { normalizeURL } from "../_lib/normalize-url";

export type AnalyzeArticleResult =
  | { kind: "success"; jobId: string }
  | { kind: "unprocessable"; message: string }
  | { kind: "rate-limited"; message: string; limit: AnalysisLimit }
  | { kind: "error"; message: string };

export type AnalysisLimit = {
  reason: "daily_limit" | "queue_full";
  audience: "guest" | "reader";
};

export default function useArticle() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [limit, setLimit] = useState<AnalysisLimit | null>(null);
  const clearLimit = useCallback(() => setLimit(null), []);

  const analyzeArticle = useCallback(
    async (url: string): Promise<AnalyzeArticleResult> => {
      setIsAnalyzing(true);
      setMessage("");
      setLimit(null);

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

        const result = (await response.json()) as ApiResponse<{
          jobId?: string;
          reason?: AnalysisLimit["reason"];
          audience?: AnalysisLimit["audience"];
        }>;

        if (result.data?.jobId && response.ok) {
          setMessage(result.message);
          return { kind: "success", jobId: result.data.jobId };
        }

        if (response.status === 429) {
          const reason = result.data?.reason;
          const audience = result.data?.audience;
          if (
            (reason === "daily_limit" || reason === "queue_full") &&
            (audience === "guest" || audience === "reader")
          ) {
            const limitInfo = { reason, audience };
            setLimit(limitInfo);
            return {
              kind: "rate-limited",
              message: result.message,
              limit: limitInfo,
            };
          }
          return { kind: "error", message: result.message };
        }

        setMessage(result.message);

        if (response.status === 422) {
          return { kind: "unprocessable", message: result.message };
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

  return {
    analyzeArticle,
    isAnalyzing,
    message,
    limit,
    clearLimit,
  };
}
