import { useEffect, useRef, useState } from "react";
import Button from "../button/button";
import MagnifyingGlassIcon from "../../icons/magnifying-glass";

type SearchProps = {
  value: string;
  onSearch: (query: string) => void;
  inputLabel?: string;
  placeholder?: string;
  buttonLabel?: string;
  debounceMs?: number;
};

export default function Search({
  value,
  onSearch,
  inputLabel = "Search",
  placeholder = "Search...",
  buttonLabel = "Search",
  debounceMs = 700,
}: SearchProps) {
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const nextSearch = query.trim();
    if (nextSearch === value) return;
    onSearch(nextSearch);
  }

  useEffect(() => {
    const nextSearch = query.trim();
    if (nextSearch === value) return;

    const timeout = window.setTimeout(() => onSearch(nextSearch), debounceMs);

    return () => window.clearTimeout(timeout);
  }, [debounceMs, onSearch, query, value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col gap-3 w-full lg:max-w-150"
    >
      <div
        className="flex items-center gap-6 justify-between rounded-md p-1.5 bg-clay-150 border border-clay-200 focus-within:border-clay-800 transition-colors duration-250"
        onClick={() => inputRef.current?.focus()}
      >
        <label htmlFor="query" className="sr-only">
          {inputLabel}
        </label>

        <div className="flex items-center gap-3 pl-3 flex-1">
          <MagnifyingGlassIcon className="size-6" />

          <input
            ref={inputRef}
            id="query"
            name="query"
            type="text"
            value={query}
            placeholder={placeholder}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full focus:outline-none"
          />
        </div>

        <Button
          type="submit"
          disabled={!query.trim()}
          className="hidden sm:block"
        >
          <span>{buttonLabel}</span>
        </Button>
      </div>

      <Button
        type="submit"
        disabled={!query.trim()}
        className="sm:hidden w-full"
      >
        <span>{buttonLabel}</span>
      </Button>
    </form>
  );
}
