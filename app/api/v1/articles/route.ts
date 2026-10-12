import { createHash, randomUUID } from "node:crypto";
import { after } from "next/server";
import { getSession } from "@/app/_lib/auth/server";
import { normalizeURL } from "@/app/_lib/normalize-url";
import { apiResponse } from "@/app/api/_lib/build-response";
import {
  admitAnalysis,
  processOwnerQueue,
  type QueueOwner,
} from "./_lib/analysis-queue";

const GUEST_COOKIE = "unearth_guest_id";

function getGuestId(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${GUEST_COOKIE}=([a-f0-9-]{36})`),
  );
  return match?.[1] ?? randomUUID();
}

function ownerFor(userId: string | null, guestId: string): QueueOwner {
  return userId
    ? { userId, guestIdHash: null }
    : {
        userId: null,
        guestIdHash: createHash("sha256").update(guestId).digest("hex"),
      };
}

function guestCookie(guestId: string) {
  return `${GUEST_COOKIE}=${guestId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export async function POST(request: Request) {
  const session = await getSession();
  const guestId = getGuestId(request);
  const owner = ownerFor(session?.user.id ?? null, guestId);

  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string" || !body.url.trim()) {
      return apiResponse({ message: "Enter an article URL", data: null }, 400);
    }
    const normalizedURL = normalizeURL(body.url);
    if (!normalizedURL) {
      return apiResponse(
        { message: "Unable to process source", data: null },
        422,
      );
    }

    const role = session?.user.role ?? "guest";
    const plan = session?.user.plan ?? "guest";
    const admission = await admitAnalysis(owner, plan, role, normalizedURL);
    if (
      (admission.result !== "accepted" && admission.result !== "duplicate") ||
      !admission.jobId
    ) {
      const message =
        admission.result === "daily_limit"
          ? "You’ve reached your daily analysis limit. Try again tomorrow."
          : owner.userId
            ? "Your analysis queue is full. Wait for an analysis to finish before adding another article."
            : "You already have an analysis in progress. Guests can analyze one article at a time.";
      const response = apiResponse(
        { message, data: { reason: admission.result } },
        429,
      );
      if (!session) response.headers.set("Set-Cookie", guestCookie(guestId));
      return response;
    }

    after(() => processOwnerQueue(owner, role));
    const response = apiResponse(
      {
        message:
          admission.result === "duplicate"
            ? "This article is already in your analysis queue"
            : "Article added to your analysis queue",
        data: { jobId: admission.jobId, status: admission.status ?? "queued" },
      },
      202,
    );
    if (!session) response.headers.set("Set-Cookie", guestCookie(guestId));
    return response;
  } catch (error) {
    console.error("error while queuing article: ", error);
    const response = apiResponse(
      { message: "Unexpected Error", data: null },
      500,
    );
    if (!session) response.headers.set("Set-Cookie", guestCookie(guestId));
    return response;
  }
}
