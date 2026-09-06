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
  searchParams: Promise<{ error?: string; tab?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { error, tab: tabParam, q } = await searchParams;
  const activeTab: GroupTab =
    tabParam === "about" || tabParam === "members" ? tabParam : "posts";
  const query = (q || "").trim();

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

  const visiblePosts = group.posts.filter((p) => canModerate || !p.hidden);
  const searchedPosts = query
    ? visiblePosts.filter((p) => p.body.toLowerCase().includes(query.toLowerCase()))
    : visiblePosts;
  const officialNotices = visiblePosts
    .filter((p) => p.official || p.pinned)
    .slice(0, 6);

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
            {officialNotices.length ? (
              <section className="border border-border bg-surface">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-ui font-semibold text-ink">Official noticeboard</h2>
                    <Badge variant="official">Official</Badge>
                  </div>
                  <Link
                    href={`/groups/${slug}?tab=about`}
                    className="text-meta font-semibold text-brand hover:underline"
                  >
                    Rules &amp; gate
                  </Link>
                </div>
                <ul className="divide-y divide-border">
                  {officialNotices.map((p) => (
                    <li key={p.id} className="px-3 py-2">
                      <a
                        href={`#post-${p.id}`}
                        className="block text-ui text-ink hover:text-brand"
                      >
                        <span className="line-clamp-2 whitespace-pre-wrap">{p.body}</span>
                        <span className="mt-0.5 block text-meta text-muted">
                          {p.pinned ? "Pinned · " : ""}
                          {p.author.name}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {membership ? (
              <div className="border border-border">
                <Composer
                  userName={user!.name}
                  fixedGroup={{ id: group.id, slug }}
                  canOfficial={canModerate}
                />
              </div>
            ) : null}

            <form method="get" className="flex flex-wrap gap-2" role="search">
              <label className="sr-only" htmlFor="group-post-search">
                Search posts in this group
              </label>
              <input
                id="group-post-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search posts…"
                className="field min-w-[12rem] flex-1"
              />
              <button type="submit" className="btn">
                Search
              </button>
              {query ? (
                <Link href={`/groups/${slug}`} className="btn-secondary">
                  Clear
                </Link>
              ) : null}
            </form>

            {searchedPosts.length ? (
              searchedPosts.map((p) => (
                <PostRow
                  key={p.id}
                  post={{
                    ...p,
                    authorId: p.authorId,
                    likeCount: p._count.reactions,
                    likedByMe: user ? p.reactions.some((r) => r.userId === user.id) : false,
                    comments: p.comments,
                    commentCount: p._count.comments,
                  }}
                  slug={slug}
                  canModerate={canModerate}
                  canInteract={!!membership}
                  returnPath={query ? `/groups/${slug}?q=${encodeURIComponent(query)}` : `/groups/${slug}`}
                  currentUserId={user?.id}
                />
              ))
            ) : (
              <EmptyState
                title={query ? "No matching posts" : "No posts yet"}
                body={query ? `Nothing matches “${query}”.` : "Be the first to share an update."}
              />
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
                    {group.venue.gateCode && membership ? (
                      <p className="mt-2 rounded-md bg-canvas px-3 py-2 font-mono text-ui text-ink">
                        {group.venue.gateCode}
                      </p>
                    ) : null}
                    {group.venue.gateCode && !membership ? (
                      <p className="mt-2 text-ui text-muted">Join to see the gate code.</p>
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
