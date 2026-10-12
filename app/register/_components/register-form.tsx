"use client";

import { type SyntheticEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/_lib/auth/auth-client";
import Button from "@/app/_components/ui/button/button";
import EyeIcon from "@/app/_components/icons/eye";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await authClient.signUp.email({
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        password: String(formData.get("password")),
        callbackURL: "/account",
      });

      if (result.error) {
        setError(
          result.error.message ??
            "Unable to create your account. Please try again.",
        );
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Unable to create your account. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="register-name" className="text-lg">
          Name
        </label>
        <div className="rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Your name"
            className="h-11 w-full bg-transparent px-3 placeholder:text-clay-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="register-email" className="text-lg">
          Email Address
        </label>
        <div className="rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Your email address"
            className="h-11 w-full bg-transparent px-3 placeholder:text-clay-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="register-password" className="text-lg">
          Password
        </label>
        <div className="flex items-center rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="register-password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={15}
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
        {isPending ? "Creating account…" : "Register"}
      </Button>
    </form>
  );
}
