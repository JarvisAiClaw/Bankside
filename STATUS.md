# Bankside STATUS
Wave 1 product build 6 Sep 2026 (UTC+1) — **shipped**. Design baseline LOCKED (Pepper PASS). App on :3000 (next start).

**Handoff:** Wave 1 complete. Do not restyle. Wave 2 is for Grok Build (not this agent).

## Versions
- Next 16 / React 19 / Prisma 7 / Tailwind 4

## Wave 1 (shipped)
- Image upload on posts (`public/uploads`) + Composer
- Comments create + list
- Like reactions (toggle + count)
- Owner backend: edit about/cover, member list/remove, pin + official flags
- Invite link regeneration (`/join/[token]`) — chosen over join-request queue
- In-app notifications `/me/notifications`
- Discover search by name
- Seed demos + README + PRODUCT.md (done vs later)

## Craft baseline (earlier leaps, still in force)
1. Custom peg/bank SVG mark + wordmark (`Logo.tsx`)
2. Photographic covers + peg-grid empty cover
3. Media-first demo posts + PostRow media
4. Scroll-linked hero depth
5. Sticky group tabs + dense feed

## Screenshots (fresh 6 Sep 2026)
- preview-home.png, preview-feed.png, preview-group.png, preview-owner.png, preview-compose.png, preview-feed-mobile.png

## Schema
- Group.coverUrl, Group.inviteToken
- Post.imageUrl
- Comment, Reaction, Notification models
