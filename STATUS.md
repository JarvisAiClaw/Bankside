# Bankside STATUS

**North star (locked):** Free forever knock-out for clubs + anglers; no booking; fishery/club management + Facebook-style social; Fishbrain-quality bar; only owners create venue groups + system global super-groups; monetise elsewhere. Full quote in PRODUCT.md. Build in **weeks, not days**. Prefer working components over polish. See ROADMAP.md.

**Now:** Waves 1–2 merged on master. **Wave 3 hardening in progress** (noticeboard library + member lifecycle + Add photo + smoke). Design LOCKED (Pepper PASS). App on `:3000`.

## Versions
- Next 16 / React 19 / Prisma 7 / Tailwind 4

## Merge (6 Sep 2026 UTC+1)
- Mid-merge conflicts aborted; master hard-reset to `grok/wave2` @ `70b2ad7` (gold worktree `/workspace/bankside-wave2`)
- Restored ROADMAP.md + DESIGN north-star; PRODUCT/STATUS rewritten for unified tree
- Wave1 retained inside Wave2 gold; Wave2 additive features all on master

## Wave 1 (done)
- Image upload, comments, likes, owner tools, invite regen, notifications, discover search

## Wave 2 (done, on master)
- DMs `/me/messages` + `/me/messages/[threadId]` + `/u/[id]`
- Venue join-request queue + invite links
- Noticeboard templates; unread badges; `Venue.featured`; Predator/Specimen globals

## Wave 3 (shipping now)
- [x] Venue structured noticeboard: `rulesText`, `gateCode`, `gateNotes` + owner Save (+ optional publish)
- [x] Group About shows official Rules / Gate block
- [x] Cancel pending join request; join-request empty state; members role badges + profile links
- [x] Composer **Add photo** button restyle (hidden file input; Pepper non-blocking)
- [x] `scripts/smoke-wave2.mjs` — DMs, compose photo, noticeboard, owner queue (**SMOKE PASS**)
- [ ] Moderator role assignment UI (next)
- [ ] Broader critical-path unit/integration tests

## Live on :3000
- Production `next start`; migrate deploy + seed applied (incl. Willow demo gate `4821#`)
- Auth routes 307 when logged out; public discover/group/home 200

## Schema
- Wave3: Venue.rulesText, Venue.gateCode, Venue.gateNotes

## Screenshots
- Wave1 previews + preview-dms.png, preview-join-requests.png
