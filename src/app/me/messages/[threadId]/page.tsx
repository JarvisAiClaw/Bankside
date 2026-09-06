import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sendDm } from "@/app/actions";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Avatar, Notice } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Chat" };

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { threadId } = await params;
  const { error } = await searchParams;

  const thread = await db.dmThread.findUnique({
    where: { id: threadId },
    include: {
      userA: { select: { id: true, name: true } },
      userB: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
  if (!thread || (thread.userAId !== user.id && thread.userBId !== user.id)) notFound();
  const other = thread.userAId === user.id ? thread.userB : thread.userA;

  return (
    <div className="feed-shell flex min-h-[70vh] flex-col px-4 py-6 md:px-0">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Link href="/me/messages" className="text-ui font-semibold text-brand hover:underline">
          ←
        </Link>
        <Avatar name={other.name} size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink">{other.name}</h1>
          <p className="text-meta text-muted">Direct message</p>
        </div>
        <Link href={`/u/${other.id}`} className="btn-ghost shrink-0">
          Mute / block
        </Link>
      </div>

      <Notice message={error} />

      <ul className="mt-4 flex-1 space-y-3 overflow-y-auto">
        {thread.messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] border px-3 py-2 ${
                  mine ? "border-brand/30 bg-brand-subtle" : "border-border bg-surface"
                }`}
              >
                {!mine ? (
                  <p className="text-meta font-semibold text-muted">{m.sender.name}</p>
                ) : null}
                <p className="whitespace-pre-wrap text-ui text-ink">{m.body}</p>
                <p className="mt-1 text-meta text-muted">{formatRelativeTime(m.createdAt)}</p>
              </div>
            </li>
          );
        })}
        {!thread.messages.length ? (
          <li className="text-ui text-muted">Say hello — send the first message.</li>
        ) : null}
      </ul>

      <form action={sendDm} className="sticky bottom-0 mt-4 border border-border bg-surface p-3">
        <input type="hidden" name="threadId" value={thread.id} />
        <label className="sr-only" htmlFor="dm-body">
          Message
        </label>
        <textarea
          id="dm-body"
          name="body"
          required
          maxLength={2000}
          rows={2}
          placeholder="Write a message…"
          className="field"
        />
        <button type="submit" className="btn mt-2 w-full sm:w-auto">
          Send
        </button>
      </form>
    </div>
  );
}
