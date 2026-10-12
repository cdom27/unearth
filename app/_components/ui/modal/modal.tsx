"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  labelledBy,
  children,
}: ModalProps) {
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
        aria-labelledby={labelledBy}
        className="relative w-full max-w-lg rounded-lg bg-clay-50 p-6 text-clay-900 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded p-2 text-2xl leading-none hover:bg-clay-150"
        >
          ×
        </button>
        {children}
      </section>
    </div>
  );
}
