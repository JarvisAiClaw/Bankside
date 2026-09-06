import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import {
  adminToggleVenueFeatured,
  saveBrandSpot,
} from "@/app/actions";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Badge, EmptyState, Notice } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Admin" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== Role.ADMIN) redirect("/discover");
  const { error } = await searchParams;

  const [users, venues, brand] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { posts: true, memberships: true } },
      },
    }),
    db.venue.findMany({
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      include: {
        owner: { select: { name: true } },
        group: { select: { slug: true, _count: { select: { memberships: true } } } },
      },
    }),
    db.brandSpot.findFirst({ orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <div className="shell max-w-3xl space-y-4 py-6">
      <div>
        <h1 className="text-title text-ink">Admin</h1>
        <p className="mt-1 text-ui text-muted">
          Users, venues, featured flags, and Discover partner slot. No payments.
        </p>
      </div>
      <Notice message={error} />

      <section className="border border-border bg-surface px-4 py-4">
        <h2 className="text-title text-ink">Partner / brand slot</h2>
        <p className="mt-1 text-ui text-muted">
          Shown on Discover when active. Env fallback:{" "}
          <code className="text-meta">BANKSIDE_PARTNER_TITLE</code> /{" "}
          <code className="text-meta">_BODY</code> /{" "}
          <code className="text-meta">_HREF</code>.
        </p>
        <form action={saveBrandSpot} className="mt-3 space-y-3">
          <div>
            <label className="label" htmlFor="brand-title">
              Title
            </label>
            <input
              id="brand-title"
              name="title"
              className="field"
              required
              defaultValue={brand?.title ?? "Partner with Bankside"}
            />
          </div>
          <div>
            <label className="label" htmlFor="brand-body">
              Body
            </label>
            <textarea
              id="brand-body"
              name="body"
              className="field min-h-[72px]"
              defaultValue={brand?.body ?? "Reach UK anglers — free core stays free forever."}
            />
          </div>
          <div>
            <label className="label" htmlFor="brand-href">
              Link (optional)
            </label>
            <input
              id="brand-href"
              name="href"
              className="field"
              placeholder="https://"
              defaultValue={brand?.href ?? ""}
            />
          </div>
          <label className="flex items-center gap-2 text-ui text-ink">
            <input
              type="checkbox"
              name="active"
              value="1"
              className="accent-brand"
              defaultChecked={brand?.active ?? true}
            />
            Active on Discover
          </label>
          <button type="submit" className="btn">
            Save partner slot
          </button>
        </form>
      </section>

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-title text-ink">Venues</h2>
          <p className="mt-1 text-ui text-muted">{venues.length} registered</p>
        </div>
        {venues.length ? (
          <ul>
            {venues.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/owner/venues/${v.slug}`}
                      className="text-ui font-semibold text-ink hover:text-brand"
                    >
                      {v.name}
                    </Link>
                    {v.featured ? <Badge variant="featured">Featured</Badge> : null}
                  </div>
                  <p className="text-meta text-muted">
                    {v.location} · {v.owner.name}
                    {v.group ? ` · ${v.group._count.memberships} members` : ""}
                  </p>
                </div>
                <form action={adminToggleVenueFeatured}>
                  <input type="hidden" name="venueSlug" value={v.slug} />
                  <button type="submit" className="btn-secondary !min-h-10">
                    {v.featured ? "Unfeature" : "Feature"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <EmptyState title="No venues" body="Owners register venues from /owner/new." />
          </div>
        )}
      </section>

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-title text-ink">Users</h2>
          <p className="mt-1 text-ui text-muted">Latest {users.length}</p>
        </div>
        <ul>
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <Link href={`/u/${u.id}`} className="text-ui font-semibold text-ink hover:text-brand">
                  {u.name}
                </Link>
                <p className="text-meta text-muted">
                  {u.email} · {u.role} · joined {formatRelativeTime(u.createdAt)} ·{" "}
                  {u._count.posts} posts · {u._count.memberships} groups
                </p>
              </div>
              <Badge variant="role">{u.role}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
