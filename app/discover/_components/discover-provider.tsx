"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Params } from "@/app/_lib/types/preview-params";

type DiscoverContextValue = {
  search: string;
  sorting: Params["sorting"];
  filters: NonNullable<Params["filters"]>;
  includeUnanalyzed: boolean;
  resultsVersion: number;
  saveFilters: (
    sorting: Params["sorting"],
    filters: NonNullable<Params["filters"]>,
    search: string,
    includeUnanalyzed: boolean,
  ) => void;
};

const DiscoverContext = createContext<DiscoverContextValue | null>(null);

type DiscoverProviderProps = {
  children: ReactNode;
  initialSearch: string;
  initialSorting: Params["sorting"];
  initialFilters: NonNullable<Params["filters"]>;
  initialIncludeUnanalyzed: boolean;
};

export function DiscoverProvider({
  children,
  initialSearch,
  initialSorting,
  initialFilters,
  initialIncludeUnanalyzed,
}: DiscoverProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sorting, setSorting] = useState(initialSorting);
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState(initialFilters);
  const [includeUnanalyzed, setIncludeUnanalyzed] = useState(
    initialIncludeUnanalyzed,
  );
  const [resultsVersion, setResultsVersion] = useState(0);

  const saveFilters = useCallback((
    nextSorting: Params["sorting"],
    nextFilters: NonNullable<Params["filters"]>,
    nextSearch: string,
    nextIncludeUnanalyzed: boolean,
  ) => {
    setSorting(nextSorting);
    setFilters(nextFilters);
    setSearch(nextSearch);
    setIncludeUnanalyzed(nextIncludeUnanalyzed);
    setResultsVersion((version) => version + 1);

    const searchParams = new URLSearchParams();
    if (nextSearch) {
      searchParams.set("q", nextSearch);
    }
    if (nextSorting !== "newest") {
      searchParams.set("sort", nextSorting);
    }
    if (nextIncludeUnanalyzed) {
      searchParams.set("includeUnanalyzed", "true");
    }

    const scalarFilters = [
      "minFactualScore",
      "maxFactualScore",
      "minBiasScore",
      "maxBiasScore",
      "minPublishedAt",
      "maxPublishedAt",
    ] as const;
    scalarFilters.forEach((filter) => {
      const value = nextFilters[filter];
      if (value !== undefined && value !== "") {
        searchParams.set(filter, String(value));
      }
    });

    const arrayFilters = ["sources", "sentiments", "credibilities"] as const;
    arrayFilters.forEach((filter) => {
      const values = nextFilters[filter];
      if (values?.length) searchParams.set(filter, values.join(","));
    });

    const query = searchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [pathname, router]);

  const value = useMemo(
    () => ({
      search,
      sorting,
      filters,
      includeUnanalyzed,
      resultsVersion,
      saveFilters,
    }),
    [filters, includeUnanalyzed, resultsVersion, saveFilters, search, sorting],
  );

  return (
    <DiscoverContext.Provider value={value}>
      {children}
    </DiscoverContext.Provider>
  );
}

export function useDiscover() {
  const context = useContext(DiscoverContext);

  if (!context) {
    throw new Error("useDiscover must be used within DiscoverProvider.");
  }

  return context;
}
