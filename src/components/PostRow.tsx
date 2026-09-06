import Link from "next/link";
import {
  createComment,
  deleteOwnPost,
  editOwnPost,
  reportPost,
  toggleLike,
  toggleOfficial,
  togglePin,
  togglePostHidden,
} from "@/app/actions";
import { Avatar, Badge } from "@/components/ui";
import { formatDate, formatRelativeTime, pluralize } from "@/lib/utils";

export type PostComment = {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string };
};

export type PostRowData = {
  id: string;
  body: string;
  pinned: boolean;
  official: boolean;
  hidden?: boolean;
  createdAt: Date;
  authorId?: string;
  author: { name: string };
  group?: { name: string; slug: string } | null;
  imageUrl?: string | null;
  likeCount?: number;
  likedByMe?: boolean;
  comments?: PostComment[];
  commentCount?: number;
};

export function PostRow({
  post,
  canModerate = false,
  slug,
  showGroup = false,
  canInteract = false,
  returnPath,
  showOfficialToggle = false,
  venueSlug,
  currentUserId,
  commentsPage = 1,
  commentsTotalPages = 1,
  commentsBasePath,
}: {
  post: PostRowData;
  canModerate?: boolean;
  slug: string;
  showGroup?: boolean;
  canInteract?: boolean;
  returnPath?: string;
  showOfficialToggle?: boolean;
  venueSlug?: string;
  currentUserId?: string | null;
  commentsPage?: number;
  commentsTotalPages?: number;
  commentsBasePath?: string;
}) {
  const groupSlug = post.group?.slug ?? slug;
  const stamp = formatDate(post.createdAt);
  const path = returnPath ?? (showGroup ? "/feed" : `/groups/${groupSlug}`);
  const likeCount = post.likeCount ?? 0;
  const comments = post.comments ?? [];
  const commentCount = post.commentCount ?? comments.length;
  const isAuthor = !!currentUserId && !!post.authorId && currentUserId === post.authorId;

  return (
    <article
      id={`post-${post.id}`}
      className={`relative bg-surface px-3 py-2.5 sm:px-4 sm:py-3 ${
        post.pinned ? "border-l-4 border-l-signal bg-signal-subtle/40" : ""
      } ${post.hidden ? "opacity-70" : ""}`}
    >
      <div className="flex gap-2.5 sm:gap-3">
        <Avatar name={post.author.name} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="text-ui text-ink">{post.author.name}</strong>
            {post.official ? <Badge variant="official">Official</Badge> : null}
            {post.pinned ? <Badge variant="pinned">Pinned</Badge> : null}
            {post.hidden ? <Badge variant="role">Hidden</Badge> : null}
            <span className="text-muted" aria-hidden="true">
              ·
            </span>
            <time className="text-meta text-muted" dateTime={post.createdAt.toISOString()} title={stamp}>
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>

          {showGroup && post.group ? (
            <Link
              href={`/groups/${post.group.slug}`}
              className="mt-1 inline-flex rounded-md bg-brand-subtle px-2 py-0.5 text-meta font-semibold text-brand hover:underline"
            >
              {post.group.name}
            </Link>
          ) : null}

          <p className="mt-1.5 whitespace-pre-wrap text-body text-ink">{post.body}</p>

          {post.imageUrl ? (
            <div className="mt-2.5 overflow-hidden rounded-md border border-border bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt=""
                className="max-h-[320px] w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border pt-1.5">
            {canInteract ? (
              <form action={toggleLike}>
                <input type="hidden" name="postId" value={post.id} />
                <input type="hidden" name="returnPath" value={path} />
                <button
                  type="submit"
                  className={`inline-flex min-h-10 items-center gap-1.5 px-2.5 text-meta font-medium ${
                    post.likedByMe ? "text-brand" : "text-muted hover:text-ink"
                  }`}
                  aria-pressed={!!post.likedByMe}
                >
                  <span aria-hidden="true">{post.likedByMe ? "♥" : "♡"}</span>
                  Like{likeCount ? ` · ${likeCount}` : ""}
                </button>
              </form>
            ) : (
              <span className="inline-flex min-h-10 items-center px-2.5 text-meta text-muted">
                {pluralize(likeCount, "like")}
              </span>
            )}

            <span className="inline-flex min-h-10 items-center px-2.5 text-meta text-muted">
              {pluralize(commentCount, "comment")}
            </span>

            {canInteract && !canModerate && !isAuthor ? (
              <form action={reportPost} className="ml-auto">
                <input type="hidden" name="postId" value={post.id} />
                <input type="hidden" name="returnPath" value={path} />
                <button type="submit" className="btn-ghost !min-h-10 !px-3 text-muted">
                  Report
                </button>
              </form>
            ) : null}

            {isAuthor ? (
              <details className={canInteract && !canModerate && !isAuthor ? "" : "ml-auto"}>
                <summary className="btn-ghost !min-h-10 !px-3 cursor-pointer list-none text-muted [&::-webkit-details-marker]:hidden">
                  Edit
                </summary>
                <form action={editOwnPost} className="mt-2 space-y-2 rounded-md border border-border bg-canvas p-2">
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="returnPath" value={path} />
                  <label className="sr-only" htmlFor={`edit-${post.id}`}>
                    Edit post
                  </label>
                  <textarea
                    id={`edit-${post.id}`}
                    name="body"
                    className="field min-h-[88px]"
                    maxLength={2000}
                    required
                    defaultValue={post.body}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className="btn !min-h-10">
                      Save
                    </button>
                  </div>
                </form>
              </details>
            ) : null}

            {isAuthor ? (
              <form action={deleteOwnPost}>
                <input type="hidden" name="postId" value={post.id} />
                <input type="hidden" name="returnPath" value={path} />
                <button type="submit" className="btn-ghost !min-h-10 !px-3 text-danger">
                  Delete
                </button>
              </form>
            ) : null}

            {canModerate ? (
              <>
                <form action={togglePin} className={isAuthor ? "" : "ml-auto"}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="slug" value={groupSlug} />
                  {venueSlug ? <input type="hidden" name="venueSlug" value={venueSlug} /> : null}
                  <button type="submit" className="btn-ghost !min-h-10 !px-3 text-brand">
                    {post.pinned ? "Unpin" : "Pin"}
                  </button>
                </form>
                <form action={togglePostHidden}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="returnPath" value={path} />
                  <button type="submit" className="btn-ghost !min-h-10 !px-3 text-danger">
                    {post.hidden ? "Unhide" : "Hide"}
                  </button>
                </form>
              </>
            ) : null}
            {showOfficialToggle ? (
              <form action={toggleOfficial}>
                <input type="hidden" name="postId" value={post.id} />
                {venueSlug ? <input type="hidden" name="venueSlug" value={venueSlug} /> : null}
                <button type="submit" className="btn-ghost !min-h-10 !px-3 text-brand">
                  {post.official ? "Unofficial" : "Official"}
                </button>
              </form>
            ) : null}
          </div>

          {comments.length ? (
            <ul className="mt-2 space-y-2 border-t border-border pt-2">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <Avatar name={c.author.name} size={32} />
                  <div className="min-w-0 flex-1 rounded-md bg-canvas px-2.5 py-1.5">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <strong className="text-meta font-semibold text-ink">{c.author.name}</strong>
                      <time
                        className="text-meta text-muted"
                        dateTime={c.createdAt.toISOString()}
                        title={formatDate(c.createdAt)}
                      >
                        {formatRelativeTime(c.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-ui text-ink">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {commentCount > comments.length || commentsTotalPages > 1 ? (
            <div
              className="mt-2 flex flex-wrap items-center gap-2 text-meta text-muted"
              data-testid="comments-pagination"
            >
              <span>
                Showing {comments.length} of {commentCount} comments
                {commentsTotalPages > 1 ? ` · page ${commentsPage}/${commentsTotalPages}` : ""}
              </span>
              {commentsBasePath && commentsPage > 1 ? (
                <Link
                  href={`${commentsBasePath}${commentsBasePath.includes("?") ? "&" : "?"}commentsPage=${commentsPage - 1}`}
                  className="font-semibold text-brand hover:underline"
                >
                  Newer comments
                </Link>
              ) : null}
              {commentsBasePath && commentsPage < commentsTotalPages ? (
                <Link
                  href={`${commentsBasePath}${commentsBasePath.includes("?") ? "&" : "?"}commentsPage=${commentsPage + 1}`}
                  className="font-semibold text-brand hover:underline"
                >
                  Older comments
                </Link>
              ) : null}
              {commentsBasePath && commentsTotalPages <= 1 && commentCount > comments.length ? (
                <Link
                  href={`${commentsBasePath}${commentsBasePath.includes("?") ? "&" : "?"}commentsPage=1`}
                  className="font-semibold text-brand hover:underline"
                >
                  View all comments
                </Link>
              ) : null}
            </div>
          ) : null}

          {canInteract ? (
            <form action={createComment} className="mt-2 flex gap-2">
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="returnPath" value={path} />
              <label className="sr-only" htmlFor={`comment-${post.id}`}>
                Add a comment
              </label>
              <input
                id={`comment-${post.id}`}
                name="body"
                className="field !min-h-10 flex-1 py-2"
                maxLength={1000}
                required
                placeholder="Write a comment…"
              />
              <button type="submit" className="btn-secondary !min-h-10 shrink-0">
                Reply
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}
