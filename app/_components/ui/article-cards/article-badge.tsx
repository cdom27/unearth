import timeSince from "@/app/_lib/utils/timeSince";
import ClockIcon from "../../icons/clock";
import InfoIcon from "../../icons/info";

type ArticleBadgeProps =
  | { variant: "time"; timeStamp: string }
  | { variant: "bias" | "sourcing" | "tone" | "tf"; value: string };

const BADGE_COLORS: Record<string, string> = {
  "lean left": "bg-left-500",
  left: "bg-left-500",
  "lean right": "bg-right-500",
  right: "bg-right-500",
  center: "bg-clay-600",
  mixed: "bg-clay-600",
  "one sided": "bg-rating-low",
  negative: "bg-rating-low",
  false: "bg-rating-low",
  true: "bg-rating-very-high",
  "mostly one sided": "bg-rating-mixed text-clay-900",
  balanced: "bg-rating-very-high",
  positive: "bg-rating-very-high",
  neutral: "bg-clay-400",
};

function getBadgeColor(value: string) {
  const normalizedValue = value.trim().toLowerCase().replaceAll("-", " ");
  return BADGE_COLORS[normalizedValue] ?? "bg-clay-600";
}

export default function ArticleBadge(props: ArticleBadgeProps) {
  if (props.variant === "time") {
    return (
      <div
        className="flex items-center gap-3 text-brand-500"
        title={`Published ${timeSince(props.timeStamp)} ago`}
      >
        <ClockIcon className="size-6" />
        <time className="text-lg" dateTime={props.timeStamp}>
          {timeSince(props.timeStamp)}
        </time>
      </div>
    );
  }

  if (props.variant === "bias") {
    return (
      <div
        className={`flex items-center gap-1.5 ${getBadgeColor(props.value)} text-clay-100 py-1 px-4 rounded-full`}
        title={`Source typically leans ${props.value}`}
      >
        <span>{props.value}</span>
        <InfoIcon className="size-3" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 ${getBadgeColor(props.value)} text-clay-100 py-1 px-4 rounded-full`}
      title={props.variant === "tone" ? "Term tone" : "Sourcing"}
    >
      <span>{props.value}</span>
      <InfoIcon className="size-3" />
    </div>
  );
}
