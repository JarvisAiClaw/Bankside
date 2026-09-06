# Bankside — Complete project document

**Working title:** Bankside  
**Status:** Active product build (design craft locked; product completeness is the scoreboard)  
**Repo:** https://github.com/JarvisAiClaw/Bankside (public)  
**Owner:** Chris Streames  
**Document purpose:** One place to explain what Bankside is — mission, product function, rules of the world, who it serves, what ships today, what never ships, and how money works — from first principles to current state.  
**Last updated:** 6 September 2026

Related docs (detail, not replacements for this overview):

| Doc | Role |
| --- | --- |
| `PRODUCT.md` | Locked north star + wave scope |
| `DESIGN.md` | Locked visual/UX baseline (Pepper) |
| `STATUS.md` | Living done / next checklist |
| `ROADMAP.md` | Multi-week themes (informational; Chris sets priority) |
| `README.md` | Run locally, demo accounts |
| `DEPLOY.md` | Docker / VPS notes |

---

## 1. One-sentence pitch

Bankside is a **free-forever** home for UK anglers and fisheries that joins **Facebook-style social** (groups, feed, media, DMs) with **light fishery/club management** (venue homes, noticeboards, members, invites) — without booking, without forcing clubs to buy SaaS.

---

## 2. Mission

UK angling community life is fragmented across Facebook groups, WhatsApp threads, and venue Facebook pages. Clubs and fisheries either put up with that mess or get pushed toward pricey club software they don’t want.

Bankside’s mission is to become the **official digital home of the water**:

- A place anglers actually open every day (social density and familiarity).
- A place venue owners can run community ops without an ERP.
- A knock-out alternative that stays **free forever for clubs and anglers**, so adoption isn’t gated by a subscription.

Scoreboard: a **multi-week, world-ready working product** — not a design expedition, not a same-day demo spike.

---

## 3. Problem

| Pain | Reality today |
| --- | --- |
| Fragmentation | Catch photos, rules, gate codes, and “is anyone going Friday?” live in different Facebook groups and chats. |
| Weak venue home | Fisheries lack a first-class “page + group + ops” that isn’t a generic Facebook page or a paid club suite. |
| Price sensitivity | Clubs won’t pay for heavy software; Clubmate-style paid SaaS is the wrong bet for the core wedge. |
| Social bar | Thin bulletin boards fail. Anglers judge against Fishbrain / Facebook / Instagram density. |
| Wrong products | Booking diaries and catch-map clones are crowded or off-mission for this north star. |

---

## 4. Solution (product function)

Bankside is **one product world** with two joined layers:

### 4.1 Social layer (Facebook-style, Fishbrain-quality bar)

- Register / log in as an angler (or venue owner / admin).
- **Global interest groups** (system-owned): Carp, Match, Pleasure, Predator, Specimen hunting — shared communities anyone can join.
- **Venue groups** (owner-created only): each registered venue gets an official group home.
- **Feed** of posts with optional photos, likes, comments, edit/delete own posts.
- **Discover** venues/groups (search, featured row, partner slot).
- **DMs** (1:1 threads).
- **Notifications** with unread badges (comments, joins, reports, etc.).
- Profiles and group post search.

### 4.2 Light venue / club management (not ERP)

When an owner **registers a venue/club**, the system atomically creates:

1. The **official venue group** (social home of that water).
2. A **separate owner management backend** for that venue.

Owner / moderator tools include:

- Cover and about.
- Members list, remove, leave; promote/demote moderators.
- Pin + official posts; denser noticeboard.
- Structured **rules / gate code / gate notes**.
- Invite links (regenerate invalidates old tokens) + join-request approve/deny.
- Hide posts; members can report; featured flag (stub).

### 4.3 Admin layer

- `/admin` for users, venues, featured toggles, BrandSpot / partner card editing.
- Evidence that monetisation can sit **beside** the free core — never instead of it.

---

## 5. Rules of the world (locked)

These are product law, not suggestions:

1. **No booking.** Bankside is not a diary, peg book, or ERP.
2. **Free forever for clubs + anglers.** Core social + light management must not be paywalled.
3. **Only owners create venue groups.** Anglers don’t invent fake “official” venues.
4. **System owns global super-groups** (Carp / Match / etc.). Seed/admin — not owner venue groups.
5. **Venue register → group + management backend** in one atomic act.
6. **Monetise elsewhere** — brands, featured reach, optional later nominal fees for fisheries/syndicates — never by locking the free core.
7. **Design craft is locked** (Pepper PASS). Extend tokens and patterns; don’t reinvent AI-generic UI.
8. **Working product over polish theatre.** Completeness beats screenshot expeditions.

---

## 6. Who it’s for

| Audience | What they get |
| --- | --- |
| **Anglers** | Free social home: globals + venue groups, feed, photos, likes, comments, DMs, notifications. |
| **Venue / fishery owners** | Official group + management backend: members, noticeboard, invites, join requests, moderation. |
| **Clubs** | Free rider on the same stack — no paid club suite required for the core. |
| **Syndicates / commercials** | Beachhead venues; may later see optional nominal tools/reach (not required for core). |
| **Brands / partners** | Discover partner slot and featured reach (stubs live; no Stripe in core). |
| **Platform admin** | User/venue oversight, featured + BrandSpot controls. |

Beachhead thinking from discovery: day-ticket commercials and syndicates first; clubs as free riders; cold-start needs real seeded waters posting as home for a sustained period. Global interest groups support network effects beyond a single venue.

---

## 7. What Bankside is not

Explicit non-goals (do not pitch or build into the core):

- Booking / peg allocation / diary systems.
- Heavy paid club secretary SaaS (Clubmate-class) as the wedge.
- Open syndicate secondary markets (e.g. SyndicateSwap) — many syndicates require interviews.
- Pure catch-map clones as the product.
- Friday go/no-go / trip-card “idiot filter” products.
- Club membership renewal / Club Card wedges (rejected).
- Paywalling social, groups, DMs, noticeboard, or basic venue management.

---

## 8. Monetisation philosophy

**Locked:** Clubs and anglers stay free forever. No Stripe in the free core. No paywall on social or basic venue ops.

What may pay **later**, sitting beside the free product:

| Lever | Status | Notes |
| --- | --- | --- |
| Brand / partner placements | Stub live | Discover `BrandSpot` + env fallback; admin editor |
| Featured venues | Stub live | Badge + Discover row; owner/admin toggle |
| Nominal fishery/syndicate fee | Not built | Optional later for extra reach/ops — never required for clubs/anglers |

Money follows attention and venue reach, not a tax on community membership.

---

## 9. User journeys (start → finish)

### Angler

1. Land on short logged-out home → register / log in.
2. Hit Feed (logged-in `/` goes to product, not a brochure).
3. Discover and join global groups and venue groups.
4. Post (optional photo), like, comment, DM, get notifications.
5. Use invite links or join requests for gated venues.
6. Leave groups when done (owners cannot “leave” their own venue group the same way).

### Venue owner

1. Register as owner / register a venue.
2. System creates official group + owner membership + owner backend.
3. Set cover, about, rules, gate code.
4. Share invite link; approve join requests; manage members and mods.
5. Pin official noticeboard posts; hide/report flow for moderation.
6. Optionally mark featured (stub); keep community posting on that water.

### Admin

1. Log in as admin.
2. Review users and venues; edit BrandSpot; toggle featured.
3. Moderate at platform level where needed.

---

## 10. What’s shipped today (product completeness)

Living detail: `STATUS.md`. Summary:

**Social core**

- Auth + roles (angler / owner / admin).
- Global + venue groups; feed; uploads; likes; comments; edit/delete own posts.
- Discover search; featured venues; partner slot.
- DMs; notifications + unread badges.
- Group post search; leave group; denser official noticeboard.

**Venue OS**

- Atomic venue register → group + backend.
- Cover/about; members; pin/official; invite regen; join-request queue.
- Structured rules / gate fields; moderator promote/demote.
- Hide/report posts.

**Admin + monetisation stubs**

- `/admin` users/venues/featured/BrandSpot.
- Free-forever core documented; no payments.

**Craft**

- Design baseline locked (IBM Plex, brand `#0D4F3C`, signal `#D94E1F`, canvas `#E8ECE9`, media-first feed, mobile tabs). Branding swappable via `src/lib/branding.ts`.

**Quality bar**

- Smoke scripts for wave 2 / wave 3 / admin-brand paths.
- Demo accounts after seed (see README).

---

## 11. Stack and hosting

| Layer | Choice |
| --- | --- |
| App | Next.js 16, React 19 |
| Data | PostgreSQL + Prisma 7 |
| UI | Tailwind 4, locked design tokens |
| Auth | Session cookies (iron-session), bcrypt passwords |
| Build tooling | Codex + Grok Build + Gemini on the agent computer; no Cursor Origin requirement |
| Dev home | Built on the agent computer first |
| Production target | Chris’s Fasthosts VPS 6 — separate Docker stack beside existing sites (subdomain/port isolation) |
| Source | GitHub `JarvisAiClaw/Bankside` (public) |

Local run: see `README.md`. Deploy notes: `DEPLOY.md` / Docker compose files in tree.

---

## 12. Design and brand

- **Inspiration:** Fishbrain, Facebook, Instagram patterns — steal familiarity, do not clone brands.
- **Reject:** Cream/serif “AI outdoor SaaS”, brochure landing pages, empty chrome feeds.
- **Principles:** Product first; density; one surface language; UK outdoor credibility; WCAG 2.2 AA.
- **Owner:** Pepper owns craft; Jarvis coordinates; Chris may brief specialists directly.

Full tokens and screen rules: `DESIGN.md` (LOCKED).

---

## 13. How Bankside was born (context)

Discovery into UK angling digital gaps (carp / pleasure / match) rejected several wedges: club renewals, catch-map clones as the product, Friday go/no-go tools, open syndicate trading, and heavy paid club SaaS.

The surviving north star: rebuild “Facebook as fishery OS” as a **free forever** social + light venue management product, with owner-created venue homes and system global interest groups, monetised via attention/brands rather than club subscriptions.

Working title **Bankside** is placeholder-friendly; branding remains swappable.

---

## 14. Team and working agreements

| Role | Responsibility |
| --- | --- |
| Chris | Product owner; priorities; may brief specialists directly |
| Jarvis | Chief of staff; coordinates build and docs |
| Pepper | Design / UI / UX / a11y craft gate |
| Scout / Inventor | Discovery support (research / invention) when needed |

Agreements:

- Design baseline stays locked while product scope expands.
- Prefer working components over endless micro-QA after each tweak.
- Chris decides what ships next — week labels in `ROADMAP.md` are themes, not gates.
- Never post on X for Chris without explicit say-so (separate project).

---

## 15. Success looks like

- An angler can live daily life on Bankside: feed, groups, photos, DMs, notifications.
- A venue owner can run that water’s community without Facebook: members, rules, codes, invites, moderation.
- Clubs/anglers never hit a paywall for the core.
- The product feels like a real social app (Fishbrain-quality bar), not a brochure or generic AI SaaS skin.
- Staging on Fasthosts exists as a real Docker neighbour to Chris’s other sites.
- UK venue pilots can be seeded without rewriting the world model.

---

## 16. Open / next (Chris picks)

Not gated by week numbers. Candidates when work resumes:

- Club vs fishery type clarity on register (if still thin).
- Broader tests, a11y hardening, UK pilot seed polish.
- VPS Docker staging cutover.
- Whatever is still missing for “Facebook replacement + light venue OS” completeness.

Booking and paid club ERP remain out of north star.

---

## 17. Glossary

| Term | Meaning |
| --- | --- |
| Global / super-group | System-owned interest community (e.g. Carp) |
| Venue group | Official group for a registered water/club; owner-created only |
| Noticeboard | Official/pinned updates; plus structured rules/gate fields |
| BrandSpot | Discover partner placement stub |
| Free forever core | Social + light venue management never paywalled for clubs/anglers |
| Craft lock | Pepper-approved design baseline — extend, don’t reinvent |

---

*End of project document. For implementation detail, start at `README.md` and `PRODUCT.md`.*
