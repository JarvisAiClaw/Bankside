import Link from "next/link";
import Image from "next/image";
import { cancelJoinRequest, joinGroup, leaveGroup } from "@/app/actions";
import { Avatar, Badge } from "@/components/ui";
import { pluralize } from "@/lib/utils";
import { MembershipRole } from "@/generated/prisma/client";

export type GroupTab = "posts" | "about" | "members";

export function GroupHeader({
  group,
  memberCount,
  user,
  membership,
  activeTab,
  pendingJoinRequest,
}: {
  group: {
    id: string;
    slug: string;
    name: string;
    description: string;
    type: string;
    coverUrl?: string | null;
    venue?: { location: string; description?: string; featured?: boolean } | null;
  };
  memberCount: number;
  user: { id: string } | null;
  membership: { role: string } | null | undefined;
  activeTab: GroupTab;
  pendingJoinRequest?: boolean;
}) {
  const tabs: { id: GroupTab; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "about", label: "About" },
    { id: "members", label: "Members" },
  ];
  const isVenue = group.type === "VENUE";

  return (
    <header className="bg-surface">
      <div className="relative h-40 w-full overflow-hidden sm:h-48" aria-hidden="true">
        {group.coverUrl ? (
          <Image src={group.coverUrl} alt="" fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="cover-pattern absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
      </div>

      <div className="shell relative -mt-10 sm:-mt-12">
        <div className="flex flex-wrap items-end gap-4">
          <Avatar name={group.name} size={72} />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isVenue ? "venue" : "community"}>
                {isVenue ? "Venue" : "Community"}
              </Badge>
              {group.venue?.featured ? <Badge variant="featured">Featured</Badge> : null}
            </div>
            <h1 className="mt-1 text-title text-ink sm:text-display">{group.name}</h1>
            <p className="mt-1 text-ui text-muted">
              {group.venue ? `${group.venue.location} · ` : null}
              {pluralize(memberCount, "member")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {user ? (
              membership ? (
                <form action={leaveGroup}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="slug" value={group.slug} />
                  <button
                    className="btn-secondary"
                    disabled={membership.role !== MembershipRole.MEMBER}
                    type="submit"
                  >
                    {membership.role === MembershipRole.MEMBER ? "Leave" : "Admin"}
                  </button>
                </form>
              ) : pendingJoinRequest ? (
                <form action={cancelJoinRequest} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="slug" value={group.slug} />
                  <span className="text-ui text-muted">Request pending</span>
                  <button className="btn-secondary" type="submit">
                    Cancel request
                  </button>
                </form>
              ) : (
                <form action={joinGroup}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="slug" value={group.slug} />
                  <button className="btn" type="submit">
                    {isVenue ? "Request to join" : "Join"}
                  </button>
                </form>
              )
            ) : (
              <Link href="/login" className="btn">
                Log in to join
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="group-header-sticky mt-3">
        <div className="shell">
          <nav className="flex gap-1" aria-label="Group sections" role="tablist">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              const href =
                tab.id === "posts" ? `/groups/${group.slug}` : `/groups/${group.slug}?tab=${tab.id}`;
              return (
                <Link
                  key={tab.id}
                  href={href}
                  role="tab"
                  aria-selected={active}
                  className={`min-h-11 px-4 py-2.5 text-ui font-semibold transition-colors duration-150 ${
                    active
                      ? "border-b-2 border-brand text-brand"
                      : "border-b-2 border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
