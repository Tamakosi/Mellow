// Worst-case data pass (review-web-design lens 12): feeds realistic long, short and emoji values through
// the app's own inputs, then checks for text escaping its box, broken initials and sideways scroll.
// Usage: npm run review:worst-case   (needs the dev server on http://localhost:3000)
// Screenshots: visual-check/worst-case/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "visual-check/worst-case";
mkdirSync(OUT, { recursive: true });

const LONG_NAME = "Aleksandra Wiśniewska-Kowalczyk";
const EMOJI_NAME = "🌍 Sam Lee";
const SHORT_NAME = "Jo";
const LONG_EMAIL = "bartholomew.fitzgerald.northwindindustriesholdings@example.com";
const LONG_BRAND = "Llanfairpwllgwyngyll Community Bicycle Cooperative";
const LONG_PROMPT = "A 12-slide onboarding guide for Aleksandra Wiśniewska-Kowalczyk's team at Northwind Industries Holdings covering benefits, security training, the quarterly planning calendar and who to ask for what";
const LONG_WORD_MESSAGE = "Please use https://northwindindustriesholdings.example.com/brand/guidelines/2026/final-final-v3.pdf for the colours";

const browser = await chromium.launch().catch(() => chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" }));

/** Elements whose text runs past their own box or the viewport. */
const overflowCheck = (page) =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const hits = [];
    for (const el of document.querySelectorAll("body *")) {
      if (!el.getClientRects().length || el.closest(".sr-only, [aria-hidden=true], nextjs-portal")) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "contents") continue;
      const r = el.getBoundingClientRect();
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!ownText) continue;
      const pastBox = el.scrollWidth > el.clientWidth + 1 && /hidden|clip/.test(cs.overflowX) === false && cs.display !== "inline";
      const pastScreen = r.right > vw + 1;
      if (pastBox || pastScreen) hits.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}" ${pastScreen ? "past the screen" : "past its box"} (${Math.round(el.scrollWidth)}>${Math.round(el.clientWidth)})`);
    }
    return { sidewaysScroll: document.documentElement.scrollWidth > vw + 1, hits: [...new Set(hits)].slice(0, 8) };
  });

const setValue = async (page, selector, value) => {
  await page.locator(selector).fill(value);
  await page.waitForTimeout(80);
};

const results = [];
async function run(label, route, width, act) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  let extra = {};
  try {
    extra = (await act(page)) || {};
  } catch (e) {
    extra = { error: e.message.split("\n")[0].slice(0, 200) };
  }
  const check = await overflowCheck(page);
  const file = `${OUT}/${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${width}.png`;
  await page.screenshot({ path: file, fullPage: false });
  results.push({ label, width, ...check, ...extra, file });
  await page.close();
}

for (const width of [320, 1280]) {
  // Profile: avatar initials and the name and email fields.
  for (const name of [LONG_NAME, EMOJI_NAME, SHORT_NAME]) {
    await run(`profile ${name}`, "/account", width, async (page) => {
      await setValue(page, "#name", name);
      await setValue(page, "#email", LONG_EMAIL);
      const initials = await page.evaluate(() => document.querySelector(".size-24")?.textContent.trim());
      await page.getByRole("button", { name: "Save changes" }).click();
      await page.waitForTimeout(1000);
      return { initials, saved: await page.getByText("Changes saved.").isVisible().catch(() => false) };
    });
  }
  // Sign up with a taken, very long email: the "Log in with …" link carries the whole address.
  await run("signup taken long email", "/signup", width, async (page) => {
    await setValue(page, "#name", LONG_NAME);
    await setValue(page, "#email", "taken@example.com");
    await page.locator("#password").fill("calm-slides-1");
    await page.locator("#terms").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByText("An account with this email already exists").waitFor({ timeout: 4000 });
    // Swap in the long address after the error so the link text shows it.
    await setValue(page, "#email", LONG_EMAIL);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForTimeout(1200);
    return { url: page.url().replace(BASE, "") };
  });
  // Sign up validation errors with nothing filled in (longest error copy at once).
  await run("signup all errors", "/signup", width, async (page) => {
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForTimeout(300);
  });
  // Log in with a long email and the wrong password.
  await run("login long email wrong password", "/login", width, async (page) => {
    await setValue(page, "#email", LONG_EMAIL);
    await page.locator("#password").fill("wrong-password");
    await page.getByRole("button", { name: "Show password" }).click();
    await page.getByRole("button", { name: "Log in" }).click();
    await page.getByRole("alert").waitFor({ timeout: 4000 });
  });
  // Password reset confirmation repeats the email inside a sentence.
  await run("reset long email", "/login", width, async (page) => {
    await page.getByRole("button", { name: "Forgot your password?" }).click();
    await setValue(page, "#reset-email", LONG_EMAIL);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await page.getByRole("heading", { name: "Check your email" }).waitFor({ timeout: 4000 });
  });
  // Brand kit: long brand name in the preview slide.
  await run("brand kit long name", "/brand-kit", width, async (page) => {
    await setValue(page, "#brand-name", LONG_BRAND);
    await page.locator("aside").scrollIntoViewIfNeeded();
  });
  // Create: a long prompt.
  await run("create long prompt", "/create", width, async (page) => {
    await setValue(page, "#prompt", LONG_PROMPT);
  });
  // Editor: a chat message with a long unbroken URL.
  await run("editor long chat message", "/editor", width, async (page) => {
    const input = page.getByLabel("Ask Mel for a change");
    await input.fill(LONG_WORD_MESSAGE);
    await input.press("Enter");
    await page.waitForTimeout(300);
    await input.scrollIntoViewIfNeeded();
  });
}

// Screenshot paths are left out of the printed summary; the files are in visual-check/worst-case.
console.log(JSON.stringify(results, (key, value) => (key === "file" ? undefined : value), 1));
await browser.close();
