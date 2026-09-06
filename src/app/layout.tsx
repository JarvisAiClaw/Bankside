import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { branding } from "@/lib/branding";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { MobileTabBar } from "@/components/MobileTabBar";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-plex-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: branding.name, template: `%s · ${branding.name}` },
  description: branding.tagline,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const isOwner = user?.role === "VENUE_OWNER" || user?.role === "ADMIN";
  const unreadCount = user
    ? await db.notification.count({ where: { userId: user.id, read: false } })
    : 0;

  return (
    <html
      lang="en-GB"
      className={`${plex.variable} ${plexSerif.variable}`}
      style={
        {
          "--brand": branding.colours.primary,
          "--ink": branding.colours.ink,
          "--canvas": branding.colours.canvas,
          "--surface": branding.colours.surface,
          "--signal": branding.colours.signal,
          "--muted": branding.colours.muted,
          "--border": branding.colours.border,
        } as React.CSSProperties
      }
    >
      <body className={`min-h-screen font-sans antialiased ${user ? "has-mobile-tabs" : ""}`}>
        <AppHeader
          user={user ? { name: user.name, role: user.role } : null}
          unreadCount={unreadCount}
        />
        <main>{children}</main>
        {user ? <MobileTabBar isOwner={!!isOwner} /> : null}
        {!user ? (
          <footer className="border-t border-border">
            <div className="shell flex flex-wrap items-center justify-between gap-3 py-5 text-ui text-muted">
              <span>
                © {new Date().getFullYear()} {branding.name}
              </span>
              <span>{branding.tagline}</span>
            </div>
          </footer>
        ) : null}
      </body>
    </html>
  );
}
