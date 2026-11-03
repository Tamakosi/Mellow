// Visual check for Mellow: screenshots, flow videos, animation frames and an error report.
// Usage: npm run visual            (needs the dev server on http://localhost:3000)
//        BASE_URL=http://localhost:3001 npm run visual
// Output: visual-check/ (open visual-check/index.html to browse everything)
import { chromium } from "playwright";
import { mkdir, rm, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { existsSync, readdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("visual-check");
const SHOTS = path.join(OUT, "screens");
const VIDEOS = path.join(OUT, "flows");
const FRAMES = path.join(OUT, "frames");

const ROUTES = [
  ["landing", "/"],
  ["create", "/create"],
  ["outline", "/outline"],
  ["generate", "/generate"],
  ["editor", "/editor"],
  ["export", "/export"],
  ["mel", "/mel"],
  ["login", "/login"],
  ["signup", "/signup"],
  ["account", "/account"],
  ["settings", "/settings"],
  ["brand-kit", "/brand-kit"],
  ["not-found", "/this-page-does-not-exist"],
];
const SIZES = [
  ["phone", 320, 800],
  ["tablet", 768, 1024],
  ["desktop", 1440, 900],
];

/** Playwright's own Chromium when installed, otherwise Microsoft Edge (same engine, preinstalled on Windows). */
async function launch() {
  try {
    return await chromium.launch();
  } catch {
    console.log("Playwright Chromium not installed; using Microsoft Edge.");
    return chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" });
  }
}
// Video needs Playwright's ffmpeg download (npx playwright install ffmpeg).
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(process.env.LOCALAPPDATA || path.join(process.env.HOME || "", ".cache"), "ms-playwright");
const canRecord = existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("ffmpeg"));

const report = { base: BASE, startedAt: new Date().toISOString(), pages: [], flows: [], frames: [] };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Collects console errors, page crashes and failed requests for one page. */
function watch(page) {
  const problems = [];
  // The 404 page's own "not found" status is expected, so it isn't reported.
  const expected404 = (m) => m.text().includes("status of 404") && page.url().includes("this-page-does-not-exist");
  page.on("console", (m) => m.type() === "error" && !expected404(m) && problems.push(`console: ${m.text().slice(0, 200)}`));
  page.on("pageerror", (e) => problems.push(`crash: ${e.message.slice(0, 200)}`));
  page.on("response", (r) => r.status() >= 400 && !r.url().includes("this-page-does-not-exist") && problems.push(`${r.status()} ${r.url()}`));
  return problems;
}

/** Waits for fonts and for finite animations to finish, so screenshots show the settled page. */
async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
    const running = document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity && !(a.timeline instanceof (window.ViewTimeline || class {})));
    await Promise.race([Promise.all(running.map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 1500))]);
  });
}

/** Scrolls through the page so scroll-driven reveals have played, then returns to the top. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = innerHeight * 0.6;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
}

async function layoutFacts(page) {
  return page.evaluate(() => {
    const d = document.documentElement;
    const small = [...document.querySelectorAll("a, button, input, select, textarea, [role=switch]")]
      .filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden" && !el.closest("p, li"))
      .map((el) => [el, el.getBoundingClientRect()])
      .filter(([el, r]) => r.width > 2 && r.height > 2 && (r.height < 24 || r.width < 24) && !["checkbox", "radio", "color"].includes(el.type))
      .map(([el, r]) => `${Math.round(r.width)}x${Math.round(r.height)} ${(el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 30)}`);
    return { title: document.title, horizontalScroll: d.scrollWidth > d.clientWidth + 1, scrollWidth: d.scrollWidth, smallTargets: small.slice(0, 10) };
  });
}

async function screens(browser) {
  const variants = [
    ...SIZES.map(([name, width, height]) => ({ name, width, height, colorScheme: "light", reducedMotion: "no-preference" })),
    { name: "phone-dark", width: 375, height: 812, colorScheme: "dark", reducedMotion: "no-preference" },
    { name: "phone-reduced-motion", width: 375, height: 812, colorScheme: "light", reducedMotion: "reduce" },
  ];
  for (const v of variants) {
    const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, colorScheme: v.colorScheme, reducedMotion: v.reducedMotion, deviceScaleFactor: 1 });
    for (const [name, route] of ROUTES) {
      const page = await context.newPage();
      const problems = watch(page);
      await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
      await settle(page);
      await scrollThrough(page);
      await settle(page);
      const file = `${name}--${v.name}.png`;
      await page.screenshot({ path: path.join(SHOTS, file), fullPage: true });
      report.pages.push({ page: name, route, variant: v.name, file: `screens/${file}`, ...(await layoutFacts(page)), problems });
      await page.close();
      process.stdout.write(".");
    }
    await context.close();
  }
  process.stdout.write("\n");
}

/** Captures an element at several moments after an action, to check how an animation moves. */
async function frames(page, label, locator, act, times = [0, 80, 160, 300, 600, 1200]) {
  const start = Date.now();
  await act();
  for (const t of times) {
    const wait = t - (Date.now() - start);
    if (wait > 0) await page.waitForTimeout(wait);
    const file = `${slug(label)}--${String(t).padStart(4, "0")}ms.png`;
    await locator.screenshot({ path: path.join(FRAMES, file) });
    report.frames.push({ label, t, file: `frames/${file}` });
  }
}

const fill = async (page, selector, value) => page.locator(selector).fill(value);
const click = async (page, name, role = "button") => page.getByRole(role, { name, exact: true }).first().click();

const FLOWS = [
  [
    "Landing: ask Mel, then Meet Mel",
    async (page) => {
      await page.goto(BASE + "/");
      await settle(page);
      const mel = page.locator("#mel");
      await mel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await frames(page, "Mel answers a question", mel, () => mel.getByRole("button", { name: "Can you change a slide for me?" }).click());
      await page.waitForTimeout(800);
      await click(page, "Meet Mel", "link");
      await page.waitForURL("**/mel");
      await settle(page);
      await page.getByRole("button", { name: "What can Mellow make?" }).click();
      await page.waitForTimeout(1500);
      return page.url().endsWith("/mel");
    },
  ],
  [
    "Main flow: prompt to export",
    async (page) => {
      await page.goto(BASE + "/create");
      await settle(page);
      await fill(page, "#prompt", "A 10-slide pitch for a neighborhood bike repair co-op");
      await page.locator("form button[type=submit]").first().click();
      await page.waitForURL("**/outline");
      await settle(page);
      await page.locator('a[href="/generate"]').first().click();
      await page.waitForURL("**/generate");
      await page.locator('a[href="/editor"]').first().waitFor({ timeout: 45000 });
      await page.waitForTimeout(800);
      await page.locator('a[href="/editor"]').first().click();
      await page.waitForURL("**/editor");
      await settle(page);
      await page.getByRole("link", { name: /^share/i }).first().click();
      await page.waitForURL("**/export");
      await settle(page);
      return true;
    },
  ],
  [
    "Log in: wrong password, reset, success",
    async (page) => {
      await page.goto(BASE + "/login");
      await settle(page);
      await click(page, "Log in");
      await page.waitForTimeout(700);
      await fill(page, "#email", "me@example.com");
      await fill(page, "#password", "wrong-password");
      await click(page, "Log in");
      await page.getByRole("alert").waitFor();
      await page.waitForTimeout(1200);
      await click(page, "Forgot your password?");
      await click(page, "Send reset link");
      await page.getByRole("heading", { name: "Check your email" }).waitFor();
      await page.waitForTimeout(1000);
      await click(page, "Back to log in");
      await fill(page, "#password", "a-good-password");
      await click(page, "Log in");
      await page.waitForURL("**/create");
      return true;
    },
  ],
  [
    "Sign up: taken email, then success",
    async (page) => {
      await page.goto(BASE + "/signup");
      await settle(page);
      await click(page, "Create account");
      await page.waitForTimeout(900);
      await fill(page, "#name", "Ana Kusuma");
      await fill(page, "#email", "taken@example.com");
      await page.locator("#password").pressSequentially("calm-slides-1", { delay: 40 });
      await page.locator("#terms").check();
      await click(page, "Create account");
      await page.getByText("An account with this email already exists", { exact: false }).waitFor();
      await page.waitForTimeout(1200);
      await fill(page, "#email", "ana@example.com");
      await click(page, "Create account");
      await page.waitForURL("**/create");
      return true;
    },
  ],
  [
    "Profile: edit, discard, save",
    async (page) => {
      await page.goto(BASE + "/account");
      await settle(page);
      await fill(page, "#name", "Ana Kusuma");
      await page.waitForTimeout(800);
      await click(page, "Discard");
      await page.waitForTimeout(500);
      await fill(page, "#name", "");
      await click(page, "Save changes").catch(() => {});
      await fill(page, "#name", "Ana Kusuma");
      await page.locator("#role").selectOption("Founder");
      await click(page, "Save changes");
      await page.getByText("Changes saved.").waitFor();
      await page.waitForTimeout(3600);
      return true;
    },
  ],
  [
    "Settings: autosave, switch, delete dialog",
    async (page) => {
      await page.goto(BASE + "/settings");
      await settle(page);
      await page.locator("#pref-tone").selectOption("Formal");
      await page.waitForTimeout(900);
      const sw = page.getByRole("switch", { name: "Send product news" });
      await sw.scrollIntoViewIfNeeded();
      await frames(page, "Settings switch turns on", sw, () => sw.click(), [0, 50, 100, 150, 250]);
      await page.waitForTimeout(700);
      await click(page, "Delete account…");
      await page.waitForTimeout(500);
      await fill(page, "#confirm", "delete");
      await click(page, "Delete account");
      await page.waitForTimeout(1200);
      await click(page, "Keep my account");
      await page.waitForTimeout(600);
      return true;
    },
  ],
  [
    "Brand kit: faint colour, fix, save",
    async (page) => {
      await page.goto(BASE + "/brand-kit");
      await settle(page);
      await fill(page, "#brand-name", "Bike Co-op");
      await fill(page, "#hex-text", "#C8D0C9");
      await page.locator("#hex-text").scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      await fill(page, "#hex-text", "#1F2A24");
      await page.locator("#font-heading").selectOption("Georgia");
      await page.waitForTimeout(800);
      await click(page, "Save brand kit");
      await page.getByText("Changes saved.").waitFor();
      await page.waitForTimeout(1200);
      return true;
    },
  ],
];

async function flows(browser) {
  for (const [label, run] of FLOWS) {
    for (const [device, width, height] of [["desktop", 1280, 800], ["phone", 375, 812]]) {
      const dir = path.join(VIDEOS, "tmp");
      const context = await browser.newContext({ viewport: { width, height }, ...(canRecord ? { recordVideo: { dir, size: { width, height } } } : {}) });
      const page = await context.newPage();
      const problems = watch(page);
      let ok = false;
      let error = "";
      try {
        ok = await run(page);
      } catch (e) {
        error = e.message.split("\n")[0].slice(0, 300);
      }
      // Without the video encoder, keep a screenshot of where the flow ended instead.
      const file = `${slug(label)}--${device}.${canRecord ? "webm" : "png"}`;
      if (!canRecord) await page.screenshot({ path: path.join(VIDEOS, file) }).catch(() => {});
      const video = canRecord ? await page.video().path() : null;
      await context.close();
      if (video) await rename(video, path.join(VIDEOS, file));
      report.flows.push({ flow: label, device, passed: ok && !error, error, problems, file: `flows/${file}` });
      process.stdout.write(ok && !error ? "✓" : "✗");
      if (device === "phone") process.stdout.write(" ");
    }
  }
  await rm(path.join(VIDEOS, "tmp"), { recursive: true, force: true });
  process.stdout.write("\n");
}

function gallery() {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const pages = [...new Set(report.pages.map((p) => p.page))];
  const flagged = (p) => p.horizontalScroll || p.problems.length || p.smallTargets.length;
  const pageRows = pages
    .map((name) => {
      const shots = report.pages.filter((p) => p.page === name);
      return `<section><h2>${esc(name)} <code>${esc(shots[0].route)}</code></h2><div class="row">${shots
        .map(
          (s) => `<figure class="${flagged(s) ? "flag" : ""}"><a href="${s.file}" target="_blank"><img loading="lazy" src="${s.file}" alt="${esc(name)} at ${esc(s.variant)}"></a>
          <figcaption><b>${esc(s.variant)}</b>${s.horizontalScroll ? `<br>⚠ sideways scroll (${s.scrollWidth}px)` : ""}${s.problems.map((x) => `<br>⚠ ${esc(x)}`).join("")}${
            s.smallTargets.length ? `<br>small targets: ${s.smallTargets.map(esc).join(", ")}` : ""
          }</figcaption></figure>`,
        )
        .join("")}</div></section>`;
    })
    .join("");
  const flowRows = report.flows
    .map((f) => `<figure class="${f.passed ? "" : "flag"}">${f.file.endsWith(".png") ? `<img src="${f.file}" alt="End of ${esc(f.flow)}">` : `<video src="${f.file}" controls muted preload="metadata"></video>`}<figcaption><b>${f.passed ? "✓" : "✗"} ${esc(f.flow)}</b> · ${f.device}${f.error ? `<br>⚠ ${esc(f.error)}` : ""}${f.problems.map((x) => `<br>⚠ ${esc(x)}`).join("")}</figcaption></figure>`)
    .join("");
  const frameGroups = [...new Set(report.frames.map((f) => f.label))]
    .map((label) => `<h3>${esc(label)}</h3><div class="strip">${report.frames.filter((f) => f.label === label).map((f) => `<figure><img src="${f.file}" alt="${esc(label)} at ${f.t}ms"><figcaption>${f.t} ms</figcaption></figure>`).join("")}</div>`)
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mellow visual check</title>
<style>
:root{--ground:#f4f6f2;--surface:#fff;--ink:#1f2a24;--muted:#56635a;--line:#e3e8df;--danger:#a3332b}
body{margin:0;background:var(--ground);color:var(--ink);font:15px/1.5 system-ui,sans-serif}main{max-width:1600px;margin:0 auto;padding:24px 16px}
h1{margin:0}h2{margin:32px 0 12px;font-size:1.25rem}code{font-size:.85em;color:var(--muted)}.meta{color:var(--muted)}
.row{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:12px;align-items:start}
.strip{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px}.strip img{max-height:220px}
figure{margin:0;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:8px}figure.flag{border:2px solid var(--danger)}
img,video{display:block;max-width:100%;border-radius:8px}.row img{max-height:520px;object-fit:cover;object-position:top;width:100%}
figcaption{font-size:13px;color:var(--muted);margin-top:6px;overflow-wrap:anywhere}figcaption b{color:var(--ink)}
.flows{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr));gap:12px}
</style></head><body><main><h1>Mellow visual check</h1>
<p class="meta">${esc(report.base)} · ${esc(report.startedAt)} · ${report.pages.length} screenshots · ${report.flows.filter((f) => f.passed).length}/${report.flows.length} flows passed · red border = something to look at</p>
<h2>Flows (video)</h2><div class="flows">${flowRows}</div>
<h2>Animation frames</h2>${frameGroups}
${pageRows}</main></body></html>`;
}

await rm(OUT, { recursive: true, force: true });
for (const dir of [SHOTS, VIDEOS, FRAMES]) await mkdir(dir, { recursive: true });
const browser = await launch();
try {
  console.log(`Screenshots of ${ROUTES.length} pages in 5 variants`);
  await screens(browser);
  console.log(`Recording ${FLOWS.length} flows on desktop and phone`);
  await flows(browser);
} finally {
  await browser.close();
}
report.finishedAt = new Date().toISOString();
await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
await writeFile(path.join(OUT, "index.html"), gallery());
const failed = report.flows.filter((f) => !f.passed);
const flaggedPages = report.pages.filter((p) => p.horizontalScroll || p.problems.length);
console.log(`Done: ${report.pages.length} screenshots, ${report.flows.length - failed.length}/${report.flows.length} flows passed, ${flaggedPages.length} screenshots with errors or sideways scroll.`);
for (const f of failed) console.log(`  ✗ ${f.flow} (${f.device}): ${f.error}`);
for (const p of flaggedPages) console.log(`  ⚠ ${p.page} ${p.variant}: ${p.horizontalScroll ? "sideways scroll " : ""}${p.problems.join("; ")}`);
console.log(`Open ${path.join(OUT, "index.html")}`);
