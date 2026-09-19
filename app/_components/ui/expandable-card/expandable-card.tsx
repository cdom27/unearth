"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import ChevronDownIcon from "@/app/_components/icons/chevron-down";

export default function ExpandableCard({
  summary,
  summaryAction,
  defaultOpen = false,
  children,
}: {
  summary: ReactNode;
  summaryAction?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="self-start rounded-sm border border-clay-150">
      <div className="bg-clay-100 flex items-start gap-4 p-4 sm:p-6">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex min-w-0 flex-1 items-start justify-between gap-4 text-left cursor-pointer"
          onClick={() => setIsOpen((open) => !open)}
        >
          {summary}
          <ChevronDownIcon
            aria-hidden="true"
            className={`size-5 shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {summaryAction ? <div className="shrink-0">{summaryAction}</div> : null}
      </div>

      {isOpen ? (
        <div
          id={contentId}
          className="border-t border-clay-150 bg-none px-4 pb-4 pt-4 sm:px-6 sm:pb-6"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
