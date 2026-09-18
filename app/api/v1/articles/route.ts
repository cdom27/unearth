import { after } from "next/server";
import { normalizeURL } from "@/app/_lib/normalize-url";
import { apiResponse } from "@/app/api/_lib/build-response";
import { analyzeArticle } from "./_lib/service";
import { acquireAnalysisSlot } from "./_lib/ip-analysis-limit";
import { ingestExaResults } from "./_lib/ingest-exa-results";

export async function POST(request: Request) {
  const releaseAnalysisSlot = acquireAnalysisSlot(request);

  if (!releaseAnalysisSlot) {
    return apiResponse(
      {
        message: "An article analysis is already in progress",
        data: null,
      },
      429,
    );
  }

  try {
    const body = (await request.json()) as { url: string };
    const url = body.url;

    if (!url) {
      return apiResponse({ message: "error", data: null }, 400);
    }

    const normalizedURL = normalizeURL(url);

    if (!normalizedURL) {
      return apiResponse(
        { message: "Unable to process source", data: null },
        500,
      );
    }

    const analysisResult = await analyzeArticle(normalizedURL);

    if (!analysisResult.success) {
      return apiResponse(
        { message: analysisResult.error, data: null },
        analysisResult.status ?? 400,
      );
    }

    after(() => ingestExaResults(analysisResult.slug, normalizedURL));

    return apiResponse({
      message: "Analysis Complete!",
      data: { slug: analysisResult.slug },
    });
  } catch (error) {
    console.error("error while processing article: ", error);
    return apiResponse({ message: "Unexpected Error", data: null }, 500);
  } finally {
    releaseAnalysisSlot();
  }
}
