"use client";

import Link from "next/link";
import Modal from "./modal";
import type { AnalysisLimit } from "@/app/_hooks/use-article";

export default function AnalysisLimitModal({
  limit,
  onCloseAction,
}: {
  limit: AnalysisLimit | null;
  onCloseAction: () => void;
}) {
  if (!limit) return null;

  const daily = limit.reason === "daily_limit";
  const title = daily
    ? "Daily analysis limit reached"
    : "Analysis queue is full";
  const description = daily
    ? limit.audience === "guest"
      ? "Guest visitors can analyze up to 5 articles each day. Your limit resets at midnight UTC."
      : "Reader accounts can analyze up to 12 articles each day. Your limit resets at midnight UTC."
    : limit.audience === "guest"
      ? "You already have an analysis in progress. Guest visitors can analyze one article at a time, without a waiting queue."
      : "Readers can have 2 analyses running and 3 articles waiting. Wait for an item to finish before adding more.";

  return (
    <Modal isOpen title={title} onClose={onCloseAction}>
      <div>
        <p className="text-base leading-relaxed">{description}</p>

        {limit.audience === "guest" ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-md bg-clay-900 px-5 py-3 font-medium text-clay-50"
            >
              Create a free account
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-clay-800 px-5 py-3 font-medium"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <p className="mt-6 rounded-md bg-clay-150 p-4 text-sm leading-relaxed">
            Paid plan upgrades and newsletter updates aren’t available yet.
            We’ll add those options here when they’re ready.
          </p>
        )}

        <div className="mt-6 border-t border-clay-250 pt-4">
          <p className="mb-3 text-sm font-medium">Explore while you wait</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link className="underline underline-offset-2" href="/discover">
              Discover articles
            </Link>
            <Link
              className="underline underline-offset-2"
              href="/media-ratings"
            >
              Browse media ratings
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
