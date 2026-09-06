import Link from "next/link";
import { redirect } from "next/navigation";
import { MembershipRole, Role } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { PostRow } from "@/components/PostRow";
import { Composer } from "@/components/Composer";
import { EmptyState } from "@/components/ui";
import { PAGE_SIZE, parsePage, pageHref } from "@/lib/pagination";

export const metadata = { title: "Feed" };

export default async function Feed({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; commentsPage?: string; post?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const commentsPage = parsePage(sp.commentsPage);
  const focusPostId = sp.post || null;

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

  const where = {
    group: { memberships: { some: { userId: user.id } } },
    OR: [{ hidden: false }, { groupId: { in: [...modGroupIds] } }, { authorId: user.id }],
  };

  const total = await db.post.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const posts = await db.post.findMany({
    where,
    include: {
      author: { select: { name: true } },
      group: { select: { name: true, slug: true } },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: PAGE_SIZE,
      },
      reactions: { where: { type: "LIKE" }, select: { userId: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  // Optional: paginate comments for a focused post beyond the default first page
  let focusedComments: Awaited<typeof posts>[number]["comments"] | null = null;
  let focusedCommentTotal = 0;
  if (focusPostId) {
    focusedCommentTotal = await db.comment.count({ where: { postId: focusPostId } });
    focusedComments = await db.comment.findMany({
      where: { postId: focusPostId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      skip: (commentsPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  }

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
          posts.map((p) => {
            const comments =
              focusPostId === p.id && focusedComments ? focusedComments : p.comments;
            const commentCount = p._count.comments;
            const cPages = Math.max(1, Math.ceil(commentCount / PAGE_SIZE));
            const cPage = focusPostId === p.id ? Math.min(commentsPage, cPages) : 1;
            return (
              <PostRow
                key={p.id}
                post={{
                  ...p,
                  authorId: p.authorId,
                  likeCount: p._count.reactions,
                  likedByMe: p.reactions.some((r) => r.userId === user.id),
                  comments,
                  commentCount,
                }}
                slug={p.group.slug}
                showGroup
                canInteract
                canModerate={user.role === Role.ADMIN || modGroupIds.has(p.groupId)}
                returnPath={pageHref("/feed", safePage)}
                currentUserId={user.id}
                commentsPage={cPage}
                commentsTotalPages={cPages}
                commentsBasePath={pageHref("/feed", safePage, { post: p.id })}
              />
            );
          })
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

      {totalPages > 1 ? (
        <nav
          className="mt-4 flex flex-wrap items-center justify-between gap-2 px-4 md:px-0"
          aria-label="Feed pagination"
          data-testid="feed-pagination"
        >
          <p className="text-meta text-muted">
            Page {safePage} of {totalPages} · {total} posts
          </p>
          <div className="flex gap-2">
            {safePage > 1 ? (
              <Link href={pageHref("/feed", safePage - 1)} className="btn-secondary !min-h-10">
                Newer
              </Link>
            ) : null}
            {safePage < totalPages ? (
              <Link href={pageHref("/feed", safePage + 1)} className="btn-secondary !min-h-10">
                Older
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
