"use client";

import { useState, type ReactNode } from "react";
import ChevronDownIcon from "../../icons/chevron-down";

export default function CollapsibleTableRow({
  colSpan,
  summary,
  expandedContent,
  defaultExpanded = false,
}: {
  colSpan: number;
  summary: ReactNode;
  expandedContent: ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const toggleExpanded = () => setIsExpanded((expanded) => !expanded);

  return (
    <>
      <tr
        className="border-t border-clay-200 transition-colors hover:cursor-pointer hover:bg-clay-100 active:bg-clay-150"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        {summary}
        <td className="px-4 py-4">
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={(event) => {
              event.stopPropagation();
              toggleExpanded();
            }}
            className="flex items-center gap-1 font-semibold underline underline-offset-4 decoration-clay-200 hover:cursor-pointer hover:decoration-clay-400"
          >
            {isExpanded ? "Hide analysis" : "Show analysis"}
            <ChevronDownIcon
              className={`size-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-t border-clay-200 bg-clay-100">
          <td colSpan={colSpan} className="px-4 py-4">
            {expandedContent}
          </td>
        </tr>
      )}
    </>
  );
}
