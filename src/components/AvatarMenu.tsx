"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { logout } from "@/app/actions";
import { Avatar } from "@/components/ui";

export function AvatarMenu({
  name,
  role,
  unreadCount = 0,
}: {
  name: string;
  role: string;
  unreadCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const roleLabel =
    role === "VENUE_OWNER" ? "Venue owner" : role === "ADMIN" ? "Admin" : "Angler";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-md px-1.5 hover:bg-brand-subtle md:min-h-10"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative">
          <Avatar name={name} size={32} />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-signal ring-2 ring-surface" />
          ) : null}
        </span>
        <span className="sr-only sm:not-sr-only sm:text-ui sm:font-semibold sm:text-ink">{name}</span>
        <span aria-hidden="true" className="hidden text-muted sm:inline">
          ▾
        </span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-1 w-56 border border-border bg-surface p-2 shadow-[0_1px_2px_rgb(0_0_0_/6%)]"
        >
          <div className="border-b border-border px-2 py-2">
            <p className="text-ui font-semibold text-ink">{name}</p>
            <p className="text-meta text-muted">{roleLabel}</p>
          </div>
          <Link
            href="/me"
            role="menuitem"
            className="btn-ghost mt-1 w-full justify-start !px-2"
            onClick={() => setOpen(false)}
          >
            Me
          </Link>
          <Link
            href="/me/messages"
            role="menuitem"
            className="btn-ghost w-full justify-start !px-2"
            onClick={() => setOpen(false)}
          >
            Messages
          </Link>
          <Link
            href="/me/notifications"
            role="menuitem"
            className="btn-ghost w-full justify-start !px-2"
            onClick={() => setOpen(false)}
          >
            Notifications{unreadCount ? ` (${unreadCount})` : ""}
          </Link>
          <form action={logout} className="mt-1">
            <button type="submit" role="menuitem" className="btn-ghost w-full justify-start !px-2">
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
