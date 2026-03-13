"use client";

import { MarketQueryParams } from "@/lib/types";

const SORTS: { value: MarketQueryParams["sort"]; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "New" },
  { value: "closing_soon", label: "Ending" },
];

interface SortSelectorProps {
  selected: MarketQueryParams["sort"];
  onSelect: (sort: MarketQueryParams["sort"]) => void;
}

export function SortSelector({ selected, onSelect }: SortSelectorProps) {
  return (
    <div className="flex gap-0.5 rounded-full bg-[rgba(0,0,0,0.04)] p-0.5">
      {SORTS.map((s) => (
        <button
          key={s.value}
          onClick={() => onSelect(s.value)}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all duration-150 ${
            selected === s.value
              ? "bg-[var(--bg-card)] text-[var(--c-primary)] shadow-sm"
              : "text-[var(--c-dim)] hover:text-[var(--c-secondary)]"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
