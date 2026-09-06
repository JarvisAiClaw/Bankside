import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { togglePin } from "@/app/actions";

export function Notice({ message, tone = "error" }: { message?: string; tone?: "error" | "success" }) {
  if (!message) return null;
  return <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${tone === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{message}</div>;
}
export function GroupCard({ group }: { group: { slug: string; name: string; description: string; type: string; _count: { memberships: number; posts: number }; venue?: { location: string } | null } }) {
  return <Link href={`/groups/${group.slug}`} className="card group block hover:-translate-y-0.5 hover:border-brand/40">
    <div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">{group.type === "VENUE" ? "Venue" : "Community"}</span><span className="text-sm text-black/50">{group._count.memberships} members</span></div>
    <h3 className="text-xl font-bold group-hover:text-brand">{group.name}</h3>{group.venue ? <p className="mt-1 text-sm font-medium text-black/50">{group.venue.location}</p> : null}
    <p className="mt-2 line-clamp-2 text-black/65">{group.description}</p><p className="mt-4 text-sm font-semibold">{group._count.posts} posts →</p>
  </Link>;
}
export function PostCard({ post, canModerate = false, slug }: { post: { id: string; body: string; pinned: boolean; official: boolean; createdAt: Date; author: { name: string } }; canModerate?: boolean; slug: string }) {
  return <article className={`card ${post.pinned ? "border-brand/40 bg-emerald-50/40" : ""}`}>
    <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><strong>{post.author.name}</strong>{post.official ? <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">OFFICIAL</span> : null}{post.pinned ? <span className="text-xs font-bold text-brand">PINNED</span> : null}</div><time className="text-xs text-black/45">{formatDate(post.createdAt)}</time></div>
    {canModerate ? <form action={togglePin}><input type="hidden" name="postId" value={post.id}/><input type="hidden" name="slug" value={slug}/><button className="text-xs font-semibold text-brand hover:underline">{post.pinned ? "Unpin" : "Pin"}</button></form> : null}</div>
    <p className="mt-4 whitespace-pre-wrap leading-7 text-black/75">{post.body}</p>
  </article>;
}
