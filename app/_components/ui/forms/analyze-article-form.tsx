"use client";

import { useRef, useState } from "react";
import MagicWandIcon from "../../icons/magic-wand";
import Button from "../button/button";
import useArticle from "@/app/_hooks/use-article";
import { useRouter } from "next/navigation";
import CircleNotchIcon from "../../icons/circle-notch";

export default function AnalyzeArticleForm() {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { analyzeArticle, isAnalyzing, message } = useArticle();

  async function handleSubmit() {
    try {
      const result = await analyzeArticle(url);

      if (result.kind === "success") {
        router.push(`/article/${result.slug}`);
      }
    } catch {
      console.log("Unable to process source");
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col gap-3 w-full lg:max-w-150 lg:mx-auto"
    >
      <div
        className="flex items-center gap-6 justify-between rounded-md p-1.5 bg-clay-150 border border-clay-200 focus-within:border-clay-800 transition-colors duration-250"
        onClick={() => inputRef.current?.focus()}
      >
        <label htmlFor="articleURL" className="sr-only">
          Enter an article URL
        </label>

        <div className="flex items-center gap-3 pl-3 flex-1">
          <MagicWandIcon className="size-6" />

          <input
            ref={inputRef}
            id="articleURL"
            name="articleURL"
            type="url"
            defaultValue={url}
            required
            placeholder="Enter article URL"
            onChange={(e) => setUrl(e.target.value)}
            className="w-full focus:outline-none"
          />
        </div>

        <Button type="submit" disabled={url === ""} className="hidden sm:block">
          {isAnalyzing ? (
            <span className="flex items-center gap-1.5">
              <span>Analyzing</span>
              <CircleNotchIcon className="size-6 animate-spin" />
            </span>
          ) : (
            <span>Analyze Article</span>
          )}
        </Button>
      </div>

      <span className="text-red-500">{message}</span>

      <Button type="submit" disabled={url === ""} className="sm:hidden w-full">
        {isAnalyzing ? (
          <CircleNotchIcon className="size-6 animate-spin" />
        ) : (
          <span>Analyze Article</span>
        )}
      </Button>
    </form>
  );
}
