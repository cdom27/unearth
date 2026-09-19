"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ApiResponse } from "@/app/api/_lib/build-response";
import type { PreviewFilterMetadata } from "@/app/_lib/types/preview-filter-metadata";
import type { Params } from "@/app/_lib/types/preview-params";
import { useDiscover } from "@/app/discover/_components/discover-provider";
import FiltersIcon from "../../icons/filters";
import Button from "../button/button";
import SideMenu from "../side-menu/side-menu";

type FiltersState = NonNullable<Params["filters"]>;
type ValidationErrors = Partial<
  Record<"biasScore" | "factualScore" | "publishedAt", string>
>;

function dateInputValue(value: string | null | undefined) {
  return value?.slice(0, 10) ?? "";
}

function labelFor(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toggleValue(values: string[] | undefined, value: string) {
  return values?.includes(value)
    ? values.filter((item) => item !== value)
    : [...(values ?? []), value];
}

function validateFilters(filters: FiltersState): ValidationErrors {
  const errors: ValidationErrors = {};
  const scoreRanges = [
    [filters.minBiasScore, filters.maxBiasScore, "biasScore"],
    [filters.minFactualScore, filters.maxFactualScore, "factualScore"],
  ] as const;

  scoreRanges.forEach(([minimum, maximum, key]) => {
    if (
      (minimum !== undefined &&
        (!Number.isFinite(minimum) || minimum < 0 || minimum > 1)) ||
      (maximum !== undefined &&
        (!Number.isFinite(maximum) || maximum < 0 || maximum > 1))
    ) {
      errors[key] = "Scores must be between 0 and 1.";
    } else if (
      minimum !== undefined &&
      maximum !== undefined &&
      minimum > maximum
    ) {
      errors[key] = "Minimum score cannot be greater than maximum score.";
    }
  });

  if (
    filters.minPublishedAt &&
    filters.maxPublishedAt &&
    new Date(filters.minPublishedAt) > new Date(filters.maxPublishedAt)
  ) {
    errors.publishedAt = "Start date cannot be after end date.";
  }

  return errors;
}

export default function Filters() {
  const {
    search,
    sorting,
    filters,
    includeUnanalyzed,
    saveFilters,
  } = useDiscover();
  const [isOpen, setIsOpen] = useState(false);
  const [draftSorting, setDraftSorting] = useState(sorting);
  const [draftFilters, setDraftFilters] = useState<FiltersState>(filters);
  const [metadata, setMetadata] = useState<PreviewFilterMetadata | null>(null);
  const [sourceQuery, setSourceQuery] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(
      async () => {
        try {
          const query = sourceQuery.trim();
          const params = new URLSearchParams();
          if (query) params.set("q", query);
          if (draftFilters.sources?.length)
            params.set("selected", draftFilters.sources.join(","));
          const response = await fetch(
            `/api/v1/analyses/previews/filters${params.size ? `?${params}` : ""}`,
            { signal: controller.signal },
          );
          const result =
            (await response.json()) as ApiResponse<PreviewFilterMetadata>;
          if (response.ok && result.data) setMetadata(result.data);
        } catch (error) {
          if ((error as Error).name !== "AbortError") console.error(error);
        }
      },
      sourceQuery ? 250 : 0,
    );

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [draftFilters.sources, isOpen, sourceQuery]);

  const sourceOptions = useMemo(() => metadata?.sources ?? [], [metadata]);

  function applyFilters() {
    const errors = validateFilters(draftFilters);
    setValidationErrors(errors);
    if (Object.keys(errors).length) return;

    saveFilters(draftSorting, draftFilters, search, includeUnanalyzed);
    setIsOpen(false);
  }

  function openFilters() {
    setDraftSorting(sorting);
    setDraftFilters(filters);
    setValidationErrors({});
    setIsOpen(true);
  }

  function clearFilters() {
    setDraftSorting("newest");
    setDraftFilters({});
    setSourceQuery("");
    setValidationErrors({});
  }

  function toggleUnanalyzed() {
    saveFilters(sorting, filters, search, !includeUnanalyzed);
  }

  const hasAnalysisFilters =
    filters.minBiasScore !== undefined ||
    filters.maxBiasScore !== undefined ||
    filters.minFactualScore !== undefined ||
    filters.maxFactualScore !== undefined ||
    Boolean(filters.sentiments?.length);

  function updateScore(
    key:
      "minBiasScore" | "maxBiasScore" | "minFactualScore" | "maxFactualScore",
    value: string,
  ) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value === "" ? undefined : Number(value),
    }));
    setValidationErrors((current) => ({
      ...current,
      [key.includes("Bias") ? "biasScore" : "factualScore"]: undefined,
    }));
  }

  function updateDate(key: "minPublishedAt" | "maxPublishedAt", value: string) {
    setDraftFilters((current) => ({ ...current, [key]: value || undefined }));
    setValidationErrors((current) => ({ ...current, publishedAt: undefined }));
  }

  return (
    <div className="w-full md:w-auto">
      <SideMenu setOpen={setIsOpen} open={isOpen}>
        <div className="flex flex-col gap-3">
          <label htmlFor="sorting" className="text-sm font-bold">
            Sort by
          </label>
          <select
            name="sorting"
            id="sorting"
            value={draftSorting}
            onChange={(event) =>
              setDraftSorting(event.target.value as Params["sorting"])
            }
            className="min-h-11 bg-clay-600 border-r-[1.25rem] border-clay-600 rounded-md hover:cursor-pointer py-2 px-6 transition-colors duration-250"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="factualScore">Factual Score</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-7 pr-1 menu-scrollbar">
          <FilterSection title="Sources">
            <input
              type="search"
              value={sourceQuery}
              onChange={(event) => setSourceQuery(event.target.value)}
              placeholder="Search analyzed sources"
              className="w-full min-h-11 rounded-md bg-clay-800 border border-clay-600 px-3"
            />
            <p className="text-xs text-clay-300 pt-3">
              {sourceQuery ? "Matching sources" : "Most analyzed sources"}
            </p>
            <div className="flex flex-col gap-2">
              {sourceOptions.map((source) => (
                <CheckboxOption
                  key={source.slug}
                  checked={draftFilters.sources?.includes(source.slug) ?? false}
                  label={`${source.name} (${source.count})`}
                  onChange={() =>
                    setDraftFilters((current) => ({
                      ...current,
                      sources: toggleValue(current.sources, source.slug),
                    }))
                  }
                />
              ))}
              {sourceQuery && sourceOptions.length === 0 && (
                <p className="text-sm text-clay-300">
                  No analyzed sources match that search.
                </p>
              )}
            </div>
          </FilterSection>

          <FilterSection title="Sentiment">
            {metadata?.sentiments.map((option) => (
              <CheckboxOption
                key={option.value}
                checked={
                  draftFilters.sentiments?.includes(option.value) ?? false
                }
                label={`${labelFor(option.value)} (${option.count})`}
                onChange={() =>
                  setDraftFilters((current) => ({
                    ...current,
                    sentiments: toggleValue(current.sentiments, option.value),
                  }))
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="Credibility">
            {metadata?.credibilities.map((option) => (
              <CheckboxOption
                key={option.value}
                checked={
                  draftFilters.credibilities?.includes(option.value) ?? false
                }
                label={`${labelFor(option.value)} (${option.count})`}
                onChange={() =>
                  setDraftFilters((current) => ({
                    ...current,
                    credibilities: toggleValue(
                      current.credibilities,
                      option.value,
                    ),
                  }))
                }
              />
            ))}
          </FilterSection>

          <ScoreFields
            title="Bias score"
            error={validationErrors.biasScore}
            values={[draftFilters.minBiasScore, draftFilters.maxBiasScore]}
            onChange={(key, value) =>
              updateScore(
                key === "min" ? "minBiasScore" : "maxBiasScore",
                value,
              )
            }
          />
          <ScoreFields
            title="Factual score"
            error={validationErrors.factualScore}
            values={[
              draftFilters.minFactualScore,
              draftFilters.maxFactualScore,
            ]}
            onChange={(key, value) =>
              updateScore(
                key === "min" ? "minFactualScore" : "maxFactualScore",
                value,
              )
            }
          />

          <FilterSection title="Published at">
            <div className="grid grid-cols-2 gap-3">
              <DateField
                label="From"
                value={dateInputValue(draftFilters.minPublishedAt)}
                onChange={(value) => updateDate("minPublishedAt", value)}
              />
              <DateField
                label="To"
                value={dateInputValue(draftFilters.maxPublishedAt)}
                onChange={(value) => updateDate("maxPublishedAt", value)}
              />
            </div>
            {validationErrors.publishedAt && (
              <p className="text-sm text-red-300">
                {validationErrors.publishedAt}
              </p>
            )}
          </FilterSection>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3">
          <Button type="button" variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button type="button" variant="brand" onClick={applyFilters}>
            Apply Changes
          </Button>
        </div>
      </SideMenu>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <div className="flex w-fit items-center gap-1.5">
          <input
            type="checkbox"
            id="unanalyzed_articles"
            name="unanalyzed_articles"
            checked={includeUnanalyzed}
            onChange={toggleUnanalyzed}
          />
          <label htmlFor="unanalyzed_articles" className="whitespace-nowrap">
            Show unanalyzed articles
          </label>
        </div>
        {includeUnanalyzed && hasAnalysisFilters && (
          <p className="text-xs text-clay-300 max-w-60">
            Unanalyzed articles are hidden when Bias Score, Factual Score, or
            Sentiment filters are applied.
          </p>
        )}

        <Button
          type="button"
          variant="secondary"
          className="flex w-fit items-center justify-center gap-2"
          onClick={isOpen ? () => setIsOpen(false) : openFilters}
        >
          <FiltersIcon /> <span>Filters</span>
        </Button>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-bold pb-3">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckboxOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex gap-1.5 items-center text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-3 accent-brand-500"
      />
      {label}
    </label>
  );
}

function ScoreFields({
  title,
  error,
  values,
  onChange,
}: {
  title: string;
  error?: string;
  values: [number | undefined, number | undefined];
  onChange: (key: "min" | "max", value: string) => void;
}) {
  return (
    <FilterSection title={title}>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Min"
          value={values[0]}
          onChange={(value) => onChange("min", value)}
        />
        <NumberField
          label="Max"
          value={values[1]}
          onChange={(value) => onChange("max", value)}
        />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </FilterSection>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-clay-300">
      {label}
      <input
        type="number"
        step="0.01"
        value={value ?? ""}
        min="0"
        max="1"
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md bg-clay-800 border border-clay-600 px-3 text-clay-50"
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-clay-300">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md bg-clay-800 border border-clay-600 px-3 text-clay-50"
      />
    </label>
  );
}
