# Bankside — Roadmap (weeks, not days)

**North star:** free forever knock-out for clubs + anglers; no booking; fishery/club management + Facebook-style social; Fishbrain-quality bar; monetise elsewhere. See PRODUCT.md NORTH STAR.

**Principle:** ship **working components** over polish. Multi-week world-ready product — not a one-day look expedition.

| Week | Status | Theme |
| --- | --- | --- |
| 1 | **Done** | Craft baseline + wave 1 social core |
| 2 | **Done** | DMs, join requests, noticeboard templates, notif polish, featured stub |
| 3 | **In progress (now)** | Harden owner backend, reliability, tests |
| 4 | Planned | Monetisation experiments without breaking free core |
| 5 | Planned | Performance, moderation, a11y, UK venue pilots prep |
| 6 | Planned | VPS docker stack + staging for Chris |

---

## Week 1 — Done

**Craft baseline + wave 1 social core**

- Design LOCKED (Pepper PASS): tokens, PostRow, covers, Logo, mobile tabs, IBM Plex, brand+signal
- Social core: posts with image upload, comments, likes, discover search
- Owner depth: about/cover, members list/remove, pin + official flags
- Invite link regeneration; in-app notifications
- Seed demos + screenshots + PRODUCT/STATUS/README

**Outcome:** runnable world on `:3000` with media-first feed and light venue backend.

---

## Week 2 — Done

**DMs, join requests, noticeboard templates, notif polish, featured stub**

- Direct messages between members (working threads > perfect UI)
- Join-request approval queue (alongside invite links)
- Noticeboard templates (rules / codes / updates starters for owners)
- Notification polish (read state, denser list, fewer dead ends)
- Featured / brand placement **stub** (admin or flag only — no payments yet)

**Outcome:** social loop closes (DM + gated join); owners can post structured noticeboard content; featured hook exists without charging clubs/anglers.

---

## Week 3 — In progress (now)

**Harden owner backend (roles, codes/rules library, member lifecycle), reliability, tests**

- Roles beyond owner/member where needed (e.g. moderator)
- Codes / rules library reusable across noticeboard
- Member lifecycle: invite, request, approve, remove, leave — clear states
- Reliability: error paths, empty states that still work, seed stability
- Tests on critical paths (auth, membership, post/comment/react, owner actions)

**Outcome:** venue owners can run a club group without fear of broken edges; regression safety for later weeks.

---

## Week 4 — Planned

**Monetisation experiments (brand placements / featured reach) without breaking free core**

- Brand placements / featured reach experiments on top of Week 2 stub
- Nominal path possible for fisheries/syndicates only — never paywall clubs/anglers
- Free forever core remains intact and default

**Outcome:** evidence that monetisation can sit beside free knock-out product, not instead of it.

---

## Week 5 — Planned

**Performance, moderation, a11y, seed real UK venue pilots prep**

- Feed/group performance under more posts/media
- Basic moderation tools for owners/globals
- Accessibility pass on primary flows
- Prep seed / onboarding for real UK venue pilots (not fake-only demos)

**Outcome:** credible enough for pilot venues; working > pretty.

---

## Week 6 — Planned

**VPS docker stack beside existing site, staging for Chris**

- Docker compose / stack runnable on VPS next to existing site
- Staging environment Chris can hit and review
- Deploy path documented; no redesign theatre

**Outcome:** world-ready staging beside production site; multi-week product demonstrable outside localhost.

---

## Explicitly deferred / out of north star

- **Booking** — do not build
- Heavy Clubmate-style ERP / paid club suites as the product
- Same-day “look expedition” demos that replace the roadmap
- Native mobile / three.js unless explicitly pulled after Week 6
