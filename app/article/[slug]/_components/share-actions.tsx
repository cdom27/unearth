"use client";

import EmailIcon from "@/app/_components/icons/email";
import LinkIcon from "@/app/_components/icons/link";
import RedditIcon from "@/app/_components/icons/reddit";
import TwitterIcon from "@/app/_components/icons/twitter";
import Tooltip from "@/app/_components/ui/tooltip/tooltip";

type ShareActionsProps = {
  articleTitle: string;
  shareUrl: string;
};

export default function ShareActions({
  articleTitle,
  shareUrl,
}: ShareActionsProps) {
  const shareText = `${articleTitle} via unearth.news`;
  const emailHref = `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;

  return (
    <div className="flex items-center gap-3">
      <Tooltip content="Share on Twitter">
        <a
          href={`https://twitter.com/intent/tweet?${new URLSearchParams({
            text: shareText,
            url: shareUrl,
          }).toString()}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Twitter"
        >
          <TwitterIcon className="size-5" />
        </a>
      </Tooltip>
      <Tooltip content="Share on Reddit">
        <a
          href={`https://www.reddit.com/submit?${new URLSearchParams({
            title: articleTitle,
            url: shareUrl,
          }).toString()}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Reddit"
        >
          <RedditIcon className="size-5" />
        </a>
      </Tooltip>
      <Tooltip content="Email a friend">
        <a href={emailHref} aria-label="Email a friend">
          <EmailIcon className="size-5" />
        </a>
      </Tooltip>
      <Tooltip content="Copy link">
        <button
          type="button"
          className="inline-flex items-center justify-center leading-none hover:cursor-pointer"
          onClick={() => void navigator.clipboard.writeText(shareUrl)}
          aria-label="Copy analysis page link"
        >
          <LinkIcon className="size-5" />
        </button>
      </Tooltip>
    </div>
  );
}
