import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { branding } from "@/lib/branding";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { PostRow } from "@/components/PostRow";
import { HeroParallax } from "@/components/HeroParallax";
import { pluralize } from "@/lib/utils";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/feed");

  const [groups, posts] = await Promise.all([
    db.group.findMany({
      take: 6,
      orderBy: { memberships: { _count: "desc" } },
      include: {
        venue: { select: { location: true } },
        _count: { select: { memberships: true, posts: true } },
      },
    }),
    db.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
        group: { select: { name: true, slug: true } },
      },
    }),
  ]);

  return (
    <>
      <HeroParallax>
        <div className="hero-parallax-media absolute inset-0 scale-110">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/45 to-ink/25" aria-hidden="true" />
        <div className="shell relative flex min-h-[320px] flex-col justify-end py-10 sm:min-h-[400px] sm:py-14">
          <h1 className="max-w-xl text-display text-white">UK angling groups, free forever</h1>
          <p className="mt-3 max-w-lg text-ui text-white/85">{branding.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn !bg-white !text-ink hover:!bg-canvas" href="/register">
              Join free
            </Link>
            <Link className="btn-secondary !border-white/40 !bg-transparent !text-white hover:!bg-white/10" href="/discover">
              Browse groups
            </Link>
          </div>
        </div>
      </HeroParallax>

      <section className="shell py-8">
        <h2 className="section-label">Happening on Bankside</h2>
        <div className="mt-3 feed-shell feed-dense space-y-2">
          {posts.length ? (
            posts.map((p) => (
              <PostRow key={p.id} post={p} slug={p.group.slug} showGroup />
            ))
          ) : (
            <div className="panel px-4 py-4 text-ui text-muted">No public posts yet — browse groups to get started.</div>
          )}
        </div>
      </section>

      <section className="shell pb-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="section-label">Groups</h2>
          <Link href="/discover" className="text-ui font-semibold text-brand hover:underline">
            See all
          </Link>
        </div>
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {groups.map((g) => (
            <li key={g.id} className="shrink-0">
              <Link
                href={`/groups/${g.slug}`}
                className="flex min-w-[200px] items-center gap-3 border border-border bg-surface px-3 py-3 transition-colors hover:bg-brand-subtle/50"
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ui font-semibold text-white"
                  style={{ backgroundColor: "#0D4F3C" }}
                  aria-hidden="true"
                >
                  {g.name.slice(0, 1)}
                </span>
                <span>
                  <span className="block text-ui font-semibold text-ink">{g.name}</span>
                  <span className="text-meta text-muted">{pluralize(g._count.memberships, "member")}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
