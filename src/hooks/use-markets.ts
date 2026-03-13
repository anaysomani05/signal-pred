"use client";

import { useState, useEffect, useCallback } from "react";
import { NormalizedEvent, MarketQueryParams } from "@/lib/types";

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

export function useMarkets(params: MarketQueryParams): UseMarketsResult {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [sources, setSources] = useState({ kalshi: true, polymarket: true });
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

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
        setEvents(data.events);
        setHasMore(data.hasMore);
        setSources(data.sources);
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
