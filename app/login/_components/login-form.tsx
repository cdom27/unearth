"use client";

import { type SyntheticEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/_lib/auth/auth-client";
import Button from "@/app/_components/ui/button/button";
import EyeIcon from "@/app/_components/icons/eye";

export default function LoginForm({ callbackURL = "/account" }: { callbackURL?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [email, setEmail] = useState("");
  const [isResetPending, setIsResetPending] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await authClient.signIn.email({
        email: String(formData.get("email")),
        password: String(formData.get("password")),
        callbackURL,
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to log in. Please try again.");
        return;
      }

      router.push(callbackURL);
      router.refresh();
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleForgotPassword() {
    setResetMessage("");

    if (!email.trim()) {
      setResetMessage("Enter your email address first.");
      return;
    }

    setIsResetPending(true);
    const genericMessage =
      "If an account exists for that email, a password reset link will arrive shortly.";

    try {
      await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });
      setResetMessage(genericMessage);
    } catch {
      setResetMessage(genericMessage);
    } finally {
      setIsResetPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="login-email" className="text-lg">
          Email Address
        </label>
        <div className="rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your email address"
            className="h-11 w-full bg-transparent px-3 placeholder:text-clay-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="login-password" className="text-lg">
          Password
        </label>
        <div className="flex items-center rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="login-password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Password"
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
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="mt-1 w-full">
        {isPending ? "Logging in…" : "Log in"}
      </Button>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={isResetPending}
          className="cursor-pointer font-semibold underline underline-offset-2 disabled:cursor-not-allowed"
        >
          {isResetPending ? "Sending reset link…" : "Forgot your password?"}
        </button>
        {resetMessage && (
          <p role="status" className="text-center text-sm text-red-500">
            {resetMessage}
          </p>
        )}
      </div>
    </form>
  );
}
