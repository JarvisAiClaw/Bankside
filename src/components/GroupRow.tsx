import Link from "next/link";
import { Badge } from "@/components/ui";
import { pluralize } from "@/lib/utils";

export function GroupRow({
  group,
}: {
  group: {
    slug: string;
    name: string;
    description: string;
    type: string;
    _count: { memberships: number; posts: number };
    venue?: { location: string } | null;
  };
}) {
  return (
    <Link
      href={`/groups/${group.slug}`}
      className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 transition-colors duration-150 hover:bg-brand-subtle/50"
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-ui font-semibold text-white"
        aria-hidden="true"
      >
        {group.name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={group.type === "VENUE" ? "venue" : "community"}>
            {group.type === "VENUE" ? "Venue" : "Community"}
          </Badge>
          <h2 className="truncate text-ui font-semibold text-ink">{group.name}</h2>
        </div>
        {group.venue ? <p className="mt-0.5 text-meta text-muted">{group.venue.location}</p> : null}
        <p className="mt-0.5 line-clamp-1 text-ui text-muted">{group.description}</p>
        <p className="mt-1 text-meta text-muted">
          {pluralize(group._count.memberships, "member")} · {pluralize(group._count.posts, "post")}
        </p>
      </div>
      <span className="text-muted" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
