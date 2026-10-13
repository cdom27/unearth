"use client";

import { ReactNode, useEffect, useId } from "react";
import XIcon from "../../icons/x";
import Button from "../button/button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({
  isOpen,
  title,
  onClose,
  children,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-clay-900/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-sm bg-clay-50 p-6 text-clay-900 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between pb-6">
          <h2 id={titleId} className="font-serif text-2xl">
            {title}
          </h2>

          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div>{children}</div>
      </section>
    </div>
  );
}
