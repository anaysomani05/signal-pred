export type MarketSource = "kalshi" | "polymarket";

export type MarketCategory =
  | "politics"
  | "economics"
  | "crypto"
  | "sports"
  | "science"
  | "world"
  | "entertainment"
  | "other";

// A single option/outcome within an event
export interface MarketOption {
  id: string;
  label: string;
  probability: number;
  priceChange24h: number | null;
  volume24h: number;
  yesBid: number;
  yesAsk: number;
}

// An event can be binary (1 option) or multi-outcome (many options)
export interface NormalizedEvent {
  id: string;
  source: MarketSource;
  title: string; // The event/question title
  category: MarketCategory;
  endDate: string | null;
  url: string;
  totalVolume24h: number;
  options: MarketOption[]; // sorted by probability desc
}

export interface MarketQueryParams {
  sort: "trending" | "newest" | "closing_soon";
  category: MarketCategory | "all";
}

export const CATEGORIES: { value: MarketCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "politics", label: "Politics" },
  { value: "economics", label: "Economics" },
  { value: "crypto", label: "Crypto" },
  { value: "sports", label: "Sports" },
  { value: "science", label: "Science" },
  { value: "world", label: "World" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];
