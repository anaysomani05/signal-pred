"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatPriceChange } from "@/lib/utils";

export function PriceChange({ change }: { change: number | null }) {
  if (change === null || change === 0) {
    return <span className="font-mono text-xs c-dim">--</span>;
  }

  const cls = change > 0 ? "c-green" : "c-red";
  const Icon = change > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {formatPriceChange(change)}
    </span>
  );
}
