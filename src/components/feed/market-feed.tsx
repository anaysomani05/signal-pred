"use client";

import { useState, useRef, useCallback } from "react";
import { useMarkets } from "@/hooks/use-markets";
import { MarketQueryParams, MarketCategory } from "@/lib/types";
import { MarketCard, MarketCardSkeleton } from "./market-card";
import { CategoryTabs } from "@/components/filters/category-tabs";
import { SortSelector } from "@/components/filters/sort-selector";
import { AlertCircle, ChevronDown, Loader2, RefreshCw } from "lucide-react";

export function MarketFeed() {
  const [sort, setSort] = useState<MarketQueryParams["sort"]>("trending");
  const [category, setCategory] = useState<MarketCategory | "all">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { events, isLoading, isLoadingMore, error, hasMore, sources, refresh, loadMore } =
    useMarkets({ sort, category });

  // Pull to refresh
  const touchStartY = useRef(0);
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current || scrollRef.current.scrollTop > 0) return;
    const d = e.touches[0].clientY - touchStartY.current;
    if (d > 0) setPullDist(Math.min(d * 0.5, 80));
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pullDist > 60) {
      setRefreshing(true);
      refresh();
      setTimeout(() => { setRefreshing(false); setPullDist(0); }, 1000);
    } else {
      setPullDist(0);
    }
  }, [pullDist, refresh]);

  const hasSourceIssue = !sources.kalshi || !sources.polymarket;

  return (
    <div className="relative h-[100dvh] w-full bg-base">
      {/* Header — 2 rows, frosted glass */}
      <div className="fixed top-0 left-0 right-0 z-30 max-w-lg mx-auto" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="header-backdrop">
          {/* Row 1: title + sort */}
          <div className="flex items-center justify-between px-5 pt-3.5 pb-2.5">
            <div className="flex items-center gap-2">
              <h1 className="text-[13px] font-semibold tracking-tight c-primary">signal</h1>
              {hasSourceIssue && (
                <span className="text-[10px] c-dim font-medium">
                  · {!sources.kalshi && "kalshi "}{!sources.polymarket && "poly "}offline
                </span>
              )}
            </div>
            <SortSelector selected={sort} onSelect={setSort} />
          </div>
          {/* Row 2: category pills */}
          <div className="pb-2.5">
            <CategoryTabs selected={category} onSelect={setCategory} />
          </div>
        </div>
      </div>

      {/* Pull indicator */}
      {pullDist > 0 && (
        <div className="fixed left-1/2 -translate-x-1/2 z-40" style={{ top: 80, opacity: pullDist / 60 }}>
          <RefreshCw
            className={`h-4 w-4 c-dim ${refreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullDist * 3}deg)` }}
          />
        </div>
      )}

      {/* Feed */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: pullDist > 0 ? `translateY(${pullDist}px)` : undefined,
          transition: pullDist === 0 ? "transform 0.3s ease" : undefined,
        }}
      >
        {isLoading && <><MarketCardSkeleton /><MarketCardSkeleton /></>}

        {error && (
          <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-4 snap-start px-6">
            <AlertCircle className="h-6 w-6 c-dim" />
            <p className="text-[15px] font-medium c-primary">Something went wrong</p>
            <p className="text-[11px] c-dim">{error}</p>
            <button onClick={refresh} className="btn-outline px-5 py-2 text-[11px] font-medium">Retry</button>
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-2 snap-start">
            <p className="text-[15px] c-secondary">No markets found</p>
            <p className="text-[11px] c-dim">Try a different category</p>
          </div>
        )}

        {!isLoading && events.map((event, i) => (
          <MarketCard key={event.id} event={event} index={i} />
        ))}

        {!isLoading && !error && hasMore && (
          <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-4 snap-start">
            <p className="text-[11px] c-dim">{events.length} events loaded</p>
            <button onClick={loadMore} disabled={isLoadingMore} className="btn-outline flex items-center gap-2 px-6 py-2.5 text-[11px] font-medium">
              {isLoadingMore
                ? <><Loader2 className="h-4 w-4 animate-spin" />Loading...</>
                : <><ChevronDown className="h-4 w-4" />Load More</>}
            </button>
          </div>
        )}

        {!isLoading && !error && events.length > 0 && !hasMore && (
          <div className="h-[40dvh] w-full flex items-center justify-center snap-start">
            <p className="text-[11px] c-dim">End of feed</p>
          </div>
        )}
      </div>
    </div>
  );
}
