import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Notice, EmptyState } from "@/components/ui";
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
          posts: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="shell max-w-4xl py-6 md:py-8">
      <Notice
        tone="success"
        message={q.welcome ? "Welcome. Register your first venue to create its official group." : undefined}
      />
      <Notice message={q.error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title text-ink">Your venues</h1>
        <Link href="/owner/new" className="btn">
          Register venue
        </Link>
      </div>

      {venues.length ? (
        <div className="mt-4 overflow-x-auto border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-ui">
            <thead className="border-b border-border bg-canvas text-meta font-semibold text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Posts</th>
                <th className="px-4 py-3">Last activity</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Manage</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => {
                const last = v.group?.posts[0]?.createdAt;
                return (
                  <tr key={v.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold text-ink">{v.name}</td>
                    <td className="px-4 py-3 text-muted">{v.location}</td>
                    <td className="px-4 py-3 text-muted">
                      {pluralize(v.group?._count.memberships ?? 0, "member")}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {pluralize(v.group?._count.posts ?? 0, "post")}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {last ? formatRelativeTime(last) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/owner/venues/${v.slug}`} className="font-semibold text-brand hover:underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="No venues yet"
            body="Register a venue to create its official group."
            actionHref="/owner/new"
            actionLabel="Register venue"
          />
        </div>
      )}
    </div>
  );
}
