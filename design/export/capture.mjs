// Drives the running Mellow app into every screen state and measures it for the FigCraft export.
// Usage: node design/export/capture.mjs [key ...]   (needs the app on BASE_URL, default http://localhost:3100)
// Output: design/export/captures/<key>.json (layer tree) and design/export/shots/<key>.png (reference screenshot)
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3100";
const CAPTURE = readFileSync(path.join(here, "capture.js"), "utf8");
mkdirSync(path.join(here, "captures"), { recursive: true });
mkdirSync(path.join(here, "shots"), { recursive: true });

// The icon table, read from the app's own Icon paths, so captured SVGs are named after their icon.
const ui = readFileSync(path.join(here, "../../components/ui.tsx"), "utf8");
const block = ui.slice(ui.indexOf("const PATHS = {"), ui.indexOf("} as const;"));
const ICONS = Object.fromEntries([...block.matchAll(/(?:"([\w-]+)"|(\w+)):\s*\n?\s*"([^"]+)"/g)].map((m) => [m[3], m[1] || m[2]]));

const byRole = (page, role, name) => page.getByRole(role, { name, exact: true }).first();
const click = (page, name, role = "button") => byRole(page, role, name).click();
const wait = (page, ms) => page.waitForTimeout(ms);

// key, frame name, route, then what to do on the page. `viewport: true` keeps the frame to one screen (dialogs).
const DESKTOP = [
  ["landing", "Landing", "/"],
  ["landing-mel", "Landing · Mel answers", "/", async (p) => { await p.locator("#mel").getByRole("button", { name: "Can you change a slide for me?" }).click(); await wait(p, 2500); }],
  ["mel", "Meet Mel", "/mel"],
  ["mel-answer", "Meet Mel · Answer", "/mel", async (p) => { await click(p, "What can Mellow make?"); await wait(p, 2500); }],
  ["login", "Log in", "/login"],
  ["login-errors", "Log in · Missing details", "/login", async (p) => { await click(p, "Log in"); await wait(p, 600); }],
  ["login-wrong", "Log in · Wrong password", "/login", async (p) => { await p.fill("#email", "ana@example.com"); await p.fill("#password", "wrong-password"); await click(p, "Log in"); await p.getByRole("alert").waitFor(); await wait(p, 300); }],
  ["login-reset", "Reset password", "/login", async (p) => { await p.fill("#email", "ana@example.com"); await click(p, "Forgot your password?"); await wait(p, 300); }],
  ["login-sent", "Reset password · Check your email", "/login", async (p) => { await p.fill("#email", "ana@example.com"); await click(p, "Forgot your password?"); await click(p, "Send reset link"); await p.getByRole("heading", { name: "Check your email" }).waitFor(); await wait(p, 300); }],
  ["signup", "Sign up", "/signup"],
  ["signup-errors", "Sign up · Missing details", "/signup", async (p) => { await click(p, "Create account"); await wait(p, 600); }],
  ["signup-taken", "Sign up · Email already used", "/signup", async (p) => { await p.fill("#name", "Ana Kusuma"); await p.fill("#email", "taken@example.com"); await p.fill("#password", "calm-slides-1"); await p.locator("#terms").check(); await click(p, "Create account"); await p.getByText("An account with this email already exists", { exact: false }).waitFor(); await wait(p, 300); }],
  ["create", "Create", "/create"],
  ["create-error", "Create · Empty prompt", "/create", async (p) => { await p.fill("#prompt", ""); await p.locator("form button[type=submit]").first().click(); await wait(p, 300); await p.locator("#prompt").blur(); }],
  ["create-paste", "Create · Paste an outline", "/create", async (p) => { await p.getByRole("button", { name: /^Paste an outline/ }).click(); await wait(p, 400); }],
  ["create-menu", "Create · Account menu", "/create", async (p) => { await click(p, "Account"); await wait(p, 300); }],
  ["create-askmel", "Create · Ask Mel", "/create", async (p) => { await click(p, "Ask Mel"); await wait(p, 400); }],
  ["outline", "Outline", "/outline"],
  ["generate", "Generate · Writing", "/generate"],
  ["generate-done", "Generate · Ready", "/generate", async (p) => { await p.getByText("All 10 slides are written", { exact: false }).waitFor({ timeout: 30000 }); await wait(p, 600); }],
  ["editor", "Editor", "/editor"],
  ["editor-layout", "Editor · Layout menu", "/editor", async (p) => { await click(p, "Layout"); await wait(p, 300); }],
  ["editor-quiz", "Editor · Quiz slide added", "/editor", async (p) => { await click(p, "Add a quick quiz slide"); await wait(p, 2500); }],
  ["editor-present", "Editor · Present", "/editor", async (p) => { await click(p, "Present"); await wait(p, 600); }, { viewport: true }],
  ["export", "Share or export", "/export"],
  ["export-copied", "Share or export · Link copied", "/export", async (p) => { await click(p, "Copy link"); await wait(p, 400); }],
  ["account", "Profile", "/account"],
  ["account-dirty", "Profile · Unsaved changes", "/account", async (p) => { await p.fill("#name", "Ana Kusuma"); await wait(p, 300); await p.locator("#name").blur(); }],
  ["account-saved", "Profile · Saved", "/account", async (p) => { await p.fill("#name", "Ana Kusuma"); await click(p, "Save changes"); await p.getByText("Changes saved.").waitFor(); await wait(p, 200); }],
  ["settings", "Settings", "/settings"],
  ["settings-delete", "Settings · Delete account", "/settings", async (p) => { await click(p, "Delete account…"); await wait(p, 500); }, { viewport: true }],
  ["brand-kit", "Brand kit", "/brand-kit"],
  ["brand-kit-contrast", "Brand kit · Low contrast", "/brand-kit", async (p) => { await p.fill("#hex-text", "#C8D0C9"); await wait(p, 400); await p.locator("#hex-text").blur(); }],
  ["not-found", "Page not found", "/this-page-does-not-exist"],
];
const MOBILE = [
  ["m-landing", "Landing", "/"],
  ["m-mel", "Meet Mel", "/mel"],
  ["m-login", "Log in", "/login"],
  ["m-signup", "Sign up", "/signup"],
  ["m-create", "Create", "/create"],
  ["m-outline", "Outline", "/outline"],
  ["m-generate", "Generate · Writing", "/generate"],
  ["m-editor", "Editor", "/editor"],
  ["m-export", "Share or export", "/export"],
  ["m-account", "Profile", "/account"],
  ["m-settings", "Settings", "/settings"],
  ["m-brand-kit", "Brand kit", "/brand-kit"],
  ["m-not-found", "Page not found", "/this-page-does-not-exist"],
];

const only = process.argv.slice(2);
const job = (r, width, height) => ({ key: r[0], name: r[1], route: r[2], act: r[3], opts: r[4] || {}, width, height });
const jobs = [...DESKTOP.map((r) => job(r, 1440, 900)), ...MOBILE.map((r) => job(r, 375, 812))].filter((j) => !only.length || only.includes(j.key));

const browser = await chromium.launch().catch(() => chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge" }));
const summary = [];
for (const { key, name, route, act, opts, width, height } of jobs) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light" });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const fit = async () => {
    if (opts.viewport) return;
    for (let i = 0; i < 3; i++) {
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      const cur = page.viewportSize().height;
      if (h <= cur || Math.abs(h - cur) < 1) break;
      await page.setViewportSize({ width, height: h });
      await wait(page, 150);
    }
  };
  await fit();
  if (act) await act(page);
  await fit();
  await page.evaluate(() => { window.scrollTo(0, 0); document.getAnimations().forEach((a) => { try { a.finish(); } catch { a.cancel(); } }); });
  await page.addScriptTag({ content: `window.__ICONS = ${JSON.stringify(ICONS)};\n${CAPTURE}` });
  const result = await page.evaluate((n) => window.__capture(n), name);
  result.frame.key = key;
  result.frame.device = width < 768 ? "mobile" : "desktop";
  if (opts.viewport) result.frame.absoluteBoundingBox.height = height;
  writeFileSync(path.join(here, "captures", key + ".json"), JSON.stringify(result.frame));
  await page.screenshot({ path: path.join(here, "shots", key + ".png"), fullPage: false });
  summary.push(`${key}: ${result.nodes} layers, ${Math.round(result.frame.absoluteBoundingBox.width)}×${Math.round(result.frame.absoluteBoundingBox.height)}${errors.length ? " errors: " + errors.join(" | ").slice(0, 200) : ""}`);
  console.log(summary[summary.length - 1]);
  await context.close();
}
await browser.close();
