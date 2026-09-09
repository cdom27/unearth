import timeSince from "@/app/_lib/utils/timeSince";
import ClockIcon from "../../icons/clock";
import InfoIcon from "../../icons/info";

interface ArticleBadgeProps {
  variant: "time" | "bias" | "sourcing";
  timeStamp?: string;
  bias?: string;
  sourcing?: string;
}

function getBiasColor(bias?: string) {
  switch (bias) {
    case "Lean Left":
    case "Left":
      return "bg-left-500";
    case "Lean Right":
    case "Right":
      return "bg-right-500";
    case "Mixed":
    case "Center":
      return "bg-clay-600";
    default:
      return "bg-clay-600";
  }
}

function getSourcingColor(sourcing?: string) {
  switch (sourcing) {
    case "One sided":
      return "bg-rating-low";
    case "Mostly one sided":
      return "bg-rating-mixed text-clay-900";
    case "Balanced":
      return "bg-rating-very-high";
    default:
      return "bg-clay-600";
  }
}

export default function ArticleBadge({
  variant,
  timeStamp,
  bias,
  sourcing,
}: ArticleBadgeProps) {
  if (variant === "time") {
    if (timeStamp) {
      return (
        <div
          className="flex items-center gap-3 text-brand-500"
          title={`Published ${timeSince(timeStamp)} ago`}
        >
          <ClockIcon className="size-6" />
          <time className="text-lg" dateTime={timeStamp}>
            {timeSince(timeStamp)}
          </time>
        </div>
      );
    }
  } else if (variant === "bias") {
    return (
      <div
        className={`flex items-center gap-1.5 ${getBiasColor(bias)} text-clay-100 py-1 px-4 rounded-full`}
        title={`Source typically leans ${bias}`}
      >
        <span>{bias}</span>
        <InfoIcon className="size-3" />
      </div>
    );
  } else if (variant === "sourcing") {
    return (
      <div
        className={`flex items-center gap-1.5 ${getSourcingColor(sourcing)} text-clay-100 py-1 px-4 rounded-full`}
        title={`Sourcing`}
      >
        <span>{sourcing}</span>
        <InfoIcon className="size-3" />
      </div>
    );
  }
}
