import { NormalizedEvent, MarketOption, MarketCategory } from "./types";

const GAMMA_BASE = "https://gamma-api.polymarket.com";

const TAG_MAP: Record<string, MarketCategory> = {
  Politics: "politics",
  "US Elections": "politics",
  Elections: "politics",
  Economics: "economics",
  Finance: "economics",
  Business: "economics",
  Crypto: "crypto",
  Bitcoin: "crypto",
  Ethereum: "crypto",
  Sports: "sports",
  NFL: "sports",
  NBA: "sports",
  Soccer: "sports",
  MLB: "sports",
  Science: "science",
  Technology: "science",
  AI: "science",
  "Climate and Weather": "science",
  World: "world",
  "Global Affairs": "world",
  Entertainment: "entertainment",
  "Pop Culture": "entertainment",
  Music: "entertainment",
};

function mapTagsToCategory(
  tags: { label: string }[] | undefined
): MarketCategory {
  if (!tags || tags.length === 0) return "other";
  for (const tag of tags) {
    const mapped = TAG_MAP[tag.label];
    if (mapped) return mapped;
  }
  return "other";
}

interface PolyMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  active: boolean;
  closed: boolean;
  bestBid: number;
  bestAsk: number;
  lastTradePrice: number;
  oneDayPriceChange: number;
  volume24hr: number;
  endDate: string;
  groupItemTitle: string;
}

interface PolyEvent {
  id: string;
  slug: string;
  title: string;
  active: boolean;
  closed: boolean;
  restricted: boolean;
  volume: number;
  volume24hr: number;
  tags: { id: string; label: string; slug: string }[];
  markets: PolyMarket[];
}

function parseProbability(market: PolyMarket): number {
  try {
    const prices: string[] =
      typeof market.outcomePrices === "string"
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices;
    const p = parseFloat(prices[0]);
    if (!isNaN(p) && p > 0 && p < 1) return p;
  } catch {
    // fall through
  }
  const ltp = market.lastTradePrice;
  if (typeof ltp === "number" && !isNaN(ltp) && ltp > 0 && ltp < 1) return ltp;
  return 0.5;
}

export async function fetchPolymarketEvents(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];

  try {
    const res = await fetch(
      `${GAMMA_BASE}/events?active=true&closed=false&limit=200`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.error(`Polymarket API error: ${res.status}`);
      return [];
    }

    const rawEvents: PolyEvent[] = await res.json();

    for (const event of rawEvents) {
      const openMarkets = (event.markets || []).filter((m) => !m.closed);
      if (openMarkets.length === 0) continue;

      const category = mapTagsToCategory(event.tags);
      const options: MarketOption[] = [];
      let totalVolume24h = 0;

      const isMultiMarket = openMarkets.length > 1;

      for (const market of openMarkets) {
        const probability = parseProbability(market);
        if (probability === 0 || probability === 1) continue;

        // In multi-market events, skip anonymized/placeholder options.
        // Fake markets have no real order book: bestBid is missing/zero.
        // Real traded markets always have a non-zero bestBid.
        if (isMultiMarket && (!market.bestBid || market.bestBid === 0)) {
          continue;
        }

        const volume24h = market.volume24hr ?? event.volume24hr ?? 0;
        totalVolume24h += volume24h;

        let label = "Yes";
        if (isMultiMarket) {
          label =
            market.groupItemTitle ||
            market.question
              .replace(event.title, "")
              .replace("?", "")
              .trim() ||
            market.question;
        }

        options.push({
          id: `poly:${market.id}`,
          label,
          probability,
          priceChange24h: market.oneDayPriceChange ?? null,
          volume24h,
          yesBid: market.bestBid || 0,
          yesAsk: market.bestAsk || 0,
        });
      }

      if (options.length === 0) continue;

      options.sort((a, b) => b.probability - a.probability);

      const endDate = openMarkets[0]?.endDate || null;

      events.push({
        id: `poly:${event.id}`,
        source: "polymarket",
        title: event.title,
        category,
        endDate,
        url: `https://polymarket.com/event/${event.slug}`,
        totalVolume24h,
        options,
      });
    }
  } catch (err) {
    console.error("Failed to fetch Polymarket events:", err);
  }

  return events;
}
