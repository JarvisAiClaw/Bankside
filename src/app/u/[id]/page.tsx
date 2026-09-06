import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startDm } from "@/app/actions";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Avatar } from "@/components/ui";

export const metadata = { title: "Profile" };

export default async function UserProfile({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true },
  });
  if (!user) notFound();

  const roleLabel =
    user.role === "VENUE_OWNER" ? "Venue owner" : user.role === "ADMIN" ? "Admin" : "Angler";

  return (
    <div className="feed-shell px-4 py-6 md:px-0">
      <div className="flex items-center gap-3 border border-border bg-surface p-4">
        <Avatar name={user.name} size={72} />
        <div>
          <h1 className="text-title text-ink">{user.name}</h1>
          <p className="text-meta text-muted">{roleLabel}</p>
        </div>
      </div>
      {user.id !== me.id ? (
        <form action={startDm} className="mt-4">
          <input type="hidden" name="userId" value={user.id} />
          <button type="submit" className="btn">
            Message
          </button>
        </form>
      ) : (
        <p className="mt-4 text-ui text-muted">This is you.</p>
      )}
      <p className="mt-4">
        <Link href="/me/messages" className="text-ui font-semibold text-brand hover:underline">
          ← Messages
        </Link>
      </p>
    </div>
  );
}
