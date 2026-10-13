"use client";

import Link from "next/link";
import LogoIcon from "../../icons/logo";
import XIcon from "../../icons/x";
import { ReactNode, useEffect, useRef } from "react";

interface SideMenuProps {
  setOpen: (action: boolean) => void;
  open: boolean;
  children: ReactNode;
  id?: string;
  closeOnOverlayClick?: boolean;
}

export default function SideMenu({
  open,
  setOpen,
  children,
  id,
  closeOnOverlayClick = false,
}: SideMenuProps) {
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      openerRef.current = activeElement;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open || !openerRef.current?.isConnected) return;

    openerRef.current.focus();
  }, [open]);

  return (
    <div>
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={open && closeOnOverlayClick ? 0 : -1}
        disabled={!open || !closeOnOverlayClick}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-20 bg-clay-900 transition-opacity duration-400 disabled:cursor-default ${
          open
            ? "opacity-15 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        inert={!open}
        className={`bg-clay-900 text-clay-50 fixed w-full max-w-80 p-4 sm:py-6 flex flex-col gap-4 inset-0 z-30 transition-transform duration-500 ${open ? "translate-0" : "-translate-x-full"}`}
      >
        <div className="flex justify-between items-center pb-4 border-b border-clay-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold"
            onClick={() => setOpen(false)}
          >
            <LogoIcon className="size-9 bg-clay-50 text-clay-900 p-1 rounded-xs" />{" "}
            <span className="font-serif text-3xl">Unearth</span>
          </Link>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="hover:cursor-pointer"
          >
            <XIcon className="size-5" />
            <span className="sr-only">Close navigation menu</span>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
