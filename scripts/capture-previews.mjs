import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = "http://localhost:3000";

async function shot(page, name) {
  const out = path.join(root, name);
  await page.screenshot({ path: out, fullPage: false });
  console.log("wrote", out);
}

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktop.goto(base + "/", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(500);
  await shot(desktop, "preview-home.png");

  await desktop.goto(base + "/login", { waitUntil: "networkidle" });
  await desktop.fill("#email", "angler@bankside.test");
  await desktop.fill("#password", "password123");
  await Promise.all([
    desktop.waitForURL("**/feed**"),
    desktop.click('button[type="submit"]'),
  ]);
  await desktop.waitForTimeout(600);
  await desktop.evaluate(() => window.scrollBy(0, 220));
  await desktop.waitForTimeout(300);
  await shot(desktop, "preview-feed.png");

  await desktop.goto(base + "/compose", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(400);
  await shot(desktop, "preview-compose.png");

  await desktop.goto(base + "/groups/venue-willow-lakes", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(600);
  await shot(desktop, "preview-group.png");

  // Owner screens
  await desktop.goto(base + "/login", { waitUntil: "networkidle" });
  await desktop.fill("#email", "owner@bankside.test");
  await desktop.fill("#password", "password123");
  await Promise.all([
    desktop.waitForURL("**/feed**"),
    desktop.click('button[type="submit"]'),
  ]);
  await desktop.goto(base + "/owner/venues/willow-lakes", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(600);
  await shot(desktop, "preview-owner.png");

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(base + "/login", { waitUntil: "networkidle" });
  await mobile.fill("#email", "angler@bankside.test");
  await mobile.fill("#password", "password123");
  await Promise.all([
    mobile.waitForURL("**/feed**"),
    mobile.click('button[type="submit"]'),
  ]);
  await mobile.waitForTimeout(600);
  await mobile.evaluate(() => window.scrollBy(0, 180));
  await mobile.waitForTimeout(300);
  await shot(mobile, "preview-feed-mobile.png");

  await desktop.close();
  await mobile.close();
} finally {
  await browser.close();
}
