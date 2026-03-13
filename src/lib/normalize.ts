import { NormalizedEvent, MarketQueryParams } from "./types";

function sortEvents(
  events: NormalizedEvent[],
  sort: MarketQueryParams["sort"]
): NormalizedEvent[] {
  const sorted = [...events];
  switch (sort) {
    case "trending":
      sorted.sort((a, b) => b.totalVolume24h - a.totalVolume24h);
      break;
    case "newest":
      sorted.sort((a, b) => {
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      });
      break;
    case "closing_soon":
      sorted.sort((a, b) => {
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      });
      break;
  }
  return sorted;
}

export function mergeAndSort(
  kalshiEvents: NormalizedEvent[],
  polyEvents: NormalizedEvent[],
  params: MarketQueryParams & { page?: number; perSource?: number }
): { events: NormalizedEvent[]; hasMore: boolean; total: number } {
  const perSource = params.perSource || 50;
  const page = params.page || 1;

  let kalshi = kalshiEvents;
  let poly = polyEvents;

  if (params.category !== "all") {
    kalshi = kalshi.filter((e) => e.category === params.category);
    poly = poly.filter((e) => e.category === params.category);
  }

  // Filter out events where all options are near-resolved
  kalshi = kalshi.filter((e) =>
    e.options.some((o) => o.probability > 0.03 && o.probability < 0.97)
  );
  poly = poly.filter((e) =>
    e.options.some((o) => o.probability > 0.03 && o.probability < 0.97)
  );

  kalshi = sortEvents(kalshi, params.sort);
  poly = sortEvents(poly, params.sort);

  const total = kalshi.length + poly.length;

  const kalshiSlice = kalshi.slice(0, perSource * page);
  const polySlice = poly.slice(0, perSource * page);

  // Interleave
  const merged: NormalizedEvent[] = [];
  const maxLen = Math.max(kalshiSlice.length, polySlice.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < polySlice.length) merged.push(polySlice[i]);
    if (i < kalshiSlice.length) merged.push(kalshiSlice[i]);
  }

  const hasMore =
    kalshi.length > perSource * page || poly.length > perSource * page;

  return { events: merged, hasMore, total };
}
