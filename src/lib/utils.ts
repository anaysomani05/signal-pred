import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
  return `$${Math.round(volume)}`;
}

export function formatProbability(prob: number): string {
  return `${Math.round(prob * 100)}%`;
}

export function formatPriceChange(change: number | null): string {
  if (change === null) return "N/A";
  const pp = (change * 100).toFixed(1);
  return change >= 0 ? `+${pp}` : `${pp}`;
}
