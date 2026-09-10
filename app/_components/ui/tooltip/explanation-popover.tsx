"use client";

import {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useId,
  useState,
} from "react";

interface ExplanationPopoverProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function ExplanationPopover({
  content,
  children,
  className = "",
}: ExplanationPopoverProps) {
  const descriptionId = useId();
  const [isOpen, setIsOpen] = useState(false);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      event.currentTarget.blur();
    }
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  }

  function handleMouseEnter() {
    setIsOpen(true);
  }

  function handleMouseLeave(event: MouseEvent<HTMLSpanElement>) {
    const relatedTarget = event.relatedTarget;

    if (
      !(relatedTarget instanceof Node) ||
      !event.currentTarget.contains(relatedTarget)
    ) {
      setIsOpen(false);
    }
  }

  return (
    <span
      className={`relative inline-flex ${className}`.trim()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        aria-label="Show explanation"
        aria-expanded={isOpen}
        aria-describedby={isOpen ? descriptionId : undefined}
        className="inline-flex cursor-help rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
        onClick={() => setIsOpen((open) => !open)}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {children}
      </button>

      <span
        id={descriptionId}
        role="tooltip"
        aria-hidden={!isOpen}
        className={`absolute bottom-full left-1/2 z-20 mb-4 w-80 -translate-x-1/2 rounded-sm bg-clay-800 px-6 py-5 text-left text-sm font-normal leading-relaxed text-clay-50 normal-case shadow-lg transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span
          aria-hidden="true"
          className="absolute -bottom-3 left-1/2 size-0 -translate-x-1/2 border-x-12 border-t-12 border-x-transparent border-t-clay-800"
        />
        {content}
      </span>
    </span>
  );
}
