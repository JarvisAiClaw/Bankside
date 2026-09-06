# Bankside — Product scope

## NORTH STAR (Chris — locked)

Chris’s intent for Bankside, locked as the product compass. Multi-week fully functioning world-ready product – **not** a one-day look expedition. Working components over polish.

- **No booking.** Booking is out of scope; Bankside is not a diary/ERP.
- **Club paid systems mostly unnecessary / price-sensitive.** Clubs will not pay for heavy software; paid club suites are the wrong bet.
- **Free forever knock-out system for clubs + anglers.** The core social + light management product stays free forever for clubs and anglers — a knock-out alternative to fragmented Facebook groups and expensive club software.
- **Facebook fragmentation problem; Fishbrain-quality bar on social.** Angling community is scattered across Facebook groups. Social UX must clear a Fishbrain-quality bar (media-first, dense feed, credible polish) – not a thin bulletin board.
- **Join fishery/club management + Facebook-style social.** One product: venue/club management backend **and** Facebook-style groups/feed/social in the same world.
- **Only owners create venue groups; system global super-groups.** Venue groups are owner-created only. System-owned global super-groups (e.g. Carp / Match / Pleasure) are seed/admin – not owner-created venue groups.
- **Venue/club register → own group + separate management backend.** Registering a venue/club atomically creates the official group **and** a separate owner management backend.
- **Free forever clubs/anglers; nominal possible for fisheries/syndicates; monetise elsewhere.** Clubs and anglers: free forever. Fisheries/syndicates may see a nominal fee later. Real monetisation lives elsewhere (brand placements, featured reach) — never by locking the free core.
- **Multi-week fully functioning world-ready product — not a one-day look expedition.** Ship a working world over weeks (see ROADMAP.md). Do not treat Bankside as a same-day demo spike.

---

**Waves 1–2 merged:** 6 Sep 2026 (UTC+1) — master = Wave2 gold + north-star docs  
**Design:** LOCKED craft baseline (Pepper PASS) — see DESIGN.md. Extend tokens / PostRow / covers / Logo / mobile tabs / IBM Plex / brand+signal. Do not reinvent.  
**Roadmap:** see ROADMAP.md (weeks 1–6). **Status:** see STATUS.md.

## Positioning

- **Free forever** for anglers and clubs.
- **Social layer** (groups, feed, media posts) + **light fishery/club management**.
- **Not** Clubmate ERP. **Not** booking. **Not** payments in the free core.
- Branding is swappable via `src/lib/branding.ts`.

## Rules of the world

| Rule | Detail |
| --- | --- |
| Venue groups | Only venue owners create venue groups — via venue register (atomically creates official group + owner membership). |
| System global groups | Carp, Match, Pleasure, Predator, Specimen hunting (seed). |
| Venue register | Owner registers venue – own official group + owner backend. |
| Noticeboard | Official + pinned posts for rules, codes, updates. Wave 3: structured rules/codes library. |
| Monetisation (later) | Brands / reach / small fishery fee – stub/admin flags OK; **never break free forever for clubs + anglers**. |

## Wave 1 — done

- [x] Image upload on posts (local disk under `public/uploads`; Composer wired)
- [x] Comments on posts (create + list)
- [x] Reactions – Like toggle + count (replaces “Reactions soon”)
- [x] Owner backend depth: edit venue/group about + cover upload; manage members (list, remove); pin/unpin + official flag on posts
- [x] **Invite link regeneration** (chosen over join-request queue for wave 1) – venue/group invite URL; regenerate invalidates old link; open Join still works for discoverability. Documented in README.
- [x] In-app notifications – new comment on your post, new member join; list at `/me/notifications`
- [x] Discover polish — search groups by name
- [x] Seed demos kept working; README + STATUS updated

## Wave 2 — done (merged to master)

- [x] DMs: 1:1 threads; list + send; Me / Messages / profile
- [x] Join-request queue for venue groups alongside invite links
- [x] Owner noticeboard templates (Rules / Gate codes / Updates)
- [x] Extra globals (Predator, Specimen) + unread notif badges
- [x] Featured venue flag + Discover badge (no payments)

## Wave 3 — next (hardening)

- Owner noticeboard first-class (rules library, gate codes as structured fields)
- Member lifecycle polish (invite / request / approve / remove / leave)
- Compose file-picker Add photo restyle (Pepper non-blocking)
- Tests / smoke scripts; reliability edges


## Monetisation (stubs only — free forever core)

**Locked:** Clubs and anglers stay **free forever**. No Stripe. No paywall on social, groups, DMs, noticeboard, or venue management.

What may pay later (never required for the free core):
- **Fisheries / syndicates** — optional nominal fee for extra reach or ops tools (not built yet).
- **Brand placements** — Discover Partner card (`BrandSpot` model + optional `BANKSIDE_PARTNER_TITLE` / `_BODY` / `_HREF` env (legacy `BRAND_SPOT_*` aliases)). Admin edits at `/admin`.
- **Featured venues** — `Venue.featured` badge + Discover featured row; toggle on `/admin` (ADMIN) or venue admin panel.

These are evidence that monetisation can sit **beside** the free product, not instead of it.

## Later (roadmap weeks 4–6)

- Booking – **out of north star** (do not build)
- [x] Monetisation stubs (brand placements / featured reach) — BrandSpot + featured row + /admin; no Stripe
- Performance, moderation, a11y, UK venue pilots prep — Week 5
- VPS docker stack beside existing site, staging for Chris – Week 6
- Push / mobile native, three.js — post Week 6 unless pulled forward

## Success checks

- `npm run build` succeeds; app on `:3000`
- Demo owner can upload cover, pin rules post with image
- Angler can like + comment
- Screenshots: `preview-feed.png`, `preview-group.png`, `preview-owner.png`, `preview-compose.png`
- Docs: NORTH STAR + ROADMAP weeks locked; STATUS points at weeks not days
