"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { IconCompose, IconFeed, IconGroups, IconMe, IconVenues } from "@/components/icons";

type Tab = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  centre?: boolean;
};

export function MobileTabBar({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const tabs: Tab[] = [
    { href: "/feed", label: "Feed", icon: IconFeed },
    { href: "/discover", label: "Groups", icon: IconGroups },
    { href: "/compose", label: "Post", icon: IconCompose, centre: true },
    ...(isOwner ? [{ href: "/owner", label: "Venues", icon: IconVenues }] : []),
    { href: "/me", label: "Me", icon: IconMe },
  ];

  function active(href: string) {
    if (href === "/feed") return pathname === "/feed";
    if (href === "/compose") return pathname === "/compose";
    if (href === "/owner") return pathname.startsWith("/owner");
    if (href === "/discover") return pathname.startsWith("/discover") || pathname.startsWith("/groups");
    if (href === "/me") return pathname === "/me" || pathname.startsWith("/me/");
    return pathname === href;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile primary"
    >
      <ul className="flex h-14 items-stretch justify-around">
        {tabs.map((tab) => {
          const isActive = active(tab.href);
          const centre = !!tab.centre;
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 w-full flex-col items-center justify-center gap-0.5 text-meta font-semibold ${
                  centre ? "text-brand" : isActive ? "text-brand" : "text-muted"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center ${
                    centre ? "rounded-md bg-brand text-white" : ""
                  }`}
                  aria-hidden="true"
                >
                  <Icon width={24} height={24} className="h-6 w-6" />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
