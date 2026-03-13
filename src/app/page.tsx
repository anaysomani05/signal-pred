import { MarketFeed } from "@/components/feed/market-feed";

export default function Home() {
  return (
    <main className="h-[100dvh] w-full max-w-lg mx-auto relative overflow-hidden">
      <MarketFeed />
    </main>
  );
}
