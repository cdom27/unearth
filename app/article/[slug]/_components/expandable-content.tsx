"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ChevronDownIcon from "@/app/_components/icons/chevron-down";

const INITIAL_ITEMS_COUNT = 4;

export default function ExpandableContent({
  children,
}: {
  children: ReactNode[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded
    ? children
    : children.slice(0, INITIAL_ITEMS_COUNT);
  const canExpand = children.length > INITIAL_ITEMS_COUNT;

  return (
    <>
      <div className="flex flex-col gap-4">{visibleItems}</div>

      {canExpand && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="mx-auto pt-2 flex items-center gap-1 font-semibold underline underline-offset-4 decoration-clay-200 hover:cursor-pointer hover:decoration-clay-400"
        >
          {isExpanded ? "See less" : "See more"}
          <ChevronDownIcon
            className={`size-5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </>
  );
}
