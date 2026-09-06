import Link from "next/link";
import { db } from "@/lib/db";
import { GroupRow } from "@/components/GroupRow";
import { BrandSpotCard } from "@/components/BrandSpotCard";

export const metadata = { title: "Groups" };

export default async function Discover({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter, q } = await searchParams;
  const active = filter === "communities" || filter === "venues" ? filter : "all";
  const query = (q || "").trim();

  const [groups, brandSpot] = await Promise.all([
    db.group.findMany({
      where: {
        AND: [
          active === "communities"
            ? { type: "GLOBAL" }
            : active === "venues"
              ? { type: "VENUE" }
              : {},
          query ? { name: { contains: query, mode: "insensitive" } } : {},
        ],
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        venue: { select: { location: true, featured: true } },
        _count: { select: { memberships: true, posts: true } },
      },
    }),
    db.brandSpot.findFirst({ where: { active: true }, orderBy: { updatedAt: "desc" } }),
  ]);

  const envTitle = process.env.BANKSIDE_PARTNER_TITLE || process.env.BRAND_SPOT_TITLE;
  const envBody = process.env.BANKSIDE_PARTNER_BODY || process.env.BRAND_SPOT_BODY;
  const envHref = process.env.BANKSIDE_PARTNER_HREF || process.env.BRAND_SPOT_HREF;
  const partner =
    brandSpot ||
    (envTitle
      ? {
          title: envTitle,
          body: envBody || null,
          href: envHref || null,
        }
      : null);

  const filters = [
    { id: "all", label: "All", href: query ? `/discover?q=${encodeURIComponent(query)}` : "/discover" },
    {
      id: "communities",
      label: "Communities",
      href: `/discover?filter=communities${query ? `&q=${encodeURIComponent(query)}` : ""}`,
    },
    {
      id: "venues",
      label: "Venues",
      href: `/discover?filter=venues${query ? `&q=${encodeURIComponent(query)}` : ""}`,
    },
  ] as const;

  return (
    <div className="shell max-w-3xl py-6 md:py-8">
      <h1 className="text-title text-ink">Groups</h1>
      <p className="mt-1 text-ui text-muted">
        Interest communities and fishery pages — join for feed updates.
      </p>

      <form method="get" className="mt-4 flex flex-wrap gap-2" role="search">
        {active !== "all" ? <input type="hidden" name="filter" value={active} /> : null}
        <label className="sr-only" htmlFor="group-search">
          Search groups by name
        </label>
        <input
          id="group-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by name…"
          className="field min-w-[12rem] flex-1"
        />
        <button type="submit" className="btn">
          Search
        </button>
        {query ? (
          <Link href={active === "all" ? "/discover" : `/discover?filter=${active}`} className="btn-secondary">
            Clear
          </Link>
        ) : null}
      </form>

      <div
        className="mt-4 inline-flex rounded-md border border-border bg-surface p-0.5"
        role="group"
        aria-label="Filter groups"
      >
        {filters.map((f) => {
          const isActive = active === f.id;
          return (
            <Link
              key={f.id}
              href={f.href}
              aria-current={isActive ? "page" : undefined}
              className={`min-h-10 rounded-[5px] px-3 py-2 text-ui font-semibold transition-colors duration-150 ${
                isActive ? "bg-brand text-white" : "text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {partner ? (
        <div className="mt-4">
          <BrandSpotCard spot={partner} />
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden border border-border">
        {groups.length ? (
          groups.map((g) => <GroupRow key={g.id} group={g} />)
        ) : (
          <p className="bg-surface px-4 py-5 text-ui text-muted">
            {query ? `No groups match “${query}”.` : "No groups in this filter."}
          </p>
        )}
      </div>
    </div>
  );
}
