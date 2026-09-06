import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { clearUserBlock, setUserBlock, startDm } from "@/app/actions";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Avatar, Badge, Notice } from "@/components/ui";

export const metadata = { title: "Profile" };

export default async function UserProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const { id } = await params;
  const { error } = await searchParams;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true },
  });
  if (!user) notFound();

  const myBlock =
    user.id !== me.id
      ? await db.userBlock.findUnique({
          where: { blockerId_blockedId: { blockerId: me.id, blockedId: user.id } },
        })
      : null;

  const roleLabel =
    user.role === "VENUE_OWNER" ? "Venue owner" : user.role === "ADMIN" ? "Admin" : "Angler";

  return (
    <div className="feed-shell px-4 py-6 md:px-0">
      <Notice message={error} />
      <div className="flex items-center gap-3 border border-border bg-surface p-4">
        <Avatar name={user.name} size={72} />
        <div>
          <h1 className="text-title text-ink">{user.name}</h1>
          <p className="text-meta text-muted">{roleLabel}</p>
          {myBlock ? (
            <p className="mt-1">
              <Badge variant="role">{myBlock.kind === "BLOCK" ? "Blocked" : "Muted"}</Badge>
            </p>
          ) : null}
        </div>
      </div>
      {user.id !== me.id ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {!myBlock || myBlock.kind !== "BLOCK" ? (
            <form action={startDm}>
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit" className="btn">
                Message
              </button>
            </form>
          ) : null}
          {myBlock ? (
            <form action={clearUserBlock}>
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="returnPath" value={`/u/${user.id}`} />
              <button type="submit" className="btn-secondary">
                Unmute / unblock
              </button>
            </form>
          ) : (
            <>
              <form action={setUserBlock}>
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="kind" value="MUTE" />
                <input type="hidden" name="returnPath" value={`/u/${user.id}`} />
                <button type="submit" className="btn-secondary" title="Hide their posts from your feed">
                  Mute
                </button>
              </form>
              <form action={setUserBlock}>
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="kind" value="BLOCK" />
                <input type="hidden" name="returnPath" value={`/u/${user.id}`} />
                <button type="submit" className="btn-ghost text-danger" title="Stop DMs and hide from feed">
                  Block
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <p className="mt-4 text-ui text-muted">This is you.</p>
      )}
      <p className="mt-4 text-ui text-muted">
        Mute hides posts in your feed. Block also stops new DMs. Existing history is kept.
      </p>
      <p className="mt-4">
        <Link href="/me/messages" className="text-ui font-semibold text-brand hover:underline">
          ← Messages
        </Link>
      </p>
    </div>
  );
}
