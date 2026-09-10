"use client";

import { useEffect, useState } from "react";

export type TableOfContentsItem = {
  id: string;
  label: string;
  main?: boolean;
};

type ArticleTimelineProps = {
  items: TableOfContentsItem[];
};

export default function ArticleTimeline({ items }: ArticleTimelineProps) {
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [passedItems, setPassedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateTimeline = () => {
      const toc = document.getElementById("article-table-of-contents");
      if (!toc) return;

      setTimelineVisible(toc.getBoundingClientRect().bottom < 0);
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
    };
  }, [items]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed right-4 bottom-4 z-20 hidden h-56 w-14 flex-col items-center justify-center gap-2 rounded-sm bg-clay-900 px-4 shadow-lg transition-opacity duration-300 ease-out sm:right-8 sm:bottom-8 2xl:flex ${
        timelineVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {items.map((item) => (
        <span
          key={item.id}
          className={`block h-0.5 ${
            item.main ? "w-8" : "w-5"
          } ${passedItems.has(item.id) ? "bg-brand-500" : "bg-clay-100"}`}
        />
      ))}
    </div>
  );
}
