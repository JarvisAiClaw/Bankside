import { db } from "@/lib/db";
import type { BrandSpotData } from "@/components/BrandSpotCard";

/** Resolve Discover Partner card from BrandSpot DB row, else env fallback. No payments. */
export async function getActiveBrandSpot(): Promise<(BrandSpotData & { source: "db" | "env" }) | null> {
  const row = await db.brandSpot.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });
  if (row) {
    return { title: row.title, body: row.body, href: row.href, source: "db" };
  }
  const title = process.env.BANKSIDE_PARTNER_TITLE || process.env.BRAND_SPOT_TITLE;
  if (!title) return null;
  return {
    title,
    body: process.env.BANKSIDE_PARTNER_BODY || process.env.BRAND_SPOT_BODY || null,
    href: process.env.BANKSIDE_PARTNER_HREF || process.env.BRAND_SPOT_HREF || null,
    source: "env",
  };
}

export async function getBrandSpotForAdmin() {
  return db.brandSpot.findFirst({ orderBy: { updatedAt: "desc" } });
}
