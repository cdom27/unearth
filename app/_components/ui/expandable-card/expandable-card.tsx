import type { ReactNode } from "react";
import ChevronDownIcon from "@/app/_components/icons/chevron-down";

export default function ExpandableCard({
  summary,
  defaultOpen = false,
  children,
}: {
  summary: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group self-start rounded-sm border border-clay-150"
    >
      <summary className="bg-clay-100 flex cursor-pointer list-none items-start justify-between gap-4 p-4 sm:p-6 [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDownIcon
          aria-hidden="true"
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-clay-150 bg-none px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
        {children}
      </div>
    </details>
  );
}
