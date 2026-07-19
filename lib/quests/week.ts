/** ISO week start (Monday) as YYYY-MM-DD in UTC. */
export function getIsoWeekStart(date: Date): string {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = utc.getUTCDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

/** Deterministic-ish shuffle seeded by userId + weekStart. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = copy.length - 1; i > 0; i -= 1) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const j = Math.abs(h) % (i + 1);
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}
