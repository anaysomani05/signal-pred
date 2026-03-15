"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { NormalizedEvent, MarketQueryParams } from "@/lib/types";
import { getSeenIds, markSeen } from "@/lib/seen-markets";

interface UseMarketsResult {
  events: NormalizedEvent[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  sources: { kalshi: boolean; polymarket: boolean };
  refresh: () => void;
  loadMore: () => void;
}

/**
 * Reorder events so unseen markets are boosted toward the top.
 * Unseen markets keep their relative order, then seen markets follow in theirs.
 */
function boostUnseen(
  events: NormalizedEvent[],
  seen: Set<string>
): NormalizedEvent[] {
  if (seen.size === 0) return events;
  const unseen: NormalizedEvent[] = [];
  const seenEvents: NormalizedEvent[] = [];
  for (const e of events) {
    if (seen.has(e.id)) {
      seenEvents.push(e);
    } else {
      unseen.push(e);
    }
  }
  return [...unseen, ...seenEvents];
}

export function useMarkets(params: MarketQueryParams): UseMarketsResult {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [sources, setSources] = useState({ kalshi: true, polymarket: true });
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const markedRef = useRef<Set<string>>(new Set());

  const fetchEvents = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const url = `/api/markets?sort=${params.sort}&category=${params.category}&page=${pageNum}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        // Boost unseen markets to the top
        const seen = getSeenIds();
        const reordered = boostUnseen(data.events, seen);

        setEvents(reordered);
        setHasMore(data.hasMore);
        setSources(data.sources);

        // Mark the first batch of visible markets as seen (first ~10)
        const newIds = reordered
          .slice(0, 10)
          .map((e) => e.id)
          .filter((id) => !markedRef.current.has(id));
        if (newIds.length > 0) {
          markSeen(newIds);
          for (const id of newIds) markedRef.current.add(id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [params.sort, params.category]
  );

  useEffect(() => {
    setPage(1);
    markedRef.current = new Set();
    fetchEvents(1, false);
  }, [params.sort, params.category, refreshKey, fetchEvents]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEvents(nextPage, true);
  }, [page, fetchEvents]);

  return { events, isLoading, isLoadingMore, error, hasMore, sources, refresh, loadMore };
}
