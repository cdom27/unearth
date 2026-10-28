import type { AnalysisDetails } from "@/app/_lib/types/analysis-details";

export type ReportSection =
  | "summary"
  | "quote"
  | "claim"
  | "narrative"
  | "reportingBalance"
  | "term"
  | "device";

export type ReportReason = {
  value: string;
  label: string;
};

export type ReportTarget = {
  section: ReportSection;
  itemIndex: number | null;
  label: string;
  snapshot: Record<string, unknown>;
};

export const reportSectionLabels: Record<ReportSection, string> = {
  summary: "Summary",
  quote: "Direct quote",
  claim: "Claim and fact check",
  narrative: "Narrative",
  reportingBalance: "Reporting balance",
  term: "Term analysis",
  device: "Rhetorical device",
};

export const reportReasons: Record<ReportSection, ReportReason[]> = {
  summary: [
    { value: "inaccurate", label: "Misrepresents the article" },
    { value: "material_omission", label: "Omits a material point" },
    { value: "unsupported_detail", label: "Includes an unsupported detail" },
    { value: "malformed_data", label: "Summary data is malformed" },
  ],
  quote: [
    { value: "not_in_article", label: "Quote does not appear in the article" },
    { value: "misquoted", label: "Quote is materially inaccurate" },
    { value: "attribution_incorrect", label: "Speaker attribution is incorrect" },
    { value: "malformed_data", label: "Quote data is malformed" },
  ],
  claim: [
    { value: "not_stated", label: "Article does not make this claim" },
    { value: "verdict_incorrect", label: "Fact check verdict is incorrect" },
    { value: "findings_incorrect", label: "Findings or evidence are incorrect" },
    { value: "malformed_data", label: "Claim or fact-check data is malformed" },
  ],
  narrative: [
    { value: "misrepresents_article", label: "Misrepresents the article" },
    { value: "unsupported_analysis", label: "Analysis is unsupported" },
    { value: "malformed_data", label: "Narrative data is malformed" },
  ],
  reportingBalance: [
    { value: "balance_inaccurate", label: "Balance assessment is inaccurate" },
    { value: "unsupported_notes", label: "Notes are unsupported" },
    { value: "malformed_data", label: "Reporting-balance data is malformed" },
  ],
  term: [
    { value: "not_used", label: "Term is not used in the article" },
    { value: "tone_inaccurate", label: "Tone assessment is inaccurate" },
    { value: "unsupported_analysis", label: "Analysis is unsupported" },
    { value: "malformed_data", label: "Term data is malformed" },
  ],
  device: [
    { value: "example_not_in_article", label: "Example is not in the article" },
    { value: "device_misidentified", label: "Device is misidentified" },
    { value: "unsupported_analysis", label: "Analysis is unsupported" },
    { value: "malformed_data", label: "Device data is malformed" },
  ],
};

type AnalysisForReports = AnalysisDetails["analysis"];

export function getReportTargets(
  analysis: AnalysisForReports,
): ReportTarget[] {
  const targets: ReportTarget[] = [];

  if (typeof analysis.summary?.tldr === "string" && analysis.summary.tldr.trim()) {
    targets.push({
      section: "summary",
      itemIndex: null,
      label: "General summary",
      snapshot: { tldr: analysis.summary.tldr },
    });
  }

  const quotes = Array.isArray(analysis.summary?.quotes)
    ? analysis.summary.quotes
    : [];
  quotes.forEach((quote, itemIndex) => {
    if (!quote || typeof quote !== "object") return;
    if (!quote.text && !quote.speaker) return;
    targets.push({
      section: "quote",
      itemIndex,
      label: quote.text ? `“${quote.text}”` : quote.speaker || "Quote",
      snapshot: { ...quote },
    });
  });

  const claims = Array.isArray(analysis.claims) ? analysis.claims : [];
  claims.forEach((claim, itemIndex) => {
    if (!claim || typeof claim !== "object") return;
    targets.push({
      section: "claim",
      itemIndex,
      label: typeof claim.content === "string" ? claim.content : `Claim ${itemIndex + 1}`,
      snapshot: { ...claim },
    });
  });

  if (
    typeof analysis.framing?.narrative === "string" &&
    analysis.framing.narrative.trim()
  ) {
    targets.push({
      section: "narrative",
      itemIndex: null,
      label: "The narrative",
      snapshot: { narrative: analysis.framing.narrative },
    });
  }

  const sourcing = analysis.framing?.sourcing;
  if (
    sourcing &&
    typeof sourcing === "object" &&
    (sourcing.balance || (typeof sourcing.notes === "string" && sourcing.notes.trim()))
  ) {
    targets.push({
      section: "reportingBalance",
      itemIndex: null,
      label: "Reporting balance",
      snapshot: { ...sourcing },
    });
  }

  const terms = Array.isArray(analysis.framing?.terms)
    ? analysis.framing.terms
    : [];
  terms.forEach((term, itemIndex) => {
    if (!term || typeof term !== "object") return;
    targets.push({
      section: "term",
      itemIndex,
      label: typeof term.term === "string" ? term.term : `Term ${itemIndex + 1}`,
      snapshot: { ...term },
    });
  });

  const devices = Array.isArray(analysis.framing?.devices)
    ? analysis.framing.devices
    : [];
  devices.forEach((device, itemIndex) => {
    if (!device || typeof device !== "object") return;
    targets.push({
      section: "device",
      itemIndex,
      label:
        typeof device.device === "string"
          ? device.device
          : `Rhetorical device ${itemIndex + 1}`,
      snapshot: { ...device },
    });
  });

  return targets;
}
