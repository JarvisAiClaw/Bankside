# Bankside STATUS

**North star (locked):** Free forever knock-out for clubs + anglers; no booking; fishery/club management + Facebook-style social; Fishbrain-quality bar; only owners create venue groups + system global super-groups; monetise elsewhere. Full quote in PRODUCT.md. Prefer working components over polish. Chris decides what/when — no week gates.

**Now:** Full throttle on master. Design LOCKED (Pepper PASS). App on `:3000`.

## Versions
- Next 16 / React 19 / Prisma 7 / Tailwind 4

## Live on :3000 (checkpoint)
- Production `next start`
- Auth routes 307 when logged out; public discover/group/home 200
- Demo: `admin@bankside.test` / `owner@bankside.test` / `angler@bankside.test` — password `password123`

## DONE (living)

### Social core
- [x] Image upload, comments, likes, discover group search
- [x] DMs, join-request queue, invite regen, notifications + unread badges
- [x] Edit / delete own posts (`editOwnPost` / `deleteOwnPost` in PostRow)
- [x] Search posts within a group (`?q=` on group Posts tab)
- [x] Leave group (members + mods; owners blocked with clear state)
- [x] Official noticeboard strip denser on group home (pinned/official list)

### Venue / owner OS
- [x] Venue structured noticeboard (`rulesText`, `gateCode`, `gateNotes`)
- [x] Member lifecycle (cancel request, role badges, profile links)
- [x] Composer Add photo
- [x] Moderator promote/demote (`setMemberRole` on venue members)
- [x] Report post (members) + Hide/Unhide (owner/mod); `Post.hidden` + `PostReport`
- [x] Hidden posts filtered from feed / non-mod group view

### Admin + monetisation stubs (no payments / no booking)
- [x] `/admin` — list users + venues, toggle featured, BrandSpot editor
- [x] Discover Partner slot (`BrandSpot` + env fallback)
- [x] Featured venues badge/row on Discover
- [x] Free forever core documented; no Stripe

### Hardening
- [x] Empty states + error notices on critical paths
- [x] Smoke: `scripts/smoke-wave2.mjs`, `scripts/smoke-wave3.mjs`

## Schema
- Venue noticeboard fields
- `Post.hidden`, `PostReport`, `NotificationType.POST_REPORT`
- `BrandSpot`
- Migration: `20260906130000_mod_hide_brand` (idempotent)

## Next (no week labels — Chris picks)
- Club vs fishery type field on owner register (if still thin)
- Broader tests / a11y / UK pilot seed polish
- Whatever else clearly missing for Facebook-replacement + light venue OS

## Screenshots
- Wave1/2 previews in tree; later work verified via smoke + live `:3000`
