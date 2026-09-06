import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { branding } from "@/lib/branding";
import { getCurrentUser } from "@/lib/current-user";
import { logout } from "./actions";
import "./globals.css";

export const metadata: Metadata = { title: { default: branding.name, template: `%s · ${branding.name}` }, description: branding.tagline };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return <html lang="en" style={{ "--brand": branding.colours.primary, "--ink": branding.colours.ink, "--cream": branding.colours.cream } as React.CSSProperties}>
    <body className="min-h-screen antialiased">
      <header className="border-b border-black/10 bg-white/90 backdrop-blur"><div className="shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold"><Image src={branding.logo} alt="" width={34} height={34}/><span>{branding.name}</span></Link>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/discover" className="hover:text-brand">Discover</Link>
          {user ? <><Link href="/feed" className="hover:text-brand">My feed</Link>{user.role === "VENUE_OWNER" || user.role === "ADMIN" ? <Link href="/owner" className="hover:text-brand">Owner area</Link> : null}<form action={logout}><button className="btn-secondary !px-4 !py-2">Log out</button></form></> : <><Link href="/login">Log in</Link><Link className="btn !px-4 !py-2" href="/register">Join free</Link></>}
        </nav>
      </div></header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-black/10"><div className="shell flex flex-wrap justify-between gap-3 py-8 text-sm text-black/60"><span>© {new Date().getFullYear()} {branding.name}</span><span>Free forever · No booking · Built for UK angling</span></div></footer>
    </body>
  </html>;
}
