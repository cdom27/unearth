"use client";

import { useState } from "react";
import { authClient } from "@/app/_lib/auth/auth-client";

interface ResendVerificationLinkProps {
  email: string;
}

export default function ResendVerificationLink({
  email,
}: ResendVerificationLinkProps) {
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function resend() {
    setIsPending(true);
    setMessage("");

    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/account",
      });

      if (result.error) {
        setMessage("Unable to resend the verification email. Please try again later.");
        return;
      }

      setMessage("If the email can be delivered, a new verification link will arrive shortly.");
    } catch {
      setMessage("Unable to resend the verification email. Please try again later.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <span>
      <button type="button" onClick={resend} disabled={isPending} className="underline">
        {isPending ? "Sending…" : "Resend verification email"}
      </button>
      {message && <span role="status"> {message}</span>}
    </span>
  );
}
