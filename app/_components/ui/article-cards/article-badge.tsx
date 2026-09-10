import timeSince from "@/app/_lib/utils/timeSince";
import ClockIcon from "../../icons/clock";
import InfoIcon from "../../icons/info";
import ExplanationPopover from "../tooltip/explanation-popover";

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

function getPopoverContent(variant: string, value: string) {
  if (variant === "bias") {
    return `Source typically reports a bias of ${value}`;
  } else if (variant === "sourcing") {
    return `The reporting balance is determined through a partially AI-assited system where it evaluates the article's rhetoric.`;
  } else if (variant === "tone") {
    return `This term is used in a ${value} way within the report. Refer to the provided explantion for a deeper analysis.`;
  } else if (variant === "tf") {
    return `This claim has been determined ${value.trim()}. Refer to the sources and insights that aided this evaluation.`;
  }
  return value;
}

function getBadgeColor(value: string) {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replaceAll("-", " ")
    .trim();
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

  return (
    <ExplanationPopover content={getPopoverContent(props.variant, props.value)}>
      <div
        className={`flex items-center gap-1.5 ${getBadgeColor(props.value)} text-clay-100 py-1 px-4 rounded-full`}
      >
        <span>{props.value}</span>
        <InfoIcon className="size-3" />
      </div>
    </ExplanationPopover>
  );
}
