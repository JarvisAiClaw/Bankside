import Link from "next/link";
import { Badge } from "@/components/ui";

export type BrandSpotData = {
  title: string;
  body?: string | null;
  href?: string | null;
};

/** Static Discover Partner placement — admin/env configurable; no payments. */
export function BrandSpotCard({ spot }: { spot: BrandSpotData }) {
  const inner = (
    <div className="flex items-start gap-3 border border-dashed border-border bg-surface px-4 py-3">
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal text-ui font-semibold text-white"
        aria-hidden="true"
      >
        {(spot.title || "P").slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="featured">Partner</Badge>
          <h2 className="truncate text-ui font-semibold text-ink">{spot.title}</h2>
        </div>
        {spot.body ? <p className="mt-0.5 line-clamp-2 text-ui text-muted">{spot.body}</p> : null}
        <p className="mt-1 text-meta text-muted">Sponsored placement stub · free core unchanged</p>
      </div>
      {spot.href ? (
        <span className="text-muted" aria-hidden="true">
          ›
        </span>
      ) : null}
    </div>
  );

  if (spot.href) {
    const external = spot.href.startsWith("http");
    return external ? (
      <a href={spot.href} target="_blank" rel="noopener noreferrer" className="block hover:bg-brand-subtle/30">
        {inner}
      </a>
    ) : (
      <Link href={spot.href} className="block hover:bg-brand-subtle/30">
        {inner}
      </Link>
    );
  }
  return inner;
}
