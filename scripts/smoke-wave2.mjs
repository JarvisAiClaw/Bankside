import { chromium } from "playwright";

const base = process.env.BANKSIDE_URL || "http://localhost:3000";
const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const out = {};

async function login(email) {
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await Promise.all([page.waitForURL("**/feed**"), page.click("button[type=submit]")]);
}

await login("angler@bankside.test");
await page.goto(base + "/me/messages", { waitUntil: "networkidle" });
out.dms = await page.getByRole("heading", { name: /messages/i }).count();
out.dmThreadLink = await page.locator("a[href^=\"/me/messages/\"]").count();

await page.goto(base + "/compose", { waitUntil: "networkidle" });
out.addPhoto = await page.getByRole("button", { name: "Add photo" }).count();
out.composerFile = await page.locator("#composer-image").count();

await page.goto(base + "/groups/venue-willow-lakes?tab=about", { waitUntil: "networkidle" });
out.noticeboard = await page.getByRole("heading", { name: "Noticeboard" }).count();
out.rulesHeading = await page.getByText("Rules", { exact: true }).count();
out.gateCode = await page.getByText("4821#").count();

await page.goto(base + "/login");
await login("owner@bankside.test");
await page.goto(base + "/owner/venues/willow-lakes", { waitUntil: "networkidle" });
out.rulesLibrary = await page.getByRole("heading", { name: /Rules.*gate codes/i }).count();
out.joinQueue = await page.getByRole("heading", { name: "Join requests" }).count();
out.templates = await page.getByRole("heading", { name: "Quick templates" }).count();
out.pendingApprove = await page.getByRole("button", { name: "Approve" }).count();
out.saveNoticeboard = await page.getByRole("button", { name: "Save noticeboard" }).count();

console.log(JSON.stringify(out, null, 2));
const fail = Object.entries(out).filter(([, v]) => !v);
if (fail.length) {
  console.error("SMOKE FAIL", fail);
  process.exit(1);
}
console.log("SMOKE PASS");
await browser.close();
