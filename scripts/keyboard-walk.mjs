// Keyboard walk: tab order and visible focus on key pages, plus Escape and focus return for
// menus, the Mel panel, the delete dialog, Present mode and the password eye toggle.
// Usage: npm run review:keyboard   (needs the dev server on http://localhost:3000)
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch().catch(() => chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" }));
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();

const focused = () =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const hasRing = (node) => {
      const cs = getComputedStyle(node);
      return (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow !== "none" && cs.boxShadow.includes("0px 0px 0px"));
    };
    // Inputs inside a rounded field draw the ring on that field (has-[input:focus-visible]), so check two levels up.
    const ring = hasRing(el) || (/^(INPUT|TEXTAREA)$/.test(el.tagName) && [el.parentElement, el.parentElement?.parentElement].some((n) => n && hasRing(n)));
    return { name: (el.getAttribute("aria-label") || el.textContent || el.id || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40), ring };
  });
const activeText = () => page.evaluate(() => (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || document.activeElement?.id || "").trim().slice(0, 40));

async function walk(route, max = 40) {
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const stops = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const stop = await focused();
    if (!stop) break;
    stops.push(stop);
  }
  return { route, stops: stops.length, order: stops.slice(0, 8).map((s) => s.name), noRing: [...new Set(stops.filter((s) => !s.ring).map((s) => s.name))] };
}

const out = { walks: [] };
for (const route of ["/", "/create", "/editor", "/login", "/signup", "/settings", "/brand-kit"]) out.walks.push(await walk(route));

// Account menu and Ask Mel: open with Enter, close with Escape, focus back on the trigger.
await page.goto(BASE + "/create", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Account" }).focus();
await page.keyboard.press("Enter");
const menuOpen = await page.getByRole("group", { name: "Account" }).isVisible();
await page.keyboard.press("Escape");
out.accountMenu = { opened: menuOpen, closed: !(await page.getByRole("group", { name: "Account" }).isVisible().catch(() => false)), focusBack: await activeText() };
await page.getByRole("button", { name: /Ask Mel/ }).first().focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const melFocus = await activeText();
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
out.askMel = { focusInside: melFocus, focusBack: await activeText() };

// Delete dialog on settings.
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Delete account…" }).focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const dialogFocus = await activeText();
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
out.deleteDialog = { focusInside: dialogFocus, focusBack: await activeText() };

// Present mode in the editor.
await page.goto(BASE + "/editor", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Present" }).focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
const counter = () => page.evaluate(() => document.querySelector("dialog[open] [aria-live]")?.textContent);
const start = await counter();
const presentFocus = await activeText();
await page.keyboard.press("ArrowRight");
const next = await counter();
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
out.present = { focusInside: presentFocus, start, afterArrowRight: next, closed: await page.evaluate(() => !document.querySelector("dialog[open]")), focusBack: await activeText() };

// Password eye toggle on log in: reachable by Tab, toggles with Space and Enter, focus stays on it.
await page.goto(BASE + "/login", { waitUntil: "networkidle" });
await page.locator("#password").fill("calm-slides-1");
await page.keyboard.press("Tab");
const eye = await focused();
const state = () => page.evaluate(() => ({ type: document.getElementById("password").type, pressed: document.querySelector('[aria-label="Show password"]').getAttribute("aria-pressed") }));
await page.keyboard.press("Space");
const afterSpace = await state();
await page.keyboard.press("Enter");
const afterEnter = await state();
out.passwordEye = { tabbedTo: eye, afterSpace, afterEnter, focusStays: await activeText() };

console.log(JSON.stringify(out, null, 1));
await browser.close();
