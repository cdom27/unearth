import { after } from "next/server";
import { apiResponse } from "../../_lib/build-response";
import { ingestBreakingNewsArticles } from "./_lib/ingest";
import { fetchBreakingNews } from "./_lib/service";

export async function GET() {
  try {
    const newsAPIResponse = await fetchBreakingNews(200);

    if (!newsAPIResponse.success) {
      return apiResponse({
        message: newsAPIResponse.error,
        data: null,
      });
    }

    after(() => ingestBreakingNewsArticles(newsAPIResponse.data.articles));

    return apiResponse({
      message: "Results fetched!",
      data: newsAPIResponse.data,
    });
  } catch (error) {
    console.error("Error while fetching breaking news: ", error);
    return apiResponse({
      message: "Unexpected error while fetching breaking news",
      data: null,
    });
  }
}
