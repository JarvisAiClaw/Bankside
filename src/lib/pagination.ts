/** Shared feed/comment page size (cursor or page). */
export const PAGE_SIZE = 20;

export function parsePage(raw: string | undefined | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), 10_000);
}

/** Encode a simple opaque cursor from createdAt + id. */
export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString("base64url");
}

export function decodeCursor(raw: string | undefined | null): { createdAt: Date; id: string } | null {
  if (!raw) return null;
  try {
    const text = Buffer.from(raw, "base64url").toString("utf8");
    const i = text.indexOf("|");
    if (i < 1) return null;
    const createdAt = new Date(text.slice(0, i));
    const id = text.slice(i + 1);
    if (!id || Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

export function pageHref(base: string, page: number, extra: Record<string, string | undefined> = {}) {
  const u = new URL(base, "http://local");
  if (page > 1) u.searchParams.set("page", String(page));
  else u.searchParams.delete("page");
  for (const [k, v] of Object.entries(extra)) {
    if (v == null || v === "") u.searchParams.delete(k);
    else u.searchParams.set(k, v);
  }
  const q = u.searchParams.toString();
  return q ? `${u.pathname}?${q}` : u.pathname;
}
