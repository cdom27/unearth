"use client";

import { useEffect, useRef, useState } from "react";

export type TableOfContentsItem = {
  id: string;
  label: string;
  main?: boolean;
};

type ArticleTimelineProps = {
  items: TableOfContentsItem[];
};

export default function ArticleTimeline({ items }: ArticleTimelineProps) {
  const [passedItems, setPassedItems] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const updateTimeline = () => {
      setPassedItems(
        new Set(
          items
            .filter((item) => {
              const heading = document.getElementById(item.id);
              return heading
                ? heading.getBoundingClientRect().top <= 120
                : false;
            })
            .map((item) => item.id),
        ),
      );
    };

    updateTimeline();
    window.addEventListener("scroll", updateTimeline, { passive: true });
    window.addEventListener("resize", updateTimeline);

    return () => {
      window.removeEventListener("scroll", updateTimeline);
      window.removeEventListener("resize", updateTimeline);
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, [items]);

  const keepExpanded = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setExpanded(true);
  };

  const collapseSoon = () => {
    closeTimeout.current = setTimeout(() => setExpanded(false), 150);
  };

  const activeItemId = items
    .filter((item) => passedItems.has(item.id))
    .map((item) => item.id)
    .pop();

  return (
    <nav
      aria-label="Article sections"
      className="fixed top-1/2 right-5 z-10 hidden -translate-y-1/2 sm:right-8 2xl:block"
    >
      <div
        className={`absolute right-full top-1/2 mr-3 flex max-h-[min(70vh,32rem)] -translate-y-1/2 flex-col justify-center gap-0.5 overflow-y-auto rounded-sm border border-clay-800 bg-clay-900 p-2 text-clay-100 shadow-[0_8px_24px_rgba(17,15,9,0.1)] transition-opacity duration-200 ${
          expanded
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onMouseEnter={keepExpanded}
        onMouseLeave={collapseSoon}
        onFocusCapture={keepExpanded}
        onBlurCapture={collapseSoon}
      >
        {items.map((item) => {
          const isActive = item.id === activeItemId;
          const hasPassed = passedItems.has(item.id);

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              className={`block truncate px-3 py-1.5 text-right text-sm transition-colors duration-150 hover:bg-clay-800 focus-visible:bg-clay-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clay-400 ${
                item.main ? "font-bold" : ""
              } ${
                isActive
                  ? "text-brand-500"
                  : hasPassed
                    ? "text-clay-500"
                    : "text-clay-100"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>

      <div
        className="flex w-8 flex-col items-end justify-center gap-2 py-2"
        onMouseEnter={keepExpanded}
        onMouseLeave={collapseSoon}
        onFocusCapture={keepExpanded}
        onBlurCapture={collapseSoon}
      >
        {items.map((item) => {
          const isActive = item.id === activeItemId;
          const hasPassed = passedItems.has(item.id);

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-label={`Jump to ${item.label}`}
              aria-current={isActive ? "location" : undefined}
              className={`block h-0.5 transition-[width,background-color] duration-200 hover:bg-brand-500 focus-visible:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500 ${
                item.main ? "w-8" : "w-5"
              } ${
                isActive
                  ? "bg-brand-500"
                  : hasPassed
                    ? "bg-clay-500"
                    : "bg-clay-250"
              }`}
            />
          );
        })}
      </div>
    </nav>
  );
}
