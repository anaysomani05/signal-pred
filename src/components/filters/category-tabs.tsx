"use client";

import { CATEGORIES, MarketCategory } from "@/lib/types";

interface CategoryTabsProps {
  selected: MarketCategory | "all";
  onSelect: (category: MarketCategory | "all") => void;
}

export function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-0.5 overflow-x-auto px-5 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-150 ${
            selected === cat.value
              ? "bg-[var(--bg-card)] text-[var(--c-primary)] shadow-sm"
              : "text-[var(--c-dim)] hover:text-[var(--c-secondary)] hover:bg-[rgba(0,0,0,0.04)]"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
