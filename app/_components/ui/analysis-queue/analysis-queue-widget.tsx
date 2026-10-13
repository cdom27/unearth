"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../button/button";
import XIcon from "../../icons/x";
import TrashIcon from "../../icons/trash";

type QueueJob = {
  id: string;
  articleUrl: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  message: string | null;
  resultSlug: string | null;
  createdAt: string;
};

export default function AnalysisQueueWidget() {
  const router = useRouter();
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [open, setOpen] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState("");

  async function removeJob(jobId: string) {
    setRemovingIds((ids) => [...ids, jobId]);
    setActionMessage("");
    try {
      const response = await fetch("/api/v1/analysis-queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setActionMessage(payload.message ?? "Unable to remove queue item");
        return false;
      }
      setJobs((current) => current.filter((job) => job.id !== jobId));
      if (jobs.length === 1) setOpen(false);
      return true;
    } catch {
      setActionMessage("Unable to remove queue item. Please try again.");
      return false;
    } finally {
      setRemovingIds((ids) => ids.filter((id) => id !== jobId));
    }
  }

  async function viewAnalysis(job: QueueJob) {
    await removeJob(job.id);
    if (job.resultSlug) router.push(`/article/${job.resultSlug}`);
  }

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/v1/analysis-queue", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (active && response.ok && Array.isArray(payload.data)) {
          setJobs(payload.data);
          if (payload.data.length === 0) setOpen(false);
        }
      } catch {
        // keep the last known queue visible during transient network errors
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 4000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const activeCount = jobs.filter(
    (job) => job.status === "queued" || job.status === "running",
  ).length;
  const hasJobs = jobs.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={hasJobs && open}
        aria-controls="analysis-queue-panel"
        aria-hidden={!hasJobs}
        tabIndex={hasJobs ? 0 : -1}
        disabled={!hasJobs}
        className={`cursor-pointer fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-clay-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 sm:bottom-5 hover:bg-clay-800 hover:scale-101 active:scale-99 ${hasJobs ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <span aria-hidden="true">◷</span>
        {activeCount
          ? `${activeCount} analysis${activeCount === 1 ? "" : "es"}`
          : "Analysis queue"}
      </button>
      <section
        id="analysis-queue-panel"
        aria-label="Analysis queue"
        aria-hidden={!hasJobs || !open}
        className={`fixed bottom-40 right-5 z-40 flex max-h-[min(70vh,32rem)] w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-0.5 overflow-y-auto rounded-sm border border-clay-800 bg-clay-900 p-2 text-clay-100 shadow-[0_8px_24px_rgba(17,15,9,0.1)] transition-opacity duration-200 md:bottom-20 ${hasJobs && open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <h2 className="font-serif text-xl text-clay-100">Analysis queue</h2>
          <Button
            variant="primary"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close queue"
            tabIndex={open ? 0 : -1}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
        {actionMessage && (
          <p role="alert" className="mx-3 mb-2 text-sm text-red-300">
            {actionMessage}
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex items-stretch border-t border-clay-800 gap-2"
            >
              <button
                type="button"
                disabled={job.status !== "completed" || !job.resultSlug}
                onClick={() => void viewAnalysis(job)}
                tabIndex={open ? 0 : -1}
                aria-label={
                  job.status === "completed"
                    ? `View analysis for ${job.articleUrl}`
                    : `${job.articleUrl}, ${job.status === "queued" ? "waiting" : (job.message ?? job.status)}`
                }
                className="cursor-pointer flex min-w-0 flex-1 flex-col gap-1 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-clay-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clay-400 disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span
                  className="truncate text-sm text-clay-100"
                  title={job.articleUrl}
                >
                  {job.articleUrl}
                </span>
                <span className="flex items-center justify-between gap-2 text-xs text-clay-400">
                  <span
                    className={job.status === "failed" ? "text-red-300" : ""}
                  >
                    {job.status === "queued"
                      ? "Waiting"
                      : (job.message ?? job.status)}
                  </span>
                  {job.status === "completed" && (
                    <span className="shrink-0 text-brand-500">
                      View analysis →
                    </span>
                  )}
                </span>
                <span
                  role="progressbar"
                  aria-label={`Progress for ${job.articleUrl}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.max(0, job.progress))}
                  className="relative mt-1.5 h-1.5 w-full bg-clay-600"
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-rating-very-high transition-[width] duration-200"
                    style={{
                      width: `${Math.min(100, Math.max(0, job.progress))}%`,
                    }}
                  />
                </span>
              </button>

              {job.status !== "running" && (
                <Button
                  variant="dangerOutline"
                  type="button"
                  disabled={removingIds.includes(job.id)}
                  onClick={() => void removeJob(job.id)}
                  tabIndex={open ? 0 : -1}
                  className="my-auto mr-2 shrink-0 min-h-0! px-3! py-3! disabled:opacity-50"
                  aria-label={`Remove ${job.articleUrl} from queue`}
                  title={
                    removingIds.includes(job.id)
                      ? "Removing…"
                      : "Remove from queue"
                  }
                >
                  <TrashIcon className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
