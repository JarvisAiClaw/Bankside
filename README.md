# Bankside

Bankside is a free-forever social home for UK anglers and fisheries. It combines interest groups and a shared feed with lightweight venue community management. It deliberately does **not** include booking or payments.

## Quick start

1. Copy `.env.example` to `.env` and set a strong `SESSION_SECRET` (32+ characters).
2. Start Postgres: `docker compose up -d db`
3. Install packages: `npm install`
4. Create the database tables: `npm run db:migrate`
5. Seed the global groups: `npm run db:seed`
6. Run the app: `npm run dev`

Open `http://localhost:3000`.

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Angler | angler@bankside.test | password123 |
| Venue owner | owner@bankside.test | password123 |
| Admin | admin@bankside.test | password123 |

Demo venue: Willow Lakes (official group + pinned welcome post).

## Demo path

1. Log in as angler@bankside.test -> Discover shows Carp / Match / Pleasure + Willow Lakes.
2. Open Carp fishing -> already joined -> post / view members.
3. Log in as owner@bankside.test -> Owner area -> Willow Lakes -> pin/unpin official posts.
4. Branding from src/lib/branding.ts.

## Product behaviour

- Anglers can register, discover and join groups, post, and view a personalised feed.
- Venue owners can register venues. Each venue atomically creates an official venue group and makes its owner the group owner.
- Group owners and moderators can publish official updates and pin posts.
- Admins can moderate every group and see all venues in the owner area.
- Global Carp fishing, Match fishing, and Pleasure fishing groups are created by the idempotent seed.
- Branding lives in `src/lib/branding.ts`; change the name, logo path, colours, or tagline there.

## Useful scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production build and server
- `npm run db:push` — sync the Prisma schema to a development database
- `npm run db:migrate` — create/apply a development migration
- `npm run db:seed` — seed global groups, demo users, venue, and posts
- `npm run db:studio` — inspect the database

## Security notes

Passwords are hashed with bcrypt (cost 12). Sessions use encrypted, HTTP-only, same-site cookies through iron-session and secure cookies in production. Every mutation validates authentication, role, group membership, and moderation authority server-side.
