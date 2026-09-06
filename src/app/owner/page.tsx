import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinRequestStatus, Role } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Notice, EmptyState, Badge } from "@/components/ui";
import { pluralize, formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Your venues" };

export default async function Owner({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== Role.VENUE_OWNER && user.role !== Role.ADMIN) redirect("/discover");
  const q = await searchParams;

  const venues = await db.venue.findMany({
    where: user.role === Role.ADMIN ? {} : { ownerId: user.id },
    include: {
      group: {
        include: {
          _count: { select: { memberships: true, posts: true } },
          posts: {
            where: { official: true, hidden: false },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, body: true, createdAt: true, official: true, pinned: true },
          },
          joinRequests: {
            where: { status: JoinRequestStatus.PENDING },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPending = venues.reduce((n, v) => n + (v.group?.joinRequests.length ?? 0), 0);
  const totalMembers = venues.reduce((n, v) => n + (v.group?._count.memberships ?? 0), 0);

  return (
    <div className="shell max-w-4xl py-6 md:py-8">
      <Notice
        tone="success"
        message={q.welcome ? "Welcome. Register your first venue to create its official group." : undefined}
      />
      <Notice message={q.error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-ink">Owner dashboard</h1>
          <p className="mt-1 text-ui text-muted">
            Members, join requests, notices and gate status at a glance.
          </p>
        </div>
        <Link href="/owner/new" className="btn">
          Register venue
        </Link>
      </div>

      {venues.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3" data-testid="owner-summary">
          <div className="border border-border bg-surface px-4 py-3">
            <p className="text-meta font-semibold text-muted">Venues</p>
            <p className="mt-1 text-title text-ink">{venues.length}</p>
          </div>
          <div className="border border-border bg-surface px-4 py-3">
            <p className="text-meta font-semibold text-muted">Members (all)</p>
            <p className="mt-1 text-title text-ink">{totalMembers}</p>
          </div>
          <div className="border border-border bg-surface px-4 py-3">
            <p className="text-meta font-semibold text-muted">Pending joins</p>
            <p className="mt-1 text-title text-ink">{totalPending}</p>
          </div>
        </div>
      ) : null}

      {venues.length ? (
        <ul className="mt-4 space-y-3" data-testid="owner-venue-cards">
          {venues.map((v) => {
            const pending = v.group?.joinRequests.length ?? 0;
            const members = v.group?._count.memberships ?? 0;
            const latestOfficial = v.group?.posts[0] ?? null;
            const gateSet = !!(v.gateCode && v.gateCode.trim());
            const typeLabel = v.venueType === "CLUB" ? "Club" : "Fishery";
            return (
              <li
                key={v.id}
                className="border border-border bg-surface p-4"
                data-testid="owner-venue-card"
                data-slug={v.slug}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-ui font-semibold text-ink">{v.name}</h2>
                      <Badge variant={v.venueType === "CLUB" ? "community" : "venue"}>{typeLabel}</Badge>
                      {v.featured ? <Badge variant="featured">Featured</Badge> : null}
                      {v.venueType === "CLUB" ? (
                        <span className="text-meta font-semibold text-brand">Free forever</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-meta text-muted">{v.location}</p>
                  </div>
                  <Link href={`/owner/venues/${v.slug}`} className="btn-secondary !min-h-10 shrink-0">
                    Manage
                  </Link>
                </div>

                <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="border border-border bg-canvas px-3 py-2">
                    <dt className="text-meta font-semibold text-muted">Members</dt>
                    <dd className="mt-0.5 text-ui font-semibold text-ink" data-testid="owner-member-count">
                      {pluralize(members, "member")}
                    </dd>
                  </div>
                  <div className="border border-border bg-canvas px-3 py-2">
                    <dt className="text-meta font-semibold text-muted">Pending joins</dt>
                    <dd className="mt-0.5 text-ui font-semibold text-ink" data-testid="owner-pending-count">
                      {pending}
                      {pending > 0 ? (
                        <>
                          {" "}
                          <Link
                            href={`/owner/venues/${v.slug}`}
                            className="font-semibold text-brand hover:underline"
                          >
                            review
                          </Link>
                        </>
                      ) : null}
                    </dd>
                  </div>
                  <div className="border border-border bg-canvas px-3 py-2">
                    <dt className="text-meta font-semibold text-muted">Gate code</dt>
                    <dd
                      className={`mt-0.5 text-ui font-semibold ${gateSet ? "text-success" : "text-muted"}`}
                      data-testid="owner-gate-status"
                    >
                      {gateSet ? "Set" : "Not set"}
                    </dd>
                  </div>
                  <div className="border border-border bg-canvas px-3 py-2">
                    <dt className="text-meta font-semibold text-muted">Featured</dt>
                    <dd className="mt-0.5 text-ui font-semibold text-ink" data-testid="owner-featured-status">
                      {v.featured ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3" data-testid="owner-latest-official">
                  <p className="text-meta font-semibold text-muted">Latest official post</p>
                  {latestOfficial ? (
                    <p className="mt-1 border border-border px-3 py-2 text-ui text-ink">
                      <span className="line-clamp-2 whitespace-pre-wrap">{latestOfficial.body}</span>
                      <span className="mt-0.5 block text-meta text-muted">
                        {formatRelativeTime(latestOfficial.createdAt)}
                        {latestOfficial.pinned ? " · Pinned" : ""}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-ui text-muted">No official posts yet.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="No venues yet"
            body="Register a club (free forever) or fishery to create its official group."
            actionHref="/owner/new"
            actionLabel="Register venue"
          />
        </div>
      )}
    </div>
  );
}
