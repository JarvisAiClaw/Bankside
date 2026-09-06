# Bankside Wave 2

Branch: `grok/wave2`
Worktree: `/workspace/bankside-wave2`
Date: 6 Sep 2026 (UTC+1)

Grok Build hit the free usage limit after exploration (no file writes). Wave 2 was finished on this worktree against locked DESIGN.md (function over fluff). **Not merged to main.**

## Shipped

1. DMs — `/me/messages`, `/me/messages/[threadId]`, start from Me or `/u/[id]`
2. Venue join-request queue (approve/deny) + invite links still work
3. Owner noticeboard templates: Rules / Gate codes / Updates
4. Globals: Predator fishing, Specimen hunting
5. Notifications mark-as-read + unread badge on Me and header avatar
6. `Venue.featured` + Featured badge on Discover (no payments)

## How Chris can try it

```bash
cd /workspace/bankside-wave2
npx prisma migrate deploy
npx prisma generate
npx tsx prisma/seed.ts
npx next dev -p 3001
```

Open **http://localhost:3001** (Wave 1 may still be on :3000).

| Demo | Login | Password | Try |
| --- | --- | --- | --- |
| Angler | angler@bankside.test | password123 | Me → Messages (Sam); Discover Featured |
| Owner | owner@bankside.test | password123 | Venues → Willow → join requests, templates, Featured |
| Mate | sam@bankside.test | password123 | Pending Willow join; can DM Alex |

## Add system global groups

1. Add a row to the `groups` array in `prisma/seed.ts`
2. Optional cover under `public/covers/`
3. `npx tsx prisma/seed.ts`

## Migration

`prisma/migrations/20260906110000_wave2_social/`
