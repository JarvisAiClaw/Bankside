import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { joinByInvite } from "@/app/actions";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Avatar, Badge, Notice } from "@/components/ui";
import { InviteQr } from "@/components/InviteQr";
import { CopyInviteButton } from "@/components/CopyInviteButton";
import { pluralize } from "@/lib/utils";

export const metadata = { title: "Join group" };

export default async function JoinByInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const group = await db.group.findUnique({
    where: { inviteToken: token },
    include: {
      venue: { select: { location: true, venueType: true } },
      _count: { select: { memberships: true } },
    },
  });
  if (!group) notFound();

  const user = await getCurrentUser();
  if (user) {
    const member = await db.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
    });
    if (member) redirect(`/groups/${group.slug}`);
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const absoluteUrl = `${proto}://${host}/join/${token}`;
  const typeLabel =
    group.venue?.venueType === "CLUB" ? "Club" : group.type === "VENUE" ? "Venue" : "Community";

  return (
    <div className="shell max-w-lg py-8">
      <Notice message={error} />
      <div className="border border-border bg-surface px-4 py-5">
        <p className="text-meta font-semibold uppercase tracking-wide text-muted">Invite link</p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={group.name} size={72} />
          <div>
            <Badge variant={group.type === "VENUE" ? "venue" : "community"}>{typeLabel}</Badge>
            {group.venue?.venueType === "CLUB" ? (
              <span className="ml-2 text-meta font-semibold text-brand">Free forever</span>
            ) : null}
            <h1 className="mt-1 text-title text-ink">{group.name}</h1>
            <p className="text-ui text-muted">
              {group.venue ? `${group.venue.location} · ` : null}
              {pluralize(group._count.memberships, "member")}
            </p>
          </div>
        </div>
        <p className="mt-4 text-body text-ink">{group.description}</p>

        <div className="mt-5 flex flex-col items-start gap-3 border border-border bg-canvas p-3 sm:flex-row sm:items-center">
          <InviteQr url={absoluteUrl} />
          <div className="min-w-0 flex-1">
            <p className="text-ui font-semibold text-ink">Share without email</p>
            <p className="mt-1 break-all text-meta text-muted">{absoluteUrl}</p>
            <div className="mt-2">
              <CopyInviteButton text={absoluteUrl} />
            </div>
          </div>
        </div>

        {user ? (
          <form action={joinByInvite} className="mt-5">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="btn w-full">
              Join {group.name}
            </button>
          </form>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/login?next=/join/${token}`} className="btn">
              Log in to join
            </Link>
            <Link href={`/register?next=/join/${token}`} className="btn-secondary">
              Create free account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
