"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/reset-password";

  return <main className={isAuthPage ? "" : "min-h-screen"}>{children}</main>;
}
