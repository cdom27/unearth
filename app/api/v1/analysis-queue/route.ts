import { createHash, randomUUID } from "node:crypto";
import { getSession } from "@/app/_lib/auth/server";
import { apiResponse } from "@/app/api/_lib/build-response";
import { after } from "next/server";
import {
  dismissAnalysisJob,
  getOwnerQueue,
  processOwnerQueue,
} from "@/app/api/v1/articles/_lib/analysis-queue";

const GUEST_COOKIE = "unearth_guest_id";

export async function GET(request: Request) {
  const session = await getSession();
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${GUEST_COOKIE}=([a-f0-9-]{36})`),
  );
  const guestId = match?.[1] ?? randomUUID();
  const owner = session?.user.id
    ? { userId: session.user.id, guestIdHash: null }
    : {
        userId: null,
        guestIdHash: createHash("sha256").update(guestId).digest("hex"),
      };

  try {
    const jobs = await getOwnerQueue(owner);
    after(() => processOwnerQueue(owner, session?.user.role ?? "guest"));
    const response = apiResponse({ message: "Queue loaded", data: jobs });
    response.headers.set("Cache-Control", "private, no-store");
    if (!session && !match) {
      response.headers.set(
        "Set-Cookie",
        `${GUEST_COOKIE}=${guestId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
      );
    }
    return response;
  } catch (error) {
    console.error("Unable to load analysis queue:", error);
    return apiResponse(
      { message: "Unable to load analysis queue", data: null },
      500,
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${GUEST_COOKIE}=([a-f0-9-]{36})`),
  );
  const owner = session?.user.id
    ? { userId: session.user.id, guestIdHash: null }
    : {
        userId: null,
        guestIdHash: createHash("sha256")
          .update(match?.[1] ?? "")
          .digest("hex"),
      };

  try {
    const body = (await request.json()) as { jobId?: unknown };
    if (
      typeof body.jobId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(body.jobId)
    ) {
      return apiResponse({ message: "Invalid queue item", data: null }, 400);
    }

    const removed = await dismissAnalysisJob(owner, body.jobId);
    if (!removed) {
      return apiResponse(
        {
          message:
            "This item is already running or is no longer available to remove",
          data: null,
        },
        409,
      );
    }
    return apiResponse({
      message: "Removed from your queue",
      data: { jobId: body.jobId },
    });
  } catch (error) {
    console.error("Unable to remove analysis queue item:", error);
    return apiResponse(
      { message: "Unable to remove queue item", data: null },
      500,
    );
  }
}
