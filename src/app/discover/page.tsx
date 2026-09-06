import Link from "next/link";
import { db } from "@/lib/db";
import { GroupRow } from "@/components/GroupRow";
import { BrandSpotCard } from "@/components/BrandSpotCard";
import { getActiveBrandSpot } from "@/lib/brand-spot";

export const metadata = { title: "Groups" };

export default async function Discover({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter, q } = await searchParams;
  const active = filter === "communities" || filter === "venues" ? filter : "all";
  const query = (q || "").trim();

  const [groups, partner] = await Promise.all([
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
    getActiveBrandSpot(),
  ]);

  const featured = !query ? groups.filter((g) => g.venue?.featured) : [];
  const rest = !query ? groups.filter((g) => !g.venue?.featured) : groups;

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

      {partner && !query ? (
        <div className="mt-4">
          <BrandSpotCard spot={partner} />
        </div>
      ) : null}

      {featured.length ? (
        <section className="mt-4" aria-labelledby="featured-venues-heading">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="featured-venues-heading" className="text-ui font-semibold text-ink">
              Featured venues
            </h2>
            <p className="text-meta text-muted">Reach stub · free for clubs &amp; anglers</p>
          </div>
          <div className="overflow-hidden border border-border border-l-4 border-l-signal">
            {featured.map((g) => (
              <GroupRow key={g.id} group={g} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-4 overflow-hidden border border-border">
        {rest.length ? (
          rest.map((g) => <GroupRow key={g.id} group={g} />)
        ) : (
          <p className="bg-surface px-4 py-5 text-ui text-muted">
            {query
              ? `No groups match “${query}”.`
              : featured.length
                ? "No other groups in this filter."
                : "No groups in this filter."}
          </p>
        )}
      </div>
    </div>
  );
}
