"use client";

import Search from "@/app/_components/ui/forms/search";
import { useDiscover } from "./discover-provider";

export default function DiscoverSearch() {
  const { search, sorting, filters, includeUnanalyzed, saveFilters } =
    useDiscover();

  return (
    <Search
      value={search}
      onSearch={(nextSearch) =>
        saveFilters(sorting, filters, nextSearch, includeUnanalyzed)
      }
      inputLabel="Search by topic, outlet, claim, or keyword"
      placeholder="Search story content..."
      buttonLabel="Search Stories"
    />
  );
}
