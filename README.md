# Bankside

Bankside is a free-forever social home for UK anglers and fisheries. It combines interest groups and a shared feed with lightweight venue community management. It deliberately does **not** include booking or payments.

See `PRODUCT.md` for full scope (done vs later). Design baseline in `DESIGN.md` is **LOCKED** (Pepper PASS 6 Sep 2026) — extend, don’t reinvent.

## Requirements

- Node.js 20.9+ (box: 20.19). Node 22+ recommended later.
- PostgreSQL 14+


## Quick start

1. Copy `.env.example` to `.env` and set a strong `SESSION_SECRET` (32+ characters).
2. Start Postgres: `docker compose up -d db`
3. Install packages: `npm install`
4. Create the database tables: `npm run db:migrate` (or apply additive Sql / prisma schema)
5. Seed the global groups: `npm run db:seed`
6. Run the app: `npm run dev`

Open `http://localhost:3000`.

## Demo accounts (after seed)

| Role | Email | Password |
|------|------|-------|
| Angler | angler@bankside.test | password123 |
| Venue owner | owner@bankside.test | password123 |
| Admin | admin@bankside.test | password123 |

Demo venue: Willow Lakes (official group + pinned welcome post with image, likes, comments).
Demo invite link: `/join/demo-willow-invite` (regenerate from owner venue page).

## Demo path

1. Log in as angler@bankside.test -> Feed shows media posts with likes/comments; Discover search by name.
2. Open Carp fishing -> already joined -> post with optional photo / like / comment.
3. Log in as owner@bankside.test -> Owner area -> Willow Lakes -> edit about/cover, manage members, pin/official posts, regenerate invite link.
4. Notifications at `/me/notifications`.
5. Branding from `src/lib/branding.ts`.

## Working software (wave 1)

- Image upload on posts (saved under `public/uploads`)
- Comments + Like reactions
- Owner backend depth (about, cover, members, pin/official)
- Invite link regeneration (chosen over join-request queue)
- In-app notifications
- Discover search by name

## Invite links (private-ish sharing)

Venue groups get an `inviteToken`. Share `/join/<TOKEN>`. Owners can **regenerate** the link from the venue admin page to invalidate older links. Open *Join* on the public group page still works for discoverability in this wave.

## Product behaviour

- Anglers can register, discover and join groups, post (with optional image), like, comment, and view a personalised feed.
- Venue owners can register venues. Each venue atomically creates an official venue group and makes its owner the group owner.
- Group owners and moderators can publish official updates and pin posts (for rules/codes/updates).
- Admins can moderate every group and see all u�enues in the owner area.
- Global Carp fishing, Match fishing, and Pleasure fishing groups are created by the idempotent seed.
- Branding lives in `src/lib/branding.ts`; change the name, logo path, colours, or taglane there.

## Useful scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production build and server
- `npm run db:push` — sync the Prisma schema to a development database
- bnpm run db:migrate` — create/apply a development migration
- `npm run db:seed` — seed global groups, demo users, venue, and posts
- `npm run db:studio` — inspect the database

## Security notes

Passwords are hashed with bcrypt (cost 12). Sessions use encrypted, HTTP-only, same-site cookies through iron-session and secure cookies in production. Every mutation validates authentication, role, group membership, and moderation authority server-side.

## Photo credit

Hero photograph on the logged-out home page: [Саша Алалыкин / Sasha Alalykin on Pexels](https://www.pexels.com/photo/16902380/) (free Pexels License). Saved as `public/hero.jpg`.
