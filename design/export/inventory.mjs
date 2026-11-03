// Lists every control on each route (role, name, href) so the prototype wiring can be planned.
import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:3100";
const ROUTES = ["/", "/create", "/outline", "/generate", "/editor", "/export", "/mel", "/login", "/signup", "/account", "/settings", "/brand-kit", "/nope"];
const browser = await chromium.launch().catch(() => chromium.launch({ channel: "msedge" }));
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const r of ROUTES) {
  await page.goto(BASE + r, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => {
    const vis = (el) => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden";
    const items = [...document.querySelectorAll("a[href], button, input, select, textarea, [role=switch], summary")].filter(vis).map((el) => {
      const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.id || "").trim().replace(/\s+/g, " ").slice(0, 50);
      return `${el.tagName.toLowerCase()}${el.type && el.tagName !== "A" ? "[" + el.type + "]" : ""}${el.id ? "#" + el.id : ""} "${name}"${el.getAttribute("href") ? " -> " + el.getAttribute("href") : ""}`;
    });
    return { h: document.documentElement.scrollHeight, title: document.title, items };
  });
  console.log(`\n== ${r} (${info.h}px) ${info.title}`);
  console.log(info.items.join("\n"));
}
await browser.close();
