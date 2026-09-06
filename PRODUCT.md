# Bankside — Product scope

**Wave 1 build:** 6 Sep 2026 (UTC+1)  
**Design:** LOCKED craft baseline (Pepper PASS) — see DESIGN.md. Extend tokens / PostRow / covers / Logo / mobile tabs / IBM Plex / brand+signal. Do not reinvent.

## Positioning

- **Free forever** for anglers and clubs.
- **Social layer** (groups, feed, media posts) + **light fishery/club management**.
- **Not** Clubmate ERP. **Not** booking. **Not** payments in this wave.
- Branding is swappable via `src/lib/branding.ts`.

## Rules of the world

| Rule | Detail |
| --- | --- |
| Venue groups | Only venue owners create venue groups — via venue register (atomically creates official group + owner membership). |
| System global groups | Carp fishing, Match fishing, Pleasure fishing (seed). Room to add more globals later (admin/seed). |
| Venue register | Owner registers venue – own official group + owner backend. |
| Noticeboard | Official + pinned posts for rules, codes, updates (`official` / `pinned` flags). |
| Monetisation (later) | Brands / reach / small fishery fee — stub/admin flags OK; **no payments** this wave. |

## Wave 1 — done

- [x] Image upload on posts (local disk under `public/uploads`; Composer wired)
- [x] Comments on posts (create + list)
- [x] Reactions — Like toggle + count (replaces “Reactions soon”)
- [x] Owner backend depth: edit venue/group about + cover upload; manage members (list, remove); pin/unpin + official flag on posts
- [x] **Invite link regeneration** (chosen over join-request queue) — venue/group invite URL; regenerate invalidates old link; open Join still works for discoverability. Documented in README.
- [x] In-app notifications — new comment on your post, new member join; list at `/me/notifications`
- [x] Discover polish — search groups by name
- [x] Seed demos kept working; README + STATUS updated

## Later (out of this wave)

- Booking
- Payments / Stripe
- DMs
- Push / mobile native
- three.js
- VPS deploy
- Join-request approval queue (invite links cover private-ish sharing for now)
- Brand reach / fishery fee billing (admin flags only if needed)

## Success checks

- `npm run build` succeeds; app on `:3000`
- Demo owner can upload cover, pin rules post with image
- Angler can like + comment
- Screenshots: `preview-feed.png`, `preview-group.png`, `preview-owner.png`, `preview-compose.png`
