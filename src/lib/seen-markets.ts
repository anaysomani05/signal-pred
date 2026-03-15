const STORAGE_KEY = "signal:seen-markets";
const MAX_SEEN = 500; // cap to avoid localStorage bloat

interface SeenData {
  ids: string[];
  lastReset: number; // timestamp
}

function getData(): SeenData {
  if (typeof window === "undefined") return { ids: [], lastReset: Date.now() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ids: [], lastReset: Date.now() };
    const data: SeenData = JSON.parse(raw);
    // Auto-reset after 24 hours so stale "seen" data doesn't persist forever
    if (Date.now() - data.lastReset > 24 * 60 * 60 * 1000) {
      return { ids: [], lastReset: Date.now() };
    }
    return data;
  } catch {
    return { ids: [], lastReset: Date.now() };
  }
}

function save(data: SeenData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full — clear and retry
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** Get the set of seen market IDs */
export function getSeenIds(): Set<string> {
  return new Set(getData().ids);
}

/** Mark market IDs as seen */
export function markSeen(ids: string[]) {
  const data = getData();
  const set = new Set(data.ids);
  for (const id of ids) set.add(id);
  // Keep only the most recent entries if over cap
  const arr = Array.from(set);
  data.ids = arr.length > MAX_SEEN ? arr.slice(arr.length - MAX_SEEN) : arr;
  save(data);
}
