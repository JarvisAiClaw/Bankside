import { notFound } from "next/navigation";
import { MembershipRole, Role } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Notice, Badge, Avatar, EmptyState } from "@/components/ui";
import { PostRow } from "@/components/PostRow";
import { Composer } from "@/components/Composer";
import { GroupHeader, type GroupTab } from "@/components/GroupHeader";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const { error, tab: tabParam } = await searchParams;
  const activeTab: GroupTab =
    tabParam === "about" || tabParam === "members" ? tabParam : "posts";

  const user = await getCurrentUser();
  const group = await db.group.findUnique({
    where: { slug },
    include: {
      venue: true,
      memberships: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { joinedAt: "asc" },
      },
      posts: {
        include: {
          author: { select: { name: true } },
          comments: {
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
            take: 12,
          },
          reactions: { where: { type: "LIKE" }, select: { userId: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!group) notFound();

  const membership = group.memberships.find((m) => m.userId === user?.id);
  const canModerate =
    user?.role === Role.ADMIN || (!!membership && membership.role !== MembershipRole.MEMBER);

  const pendingJoinRequest = user
    ? !!(await db.joinRequest.findFirst({
        where: { groupId: group.id, userId: user.id, status: "PENDING" },
      }))
    : false;

  return (
    <div>
      <div className="shell pt-4">
        <Notice message={error} />
      </div>
      <GroupHeader
        group={group}
        memberCount={group.memberships.length}
        user={user}
        membership={membership}
        activeTab={activeTab}
        pendingJoinRequest={pendingJoinRequest}
      />

      <div className="shell max-w-3xl py-4" role="tabpanel">
        {activeTab === "posts" ? (
          <div className="space-y-2">
            {membership ? (
              <div className="border border-border">
                <Composer
                  userName={user!.name}
                  fixedGroup={{ id: group.id, slug }}
                  canOfficial={canModerate}
                />
              </div>
            ) : null}
            {group.posts.length ? (
              group.posts.map((p) => (
                <PostRow
                  key={p.id}
                  post={{
                    ...p,
                    likeCount: p._count.reactions,
                    likedByMe: user ? p.reactions.some((r) => r.userId === user.id) : false,
                    comments: p.comments,
                    commentCount: p._count.comments,
                  }}
                  slug={slug}
                  canModerate={canModerate}
                  canInteract={!!membership}
                  returnPath={`/groups/${slug}`}
                />
              ))
            ) : (
              <EmptyState title="No posts yet" body="Be the first to share an update." />
            )}
          </div>
        ) : null}

        {activeTab === "about" ? (
          <div className="border border-border bg-surface px-4 py-5">
            <h2 className="text-title text-ink">About</h2>
            <p className="mt-3 font-serif text-body text-ink">{group.description}</p>
            {group.venue ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-ui font-semibold text-ink">Location</p>
                <p className="mt-1 text-ui text-muted">{group.venue.location}</p>
                {group.venue.description ? (
                  <>
                    <p className="mt-4 text-ui font-semibold text-ink">Venue notes</p>
                    <p className="mt-1 font-serif text-body text-muted">{group.venue.description}</p>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "members" ? (
          <div className="overflow-hidden border border-border bg-surface">
            <ul>
              {group.memberships.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
                >
                  <Avatar name={m.user.name} size={32} />
                  <span className="flex-1 text-ui font-semibold text-ink">{m.user.name}</span>
                  {m.role !== MembershipRole.MEMBER ? (
                    <Badge variant="role">{m.role === "OWNER" ? "Owner" : "Moderator"}</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
