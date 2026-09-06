# Bankside STATUS

**North star (locked):** Free forever knock-out for clubs + anglers; no booking; fishery/club management + Facebook-style social; Fishbrain-quality bar; only owners create venue groups + system global super-groups; monetise elsewhere. Full quote in PRODUCT.md. Prefer working components over polish. Chris decides what/when — no week gates.

**Now:** Full throttle on master. Design LOCKED (Pepper PASS). App on `:3000`. **SMOKE WAVE3 PASS** (expanded coverage).

## Versions
- Next 16 / React 19 / Prisma 7 / Tailwind 4

## Live on :3000
- `scripts/smoke-admin-brand.mjs` **PASS** (Partner + Featured row + /admin preview/status)
- `scripts/smoke-wave3.mjs` **PASS** (checkpoint)
- Production `next start` (restarted after build)
- Auth routes 307 when logged out; public discover/group/home 200; `/admin` 307 logged out
- Demo: `admin@bankside.test` / `owner@bankside.test` / `angler@bankside.test` / `sam@bankside.test` — password `password123`
- Willow gate demo `4821#`; Partner card seeded on Discover

## DONE (living)

### Social core
- [x] Image upload, comments, likes, discover group search
- [x] DMs, join-request queue, invite regen, notifications + unread badges
- [x] Edit / delete own posts (`editOwnPost` / `deleteOwnPost` in PostRow)
- [x] Search posts within a group (`?q=` / `#group-post-search`)
- [x] Leave group (members + mods; owners blocked with clear state)
- [x] Official noticeboard strip denser on group home (pinned/official list)

### Venue / owner OS
- [x] Venue structured noticeboard (`rulesText`, `gateCode`, `gateNotes`) + About Rules/Gate
- [x] Member lifecycle (cancel request, role badges, profile links)
- [x] Composer **Add photo** (`AddPhotoButton` + hidden file input)
- [x] MEMBER ↔ MODERATOR promote/demote (`setMemberRole`)
- [x] Report post (members) + Hide/Unhide (owner/mod); `Post.hidden` + `PostReport`
- [x] Featured toggle for venue owners (stub; admins too)
- [x] Hidden posts filtered from feed / non-mod group view

### Admin + monetisation stubs (no payments / no booking)
- [x] `/admin` — users + venues, featured toggle, BrandSpot editor
- [x] Discover Partner slot (`BrandSpot` + env fallback) — no Stripe
- [x] Admin monetisation status strip + Partner live preview; Discover Featured venues row restored
- [x] Featured venues badge on Discover
- [x] Free forever core documented

### Hardening
- [x] Empty states + error notices on critical paths
- [x] Smoke: `scripts/smoke-wave2.mjs` **PASS**, `scripts/smoke-wave3.mjs` **PASS** (photo, DMs, gate/rules, promote, hide, report, featured, group search, dense noticeboard, leave, partner, admin)

## Schema
- Venue noticeboard fields
- `Post.hidden`, `PostReport`, `NotificationType.POST_REPORT`
- `BrandSpot`
- Migration: `20260906130000_mod_hide_brand` (idempotent)

## Port note
- Useful Wave3 work from `/workspace/bankside-wave2` merged into canonical `/workspace/bankside` (AddPhotoButton, PostReport/hide/promote, smoke-wave3) while keeping bankside noticeboard fields (`rulesText`/`gateNotes`) and design lock.

## Next (no week labels — Chris picks)
- Club vs fishery type field on owner register (if still thin)
- Broader tests / a11y / UK pilot seed polish
- Whatever else clearly missing for Facebook-replacement + light venue OS

## Screenshots
- Wave1/2 previews in tree; later work verified via smoke + live `:3000`
