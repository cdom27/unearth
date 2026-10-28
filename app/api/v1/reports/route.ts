import { getSession } from "@/app/_lib/auth/server";
import { db } from "@/app/_lib/db/client";
import { analysisReports } from "@/app/_lib/db/schema";
import { apiResponse } from "@/app/api/_lib/build-response";
import {
  getReportTargets,
  reportReasons,
  type ReportSection,
} from "@/app/_lib/reporting/report-options";
import type { AnalysisDetails } from "@/app/_lib/types/analysis-details";

function isReportSection(value: unknown): value is ReportSection {
  return typeof value === "string" && Object.hasOwn(reportReasons, value);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return apiResponse({ message: "Sign in to report an issue.", data: null }, 401);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const analysisUpdatedAt =
      typeof body.analysisUpdatedAt === "string" ? body.analysisUpdatedAt : "";
    const section = body.section;
    const itemIndex = body.itemIndex;
    const reason = typeof body.reason === "string" ? body.reason : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (
      !slug ||
      !analysisUpdatedAt ||
      !isReportSection(section) ||
      !(itemIndex === null ||
        (Number.isInteger(itemIndex) && Number(itemIndex) >= 0)) ||
      comment.length > 2000
    ) {
      return apiResponse({ message: "Check the report details and try again.", data: null }, 400);
    }

    if (!reportReasons[section].some((option) => option.value === reason)) {
      return apiResponse({ message: "Choose a valid report reason.", data: null }, 400);
    }

    const analysis = await db.query.analyses.findFirst({
      where: (table, { eq }) => eq(table.slug, slug),
    });
    if (!analysis) {
      return apiResponse({ message: "This analysis could not be found.", data: null }, 404);
    }

    if (analysis.updatedAt.toISOString() !== analysisUpdatedAt) {
      return apiResponse(
        { message: "This analysis has changed. Refresh the page and try again.", data: null },
        409,
      );
    }

    const reportableAnalysis = {
      summary: analysis.summary,
      claims: analysis.claims,
      framing: analysis.framing,
    } as AnalysisDetails["analysis"];
    const target = getReportTargets(reportableAnalysis).find(
      (candidate) =>
        candidate.section === section && candidate.itemIndex === itemIndex,
    );
    if (!target) {
      return apiResponse({ message: "Choose an item from this analysis.", data: null }, 400);
    }

    const validItemIndex = itemIndex as number | null;

    const [report] = await db
      .insert(analysisReports)
      .values({
        analysisId: analysis.id,
        articleId: analysis.articleId,
        userId: session.user.id,
        section,
        itemIndex: validItemIndex,
        reason,
        comment: comment || null,
        snapshot: {
          analysisUpdatedAt: analysis.updatedAt.toISOString(),
          target: target.snapshot,
        },
      })
      .returning({ id: analysisReports.id });

    return apiResponse(
      { message: "Thanks. Your report has been submitted for review.", data: report },
      201,
    );
  } catch (error) {
    console.error("Unable to submit analysis report:", error);
    return apiResponse(
      { message: "Unable to submit your report. Please try again.", data: null },
      500,
    );
  }
}
