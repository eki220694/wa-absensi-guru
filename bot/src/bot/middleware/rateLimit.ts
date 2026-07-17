const store = new Map<string, number[]>();
const MAX_REQS = 5;
const WINDOW_MS = 60_000;

export function checkRateLimit(noWa: string): boolean {
  const now = Date.now();
  const timestamps = store.get(noWa) || [];
  const recent = timestamps.filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQS) return false;
  recent.push(now);
  store.set(noWa, recent);
  return true;
}
