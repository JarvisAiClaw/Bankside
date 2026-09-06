import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { MembershipRole, Role } from "@/generated/prisma/client";
import {
  regenerateInvite,
  removeMember,
  toggleOfficial,
  togglePin,
  updateVenue,
} from "@/app/actions";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Avatar, Badge, Notice } from "@/components/ui";
import { formatRelativeTime, pluralize } from "@/lib/utils";

export default async function VenueAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { slug } = await params;
  const { error } = await searchParams;
  const venue = await db.venue.findUnique({
    where: { slug },
    include: {
      group: {
        include: {
          _count: { select: { memberships: true, posts: true } },
          memberships: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { joinedAt: "asc" },
          },
          posts: {
            include: { author: { select: { name: true } } },
            orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
            take: 30,
          },
        },
      },
    },
  });
  if (!venue || (venue.ownerId !== user.id && user.role !== Role.ADMIN)) notFound();

  const inviteUrl = venue.group?.inviteToken
    ? `/join/${venue.group.inviteToken}`
    : null;

  return (
    <div>
      <header className="bg-surface">
        <div className="relative h-40 w-full overflow-hidden sm:h-48" aria-hidden="true">
          {venue.group?.coverUrl ? (
            <Image
              src={venue.group.coverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="cover-pattern absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
        </div>
        <div className="shell relative -mt-10 pb-4 sm:-mt-12">
          <div className="flex flex-wrap items-end gap-4">
            <Avatar name={venue.name} size={72} />
            <div className="min-w-0 flex-1 pb-1">
              <Badge variant="venue">Venue</Badge>
              <h1 className="mt-1 text-title text-ink sm:text-display">{venue.name}</h1>
              <p className="mt-1 text-ui text-muted">
                {venue.location} · {pluralize(venue.group?._count.memberships ?? 0, "member")} ·{" "}
                {pluralize(venue.group?._count.posts ?? 0, "post")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="shell max-w-3xl space-y-4 py-4">
        <Notice message={error} />

        <div className="flex flex-wrap gap-2 border border-border bg-surface p-3">
          <p className="w-full text-ui text-muted">
            Pin official noticeboard posts from here or the public group. Share the invite link for
            private-ish joins (regenerating invalidates old links). Open Join on the public page still
            works.
          </p>
          {venue.group ? (
            <>
              <Link className="btn" href={`/groups/${venue.group.slug}`}>
                Open public group
              </Link>
              <Link className="btn-secondary" href={`/groups/${venue.group.slug}`}>
                Post official update
              </Link>
            </>
          ) : null}
        </div>

        {inviteUrl ? (
          <section className="border border-border bg-surface px-4 py-4">
            <h2 className="text-title text-ink">Invite link</h2>
            <p className="mt-1 text-ui text-muted">
              Anyone with this link can join. Regenerate to revoke older links.
            </p>
            <p className="mt-3 break-all rounded-md bg-canvas px-3 py-2 font-mono text-meta text-ink">
              {inviteUrl}
            </p>
            <form action={regenerateInvite} className="mt-3">
              <input type="hidden" name="groupId" value={venue.group!.id} />
              <input type="hidden" name="venueSlug" value={venue.slug} />
              <button type="submit" className="btn-secondary">
                Regenerate invite link
              </button>
            </form>
          </section>
        ) : null}

        <section className="border border-border bg-surface px-4 py-4">
          <h2 className="text-title text-ink">Edit venue</h2>
          <form action={updateVenue} className="mt-3 space-y-3" encType="multipart/form-data">
            <input type="hidden" name="venueSlug" value={venue.slug} />
            <div>
              <label className="label" htmlFor="venue-name">
                Name
              </label>
              <input id="venue-name" name="name" className="field" required defaultValue={venue.name} />
            </div>
            <div>
              <label className="label" htmlFor="venue-location">
                Location
              </label>
              <input
                id="venue-location"
                name="location"
                className="field"
                required
                defaultValue={venue.location}
              />
            </div>
            <div>
              <label className="label" htmlFor="venue-description">
                About the venue
              </label>
              <textarea
                id="venue-description"
                name="description"
                className="field min-h-[100px]"
                required
                defaultValue={venue.description}
              />
            </div>
            <div>
              <label className="label" htmlFor="group-description">
                Group about
              </label>
              <textarea
                id="group-description"
                name="groupDescription"
                className="field min-h-[80px]"
                defaultValue={venue.group?.description ?? ""}
              />
            </div>
            <div>
              <label className="label" htmlFor="venue-cover">
                Cover photo
              </label>
              <input
                id="venue-cover"
                name="cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-ui text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-subtle file:px-3 file:py-2 file:text-ui file:font-semibold file:text-brand"
              />
            </div>
            <button type="submit" className="btn">
              Save changes
            </button>
          </form>
        </section>

        <section className="border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-title text-ink">Members</h2>
          </div>
          <ul>
            {(venue.group?.memberships ?? []).map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <Avatar name={m.user.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-ui font-semibold text-ink">{m.user.name}</p>
                  <p className="text-meta text-muted">{m.user.email}</p>
                </div>
                {m.role !== MembershipRole.MEMBER ? (
                  <Badge variant="role">{m.role === "OWNER" ? "Owner" : "Moderator"}</Badge>
                ) : (
                  <form action={removeMember}>
                    <input type="hidden" name="membershipId" value={m.id} />
                    <input type="hidden" name="venueSlug" value={venue.slug} />
                    <button type="submit" className="btn-ghost !min-h-10 text-danger">
                      Remove
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-title text-ink">Noticeboard posts</h2>
            <p className="mt-1 text-ui text-muted">Pin and mark official for rules and codes.</p>
          </div>
          <ul>
            {(venue.group?.posts ?? []).map((p) => (
              <li key={p.id} className="border-b border-border px-4 py-3 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-ui text-ink">{p.author.name}</strong>
                  {p.official ? <Badge variant="official">Official</Badge> : null}
                  {p.pinned ? <Badge variant="pinned">Pinned</Badge> : null}
                  <span className="text-meta text-muted">{formatRelativeTime(p.createdAt)}</span>
                </div>
                <p className="mt-1 line-clamp-3 text-ui text-ink">{p.body}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={togglePin}>
                    <input type="hidden" name="postId" value={p.id} />
                    <input type="hidden" name="slug" value={venue.group!.slug} />
                    <input type="hidden" name="venueSlug" value={venue.slug} />
                    <button type="submit" className="btn-secondary !min-h-10">
                      {p.pinned ? "Unpin" : "Pin"}
                    </button>
                  </form>
                  <form action={toggleOfficial}>
                    <input type="hidden" name="postId" value={p.id} />
                    <input type="hidden" name="venueSlug" value={venue.slug} />
                    <button type="submit" className="btn-secondary !min-h-10">
                      {p.official ? "Clear official" : "Mark official"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {!venue.group?.posts.length ? (
              <li className="px-4 py-5 text-ui text-muted">No posts yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
