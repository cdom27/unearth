import { parseHTML } from "linkedom";

const VIDEO_PLATFORM_PATTERNS = [
  { name: "youtube", pattern: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
  { name: "tiktok", pattern: /(^|\.)tiktok\.com$/i },
  { name: "facebook", pattern: /(^|\.)facebook\.com$/i },
  { name: "vimeo", pattern: /(^|\.)vimeo\.com$/i },
  { name: "twitch", pattern: /(^|\.)twitch\.tv$/i },
];

const VIDEO_OG_TYPES = new Set([
  "video",
  "video.other",
  "video.movie",
  "video.episode",
  "video.tv_show",
]);

type DetectionSignal = {
  type: string;
  value: string;
};

export type MediaInspection =
  | {
      rejected: true;
      finalUrl: string;
      reason: string;
      signals: DetectionSignal[];
    }
  | {
      rejected: false;
      finalUrl: string;
      html: string;
    };

function getMetaContent(
  document: ReturnType<typeof parseHTML>["document"],
  selector: string,
) {
  return (
    document.querySelector(selector)?.getAttribute("content")?.trim() ?? ""
  );
}

function getStructuredDataTypes(
  document: ReturnType<typeof parseHTML>["document"],
) {
  const types = new Set<string>();

  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    try {
      const data = JSON.parse(script.textContent ?? "");
      const collectTypes = (value: unknown) => {
        if (Array.isArray(value)) {
          value.forEach(collectTypes);
          return;
        }

        if (!value || typeof value !== "object") {
          return;
        }

        const type = (value as Record<string, unknown>)["@type"];
        if (typeof type === "string") {
          types.add(type);
        } else if (Array.isArray(type)) {
          type.forEach((item) => types.add(String(item)));
        }

        Object.values(value).forEach(collectTypes);
      };

      collectTypes(data);
    } catch {
      // for now: ignore malformed JSON-LD and continue evaluating other signals.
    }
  }

  return types;
}

function detectKnownVideoPlatform(url: URL): DetectionSignal | null {
  const platform = VIDEO_PLATFORM_PATTERNS.find(({ pattern }) =>
    pattern.test(url.hostname),
  );

  if (!platform) {
    return null;
  }

  const isVideoPath =
    platform.name === "youtube"
      ? url.hostname === "youtu.be" ||
        /\/(watch|shorts|live|embed)\b/i.test(url.pathname) ||
        url.searchParams.has("v")
      : platform.name === "tiktok"
        ? /\/video\/\d+/i.test(url.pathname)
        : platform.name === "facebook"
          ? /\/(watch|reel|videos?)\b/i.test(url.pathname)
          : platform.name === "vimeo"
            ? /\/\d+(?:$|\/)/.test(url.pathname)
            : /\/(videos?|clip)\b/i.test(url.pathname);

  return isVideoPath
    ? { type: "known_video_platform", value: platform.name }
    : null;
}

export async function inspectMediaSubmission(
  submittedUrl: string,
): Promise<MediaInspection> {
  const submittedURL = new URL(submittedUrl);
  const submittedPlatformSignal = detectKnownVideoPlatform(submittedURL);

  if (submittedPlatformSignal) {
    return {
      rejected: true,
      finalUrl: submittedUrl,
      reason: "known_video_platform",
      signals: [submittedPlatformSignal],
    };
  }

  let response: Response;
  try {
    response = await fetch(submittedUrl);
  } catch (error) {
    return {
      rejected: true,
      finalUrl: submittedUrl,
      reason: "upstream_fetch_failed",
      signals: [
        {
          type: "fetch_error",
          value: error instanceof Error ? error.message : "unknown_error",
        },
      ],
    };
  }

  const finalUrl = response.url || submittedUrl;
  const finalURL = new URL(finalUrl);
  const signals: DetectionSignal[] = [];

  if (!response.ok) {
    return {
      rejected: true,
      finalUrl,
      reason: "upstream_http_error",
      signals: [
        {
          type: "http_status",
          value: String(response.status),
        },
        {
          type: "content_type",
          value: response.headers.get("content-type") ?? "unknown",
        },
      ],
    };
  }

  const platformSignal = detectKnownVideoPlatform(finalURL);
  if (platformSignal) {
    signals.push(platformSignal);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
    signals.push({ type: "direct_media_response", value: contentType });
  }

  if (platformSignal || signals.length > 0) {
    return {
      rejected: true,
      finalUrl,
      reason: platformSignal ? "known_video_platform" : "direct_media_response",
      signals,
    };
  }

  const html = await response.text();
  const { document } = parseHTML(html);
  const ogType = getMetaContent(document, 'meta[property="og:type"]');

  if (VIDEO_OG_TYPES.has(ogType.toLowerCase())) {
    signals.push({ type: "open_graph_video", value: ogType });
  }

  if (getMetaContent(document, 'meta[name="twitter:player"]')) {
    signals.push({ type: "twitter_player", value: "present" });
  }

  const structuredDataTypes = getStructuredDataTypes(document);
  const hasVideoStructuredData = structuredDataTypes.has("VideoObject");
  if (hasVideoStructuredData) {
    signals.push({ type: "video_structured_data", value: "VideoObject" });
  }

  const hasArticleStructuredData = [...structuredDataTypes].some((type) =>
    ["Article", "NewsArticle"].includes(type),
  );

  if (
    signals.some((signal) => signal.type === "open_graph_video") ||
    (hasVideoStructuredData && !hasArticleStructuredData)
  ) {
    return {
      rejected: true,
      finalUrl,
      reason: platformSignal
        ? "known_video_platform"
        : (signals.find((signal) => signal.type !== "video_structured_data")
            ?.type ?? "video_structured_data"),
      signals,
    };
  }

  return { rejected: false, finalUrl, html };
}
