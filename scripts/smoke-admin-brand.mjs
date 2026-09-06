import { chromium } from "playwright";
const BASE = process.env.BANKSIDE_URL || "http://localhost:3000";
const out = {};
const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
async function login(email) {
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await Promise.all([
    page.waitForURL((u) => !String(u).includes("/login")),
    page.click('button[type="submit"]'),
  ]);
}
try {
  await page.goto(BASE + "/discover", { waitUntil: "networkidle" });
  out.partner = (await page.getByText("Partner", { exact: true }).count()) > 0;
  out.featuredRow = (await page.getByRole("heading", { name: "Featured venues" }).count()) > 0;
  out.willowFeatured = (await page.getByText("Willow Lakes").count()) > 0;
  await login("admin@bankside.test");
  await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
  out.admin = (await page.getByRole("heading", { name: "Admin" }).count()) > 0;
  out.statusPartner = (await page.getByText(/Active \(DB\)|Active \(env\)|Partner slot/i).count()) > 0;
  out.preview = (await page.getByText("Live preview").count()) > 0;
  out.savePartner = (await page.getByRole("button", { name: /Save partner/i }).count()) > 0;
  out.featureBtn = (await page.getByRole("button", { name: /Feature|Unfeature/ }).count()) > 0;
  out.paymentsNone = (await page.getByText(/None · free core|No Stripe|free forever/i).count()) > 0;
  console.log(JSON.stringify(out, null, 2));
  const fail = Object.entries(out).filter(([, v]) => !v);
  if (fail.length) {
    console.error("FAIL", fail.map(([k]) => k));
    process.exitCode = 1;
  } else {
    console.log("ADMIN/BRAND CHECKPOINT PASS");
  }
} catch (e) {
  console.error(e);
  console.log(JSON.stringify(out, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
