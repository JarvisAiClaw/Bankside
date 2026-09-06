/**
 * Wave 3 smoke — DMs, join request, like, comment, noticeboard template,
 * Add photo button, gate/rules About, promote stub surfaces.
 * Targets :3000 (canonical bankside).
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const results = {};

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#email", { timeout: 15000 });
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await Promise.all([
    page.waitForURL((url) => !String(url).includes("/login"), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
}

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  // --- Angler: Add photo, like, comment, DMs ---
  await login(page, "angler@bankside.test");

  await page.goto(`${BASE}/compose`, { waitUntil: "networkidle" });
  results.addPhotoBtn = await page.locator('label[for="composer-image"]').count();
  results.hiddenFileInput = await page.locator("#composer-image.sr-only").count();

  await page.goto(`${BASE}/feed`, { waitUntil: "networkidle" });
  const likeBefore = await page.locator('button[aria-pressed]').first().getAttribute("aria-pressed");
  await page.locator('button[aria-pressed]').first().click();
  await page.waitForTimeout(800);
  const likeAfter = await page.locator('button[aria-pressed]').first().getAttribute("aria-pressed");
  results.likeToggle = likeBefore !== likeAfter;

  const commentInput = page.locator('input[placeholder="Write a comment…"]').first();
  await commentInput.fill("Smoke wave3 comment " + Date.now());
  await Promise.all([
    page.waitForLoadState("networkidle"),
    commentInput.locator("xpath=ancestor::form").locator('button[type="submit"]').click(),
  ]);
  await page.waitForTimeout(500);
  results.commentPosted = (await page.locator("text=Smoke wave3 comment").count()) > 0;

  await page.goto(`${BASE}/me/messages`, { waitUntil: "networkidle" });
  results.dmsList = (await page.locator("text=Sam Bank").count()) > 0 || (await page.locator("a[href*='/me/messages/']").count()) > 0;
  const threadHref = await page.locator("a[href*='/me/messages/']").first().getAttribute("href");
  if (threadHref) {
    await page.goto(`${BASE}${threadHref}`, { waitUntil: "networkidle" });
    const marker = "Wave3smokeDM-" + Date.now();
    const dmBody = page.locator("#dm-body");
    if (await dmBody.count()) {
      await dmBody.fill(marker);
      await page.locator("form").filter({ has: page.locator("#dm-body") }).locator('button[type="submit"]').click();
      await page.waitForTimeout(1200);
      results.dmSend = (await page.getByText(marker).count()) > 0;
    } else {
      results.dmSend = false;
    }
  } else {
    results.dmSend = false;
  }

  await page.goto(`${BASE}/groups/venue-willow-lakes?tab=about`, { waitUntil: "networkidle" });
  results.rulesOnAbout =
    (await page.locator("text=Barbless hooks").count()) > 0 ||
    ((await page.getByRole("heading", { name: "Noticeboard" }).count()) > 0 &&
      (await page.getByText("Rules", { exact: true }).count()) > 0);
  results.gateOnAbout =
    (await page.locator("text=4821#").count()) > 0 ||
    (await page.getByText("Gate / access").count()) > 0;

  // Report stub present on a post (member, not mod)
  await page.goto(`${BASE}/groups/carp-fishing`, { waitUntil: "networkidle" });
  results.reportBtn = (await page.locator('button:has-text("Report")').count()) > 0;

  // --- Mate: join request already pending; check group CTA ---
  await page.goto(`${BASE}/login`);
  await login(page, "sam@bankside.test");
  await page.goto(`${BASE}/groups/venue-willow-lakes`, { waitUntil: "networkidle" });
  results.joinPendingOrRequest =
    (await page.locator("text=Pending").count()) > 0 ||
    (await page.locator("text=Request").count()) > 0 ||
    (await page.locator('button:has-text("Join")').count()) > 0;

  // --- Owner dashboard at-a-glance ---
  await page.goto(`${BASE}/login`);
  await login(page, "owner@bankside.test");
  await page.goto(`${BASE}/owner`, { waitUntil: "networkidle" });
  results.ownerDashCards = (await page.locator('[data-testid="owner-venue-card"]').count()) > 0;
  results.ownerGateStatus = (await page.locator('[data-testid="owner-gate-status"]').count()) > 0;
  results.ownerLatestOfficial = (await page.locator('[data-testid="owner-latest-official"]').count()) > 0;
  results.ownerPending = (await page.locator('[data-testid="owner-pending-count"]').count()) > 0;

  // --- Owner: join requests, noticeboard template, promote ---
  await page.goto(`${BASE}/owner/venues/willow-lakes`, { waitUntil: "networkidle" });
  results.joinRequests = (await page.locator("text=Join requests").count()) > 0;
  results.noticeTemplates = (await page.locator('button:has-text("Post Rules")').count()) > 0;
  results.gateField = (await page.locator("#gate-code").count()) > 0 || (await page.locator("#venue-gate").count()) > 0;
  results.rulesField = (await page.locator("#rules-text").count()) > 0 || (await page.locator("#venue-rules").count()) > 0;
  results.promoteBtn = (await page.locator('button:has-text("Promote")').count()) > 0;

  // Post a noticeboard update template
  const updatesBtn = page.locator('button:has-text("Post Updates")');
  if (await updatesBtn.count()) {
    await updatesBtn.click();
    await page.waitForTimeout(1000);
    results.noticePosted =
      (await page.locator("text=Venue update").count()) > 0 ||
      (await page.locator("text=Quick update").count()) > 0;
  } else {
    results.noticePosted = false;
  }

  // Hide control on noticeboard
  results.hideBtn = (await page.locator('button:has-text("Hide")').count()) > 0;

  // Featured toggle for owners
  results.featuredToggle = (await page.locator('button:has-text("Mark featured")').count()) + (await page.locator('button:has-text("Remove featured")').count()) > 0;

  // Group post search + denser noticeboard
  await page.goto(`${BASE}/groups/venue-willow-lakes`, { waitUntil: "networkidle" });
  results.groupPostSearch = (await page.locator("#group-post-search").count()) > 0;
  results.denseNoticeboard = (await page.locator("text=Official noticeboard").count()) > 0;

  // Leave group CTA on a community (angler)
  await page.goto(`${BASE}/login`);
  await login(page, "angler@bankside.test");
  await page.goto(`${BASE}/groups/carp-fishing`, { waitUntil: "networkidle" });
  results.leaveGroup = (await page.locator('button:has-text("Leave group")').count()) > 0;

  // Partner slot on Discover
  await page.goto(`${BASE}/discover`, { waitUntil: "networkidle" });
  results.partnerSlot = (await page.locator("text=Partner").count()) > 0;

  // Admin panel
  await page.goto(`${BASE}/login`);
  await login(page, "admin@bankside.test");
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  results.adminUsers = (await page.locator("text=Users").count()) > 0;
  results.adminFeatured = (await page.getByRole("heading", { name: "Venues" }).count()) > 0 || (await page.getByRole("button", { name: /Feature|Unfeature/ }).count()) > 0;
  results.adminBrand = (await page.getByRole("heading", { name: /Partner/ }).count()) > 0 || (await page.getByRole("button", { name: /Save partner/i }).count()) > 0;

  console.log(JSON.stringify(results, null, 2));
  const failed = Object.entries(results).filter(([, v]) => v === false || v === 0);
  if (failed.length) {
    console.error("FAILED:", failed.map(([k]) => k).join(", "));
    process.exitCode = 1;
  } else {
    console.log("SMOKE WAVE3 PASS");
  }
} catch (e) {
  console.error("SMOKE ERROR", e);
  console.log(JSON.stringify(results, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
