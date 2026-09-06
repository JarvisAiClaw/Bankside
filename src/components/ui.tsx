import Link from "next/link";
import { initials } from "@/lib/utils";

export function Notice({ message, tone = "error" }: { message?: string; tone?: "error" | "success" }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`mb-4 flex gap-2 border px-3 py-2.5 text-ui ${
        tone === "error"
          ? "border-danger/40 bg-red-50 text-danger"
          : "border-success/40 bg-brand-subtle text-ink"
      }`}
    >
      <span aria-hidden="true">{tone === "error" ? "!" : "✓"}</span>
      <span>{message}</span>
    </div>
  );
}

const AVATAR_PALETTE = [
  "#0D4F3C",
  "#1B4F72",
  "#0F6B45",
  "#5C4A32",
  "#3E4742",
  "#1E5A4A",
  "#4A3728",
  "#245C6E",
] as const;

function avatarColour(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function Avatar({ name, size = 40 }: { name: string; size?: 32 | 40 | 72 }) {
  const dim = size === 32 ? "h-8 w-8 text-meta" : size === 72 ? "h-[72px] w-[72px] text-title" : "h-10 w-10 text-ui";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${dim}`}
      style={{ backgroundColor: avatarColour(name) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Badge({
  variant,
  children,
}: {
  variant: "official" | "pinned" | "community" | "venue" | "role";
  children: React.ReactNode;
}) {
  const styles = {
    official: "bg-signal text-white",
    pinned: "bg-signal-subtle text-signal border border-signal/30",
    community: "bg-brand-subtle text-brand border border-brand/20",
    venue: "bg-brand text-white",
    role: "bg-brand-subtle text-brand",
  }[variant];
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-meta font-semibold ${styles}`}>{children}</span>;
}

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="panel px-4 py-5">
      <p className="text-title text-ink">{title}</p>
      <p className="mt-1 text-ui text-muted">{body}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn mt-4">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
