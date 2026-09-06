import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Composer } from "@/components/Composer";
import { EmptyState, Notice } from "@/components/ui";

export const metadata = { title: "Post" };

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error } = await searchParams;

  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { group: { select: { id: true, slug: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const groups = memberships.map((m) => m.group);

  return (
    <div className="feed-shell py-4 md:py-6">
      <div className="mb-3 px-4 md:px-0">
        <Notice message={error} />
        <h1 className="text-title text-ink">New post</h1>
        <p className="mt-0.5 text-ui text-muted">Share an update with one of your groups. Photos welcome.</p>
      </div>
      {groups.length ? (
        <div className="border-y border-border md:border">
          <Composer userName={user.name} groups={groups} returnTo="compose" />
        </div>
      ) : (
        <div className="px-4 md:px-0">
          <EmptyState
            title="Join a group first"
            body="You need a group membership before you can post."
            actionHref="/discover"
            actionLabel="Browse groups"
          />
        </div>
      )}
    </div>
  );
}
