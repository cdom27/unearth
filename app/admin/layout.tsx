import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/app/_lib/auth/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (session?.user.role !== "admin") {
    redirect("/");
  }

  return children;
}
