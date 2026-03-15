import { NormalizedEvent, MarketOption, MarketCategory } from "./types";

const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

const CATEGORY_MAP: Record<string, MarketCategory> = {
  Politics: "politics",
  Economics: "economics",
  Financials: "economics",
  Finance: "economics",
  "Climate and Weather": "science",
  "Science and Technology": "science",
  Climate: "science",
  Tech: "science",
  Science: "science",
  Sports: "sports",
  World: "world",
  Entertainment: "entertainment",
  Culture: "entertainment",
  Crypto: "crypto",
};

function mapCategory(category: string | undefined): MarketCategory {
  if (!category) return "other";
  return CATEGORY_MAP[category] || "other";
}

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle: string;
  status: string;
  yes_bid: number;
  yes_ask: number;
  last_price: number;
  volume_24h: number;
  close_time: string;
  expiration_time: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  last_price_dollars?: string;
  volume_24h_fp?: string;
  previous_price_dollars?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
}

interface KalshiEvent {
  event_ticker: string;
  title: string;
  category: string;
  markets: KalshiMarket[];
  mutually_exclusive?: boolean;
}

interface KalshiEventsResponse {
  events: KalshiEvent[];
  cursor: string;
}

export async function fetchKalshiEvents(): Promise<NormalizedEvent[]> {
  const events: NormalizedEvent[] = [];

  try {
    const res = await fetch(
      `${KALSHI_BASE}/events?with_nested_markets=true&limit=500`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.error(`Kalshi API error: ${res.status}`);
      return [];
    }

    const data: KalshiEventsResponse = await res.json();

    for (const event of data.events) {
      const activeMarkets = (event.markets || []).filter(
        (m) => m.status === "active" || m.status === "open"
      );
      if (activeMarkets.length === 0) continue;

      const options: MarketOption[] = [];
      let totalVolume24h = 0;

      for (const market of activeMarkets) {
        const probability = market.last_price_dollars
          ? parseFloat(market.last_price_dollars)
          : market.last_price / 100;

        if (probability === 0 || probability === 1) continue;

        const volume24h = market.volume_24h_fp
          ? parseFloat(market.volume_24h_fp)
          : market.volume_24h / 100;

        const yesBid = market.yes_bid_dollars
          ? parseFloat(market.yes_bid_dollars)
          : market.yes_bid / 100;

        const yesAsk = market.yes_ask_dollars
          ? parseFloat(market.yes_ask_dollars)
          : market.yes_ask / 100;

        let priceChange24h: number | null = null;
        if (market.previous_price_dollars) {
          const prev = parseFloat(market.previous_price_dollars);
          if (prev > 0 && prev < 1) {
            priceChange24h = probability - prev;
          }
        }

        // For multi-outcome: yes_sub_title has the specific option name (e.g. candidate name),
        // while subtitle often just has a generic category (e.g. "Democratic", "Republican").
        let label =
          market.yes_sub_title ||
          market.subtitle ||
          market.title ||
          "Yes";
        // Clean up Kalshi label prefixes like ":: "
        label = label.replace(/^::\s*/, "").trim();

        totalVolume24h += volume24h;

        options.push({
          id: `kalshi:${market.ticker}`,
          label,
          probability,
          priceChange24h,
          volume24h,
          yesBid,
          yesAsk,
        });
      }

      if (options.length === 0) continue;

      // Sort options by probability descending
      options.sort((a, b) => b.probability - a.probability);

      // Use first market's close_time as event endDate
      const endDate =
        activeMarkets[0]?.close_time ||
        activeMarkets[0]?.expiration_time ||
        null;

      events.push({
        id: `kalshi:${event.event_ticker}`,
        source: "kalshi",
        title: event.title,
        category: mapCategory(event.category),
        endDate,
        url: `https://kalshi.com/markets/${event.event_ticker}`,
        totalVolume24h,
        options,
      });
    }
  } catch (err) {
    console.error("Failed to fetch Kalshi events:", err);
  }

  return events;
}
