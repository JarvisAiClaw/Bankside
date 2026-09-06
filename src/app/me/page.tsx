import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Avatar } from "@/components/ui";

export const metadata = { title: "Me" };

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const unread = await db.notification.count({ where: { userId: user.id, read: false } });

  const roleLabel =
    user.role === "VENUE_OWNER" ? "Venue owner" : user.role === "ADMIN" ? "Admin" : "Angler";

  return (
    <div className="feed-shell px-4 py-6 md:px-0">
      <h1 className="text-title text-ink">Me</h1>
      <div className="mt-4 flex items-center gap-3 border border-border bg-surface p-4">
        <Avatar name={user.name} size={72} />
        <div>
          <p className="text-title text-ink">{user.name}</p>
          <p className="text-ui text-muted">{user.email}</p>
          <p className="mt-1 text-meta text-muted">{roleLabel}</p>
        </div>
      </div>

      <nav className="mt-4 overflow-hidden border border-border bg-surface" aria-label="Account">
        <Link
          href="/me/notifications"
          className="flex items-center justify-between border-b border-border px-4 py-3 text-ui font-semibold text-ink hover:bg-canvas/60"
        >
          <span>Notifications</span>
          {unread ? (
            <span className="rounded-md bg-signal px-2 py-0.5 text-meta font-semibold text-white">
              {unread}
            </span>
          ) : (
            <span className="text-meta font-normal text-muted">None new</span>
          )}
        </Link>
        <Link
          href="/me/messages"
          className="flex items-center justify-between border-b border-border px-4 py-3 text-ui font-semibold text-ink hover:bg-canvas/60"
        >
          <span>Messages</span>
          <span className="text-meta font-normal text-muted">DMs</span>
        </Link>
        <Link
          href="/discover"
          className="flex items-center justify-between px-4 py-3 text-ui font-semibold text-ink hover:bg-canvas/60"
        >
          Browse groups
        </Link>
      </nav>

      <form action={logout} className="mt-4">
        <button type="submit" className="btn-secondary w-full sm:w-auto">
          Log out
        </button>
      </form>
    </div>
  );
}
