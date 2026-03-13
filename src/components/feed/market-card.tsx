"use client";

import { useRef, useState } from "react";
import { NormalizedEvent, MarketOption } from "@/lib/types";
import { formatVolume, formatPriceChange } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, ChevronDown, ArrowUpRight as TradeIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function PriceChangeInline({ change }: { change: number | null }) {
  if (change === null || change === 0) return null;
  const isUp = change > 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`font-mono text-[10px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium ${
        isUp
          ? "text-[var(--c-green)] bg-[rgba(61,140,108,0.08)]"
          : "text-[var(--c-red)] bg-[rgba(199,90,74,0.08)]"
      }`}
    >
      <Icon className="h-2.5 w-2.5" />
      {formatPriceChange(change)}
    </span>
  );
}

function OptionRow({
  option,
  maxProb,
  isTop,
  source,
}: {
  option: MarketOption;
  maxProb: number;
  isTop: boolean;
  source: "kalshi" | "polymarket";
}) {
  const pct = Math.round(option.probability * 100);
  const barW = maxProb > 0 ? (option.probability / maxProb) * 100 : 0;

  const isKalshi = source === "kalshi";
  const barBg = isTop
    ? isKalshi ? "bg-[rgba(90,138,122,0.22)]" : "bg-[rgba(196,122,90,0.22)]"
    : isKalshi ? "bg-[rgba(90,138,122,0.10)]" : "bg-[rgba(196,122,90,0.10)]";

  return (
    <div className={`px-5 py-2.5 ${isTop ? (isKalshi ? "bg-[rgba(90,138,122,0.04)]" : "bg-[rgba(196,122,90,0.04)]") : ""}`}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className={`text-[14px] truncate min-w-0 flex-1 ${isTop ? "font-medium c-primary" : "font-normal c-secondary"}`}>
          {option.label}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <PriceChangeInline change={option.priceChange24h} />
          <span className={`font-mono text-[14px] font-semibold tabular-nums ${isTop ? "c-primary" : "c-secondary"}`}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(0,0,0,0.04)] overflow-hidden">
        <div
          className={`h-full rounded-full bar-animate ${barBg}`}
          style={{ width: `${barW}%` }}
        />
      </div>
    </div>
  );
}

export function MarketCard({ event }: { event: NormalizedEvent; index: number }) {
  const timeAgo = event.endDate
    ? formatDistanceToNow(new Date(event.endDate), { addSuffix: false })
    : null;

  const maxProb = event.options[0]?.probability || 1;
  const optionsRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);

  const INITIAL = 5;
  const hasMore = event.options.length > INITIAL;
  const visible = showAll || !hasMore ? event.options : event.options.slice(0, INITIAL);

  const isKalshi = event.source === "kalshi";

  return (
    <div className="h-[100dvh] w-full snap-start snap-always flex items-center justify-center px-4">
      <div className="card-surface w-full max-w-lg flex flex-col overflow-hidden card-enter" style={{ maxHeight: "calc(100dvh - 100px)" }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                isKalshi
                  ? "text-[var(--accent-kalshi)] bg-[rgba(90,138,122,0.08)]"
                  : "text-[var(--accent-poly)] bg-[rgba(196,122,90,0.08)]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isKalshi ? "bg-[var(--accent-kalshi)]" : "bg-[var(--accent-poly)]"}`} />
              {event.source}
            </span>
          </div>
          <h2 className="text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] line-clamp-3 c-primary">
            {event.title}
          </h2>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-[rgba(0,0,0,0.06)]" />

        {/* Options list */}
        <div className="flex-1 min-h-[120px] overflow-hidden">
          <div
            ref={optionsRef}
            className="h-full overflow-y-auto scrollbar-hide overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {visible.map((o, i) => (
                <OptionRow
                  key={o.id}
                  option={o}
                  maxProb={maxProb}
                  isTop={i === 0}
                  source={event.source}
                />
              ))}
            </div>
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium c-dim hover:c-secondary transition-colors"
              >
                <ChevronDown className="h-3 w-3" />
                Show all {event.options.length}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 shrink-0 border-t border-[rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[11px] c-dim">
              {timeAgo && <span>{timeAgo}</span>}
              {timeAgo && event.totalVolume24h > 0 && <span className="opacity-40">|</span>}
              {event.totalVolume24h > 0 && <span>{formatVolume(event.totalVolume24h)} vol</span>}
            </div>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-opacity hover:opacity-70 ${
                isKalshi
                  ? "text-[var(--accent-kalshi)] bg-[rgba(90,138,122,0.08)]"
                  : "text-[var(--accent-poly)] bg-[rgba(196,122,90,0.08)]"
              }`}
            >
              Trade
              <TradeIcon className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="h-[100dvh] w-full snap-start snap-always flex items-center justify-center px-4">
      <div className="card-surface w-full max-w-lg overflow-hidden">
        <div className="px-5 pt-5 space-y-4">
          <div className="h-5 w-20 rounded-full animate-shimmer" />
          <div className="space-y-2">
            <div className="h-5 w-full rounded animate-shimmer" />
            <div className="h-5 w-3/4 rounded animate-shimmer" />
          </div>
        </div>
        <div className="mx-5 mt-4 h-px bg-[rgba(0,0,0,0.06)]" />
        <div className="px-5 py-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3.5 w-28 rounded animate-shimmer" />
                <div className="h-3.5 w-10 rounded animate-shimmer" />
              </div>
              <div className="h-1.5 rounded-full animate-shimmer" />
            </div>
          ))}
        </div>
        <div className="px-5 py-3.5 flex justify-between border-t border-[rgba(0,0,0,0.06)]">
          <div className="h-3 w-24 rounded animate-shimmer" />
          <div className="h-5 w-16 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
