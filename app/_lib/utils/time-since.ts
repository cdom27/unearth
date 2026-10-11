export function timeSince(iso: string): string {
  if (!iso) return "Invalid date";

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  const now = Date.now();
  const diffMs = now - parsed.getTime();

  const absMs = Math.abs(diffMs);
  const absSeconds = Math.floor(absMs / 1000);
  const absMinutes = Math.floor(absSeconds / 60);
  const absHours = absMinutes / 60;
  const absDays = absHours / 24;

  const isFuture = diffMs < 0;
  const prefix = isFuture ? "in " : "";

  if (!isFuture && absMinutes < 5) {
    return "Now";
  }

  if (isFuture && absMinutes < 5) {
    return "in a few minutes";
  }

  if (absMinutes >= 5 && absMinutes < 50) {
    const label = `${absMinutes}m`;
    return isFuture ? `${prefix}${label}` : label;
  }

  if (absMinutes >= 50 && absHours < 24) {
    // round to nearest 0.5 hour for compact display
    const halfHourUnits = Math.round(absMinutes / 30);
    const hours = halfHourUnits / 2;

    const hoursLabel = Number.isInteger(hours)
      ? `${hours}h`
      : `${hours.toFixed(1)}h`;
    return isFuture ? `${prefix}${hoursLabel}` : hoursLabel;
  }

  if (absHours >= 24 && absDays < 7) {
    const daysRounded = Math.round(absDays);
    const label = `${daysRounded}d`;
    return isFuture ? `${prefix}${label}` : label;
  }

  if (absDays >= 7 && absDays < 30) {
    const weeksRounded = Math.round(absDays / 7);
    const label = `${weeksRounded}w`;
    return isFuture ? `${prefix}${label}` : label;
  }

  if (absDays >= 30 && absDays < 365) {
    const monthsRounded = Math.round(absDays / 30);
    const label = `${monthsRounded}mo`;
    return isFuture ? `${prefix}${label}` : label;
  }

  const yearsRounded = Math.round(absDays / 365);
  const label = `${yearsRounded}y`;
  return isFuture ? `${prefix}${label}` : label;
}

export default timeSince;
