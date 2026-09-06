"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BanksideLogo } from "@/components/Logo";
import { AvatarMenu } from "@/components/AvatarMenu";

type NavUser = { name: string; role: string } | null;

export function AppHeader({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const isOwner = user?.role === "VENUE_OWNER" || user?.role === "ADMIN";
  const links = user
    ? [
        { href: "/feed", label: "Feed" },
        { href: "/discover", label: "Groups" },
        ...(isOwner ? [{ href: "/owner", label: "Venues" }] : []),
      ]
    : [
        { href: "/discover", label: "Groups" },
        { href: "/login", label: "Log in" },
      ];

  function active(href: string) {
    if (href === "/feed") return pathname === "/feed" || pathname.startsWith("/compose");
    if (href === "/owner") return pathname.startsWith("/owner");
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
          <span className="ml-2 w-40" aria-hidden="true" />
          {user ? (
            <AvatarMenu name={user.name} role={user.role} />
          ) : (
            <Link href="/register" className="btn !min-h-10 !px-3">
              Join free
            </Link>
          )}
        </nav>

        <div className="md:hidden">
          {user ? (
            <AvatarMenu name={user.name} role={user.role} />
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
