import { redirect } from "next/navigation";
import { MembershipRole, Role } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { PostRow } from "@/components/PostRow";
import { Composer } from "@/components/Composer";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Feed" };

export default async function Feed() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { group: { select: { id: true, slug: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const groups = memberships.map((m) => m.group);
  const modGroupIds = new Set(
    memberships
      .filter((m) => m.role !== MembershipRole.MEMBER || user.role === Role.ADMIN)
      .map((m) => m.groupId),
  );

  const posts = await db.post.findMany({
    where: {
      group: { memberships: { some: { userId: user.id } } },
      OR: [{ hidden: false }, { groupId: { in: [...modGroupIds] } }, { authorId: user.id }],
    },
    include: {
      author: { select: { name: true } },
      group: { select: { name: true, slug: true } },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: 8,
      },
      reactions: { where: { type: "LIKE" }, select: { userId: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="feed-shell feed-dense py-3 md:py-5">
      <div className="mb-2 px-4 md:px-0">
        <h1 className="text-title text-ink">Feed</h1>
        <p className="mt-0.5 text-ui text-muted">Latest from groups you have joined.</p>
      </div>

      {groups.length ? (
        <div className="mb-1.5 border-y border-border md:border md:border-border">
          <Composer userName={user.name} groups={groups} />
        </div>
      ) : null}

      <div className="space-y-1.5">
        {posts.length ? (
          posts.map((p) => (
            <PostRow
              key={p.id}
              post={{
                ...p,
                authorId: p.authorId,
                likeCount: p._count.reactions,
                likedByMe: p.reactions.some((r) => r.userId === user.id),
                comments: p.comments,
                commentCount: p._count.comments,
              }}
              slug={p.group.slug}
              showGroup
              canInteract
              canModerate={user.role === Role.ADMIN || modGroupIds.has(p.groupId)}
              returnPath="/feed"
              currentUserId={user.id}
            />
          ))
        ) : (
          <div className="px-4 md:px-0">
            <EmptyState
              title="Your feed is quiet"
              body="Join a group to see posts here."
              actionHref="/discover"
              actionLabel="Browse groups"
            />
          </div>
        )}
      </div>
    </div>
  );
}
