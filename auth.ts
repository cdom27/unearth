import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { after } from "next/server";
import { db } from "@/app/_lib/db/client";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendVerificationEmail(to: string, url: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const escapedUrl = escapeHtml(url);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Unearth News <accounts@unearth.news>",
      to: [to],
      subject: "Verify your Unearth News email",
      text: `Verify your email address by opening this link: ${url}`,
      html: `<p>Verify your email address by clicking the link below:</p><p><a href="${escapedUrl}">Verify email address</a></p><p>If you did not create an Unearth News account, you can ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${details}`);
  }
}

async function sendPasswordResetEmail(to: string, url: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const escapedUrl = escapeHtml(url);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Unearth News <accounts@unearth.news>",
      to: [to],
      subject: "Reset your Unearth News password",
      text: `Reset your password by opening this link: ${url}\n\nIf you did not request a password reset, you can ignore this email.`,
      html: `<p>Reset your password by clicking the link below:</p><p><a href="${escapedUrl}">Reset password</a></p><p>If you did not request a password reset, you can ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${details}`);
  }
}

async function sendPasswordChangedEmail(to: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Unearth News <accounts@unearth.news>",
      to: [to],
      subject: "Your Unearth News password was changed",
      text: "The password for your Unearth News account was changed. If you did not make this change, reset your password immediately.",
      html: "<p>The password for your Unearth News account was changed.</p><p>If you did not make this change, reset your password immediately.</p>",
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${details}`);
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      plan: {
        type: "string",
        required: false,
        defaultValue: "reader",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 15,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      after(async () => {
        try {
          await sendPasswordResetEmail(user.email, url);
        } catch (error) {
          console.error("Failed to send password reset email:", error);
        }
      });
    },
    onPasswordReset: async ({ user }) => {
      try {
        after(async () => {
          try {
            await sendPasswordChangedEmail(user.email);
          } catch (error) {
            console.error("Failed to send password changed email:", error);
          }
        });
      } catch (error) {
        console.error("Failed to schedule password changed email:", error);
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      after(async () => {
        try {
          await sendVerificationEmail(user.email, url);
        } catch (error) {
          console.error("Failed to send verification email:", error);
        }
      });
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/change-password") return;

      const result = ctx.context.returned;
      const email = ctx.context.session?.user.email;
      if (
        !email ||
        !result ||
        typeof result !== "object" ||
        !("user" in result)
      ) {
        return;
      }

      try {
        after(async () => {
          try {
            await sendPasswordChangedEmail(email);
          } catch (error) {
            console.error("Failed to send password changed email:", error);
          }
        });
      } catch (error) {
        console.error("Failed to schedule password changed email:", error);
      }
    }),
  },
  plugins: [admin({ defaultRole: "user" })],
});
