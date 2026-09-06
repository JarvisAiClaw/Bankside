# Bankside STATUS
Wave 2 product build 6 Sep 2026 (UTC+1). Design baseline LOCKED (Pepper PASS).
Branch: grok/wave2 worktree /workspace/bankside-wave2. Not merged to main.
App try: http://localhost:3001

## Versions
- Next 16 / React 19 / Prisma 7 / Tailwind 4

## Wave 1 (shipped)
- Uploads, comments, likes, owner tools, invites, notifications, discover search

## Wave 2 (this branch)
- DMs (/me/messages)
- Venue join-request queue + invite links
- Noticeboard templates on owner venue page
- Globals: Predator fishing, Specimen hunting
- Unread notification badge (Me + header)
- Venue.featured + Discover badge

## Schema (added)
- JoinRequest, DmThread, DmMessage
- Venue.featured
- NotificationType: JOIN_REQUEST, JOIN_APPROVED, JOIN_DENIED, DM

## Screenshots
- Wave1 previews + preview-dms.png, preview-join-requests.png
