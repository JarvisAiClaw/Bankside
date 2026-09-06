import Link from "next/link";
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
          <div className="space-y-3">
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
            {group.venue && (group.venue.rulesText || group.venue.gateCode || group.venue.gateNotes) ? (
              <div className="border border-border bg-surface px-4 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-title text-ink">Noticeboard</h2>
                  <Badge variant="official">Official</Badge>
                </div>
                {group.venue.rulesText ? (
                  <div className="mt-4">
                    <p className="text-ui font-semibold text-ink">Rules</p>
                    <p className="mt-1 whitespace-pre-wrap font-serif text-body text-ink">
                      {group.venue.rulesText}
                    </p>
                  </div>
                ) : null}
                {group.venue.gateCode || group.venue.gateNotes ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-ui font-semibold text-ink">Gate / access</p>
                    {group.venue.gateCode ? (
                      <p className="mt-2 rounded-md bg-canvas px-3 py-2 font-mono text-ui text-ink">
                        {group.venue.gateCode}
                      </p>
                    ) : null}
                    {group.venue.gateNotes ? (
                      <p className="mt-2 whitespace-pre-wrap text-ui text-muted">{group.venue.gateNotes}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "members" ? (
          <div className="overflow-hidden border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <p className="text-ui text-muted">
                {group.memberships.length} member{group.memberships.length === 1 ? "" : "s"}
                {pendingJoinRequest ? " · your join request is pending" : ""}
                {!membership && group.type === "VENUE" && !pendingJoinRequest
                  ? " · request to join to become a member"
                  : ""}
              </p>
            </div>
            <ul>
              {group.memberships.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
                >
                  <Avatar name={m.user.name} size={32} />
                  <Link
                    href={`/u/${m.user.id}`}
                    className="min-w-0 flex-1 text-ui font-semibold text-ink hover:text-brand"
                  >
                    {m.user.name}
                  </Link>
                  <Badge variant="role">
                    {m.role === "OWNER" ? "Owner" : m.role === "MODERATOR" ? "Moderator" : "Member"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
