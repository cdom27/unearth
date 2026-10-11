"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/_lib/auth/auth-client";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await authClient.signIn.email({
        email: String(formData.get("email")),
        password: String(formData.get("password")),
        callbackURL: "/account",
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to log in. Please try again.");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
