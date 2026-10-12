"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/_lib/auth/auth-client";
import Button from "@/app/_components/ui/button/button";

export default function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function signOut() {
    setIsPending(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={signOut}
      disabled={isPending}
      variant="dangerOutline"
      className="w-full"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
