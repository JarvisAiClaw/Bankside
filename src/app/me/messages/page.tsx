import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Avatar, EmptyState } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";
import { startDm } from "@/app/actions";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const threads = await db.dmThread.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      userA: { select: { id: true, name: true } },
      userB: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // People you might message: fellow group members (demo-friendly)
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  });
  const groupIds = memberships.map((m) => m.groupId);
  const peers =
    groupIds.length === 0
      ? []
      : await db.user.findMany({
          where: {
            id: { not: user.id },
            memberships: { some: { groupId: { in: groupIds } } },
          },
          select: { id: true, name: true },
          take: 12,
          orderBy: { name: "asc" },
        });

  return (
    <div className="feed-shell px-4 py-6 md:px-0">
      <h1 className="text-title text-ink">Messages</h1>
      <p className="mt-0.5 text-ui text-muted">Direct chats with other anglers.</p>

      {threads.length ? (
        <ul className="mt-4 overflow-hidden border border-border bg-surface">
          {threads.map((t) => {
            const other = t.userAId === user.id ? t.userB : t.userA;
            const last = t.messages[0];
            return (
              <li key={t.id} className="border-b border-border last:border-0">
                <Link
                  href={`/me/messages/${t.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-canvas/60"
                >
                  <Avatar name={other.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-ui font-semibold text-ink">{other.name}</p>
                    <p className="truncate text-meta text-muted">
                      {last ? last.body : "No messages yet"}
                    </p>
                  </div>
                  {last ? (
                    <span className="shrink-0 text-meta text-muted">
                      {formatRelativeTime(last.createdAt)}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="No conversations yet"
            body="Start a chat with someone from your groups."
          />
        </div>
      )}

      {peers.length ? (
        <section className="mt-6">
          <h2 className="text-title text-ink">Start a chat</h2>
          <ul className="mt-2 overflow-hidden border border-border bg-surface">
            {peers.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size={32} />
                  <span className="text-ui font-semibold text-ink">{p.name}</span>
                </div>
                <form action={startDm}>
                  <input type="hidden" name="userId" value={p.id} />
                  <button type="submit" className="btn-secondary !min-h-10">
                    Message
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-4">
        <Link href="/me" className="text-ui font-semibold text-brand hover:underline">
          ← Back to Me
        </Link>
      </p>
    </div>
  );
}
