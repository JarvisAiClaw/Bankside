import Link from "next/link";
import { redirect } from "next/navigation";
import { markNotificationsRead } from "@/app/actions";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { EmptyState } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { name: true } } },
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="feed-shell px-4 py-6 md:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-ink">Notifications</h1>
          <p className="mt-0.5 text-ui text-muted">
            {unread ? `${unread} unread` : "You’re up to date"}
          </p>
        </div>
        {unread ? (
          <form action={markNotificationsRead}>
            <button type="submit" className="btn-secondary">
              Mark all read
            </button>
          </form>
        ) : null}
      </div>

      {notifications.length ? (
        <ul className="mt-4 overflow-hidden border border-border bg-surface">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`border-b border-border last:border-0 ${n.read ? "" : "bg-brand-subtle/40"}`}
            >
              {n.link ? (
                <Link href={n.link} className="block px-4 py-3 hover:bg-canvas/60">
                  <p className="text-ui text-ink">{n.message}</p>
                  <p className="mt-0.5 text-meta text-muted">{formatRelativeTime(n.createdAt)}</p>
                </Link>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-ui text-ink">{n.message}</p>
                  <p className="mt-0.5 text-meta text-muted">{formatRelativeTime(n.createdAt)}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState title="No notifications yet" body="Comments and new members will show up here." />
        </div>
      )}

      <p className="mt-4">
        <Link href="/me" className="text-ui font-semibold text-brand hover:underline">
          ← Back to Me
        </Link>
      </p>
    </div>
  );
}
