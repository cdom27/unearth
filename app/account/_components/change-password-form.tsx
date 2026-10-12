"use client";

import { type SyntheticEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/_components/ui/button/button";
import { authClient } from "@/app/_lib/auth/auth-client";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword"));
    const newPassword = String(formData.get("newPassword"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setIsPending(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        setError(
          "Unable to change your password. Check your current password and try again.",
        );
        return;
      }

      form.reset();
      setMessage("Your password has been changed successfully.");
      router.refresh();
    } catch {
      setError("Unable to change your password. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <h2 className="text-center font-serif text-2xl">Change password</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="current-password" className="text-lg">
          Current password
        </label>
        <div className="rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Current password"
            className="h-11 w-full bg-transparent px-3 placeholder:text-clay-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="new-password" className="text-lg">
          New password
        </label>
        <div className="rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={15}
            maxLength={128}
            required
            placeholder="New password"
            className="h-11 w-full bg-transparent px-3 placeholder:text-clay-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-new-password" className="text-lg">
          Confirm new password
        </label>
        <div className="rounded-md border border-clay-200 bg-clay-150 p-1.5 transition-colors duration-250 focus-within:border-clay-800">
          <input
            id="confirm-new-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={15}
            maxLength={128}
            required
            placeholder="Confirm new password"
            className="h-11 w-full bg-transparent px-3 placeholder:text-clay-400 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-center">
          {message}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Changing password…" : "Change password"}
      </Button>
    </form>
  );
}
