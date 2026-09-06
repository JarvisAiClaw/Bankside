"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BanksideLogo } from "@/components/Logo";
import { AvatarMenu } from "@/components/AvatarMenu";

type NavUser = { name: string; role: string } | null;

export function AppHeader({ user, unreadCount = 0 }: { user: NavUser; unreadCount?: number }) {
  const pathname = usePathname();
  const isOwner = user?.role === "VENUE_OWNER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const links = user
    ? [
        { href: "/feed", label: "Feed" },
        { href: "/discover", label: "Groups" },
        ...(isOwner ? [{ href: "/owner", label: "Venues" }] : []),
        ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [
        { href: "/discover", label: "Groups" },
        { href: "/login", label: "Log in" },
      ];

  function active(href: string) {
    if (href === "/feed") return pathname === "/feed" || pathname.startsWith("/compose");
    if (href === "/owner") return pathname.startsWith("/owner");
    if (href === "/admin") return pathname.startsWith("/admin");
    if (href === "/discover") return pathname.startsWith("/discover") || pathname.startsWith("/groups");
    return pathname === href;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="shell flex h-[52px] items-center justify-between gap-4 md:h-14">
        <BanksideLogo href={user ? "/feed" : "/"} markSize={28} />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => {
            const isActive = active(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive ? "page" : undefined}
                className={`min-h-10 px-3 py-2 text-ui font-semibold transition-colors duration-150 ${
                  isActive ? "border-b-2 border-brand text-brand" : "text-ink hover:text-brand"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {user ? (
            <Link
              href="/me/notifications"
              className="relative ml-1 inline-flex min-h-10 items-center px-2 text-ui font-semibold text-ink hover:text-brand"
              aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
            >
              Alerts
              {unreadCount > 0 ? (
                <span className="ml-1 rounded-md bg-signal px-1.5 py-0.5 text-meta font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          <span className="ml-2 w-8" aria-hidden="true" />
          {user ? (
            <AvatarMenu name={user.name} role={user.role} unreadCount={unreadCount} />
          ) : (
            <Link href="/register" className="btn !min-h-10 !px-3">
              Join free
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {user && unreadCount > 0 ? (
            <Link
              href="/me/notifications"
              className="rounded-md bg-signal px-2 py-0.5 text-meta font-semibold text-white"
              aria-label={`${unreadCount} unread`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Link>
          ) : null}
          {user ? (
            <AvatarMenu name={user.name} role={user.role} unreadCount={unreadCount} />
          ) : (
            <Link href="/register" className="btn !min-h-10 !px-3">
              Join
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
