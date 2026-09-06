const activeAnalysesByIp = new Map<string, number>();

const MAX_ACTIVE_ANALYSES_PER_IP = 1;

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function acquireAnalysisSlot(request: Request) {
  const ip = getClientIp(request);
  const activeAnalyses = activeAnalysesByIp.get(ip) ?? 0;

  if (activeAnalyses >= MAX_ACTIVE_ANALYSES_PER_IP) {
    return null;
  }

  activeAnalysesByIp.set(ip, activeAnalyses + 1);

  return () => {
    const currentActiveAnalyses = activeAnalysesByIp.get(ip) ?? 0;

    if (currentActiveAnalyses <= 1) {
      activeAnalysesByIp.delete(ip);
      return;
    }

    activeAnalysesByIp.set(ip, currentActiveAnalyses - 1);
  };
}
