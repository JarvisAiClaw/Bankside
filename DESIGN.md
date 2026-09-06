# Bankside — Design rehaul brief

**LOCKED craft baseline — Pepper PASS 6 Sep 2026. Extend, don’t reinvent.**


**Status:** LOCKED visual baseline (6 Sep 2026) — Chris: keep this guide, build the full product. No random restyles.  
**Owner:** Pepper (design) via Jarvis  
**Date:** 6 Sep 2026  
**Scope:** Design system + screen specs for Bankside. Product behaviour expands (uploads, comments, owner tools, notifications, etc.) but **must match this baseline + craft pass**. No booking. No payments.

### Locked craft pass (shipped)
Custom peg mark + wordmark, photographic covers, media-first feed, single “Reactions soon”, hero parallax, sticky blur tabs, denser feed, avatar colour variety. QA **PASS** against raised bar.

Pepper QA’s new surfaces against this file. Flag Jarvis if build drifts.

**North star (Chris, locked):** multi-week fully functioning free social + venue management for the world — not a design expedition. Design baseline stays locked; **product completeness is the scoreboard.** No booking. No club SaaS. Free forever for clubs/anglers; monetise elsewhere.

---

## 0. Verdict on what exists

Chris’s call was right. The first cut was classic AI SaaS (cream, pills, soft cards). The “editorial” reskin (Fraunces + Source Sans 3, ink/paper/reed-olive, sharp corners, dark hero) still reads as **AI costume** — a different template, same tell.

### Why it still looks fake

1. **Warm cream canvas + serif display + uppercase tracked eyebrows** is the current default “tasteful AI outdoor brand” kit. Anglers don’t trust it.
2. **Home is a landing page, not a product.** Dark essay hero + “WHAT YOU GET” feature box = marketing deck. A community product puts you in the feed or groups fast.
3. **Feed is empty chrome.** One lonely text card, no avatar, no media slot, no actions, huge side gutters. Nobody who lives on Facebook/Instagram/Fishbrain will take this seriously.
4. **Cards-on-cream everywhere.** White bordered rectangles for every object (group, post, venue) = dashboard kit, not a social surface.
5. **Muddy olive (`#5c6b3a`) + reed gold** reads “nature startup,” not UK fishery / tackle-shop / bankside press.
6. **Owner area is a sparse CRM.** One card, acres of void. Venue owners need a **venue home**, not an empty list.
7. **Nav is marketing chrome.** Text links + ghost “Log out”. No active state, no mobile tabs, no “this is an app I use daily” structure.
8. **Logo mark is generic fish-in-a-black-square.** Fine as a placeholder; do not treat it as brand finished.

### Inspiration (steal patterns, do not clone)

Chris: take inspiration from **Fishbrain, Facebook, Instagram**, etc. — **not exclusively**, and **do not clone**.

| Steal | From | Bankside version |
| --- | --- | --- |
| Dense vertical feed, familiar post anatomy | Facebook / Instagram | Avatar · name · community chip · relative time · body · media · action row |
| Media-first catch culture | Fishbrain / Instagram | Reserve a media frame on every post; empty frame collapses until uploads exist |
| Clear “page” for a place or interest | Facebook Pages / Groups | Group & venue = cover + identity + tabs (Posts / About / Members) |
| Bottom tabs on mobile | Facebook / IG | Feed · Groups · Post · Me (Venues tab if owner) |
| Serious outdoor credibility | Fishbrain + UK press (Angling Times energy) | Photo-capable, information-dense, no soft lifestyle fluff |

**Do not copy:** Meta blue UI, IG gradient logos, Fishbrain teal fish brand, Stories rings (we have no Stories), US consumer-app chrome, dark-mode-only sports skins.

**North star:** a free UK angling community product people would actually open beside Facebook — denser than a magazine site, more trustworthy than generic SaaS, its own brand.

---

## 1. Design principles (commit to these)

1. **Product first, brochure never.** Logged-in `/` redirects to Feed. Logged-out home is short acquisition → live social proof, not a feature essay.
2. **Density over whitespace theatre.** Aim for Facebook-ish information density on phone. Desktop feed max-width ~640–680px, not a lonely `max-w-2xl` island in a sea of cream.
3. **One surface language.** Canvas behind, white surface for content, hairline borders or separators — not nested “card in card.”
4. **Social patterns are familiar on purpose.** Don’t invent cute post chrome. Use patterns people already know; brand them with Bankside colour/type.
5. **UK outdoor, not AI pastoral.** Cool neutrals, deep water green, one hot signal colour. No beige lifestyle.
6. **Accessibility is non-negotiable.** WCAG 2.2 AA from day one of the rehaul — contrast, focus, targets, names.

---

## 2. Design tokens (implement exactly)

Update `src/lib/branding.ts` and CSS variables in `globals.css`. Kill cream/paper/reed as the system.

### Colour

| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#0B0D0C` | Primary text, icons on light |
| `--muted` | `#3E4742` | Secondary text (**must** stay ≥4.5:1 on `--canvas` and `--surface`) |
| `--canvas` | `#E8ECE9` | App background (cool grey-green; **not** warm cream) |
| `--surface` | `#FFFFFF` | Feed posts, panels, sheets |
| `--border` | `#B7C0BA` | Hairlines, inputs |
| `--brand` | `#0D4F3C` | Primary actions, active nav, links of record |
| `--brand-hover` | `#0A3F30` | Hover/active for brand |
| `--brand-subtle` | `#D7E6E0` | Soft brand wash (chips, selected rows) |
| `--signal` | `#D94E1F` | Official badge, pin marker, destructive-adjacent emphasis |
| `--signal-subtle` | `#F8E4DC` | Official/pinned wash |
| `--focus` | `#1D4ED8` | Focus ring only (never rely on brand colour alone for focus) |
| `--danger` | `#B42318` | Errors |
| `--success` | `#0F6B45` | Success notices |

**Rules**

- Body text is `--ink` on `--surface` or `--canvas` only.
- Never use `#f3efe6` / cream again as the app ground.
- Never use gold/tan eyebrows as a brand crutch.
- Official / Pinned use `--signal` + text label (not colour alone).
- Dark hero blocks are banned on product screens. Optional dark strip only on logged-out marketing hero *with real photography*, not flat charcoal essay panels.

### Typography

**Drop Fraunces and Source Sans 3.**

| Role | Font | Notes |
| --- | --- | --- |
| UI + headings | `IBM Plex Sans` via `next/font` | Industrial, UK-trustworthy, not “editorial AI” |
| Optional long-read | `IBM Plex Serif` | Venue about / long posts only — rare |

**Scale (rem, mobile-first)**

| Token | Size / line / weight |
| --- | --- |
| `display` | 1.75rem / 1.15 / 600 (md: 2.25rem) — page titles sparingly |
| `title` | 1.25rem / 1.25 / 600 — group/venue names, composer headers |
| `body` | 1rem / 1.5 / 400 — post body |
| `ui` | 0.875rem / 1.35 / 500 — nav, buttons, meta |
| `meta` | 0.75rem / 1.3 / 500 — timestamps, counts |

**Rules**

- No `uppercase` + `tracking-[0.14em+]` eyebrows as section decoration.
- Section labels, if needed: `ui` weight 600, sentence case or small caps via `font-variant`, normal tracking.
- Post body stays readable at 16px. Do not shrink feed text to look “dense.”

### Geometry & elevation

- Radius: **6px** controls/buttons, **8px** media frames, **999px only for avatars**.
- No `rounded-2xl`, no pill primary buttons.
- Shadows: almost none. Prefer 1px `--border`. Optional `0 1px 2px rgb(0 0 0 / 6%)` on floating composer/sheets only.
- Spacing base 4px. Feed row padding `12px 16px`. Section gaps `16–24px`, not `48–80px` voids.

### Motion

- Respect `prefers-reduced-motion`.
- Transitions ≤150ms opacity/colour only. No decorative page theatre.

---

## 3. Navigation

### Desktop (sticky top, 56px)

```
[Mark + Bankside]    Feed    Groups    Venues*    [Avatar ▾]
```

- `*` Venues only if `VENUE_OWNER` or `ADMIN`.
- Active route: brand underline or brand text + `aria-current="page"`.
- Avatar menu: name, role, Log out. Kill the ghost “Log out” button in the bar.
- Search can wait; leave a right-side slot width so it can land later without relayout.

### Mobile (sticky top 52px + bottom tab bar 56px + safe-area)

Bottom tabs:

| Tab | Route | Notes |
| --- | --- | --- |
| Feed | `/feed` | Home for signed-in users |
| Groups | `/discover` | |
| Post | opens composer sheet on current group context, or group picker | Visual centre affordance |
| Venues | `/owner` | Owners/admins only; hide tab otherwise |
| Me | account sheet / logout for MVP | |

Top bar on mobile: mark + contextual title + optional overflow.

### Logged-in routing

- `/` → redirect to `/feed`.
- Logged-out `/` = marketing home (below).

---

## 4. Screen specs

### 4.1 Logged-out home (`/`)

**Kill:** flat charcoal essay hero, “WHAT YOU GET” list, three sparse cream-era cards as the whole story.

**Build:**

1. **Hero (short):** full-bleed UK bankside photo (use a high-quality placeholder in `/public/hero.jpg` until brand photography exists). Overlay scrim for contrast. Headline ≤8 words. One primary CTA `Join free`, one secondary `Browse groups`. No feature checklist in the hero.
2. **Live strip:** “Happening on Bankside” — 3–5 latest public posts or group teasers in **feed-row style** (density), not marketing cards.
3. **Groups strip:** Carp / Match / Pleasure / venues as horizontal chips or compact list rows (avatar/initial + name + member count + Join).
4. Footer: legal/tagline only. Tagline rewrite: `Free UK angling groups and fishery updates. No booking.`

Copy tone: plain, specific, bankside English. Ban: “Good fishing. Good company.” soft startup lines; ban vague “Find your people.”

### 4.2 Feed (`/feed`)

**This is the product.**

Layout:

- Mobile: edge-to-edge surface list on `--canvas` with posts as `--surface` full-bleed rows separated by 8px canvas gap **or** 1px border (pick one; prefer gap).
- Desktop: centred column **640–680px**, same row language.

**Composer (top of feed, members only)**

- Avatar + textarea placeholder `What’s happening at the water?`
- Group selector (required if posting from global feed)
- Primary `Post` button (`--brand`)
- Official checkbox only if moderator (label clearly)

**Post row anatomy (mandatory)**

```
[Avatar 40]  Name                    ·  relative time
             [Group chip → /groups/slug]
             Body text (15–16px)
             [Media frame 16:9 if image else omit]
             Like    Comment    Share     (MVP: buttons present; can no-op with aria-disabled + tooltip “Soon” OR wire likes later — do not omit the row)
```

- Pinned: signal-tint left bar + `Pinned` label.
- Official: `--signal` badge text `Official` beside name.
- Empty feed: one compact panel + `Browse groups` — not a giant serif empty state.

**Do not:** wrap each post in a heavy bordered “card” with double chrome; do not show raw `6 Sept 2026, 08:26` as the primary time (use relative: `2h`, `Yesterday`; full stamp in `title` tooltip).

### 4.3 Groups discover (`/discover`)

- Filters: All · Communities · Venues (segmented control).
- List **rows**, not a postcard grid: type chip, name, one-line description, member count, chevron.
- Optional compact grid only at `md+` if rows feel too long — but default mental model is list/directory.

### 4.4 Group / venue community (`/groups/[slug]`)

Treat as a **Facebook-style page home**, not a form stack.

**Header block**

- Cover strip 160–200px (colour `--brand` or photo when available)
- Identity row overlapping cover: avatar/initial 72px, name, location (venues), member count, Join/Leave
- Tabs: `Posts` | `About` | `Members`

**Posts tab:** composer + feed rows (same component as global feed).  
**About:** description + venue location.  
**Members:** dense list (name, role badge).

Moderator pin control lives in post overflow (`⋯`) or inline text button — keep feed clean.

### 4.5 Owner area (`/owner`, `/owner/venues/[slug]`, `/owner/new`)

**List (`/owner`)**

- Page title `Your venues` (`title` size, not giant display).
- Primary button `Register venue`.
- Dense table/list: Name · Location · Members · Posts · Last activity · Manage.
- Empty: one short line + button. No heroic serif void.

**Venue manage (`/owner/venues/[slug]`)**

- Same identity header as public venue group, plus **Manage** tools strip: pin/unpin guidance, link to public group, official post shortcut.
- Do not invent booking UI.

**Register (`/owner/new`)**

- Single-column form on `--surface`, clear labels, brand submit. Error summary at top.

### 4.6 Auth (`/login`, `/register`)

- Centred `--surface` panel max 400px on `--canvas`.
- Clear H1, fields with visible labels (not placeholder-only), brand CTA.
- Link across login/register.
- Demo hint can stay in README only — not stamped on the UI.

---

## 5. Components to rebuild

Replace the spirit of `src/components/ui.tsx` + layout chrome. Concrete set:

| Component | Spec |
| --- | --- |
| `AppHeader` | Desktop sticky; active states; avatar menu |
| `MobileTabBar` | 4–5 tabs; safe-area; icons + text |
| `PostCard` → `PostRow` | Anatomy in §4.2; no heavy card chrome |
| `Composer` | Shared feed + group |
| `GroupRow` | Discover directory row |
| `GroupHeader` | Cover + identity + tabs |
| `VenueRow` | Owner list row |
| `Badge` | `Official` (signal), `Pinned`, `Community`, `Venue` |
| `Button` | `primary` (brand), `secondary` (border), `ghost`, `danger`; height 40px desktop / 44px mobile touch |
| `Field` | 44px min height; visible focus ring `--focus` |
| `Notice` | Inline; icon + text; don’t rely on colour alone |
| `Avatar` | Initials fallback from name; sizes 32/40/72 |
| `EmptyState` | Compact; one CTA |

Logo: keep `/logo.svg` temporarily but recolour to `--brand` mark on light header (not black square fighting the new system). Schedule a real mark later; do not block rehaul on it.

---

## 6. Accessibility (WCAG 2.2 AA)

Must ship with the rehaul, not as a later pass:

1. **Contrast:** `--muted` on `--canvas`/`--surface` ≥4.5:1. Recheck badges on tints.
2. **Focus:** `:focus-visible` 2px solid `--focus` offset 2px on all interactive elements. Never `outline: none` without replacement.
3. **Targets:** ≥44×44px on mobile for tabs, icon buttons, Join/Leave.
4. **Names:** icon-only controls need `aria-label`. Logo link named `Bankside home`.
5. **Structure:** one `h1` per page; tabs use proper `tablist`/`tab`/`tabpanel` or clearly labelled nav.
6. **Live regions:** form errors in `role="alert"`.
7. **Motion:** honour `prefers-reduced-motion`.
8. **Language:** keep `lang="en-GB"`.
9. **Keyboard:** avatar menu and mobile composer sheet fully operable; Escape closes sheets.
10. **Don’t use colour alone** for Official/Pinned/error — always include text (and ideally icon).

---

## 7. Content & branding strings

Update `branding.ts`:

```ts
export const branding = {
  name: "Bankside",
  logo: "/logo.svg",
  colours: {
    primary: "#0D4F3C",
    ink: "#0B0D0C",
    canvas: "#E8ECE9",
    surface: "#FFFFFF",
    signal: "#D94E1F",
    muted: "#3E4742",
    border: "#B7C0BA",
  },
  tagline: "Free UK angling groups and fishery updates. No booking.",
} as const;
```

UI copy rules: short, concrete, en-GB spelling (`organised` if used, `colour` in docs). No emoji empty states. No “Welcome to your journey.”

---

## 8. Implementation order (for build agents)

1. Tokens + fonts in `branding.ts` / `globals.css` / `layout.tsx` (remove Fraunces & Source Sans 3).
2. `AppHeader` + `MobileTabBar` + logged-in `/` → `/feed` redirect.
3. Rebuild `PostRow` + `Composer`; restyle Feed.
4. Group header + tabs; Discover as rows.
5. Owner list/detail + auth panels.
6. Logged-out home rewrite (hero photo + live strips).
7. A11y pass + fresh screenshots: `preview-home.png`, `preview-feed.png`, `preview-owner.png`.

Do **not** leave old card/eyebrow classes half-alive. Delete obsolete component styles.

---

## 9. Acceptance criteria (Chris / Jarvis)

Ship is ready for Chris to look again only if:

- [ ] No warm cream ground, no Fraunces, no tracked gold eyebrows, no flat charcoal essay hero.
- [ ] Feed looks like a social product (avatar, group chip, relative time, action row, denser layout) — even with text-only demo data.
- [ ] Group/venue feels like a home with cover + tabs, not a form on a card.
- [ ] Mobile has bottom tabs; desktop has clear active nav + avatar menu.
- [ ] Owner area is a dense list/manage surface.
- [ ] Colour/type match §2 tokens.
- [ ] Keyboard + contrast AA hold on home, feed, group, owner, auth.
- [ ] Still obviously **Bankside** — not a Facebook/Fishbrain/IG skin.

---

## 10. Out of scope (do not sneak in)

- Booking, payments, DMs, notifications infrastructure
- Real image upload pipeline (layout for media yes; backend can wait)
- Working Like/Comment/Share backends (UI row required; stubs OK if labelled)
- Final logo lockup / illustration system
- Dark mode (design tokens should not preclude it later; don’t ship a half dark theme now)

---

*Design owns this brief. Build implements it. Further visual nitpicks go through Jarvis → Design, not drive-by reskins.*
