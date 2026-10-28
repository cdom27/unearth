"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import FlagIcon from "@/app/_components/icons/flag";
import ExplanationPopover from "@/app/_components/ui/tooltip/explanation-popover";
import SideMenu from "@/app/_components/ui/side-menu/side-menu";
import Button from "@/app/_components/ui/button/button";
import { authClient } from "@/app/_lib/auth/auth-client";
import {
  getReportTargets,
  reportReasons,
  reportSectionLabels,
  type ReportSection,
} from "@/app/_lib/reporting/report-options";
import type { AnalysisDetails } from "@/app/_lib/types/analysis-details";

export default function ReportIssueMenu({
  slug,
  analysis,
  openOnLoad = false,
}: {
  slug: string;
  analysis: AnalysisDetails["analysis"];
  openOnLoad?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(openOnLoad);
  const [section, setSection] = useState<ReportSection | "">("");
  const [targetKey, setTargetKey] = useState("");
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const targets = useMemo(() => getReportTargets(analysis), [analysis]);
  const availableSections = Array.from(
    new Set(targets.map((target) => target.section)),
  );
  const sectionTargets = targets.filter((target) => target.section === section);
  const selectedTarget = sectionTargets.find(
    (target) => `${target.section}:${target.itemIndex ?? "single"}` === targetKey,
  );
  const reasons = section ? reportReasons[section] : [];

  useEffect(() => {
    if (openOnLoad) router.replace(pathname, { scroll: false });
  }, [openOnLoad, pathname, router]);

  function selectSection(value: string) {
    const nextSection = value as ReportSection | "";
    setSection(nextSection);
    const options = targets.filter((target) => target.section === nextSection);
    setTargetKey(
      options.length === 1
        ? `${options[0].section}:${options[0].itemIndex ?? "single"}`
        : "",
    );
    setReason("");
    setMessage("");
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!section || !selectedTarget || !reason) return;

    setIsSubmitting(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          analysisUpdatedAt: analysis.updatedAt,
          section,
          itemIndex: selectedTarget.itemIndex,
          reason,
          comment,
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Unable to submit your report.");

      setMessage(result.message || "Thanks. Your report has been submitted for review.");
      setSection("");
      setTargetKey("");
      setReason("");
      setComment("");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to submit your report. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ExplanationPopover content="Report an issue in this analysis" asChild>
        <button
          type="button"
          aria-label="Report an issue"
          aria-controls="report-issue-menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="duration-250 transition-all group bg-clay-900 hover:bg-clay-600 active:bg-clay-500 p-2 rounded-full cursor-pointer"
        >
          <FlagIcon className="size-4 text-clay-200 group-active:text-clay-50" filled />
        </button>
      </ExplanationPopover>

      <SideMenu
        open={isOpen}
        setOpen={setIsOpen}
        id="report-issue-menu"
        size="responsive"
        alignment="right"
        closeOnOverlayClick
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-serif">Report an issue</h2>
            <p className="text-sm text-clay-300">
              Report substantive problems with Unearth’s analysis, such as an inaccurate claim or a summary that misrepresents the article.
            </p>
          </div>

          {isPending ? (
            <p className="text-clay-300" role="status">Checking sign-in…</p>
          ) : !session ? (
            <div className="flex flex-col gap-4 rounded-md border border-clay-700 bg-clay-800 p-4">
              <p>Sign in to submit a report. Your report will be associated with your account.</p>
              <Link
                href={`/login?callbackURL=${encodeURIComponent(`/article/${slug}?report=1`)}`}
                className="min-h-11 inline-flex items-center justify-center rounded-md bg-brand-500 px-6 py-2 font-semibold text-clay-900 transition-colors hover:bg-brand-400"
              >
                Sign in to report
              </Link>
            </div>
          ) : targets.length === 0 ? (
            <p className="text-clay-300">There are no analysis details available to report yet.</p>
          ) : message && !isError ? (
            <div className="flex flex-col gap-4">
              <p role="status" className="rounded-md border border-clay-700 bg-clay-800 p-4">
                {message}
              </p>
              <Button
                type="button"
                variant="brand"
                onClick={() => {
                  setMessage("");
                  setIsError(false);
                }}
              >
                Report another issue
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={submitReport} className="flex min-h-0 flex-1 flex-col gap-5">
              <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1 menu-scrollbar">
                <Field label="What are you reporting?" htmlFor="report-section">
                  <select
                    id="report-section"
                    value={section}
                    onChange={(event) => selectSection(event.target.value)}
                    required
                    className="min-h-11 w-full rounded-md border border-clay-600 bg-clay-800 px-3 text-clay-50"
                  >
                    <option value="" disabled>Select a section</option>
                    {availableSections.map((value) => (
                      <option key={value} value={value}>{reportSectionLabels[value]}</option>
                    ))}
                  </select>
                </Field>

                {section && sectionTargets.length > 1 && (
                  <Field label={reportSectionLabels[section]} htmlFor="report-item">
                    <select
                      id="report-item"
                      value={targetKey}
                      onChange={(event) => setTargetKey(event.target.value)}
                      required
                      className="min-h-11 w-full rounded-md border border-clay-600 bg-clay-800 px-3 text-clay-50"
                    >
                      <option value="" disabled>Select an item</option>
                      {sectionTargets.map((target) => {
                        const key = `${target.section}:${target.itemIndex ?? "single"}`;
                        return <option key={key} value={key}>{target.label}</option>;
                      })}
                    </select>
                  </Field>
                )}

                {selectedTarget && (
                  <div className="rounded-md border border-clay-700 bg-clay-800 p-3">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-clay-300">Selected analysis</p>
                    <p className="line-clamp-5 text-sm">{selectedTarget.label}</p>
                  </div>
                )}

                {section && (
                  <Field label="Why are you reporting this?" htmlFor="report-reason">
                    <select
                      id="report-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      required
                      className="min-h-11 w-full rounded-md border border-clay-600 bg-clay-800 px-3 text-clay-50"
                    >
                      <option value="" disabled>Select a reason</option>
                      {reasons.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </Field>
                )}

                <Field label="Additional context (optional)" htmlFor="report-comment">
                  <textarea
                    id="report-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="What in the article or analysis supports this report?"
                    className="w-full rounded-md border border-clay-600 bg-clay-800 px-3 py-2 text-clay-50 placeholder:text-clay-400"
                  />
                </Field>
                {message && isError && <p role="alert" className="text-sm text-red-300">{message}</p>}
              </div>

              <div className="sticky bottom-0">
                <Button
                  type="submit"
                  variant="brand"
                  className="w-full"
                  disabled={!section || !selectedTarget || !reason || isSubmitting}
                >
                  {isSubmitting ? "Submitting…" : "Submit report"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </SideMenu>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
      children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-bold">{label}</label>
      {children}
    </div>
  );
}
