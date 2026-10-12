"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        aria-controls={hasJobs && open ? "analysis-queue-panel" : undefined}
        aria-hidden={!hasJobs}
        tabIndex={hasJobs ? 0 : -1}
        disabled={!hasJobs}
        className={`fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-clay-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition-opacity duration-300 sm:bottom-5 ${hasJobs ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <span aria-hidden="true">◷</span>
        {activeCount
          ? `${activeCount} analysis${activeCount === 1 ? "" : "es"}`
          : "Analysis queue"}
      </button>
      {hasJobs && open && (
        <section
          id="analysis-queue-panel"
          aria-label="Analysis queue"
          className="fixed bottom-40 right-5 z-40 max-h-[70vh] w-[min(24rem,calc(100vw-2.5rem))] overflow-y-auto rounded-lg border border-clay-300 bg-white p-4 shadow-xl md:bottom-20"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl">Analysis queue</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close queue"
              className="px-2 py-1"
            >
              ×
            </button>
          </div>
          {actionMessage && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {actionMessage}
            </p>
          )}
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id} className="border-t border-clay-200 pt-3">
                <p className="truncate text-sm" title={job.articleUrl}>
                  {job.articleUrl}
                </p>
                <p className="mt-1 text-xs text-clay-700">
                  {job.status === "queued"
                    ? "Waiting"
                    : (job.message ?? job.status)}
                </p>
                {(job.status === "running" ||
                  job.status === "completed" ||
                  job.status === "failed") && (
                  <progress
                    className="mt-2 h-2 w-full accent-clay-800"
                    max={100}
                    value={job.progress}
                    aria-label={`Progress ${job.progress}%`}
                  />
                )}
                {job.status === "completed" && job.resultSlug && (
                  <button
                    type="button"
                    disabled={removingIds.includes(job.id)}
                    onClick={() => void viewAnalysis(job)}
                    className="mt-2 inline-block text-sm underline disabled:opacity-50"
                  >
                    View analysis
                  </button>
                )}
                {job.status === "failed" && (
                  <p role="status" className="mt-1 text-xs text-red-700">
                    This analysis failed.
                  </p>
                )}
                {job.status !== "running" && (
                  <button
                    type="button"
                    disabled={removingIds.includes(job.id)}
                    onClick={() => void removeJob(job.id)}
                    className="ml-3 mt-2 text-xs underline disabled:opacity-50"
                    aria-label={`Remove ${job.articleUrl} from queue`}
                  >
                    {removingIds.includes(job.id) ? "Removing…" : "Remove"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
