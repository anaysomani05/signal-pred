import { NextRequest, NextResponse } from "next/server";
import { fetchKalshiEvents } from "@/lib/kalshi";
import { fetchPolymarketEvents } from "@/lib/polymarket";
import { mergeAndSort } from "@/lib/normalize";
import { MarketQueryParams, MarketCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sort =
      (searchParams.get("sort") as MarketQueryParams["sort"]) || "trending";
    const category =
      (searchParams.get("category") as MarketCategory | "all") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const [kalshiResult, polyResult] = await Promise.allSettled([
      fetchKalshiEvents(),
      fetchPolymarketEvents(),
    ]);

    const kalshiEvents =
      kalshiResult.status === "fulfilled" ? kalshiResult.value : [];
    const polyEvents =
      polyResult.status === "fulfilled" ? polyResult.value : [];

    const { events, hasMore, total } = mergeAndSort(
      kalshiEvents,
      polyEvents,
      { sort, category, page, perSource: 50 }
    );

    const sources = {
      kalshi: kalshiResult.status === "fulfilled" && kalshiEvents.length > 0,
      polymarket: polyResult.status === "fulfilled" && polyEvents.length > 0,
    };

    return NextResponse.json(
      { events, hasMore, total, sources },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("Markets API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
