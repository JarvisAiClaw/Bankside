# Bankside STATUS

**North star (locked):** Free forever knock-out for clubs + anglers; no booking; fishery/club management + Facebook-style social; Fishbrain-quality bar; only owners create venue groups + system global super-groups; monetise elsewhere. Full quote in PRODUCT.md. Build in **weeks, not days**. Prefer working components over polish. See ROADMAP.md.

**Now:** Waves 1–2 **merged on master** (Wave2 gold `70b2ad7` + north-star docs). Week 3 hardening in progress. Design LOCKED (Pepper PASS). App on `:3000`.

## Versions
- Next 16 / React 19 / Prisma 7 / Tailwind 4

## Merge (6 Sep 2026 UTC+1)
- Mid-merge conflicts aborted; master hard-reset to `grok/wave2` @ `70b2ad7` (gold worktree `/workspace/bankside-wave2`)
- Restored ROADMAP.md + DESIGN north-star line from Wave1; PRODUCT/STATUS rewritten for unified tree
- Wave1 features retained inside Wave2 gold (uploads/likes/comments/owner tools/invites/notifs)
- Wave2 additive: DMs, join requests, noticeboard templates, featured, notif badges, extra globals

## Wave 1 (done)
- Image upload, comments, likes, owner tools, invite regen, notifications, discover search

## Wave 2 (done, on master)
- DMs `/me/messages` + `/me/messages/[threadId]` + `/u/[id]`
- Venue join-request queue + invite links
- Noticeboard templates on owner venue page
- Unread notification badges
- `Venue.featured` + Discover badge
- Globals: Predator, Specimen

## Wave 3 (shipping next)
- Owner noticeboard first-class (rules / gate codes library)
- Member lifecycle polish
- Compose Add photo restyle (Pepper non-blocking)
- Smoke/test scripts + reliability edges

## Schema
- Wave1: Post media, Comment, Reaction, Notification, inviteToken
- Wave2: JoinRequest, DmThread, DmMessage, Venue.featured, extra NotificationTypes

## Screenshots
- preview-home/feed/group/owner/compose/feed-mobile + preview-dms.png, preview-join-requests.png
