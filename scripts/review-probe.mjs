// Runs the review-web-design probe on every route at six widths, plus a hero fold check.
// Usage: npm run review:probe   (needs the dev server on http://localhost:3000)
// Output: visual-check/probe-results.json
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PROBE = process.env.PROBE_PATH || path.join(os.homedir(), ".claude/skills/review-web-design/scripts/probe.js");
const ROUTES = ["/", "/create", "/outline", "/generate", "/editor", "/export", "/mel", "/login", "/signup", "/account", "/settings", "/brand-kit", "/this-page-does-not-exist"];
const WIDTHS = [320, 375, 768, 1024, 1280, 1440];

if (!existsSync(PROBE)) {
  console.error(`Probe not found at ${PROBE}. Set PROBE_PATH to the review-web-design probe.js.`);
  process.exit(1);
}
// The probe ends with a JSON.stringify expression; return the object instead.
const probe = readFileSync(PROBE, "utf8").replace(/JSON\.stringify\(PROBE, null, 1\);\s*$/, "return PROBE;");

const browser = await chromium.launch().catch(() => chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" }));
const results = [];
for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: width < 768 ? 800 : 900 } });
  for (const route of ROUTES) {
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && !(route.includes("does-not-exist") && m.text().includes("404")) && errors.push(m.text().slice(0, 160)));
    page.on("pageerror", (e) => errors.push("crash: " + e.message.slice(0, 160)));
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const result = await page.evaluate(`(async () => { window.PROBE_MIN_TAP = ${width < 640 ? 44 : 24}; ${probe} })()`);
    const extra = await page.evaluate(() => {
      const header = document.querySelector("header");
      const h1 = document.querySelector("h1");
      const primary = [...document.querySelectorAll("main a, main button")].find((el) => /bg-ink/.test(el.className) && el.getClientRects().length);
      const inFold = (el) => (el ? Math.round(el.getBoundingClientRect().bottom) <= innerHeight : null);
      return { headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0, fold: { h1: inFold(h1), primary: inFold(primary) } };
    });
    results.push({ width, route, errors, ...extra, ...result });
    await page.close();
    process.stdout.write(".");
  }
  await context.close();
}
await browser.close();
mkdirSync("visual-check", { recursive: true });
writeFileSync("visual-check/probe-results.json", JSON.stringify(results, null, 1));

// Summary of anything worth a look.
const flag = (key) => results.filter((r) => (Array.isArray(r[key]) ? r[key].length : r[key])).map((r) => `${r.width} ${r.route}: ${Array.isArray(r[key]) ? r[key].slice(0, 3).join(" | ") : r[key]}`);
console.log(`\n${results.length} page loads`);
for (const key of ["horizontalPageScroll", "unnamedControls", "coveredControls", "focusRingMissing", "focusRingOnContainer", "focusRingClipped", "clippedText", "positiveTabindex", "imagesNoAlt", "twoLineLabels", "sidewaysOverflow", "errors"]) {
  const hits = flag(key);
  console.log(`${key}: ${hits.length ? "\n  " + hits.join("\n  ") : "none"}`);
}
const tall = results.filter((r) => r.width <= 375 && r.headerHeight > 120).map((r) => `${r.width} ${r.route}: ${r.headerHeight}px`);
console.log(`phone headers over 120px: ${tall.length ? tall.join(", ") : "none"}`);
console.log(`pages without exactly one h1: ${results.filter((r) => (r.h1Visible || []).length !== 1).map((r) => r.width + " " + r.route).join(", ") || "none"}`);
console.log(`unique titles: ${new Set(results.filter((r) => r.width === 1280).map((r) => r.title)).size} of ${ROUTES.length}`);
