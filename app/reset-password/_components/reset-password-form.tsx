"use client";

import { type SyntheticEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EyeIcon from "@/app/_components/icons/eye";
import Button from "@/app/_components/ui/button/button";
import { authClient } from "@/app/_lib/auth/auth-client";

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [redirectIn, setRedirectIn] = useState(5);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  useEffect(() => {
    if (!isResetSuccess) return;

    const redirectTimeout = window.setTimeout(() => {
      router.replace("/login");
    }, 5000);
    const countdownInterval = window.setInterval(() => {
      setRedirectIn((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => {
      window.clearTimeout(redirectTimeout);
      window.clearInterval(countdownInterval);
    };
  }, [isResetSuccess, router]);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError(
        "This reset link is invalid or has expired. Request a new link.",
      );
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirmation = String(formData.get("confirmPassword"));

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setIsPending(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        setError(
          "This reset link is invalid or has expired. Request a new link.",
        );
        return;
      }

      setIsResetSuccess(true);
    } catch {
      setError("Unable to reset your password. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p>This reset link is invalid or has expired. Request a new link.</p>
        <Link
          href="/login"
          className="font-semibold underline underline-offset-2"
        >
          Return to log in
        </Link>
      </div>
    );
  }

  if (isResetSuccess) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p role="status" aria-live="polite">
          Your password was reset successfully. You’ll be redirected to log in
          in {redirectIn} seconds.
        </p>
        <Link
          href="/login"
          className="font-semibold underline underline-offset-2"
        >
          Go to log in now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="new-password" className="text-lg">
          New password
        </label>
        <div className="flex items-center rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="new-password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="new-password"
            minLength={15}
            maxLength={128}
            required
            placeholder="New password"
            className="h-11 min-w-0 flex-1 bg-transparent px-3 placeholder:text-clay-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
            className="flex size-10 shrink-0 items-center justify-center rounded-md hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-800"
          >
            <EyeIcon open={isPasswordVisible} className="size-6" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-password" className="text-lg">
          Confirm new password
        </label>
        <div className="flex items-center rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="confirm-password"
            name="confirmPassword"
            type={isConfirmationVisible ? "text" : "password"}
            autoComplete="new-password"
            minLength={15}
            maxLength={128}
            required
            placeholder="Confirm new password"
            className="h-11 min-w-0 flex-1 bg-transparent px-3 placeholder:text-clay-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsConfirmationVisible((visible) => !visible)}
            aria-label={
              isConfirmationVisible ? "Hide confirmation" : "Show confirmation"
            }
            aria-pressed={isConfirmationVisible}
            className="flex size-10 shrink-0 items-center justify-center rounded-md hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-800"
          >
            <EyeIcon open={isConfirmationVisible} className="size-6" />
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="mt-1 w-full">
        {isPending ? "Resetting password…" : "Reset password"}
      </Button>
    </form>
  );
}
