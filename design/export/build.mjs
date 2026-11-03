// Turns the captures into one Figma REST-style file that FigCraft opens:
// "Design system" (variables, styles, icons, components), "Screens" (desktop and phone, 1:1) and "Prototype" (wired).
// Usage: node design/export/build.mjs   -> design/export/out/Mellow.json and Mellow.variables.json
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "./spec.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "out");
mkdirSync(outDir, { recursive: true });
const caps = Object.fromEntries(readdirSync(path.join(here, "captures")).map((f) => { const c = JSON.parse(readFileSync(path.join(here, "captures", f), "utf8")); return [c.key, c]; }));
const css = readFileSync(path.join(here, "../../app/globals.css"), "utf8");

const r2 = (v) => Math.round(v * 100) / 100;
const hexToRgb = (h) => { const s = h.replace("#", ""); return { r: parseInt(s.slice(0, 2), 16) / 255, g: parseInt(s.slice(2, 4), 16) / 255, b: parseInt(s.slice(4, 6), 16) / 255, a: 1 }; };
const hex6 = (c) => [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const solid = (c, opacity) => ({ type: "SOLID", color: { ...c, a: 1 }, ...(opacity != null && opacity < 1 ? { opacity } : {}) });
const walk = (n, fn, parent) => { fn(n, parent); (n.children || []).forEach((c) => walk(c, fn, n)); };
const clone = (n) => structuredClone(n);
const shift = (n, dx, dy) => walk(n, (m) => { m.absoluteBoundingBox.x = r2(m.absoluteBoundingBox.x + dx); m.absoluteBoundingBox.y = r2(m.absoluteBoundingBox.y + dy); });
let counter = 0;
const ids = (n, page) => walk(n, (m) => { m.id = `${page}:${++counter}`; });

// ---------- tokens from the app's CSS ----------
const COLORS = Object.fromEntries([...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6});/g)].map((m) => [m[1], m[2].toUpperCase()]));
COLORS.white = "#FFFFFF";
const SHADOWS = Object.fromEntries([...css.matchAll(/--shadow-([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const parseShadow = (v) => v.split(/\),\s*/).map((p) => (p.endsWith(")") ? p : p + ")")).map((p) => { const n = p.match(/(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(-?\d+)(?:px)?/); const c = p.match(/rgba?\(([^)]+)\)/)[1].split(/[\s,]+/).map(Number); return { type: "DROP_SHADOW", visible: true, color: { r: c[0] / 255, g: c[1] / 255, b: c[2] / 255, a: c[3] ?? 1 }, offset: { x: +n[1], y: +n[2] }, radius: +n[3], spread: 0, blendMode: "NORMAL" }; });
const EFFECTS = { "Shadow/xs": parseShadow(SHADOWS.xs), "Shadow/soft": parseShadow(SHADOWS.soft), "Shadow/pop": parseShadow(SHADOWS.pop) };

// ---------- variables ----------
const VC = { color: "VariableCollectionId:1", size: "VariableCollectionId:2", motion: "VariableCollectionId:3" };
const variables = {}, collections = {};
let vid = 0;
const collection = (id, name, modeName) => (collections[id] = { id, key: id, name, modes: [{ modeId: id + "/mode1", name: modeName }], defaultModeId: id + "/mode1", variableIds: [], remote: false, hiddenFromPublishing: false });
collection(VC.color, "Mellow colour", "Light");
collection(VC.size, "Mellow size", "Default");
collection(VC.motion, "Mellow motion", "Default");
const addVar = (col, name, type, value, extra = {}) => {
  const id = `VariableID:${++vid}`;
  variables[id] = { id, key: id, name, resolvedType: type, valuesByMode: { [col + "/mode1"]: value }, variableCollectionId: col, scopes: ["ALL_SCOPES"], codeSyntax: {}, description: "", remote: false, hiddenFromPublishing: false, ...extra };
  collections[col].variableIds.push(id);
  return id;
};
const colorVar = {};
for (const [group, keys] of S.COLOR_GROUPS) for (const k of keys) colorVar[k] = addVar(VC.color, `${group}/${k}`, "COLOR", hexToRgb(COLORS[k]), { description: S.COLOR_NOTES[k] || "", codeSyntax: { WEB: `var(--color-${k})` }, scopes: ["ALL_SCOPES"] });
const sizeVar = { space: {}, radius: {} };
for (const s of S.SPACE) sizeVar.space[s] = addVar(VC.size, `space/${s}`, "FLOAT", s, { scopes: ["GAP", "WIDTH_HEIGHT"] });
for (const [n, v] of S.RADIUS) sizeVar.radius[v] = addVar(VC.size, `radius/${n}`, "FLOAT", v, { scopes: ["CORNER_RADIUS"], description: `${v === 9999 ? "rounded-full" : v + "px"}` });
for (const [n, v, note] of S.MOTION) addVar(VC.motion, `duration/${n}`, "FLOAT", v, { description: `${v}ms · ${note}`, codeSyntax: { WEB: `var(--${n})` } });
for (const [n, v, note] of S.EASING) addVar(VC.motion, `easing/${n}`, "STRING", v, { description: note, codeSyntax: { WEB: `var(--${n})` } });
const varsJson = { status: 200, error: false, meta: { variableCollections: collections, variables } };

// ---------- styles ----------
const styles = {};
const TEXT_STYLES = S.TYPE.map(([name, weight, size, lh, ls, tcase, note], i) => {
  const id = "S:t" + (i + 1);
  styles[id] = { key: "mellow-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, styleType: "TEXT", description: `Figtree ${weight} · ${size}/${lh}${ls ? " · " + ls + "px" : ""}${tcase ? " · uppercase" : ""} — ${note}` };
  return { id, name, weight, size, lh, ls, tcase, note };
});
const EFFECT_STYLES = Object.entries(EFFECTS).map(([name, effects], i) => {
  const id = "S:e" + (i + 1);
  styles[id] = { key: "mellow-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, styleType: "EFFECT", description: { "Shadow/xs": "Current step, small lifts", "Shadow/soft": "Cards and panels", "Shadow/pop": "Menus, dialogs, save bar" }[name] };
  return { id, name, effects, key: effects.map((e) => [hex6(e.color), Math.round(e.color.a * 100), e.offset.x, e.offset.y, e.radius].join()).join("|") };
});

// ---------- canvas helpers ----------
const INK = hexToRgb(COLORS.ink), MUTED = hexToRgb(COLORS.muted), LINE = hexToRgb(COLORS.line), SURFACE = hexToRgb(COLORS.surface);
const text = (chars, x, y, size, weight = 400, color = INK, extra = {}) => ({
  type: "TEXT", name: extra.name || chars.slice(0, 40), characters: chars, absoluteBoundingBox: { x, y, width: extra.width || 400, height: Math.round(size * 1.4) },
  style: { fontFamily: extra.family || "Figtree", fontWeight: weight, fontSize: size, lineHeightPx: extra.lh || Math.round(size * 1.4), lineHeightUnit: "PIXELS", letterSpacing: extra.ls || 0, textAlignHorizontal: extra.align || "LEFT", textAlignVertical: "TOP", textAutoResize: extra.width ? "HEIGHT" : "WIDTH_AND_HEIGHT", textCase: extra.tcase || undefined },
  fills: [solid(color)],
});
const frame = (name, x, y, w, h, fills = [], children = [], extra = {}) => ({ type: "FRAME", name, absoluteBoundingBox: { x, y, width: w, height: h }, fills, clipsContent: false, children, ...extra });
const rect = (name, x, y, w, h, fills, extra = {}) => ({ type: "RECTANGLE", name, absoluteBoundingBox: { x, y, width: w, height: h }, fills, ...extra });
const card = (name, x, y, w, h, children = []) => frame(name, x, y, w, h, [solid(SURFACE)], children, { cornerRadius: 20, strokes: [solid(LINE)], strokeWeight: 1, strokeAlign: "INSIDE" });

// ---------- component discovery ----------
const sig = (n) => (n.type === "TEXT" ? "T" : n.type === "VECTOR" ? "V" : n.type === "RECTANGLE" ? "R" : n.type === "ELLIPSE" ? "E" : "F") + (n.children && n.children.length ? "[" + n.children.map(sig).join(",") + "]" : "");
const DESKTOP_KEYS = S.ROWS.flatMap((r) => r.keys), MOBILE_KEYS = S.MOBILE_ROW.keys;
const occurrences = new Map(S.COMPONENTS.map((c) => [c.name, []]));
const iconOcc = new Map();
const pickSpec = (n) => (n.type === "FRAME" ? S.COMPONENTS.find((c) => { try { return c.pick(n); } catch { return false; } }) : null);
for (const key of [...DESKTOP_KEYS, ...MOBILE_KEYS]) {
  const visit = (n) => {
    const spec = pickSpec(n);
    if (spec) { occurrences.get(spec.name).push({ n, key, value: spec.value ? spec.value(n) : "Default", sig: sig(n) }); return; }
    if (n.svgKey) { if (!iconOcc.has(n.svgKey)) iconOcc.set(n.svgKey, []); iconOcc.get(n.svgKey).push({ n, key, sig: sig(n) }); return; }
    (n.children || []).forEach(visit);
  };
  caps[key].children.forEach(visit);
}
// One master per spec value: the most common structure, measured on a desktop screen where there is one.
const masters = [];
for (const spec of S.COMPONENTS) {
  const occ = occurrences.get(spec.name);
  const byValue = new Map();
  for (const o of occ) { if (!byValue.has(o.value)) byValue.set(o.value, []); byValue.get(o.value).push(o); }
  for (const [value, list] of byValue) {
    const counts = new Map();
    list.forEach((o) => counts.set(o.sig, (counts.get(o.sig) || 0) + 1));
    // The most common structure is the variant; another structure used at least twice becomes "<value> 2", "<value> 3"…
    const sigs = [...counts].sort((a, b) => b[1] - a[1]).filter(([, c], i) => i === 0 || (spec.prop && c >= 2));
    sigs.forEach(([s, uses], i) => {
      // The narrowest desktop example, so a button master hugs its label rather than copying a full-width button.
      const same = list.filter((o) => o.sig === s), desk = same.filter((o) => !o.key.startsWith("m-"));
      const src = (desk.length ? desk : same).reduce((a, o) => (o.n.absoluteBoundingBox.width < a.n.absoluteBoundingBox.width ? o : a));
      const suffix = !i ? "" : !desk.length ? " · Phone" : " " + (i + 1);
      masters.push({ spec, value: value + suffix, matchValue: value, sig: s, src, uses });
    });
  }
}
const iconMasters = [...iconOcc].map(([key, list]) => {
  const counts = new Map();
  list.forEach((o) => counts.set(o.sig, (counts.get(o.sig) || 0) + 1));
  const best = [...counts].sort((a, b) => b[1] - a[1])[0][0];
  return { key, sig: best, src: list.find((o) => o.sig === best && !o.key.startsWith("m-")) || list.find((o) => o.sig === best), uses: list.length };
});
const iconName = (key) => {
  const [nm, rest] = key.split("@");
  const [size, stroke] = rest.split("/");
  const same = iconMasters.filter((m) => m.key.startsWith(nm + "@" + size + "/")).length;
  const base = nm.startsWith("icon/") ? "Icon/" + nm.slice(5) : nm;
  return `${base}/${size}${stroke && same > 1 ? " · " + stroke : ""}`;
};

// ---------- auto layout for simple flex rows ----------
const FIT = 1.25;
const autoLayout = (n) => {
  const f = n.flex;
  if (!f || f.wrap || !f.inflow || !(n.children || []).length) return null;
  const kids = n.children.filter((c) => c.name !== "outline");
  if (kids.length !== n.children.length) return null;
  const b = n.absoluteBoundingBox, H = f.dir === "H";
  const [pt, pr, pb, pl] = f.pad.map((p, i) => p + f.border[i]);
  // With an even border the stroke takes part in the layout and padding is the CSS padding; otherwise padding includes the border.
  const evenBorder = f.border.every((w) => w === f.border[0]) && f.border[0] > 0 && n.strokeWeight === f.border[0] && !n.individualStrokeWeights;
  const main = (c) => (H ? c.absoluteBoundingBox.x : c.absoluteBoundingBox.y), size = (c) => (H ? c.absoluteBoundingBox.width : c.absoluteBoundingBox.height);
  const cross = (c) => (H ? c.absoluteBoundingBox.y : c.absoluteBoundingBox.x), csize = (c) => (H ? c.absoluteBoundingBox.height : c.absoluteBoundingBox.width);
  const sorted = [...kids].sort((a, c) => main(a) - main(c));
  if (sorted.some((c, i) => c !== kids[i])) return null;
  const start = H ? b.x + pl : b.y + pt, end = H ? b.x + b.width - pr : b.y + b.height - pb;
  const cStart = H ? b.y + pt : b.x + pl, cEnd = H ? b.y + b.height - pb : b.x + b.width - pr;
  const total = kids.reduce((s, c) => s + size(c), 0) + f.gap * (kids.length - 1);
  const jc = /center/.test(f.jc) ? "CENTER" : /end/.test(f.jc) ? "MAX" : /space-between/.test(f.jc) ? "SPACE_BETWEEN" : "MIN";
  const ai = /center/.test(f.ai) ? "CENTER" : /end/.test(f.ai) ? "MAX" : "MIN";
  // Where auto layout would put each child; reject the frame unless every child is already there.
  let pos = jc === "CENTER" ? start + (end - start - total) / 2 : jc === "MAX" ? end - total : start;
  for (const c of kids) {
    if (jc !== "SPACE_BETWEEN" && Math.abs(main(c) - pos) > FIT) return null;
    pos += size(c) + f.gap;
    const want = ai === "CENTER" ? cStart + (cEnd - cStart - csize(c)) / 2 : ai === "MAX" ? cEnd - csize(c) : cStart;
    if (Math.abs(cross(c) - want) > FIT) return null;
  }
  const hugMain = Math.abs(total - (end - start)) <= FIT, hugCross = Math.abs(Math.max(...kids.map(csize)) - (cEnd - cStart)) <= FIT;
  return {
    layoutMode: H ? "HORIZONTAL" : "VERTICAL", itemSpacing: f.gap, ...(evenBorder ? { paddingTop: f.pad[0], paddingRight: f.pad[1], paddingBottom: f.pad[2], paddingLeft: f.pad[3] } : { paddingTop: pt, paddingRight: pr, paddingBottom: pb, paddingLeft: pl }),
    primaryAxisAlignItems: jc, counterAxisAlignItems: ai, primaryAxisSizingMode: hugMain ? "AUTO" : "FIXED", counterAxisSizingMode: hugCross ? "AUTO" : "FIXED",
    layoutSizingHorizontal: (H ? hugMain : hugCross) ? "HUG" : "FIXED", layoutSizingVertical: (H ? hugCross : hugMain) ? "HUG" : "FIXED", strokesIncludedInLayout: evenBorder,
  };
};
const applyLayout = (n, deep) => {
  const al = autoLayout(n);
  if (al) {
    Object.assign(n, al);
    n.children.forEach((c) => { c.layoutAlign = "INHERIT"; c.layoutGrow = 0; c.layoutSizingHorizontal = c.type === "TEXT" && c.style.textAutoResize === "WIDTH_AND_HEIGHT" ? "HUG" : "FIXED"; c.layoutSizingVertical = c.type === "TEXT" ? "HUG" : "FIXED"; });
  }
  if (deep) (n.children || []).forEach((c) => c.type === "FRAME" && applyLayout(c, deep));
  return !!al;
};

// ---------- design system page ----------
const dsNodes = [];
const componentsMeta = {}, componentSets = {};
let y = 0;
const heading = (t, sub) => { dsNodes.push(text(t, 0, y, 32, 600, INK, { ls: -0.8, lh: 40 })); if (sub) dsNodes.push(text(sub, 0, y + 50, 16, 400, MUTED, { width: 1100, lh: 24 })); y += sub ? 110 : 64; };
dsNodes.push(text("Mellow design system", 0, y, 56, 600, INK, { ls: -1.4, lh: 64 }));
dsNodes.push(text("Variables, styles, icons and components of Mellow, the calm slide maker. Everything here is measured from the running Next.js app. Colours are variables (“Mellow colour”), spacing and radius are variables (“Mellow size”), text and shadows are styles, and the Screens and Prototype pages are built from these components.", 0, y + 80, 18, 400, MUTED, { width: 1200, lh: 28 }));
y += 200;

// Colour swatches, each bound to its variable.
heading("Colour", "Collection “Mellow colour”, mode Light. Every swatch is bound to its variable; the code name is the CSS custom property in app/globals.css.");
for (const [group, keys] of S.COLOR_GROUPS) {
  dsNodes.push(text(group, 0, y, 18, 600, INK));
  y += 40;
  keys.forEach((k, i) => {
    const x = i * 252;
    const sw = card("swatch/" + k, x, y, 236, 176);
    sw.clipsContent = true;
    const chip = rect("colour/" + k, x, y, 236, 96, [solid(hexToRgb(COLORS[k]))]);
    chip.fills[0].boundVariables = { color: { type: "VARIABLE_ALIAS", id: colorVar[k] } };
    sw.children.push(chip, text(k, x + 16, y + 108, 15, 600, INK), text(`${COLORS[k]} · --color-${k}`, x + 16, y + 130, 12, 400, MUTED), text(S.COLOR_NOTES[k] || "", x + 16, y + 148, 12, 400, MUTED, { width: 204 }));
    dsNodes.push(sw);
  });
  y += 176 + 40;
}

// Typography specimens carry the text styles (FigCraft defines each style from its first specimen).
heading("Typography", "Figtree, the app's only typeface (Regular 400, Medium 500, SemiBold 600, Bold 700). Each specimen is a text style.");
const sampleFor = (ts) => {
  // Display headlines wrap around a highlighted word in the app, so they get their whole sentence here.
  const WHOLE = { "Display/Hero": "From one sentence to a deck", "Display/Page": "What are we presenting today?" };
  if (WHOLE[ts.name]) return WHOLE[ts.name];
  // The longest single line of real copy in that style.
  let best = "";
  for (const key of DESKTOP_KEYS) walk(caps[key], (n) => {
    if (n.type === "TEXT" && !n.characterStyleOverrides && !n.characters.includes("\n") && n.characters.length > best.length && n.characters.length <= (ts.size > 30 ? 34 : 64) && n.style.fontWeight === ts.weight && n.style.fontSize === ts.size && Math.abs(n.style.lineHeightPx - ts.lh) < 0.6 && Math.abs((n.style.letterSpacing || 0) - ts.ls) < 0.05 && (n.style.textCase || null) === ts.tcase) best = n.characters;
  });
  return best || ts.name;
};
for (const ts of TEXT_STYLES) {
  dsNodes.push(text(ts.name, 0, y + 4, 14, 600, INK), text(styles[ts.id].description.split(" — ")[0], 0, y + 26, 12, 400, MUTED, { width: 300 }));
  const t = text(sampleFor(ts), 340, y, ts.size, ts.weight, INK, { lh: ts.lh, ls: ts.ls, tcase: ts.tcase || undefined, name: "Type/" + ts.name });
  t.styles = { text: ts.id };
  dsNodes.push(t, text(ts.note, 1500, y + 4, 13, 400, MUTED));
  y += Math.max(ts.lh, 44) + 24;
}
y += 40;

// Spacing, radius, elevation, motion.
heading("Spacing", "Collection “Mellow size”. Tailwind's 4px scale: page gutter 24 to 40, card padding 16 to 24, gaps 8 to 16.");
S.SPACE.forEach((s, i) => { dsNodes.push(text(`space/${s}`, 0, y + i * 36 + 2, 13, 600, MUTED), rect("space/" + s, 120, y + i * 36 + 4, s * 6, 18, [solid(hexToRgb(COLORS.accent))], { cornerRadius: 4 }), text(`${s}px`, 130 + s * 6, y + i * 36 + 2, 13, 400, MUTED)); });
y += S.SPACE.length * 36 + 48;
heading("Corner radius", "Inputs 16, cards 20 to 22, panels and dialogs 28, buttons and chips fully rounded.");
S.RADIUS.forEach(([n, r], i) => { const x = i * 176; dsNodes.push(rect("radius/" + n, x, y, 148, 100, [solid(hexToRgb(COLORS["accent-tint"]))], { cornerRadius: Math.min(r, 50), strokes: [solid(hexToRgb(COLORS["accent-deep"]))], strokeWeight: 2, strokeAlign: "INSIDE" }), text(`radius/${n}`, x, y + 112, 13, 600, INK), text(r === 9999 ? "9999 (full)" : r + "px", x, y + 132, 12, 400, MUTED)); });
y += 190;
heading("Elevation", "Three effect styles from the --shadow tokens.");
EFFECT_STYLES.forEach((es, i) => { const x = i * 360; const c = frame(es.name, x, y, 320, 150, [solid(SURFACE)], [], { cornerRadius: 22, effects: clone(es.effects), styles: { effect: es.id } }); dsNodes.push(c, text(es.name, x, y + 170, 14, 600, INK), text(styles[es.id].description + " · " + SHADOWS[es.name.split("/")[1]], x, y + 192, 12, 400, MUTED, { width: 320 })); });
y += 300;
heading("Motion", "Collection “Mellow motion”. Frequent actions stay instant; everything collapses to a fade with reduced motion.");
[...S.MOTION.map(([n, v, note]) => [`duration/${n}`, `${v}ms`, note]), ...S.EASING.map(([n, v, note]) => [`easing/${n}`, v, note])].forEach(([n, v, note], i) => { dsNodes.push(text(n, 0, y + i * 34, 14, 600, INK), text(v, 300, y + i * 34, 14, 400, INK), text(note, 640, y + i * 34, 14, 400, MUTED)); });
y += 5 * 34 + 70;

// Icons and Mel: one component per icon, size and stroke as used in the app.
heading("Icons and Mel", "Line icons on a 24px grid (stroke 1.8 to 3), one component per size in use. Mel, the help mascot, has four moods.");
const iconIdByKey = {};
{
  const list = [...iconMasters].sort((a, b) => iconName(a.key).localeCompare(iconName(b.key), "en", { numeric: true }));
  const icons = list.filter((m) => !m.key.startsWith("Mel/")), mels = list.filter((m) => m.key.startsWith("Mel/"));
  const place = (m, x, yy, tw, th) => {
    const tile = frame("tile/" + iconName(m.key), x, yy, tw, th, [solid(SURFACE)], [], { cornerRadius: 16, strokes: [solid(LINE)], strokeWeight: 1, strokeAlign: "INSIDE" });
    const c = clone(m.src.n), b = c.absoluteBoundingBox;
    shift(c, x + (tw - b.width) / 2 - b.x, yy + (th - 26 - b.height) / 2 - b.y);
    if (!m.key.startsWith("Mel/")) walk(c, (v) => { if (v.type === "VECTOR") { if (v.fills.length) v.fills = [solid(INK)]; if (v.strokes.length) v.strokes = [solid(INK)]; } });
    c.type = "COMPONENT"; c.name = iconName(m.key);
    delete c.svgKey;
    tile.children.push(c, text(iconName(m.key).replace(/^(Icon|Mel)\//, ""), x + 10, yy + th - 24, 11, 400, MUTED, { width: tw - 20 }));
    dsNodes.push(tile);
    m.node = c;
  };
  icons.forEach((m, i) => place(m, (i % 12) * 124, y + Math.floor(i / 12) * 112, 112, 100));
  y += Math.ceil(icons.length / 12) * 112 + 30;
  let x = 0, rowH = 0;
  for (const m of mels) { const s = m.src.n.absoluteBoundingBox.width, tw = Math.max(120, s + 32), th = s + 60; if (x + tw > 1800) { x = 0; y += rowH + 16; rowH = 0; } place(m, x, y, tw, th); x += tw + 12; rowH = Math.max(rowH, th); }
  y += rowH + 80;
}

// Components: variants grouped in component sets.
heading("Components", "Main components measured from the app. Rows, buttons, chips and badges use auto layout. Every screen uses them as instances, so a change here updates the screens.");
const bySpec = new Map();
for (const m of masters) { if (!bySpec.has(m.spec.name)) bySpec.set(m.spec.name, []); bySpec.get(m.spec.name).push(m); }
{
  let cx = 0, cy = y, rowH = 0;
  for (const [name, list] of bySpec) {
    const spec = list[0].spec;
    const variants = spec.prop ? list : list.slice(0, 1);
    const PAD = 32, GAP = 32;
    // Lay the variants out in a row (wrapping), inside a component set when there are several.
    const sizes = variants.map((m) => m.src.n.absoluteBoundingBox);
    let vx = 0, vy = 0, lineH = 0, setW = 0;
    const spots = sizes.map((b) => { if (vx > 0 && vx + b.width > 1400) { vx = 0; vy += lineH + GAP; lineH = 0; } const s = { x: vx, y: vy }; vx += b.width + GAP; lineH = Math.max(lineH, b.height); setW = Math.max(setW, vx - GAP); return s; });
    const setH = vy + lineH;
    const outerW = setW + (variants.length > 1 ? PAD * 2 : 0), outerH = setH + (variants.length > 1 ? PAD * 2 : 0);
    if (cx > 0 && cx + outerW > 2200) { cx = 0; cy += rowH + 100; rowH = 0; }
    dsNodes.push(text(name, cx, cy, 15, 600, INK), text(`${list.reduce((s, m) => s + m.uses, 0)} uses${variants.length > 1 ? " · " + variants.length + " variants" : ""}`, cx, cy + 22, 12, 400, MUTED));
    const top = cy + 52, ox = cx + (variants.length > 1 ? PAD : 0), oy = top + (variants.length > 1 ? PAD : 0);
    const nodes = variants.map((m, i) => {
      const c = clone(m.src.n), b = c.absoluteBoundingBox;
      shift(c, ox + spots[i].x - b.x, oy + spots[i].y - b.y);
      c.type = "COMPONENT";
      c.name = variants.length > 1 ? (spec.prop.includes(",") ? m.value : `${spec.prop}=${m.value}`) : name;
      if (spec.auto) applyLayout(c, true);
      m.node = c;
      return c;
    });
    if (variants.length > 1) {
      const set = frame(name, cx, top, outerW, outerH, [], nodes, { type: "COMPONENT_SET", strokes: [solid({ r: 0.592, g: 0.278, b: 1, a: 1 })], strokeWeight: 1, strokeDashes: [6, 4], strokeAlign: "INSIDE", cornerRadius: 8 });
      set.type = "COMPONENT_SET";
      const defs = {};
      const parts = (v) => (spec.prop.includes(",") ? v.split(", ").map((p) => p.split("=")) : [[spec.prop, v]]);
      variants.forEach((m) => parts(m.value).forEach(([k, v]) => { defs[k] = defs[k] || { type: "VARIANT", defaultValue: v, variantOptions: [] }; if (!defs[k].variantOptions.includes(v)) defs[k].variantOptions.push(v); }));
      set.componentPropertyDefinitions = defs;
      list.setNode = set;
      dsNodes.push(set);
    } else dsNodes.push(nodes[0]);
    // Masters that were not variants (extra structures for a single component) stay out of the set.
    cx += Math.max(outerW, 220) + 80;
    rowH = Math.max(rowH, outerH + 52);
  }
  y = cy + rowH + 100;
}

// ---------- screens ----------
const LABEL_GAP = 64, COL_GAP = 120, ROW_GAP = 260;
const label = (t, x, yy, size = 28, sub) => text(t, x, yy, size, sub ? 400 : 600, sub ? MUTED : INK, { ls: sub ? 0 : -0.4, lh: Math.round(size * 1.3) });
const strip = (n) => walk(n, (m) => { for (const k of ["ctl", "cls", "tag", "aria", "elId", "svgKey", "modal", "key", "device", "viewportHeight", "flex"]) delete m[k]; });
function screensPage(pageNo) {
  const out = [], byKey = {};
  let yy = 0;
  out.push(label("Mellow screens", 0, yy, 56), label("Every frame is measured 1:1 from the running Next.js app: desktop at 1440 wide, phone at 375 wide, full page height. Components and colours link to the Design system page.", 0, yy + 76, 18, true));
  yy += 200;
  for (const row of [...S.ROWS, S.MOBILE_ROW]) {
    out.push(label(row.label === S.MOBILE_ROW.label ? row.label : `Desktop · ${row.label}`, 0, yy, 32));
    let x = 0, h = 0;
    for (const key of row.keys) {
      const f = clone(caps[key]);
      shift(f, x, yy + LABEL_GAP);
      out.push(f);
      byKey[key] = f;
      x += f.absoluteBoundingBox.width + COL_GAP;
      h = Math.max(h, f.absoluteBoundingBox.height);
    }
    yy += LABEL_GAP + h + ROW_GAP;
  }
  out.forEach((n) => ids(n, pageNo));
  return { nodes: out, byKey };
}
function prototypePage(pageNo) {
  const out = [], byKey = {};
  let yy = 0;
  out.push(label("Mellow prototype", 0, yy, 56), label("Desktop, 1440 × 900. Pages scroll inside the frame. Press Present on a flow below, or start from Landing. Error states are part of the flows: the first Log in shows a wrong password, the first Create account shows an email already in use.", 0, yy + 76, 18, true));
  yy += 200;
  for (const row of S.ROWS) {
    out.push(label(row.label, 0, yy, 32));
    let x = 0;
    for (const key of row.keys) {
      const f = clone(caps[key]);
      f.absoluteBoundingBox.height = 900;
      f.clipsContent = true;
      f.scrolls = caps[key].absoluteBoundingBox.height > 900;
      shift(f, x, yy + LABEL_GAP);
      out.push(f);
      byKey[key] = f;
      x += 1440 + COL_GAP;
    }
    yy += LABEL_GAP + 900 + ROW_GAP;
  }
  out.forEach((n) => ids(n, pageNo));
  return { nodes: out, byKey };
}

// ---------- link screens to the design system ----------
let instanceCount = 0;
const instanceStats = {}, missed = {};
const mastersFor = (spec) => masters.filter((m) => m.spec === spec);
const toInstance = (occ, main, name) => {
  occ.type = "INSTANCE";
  occ.componentId = main.id;
  occ.name = name;
  const pair = (o, m) => (o.children || []).forEach((oc, i) => { oc.id = `I${occ.id};${m.children[i].id}`; pair(oc, m.children[i]); });
  pair(occ, main);
  for (const k of ["layoutMode", "itemSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "primaryAxisAlignItems", "counterAxisAlignItems", "primaryAxisSizingMode", "counterAxisSizingMode", "strokesIncludedInLayout"]) if (main[k] !== undefined) occ[k] = main[k];
  if (main.layoutMode) {
    // Each instance sizes itself as it does in the app: a full-width button stays fixed, a label-sized one hugs.
    const own = autoLayout(occ);
    occ.layoutSizingHorizontal = own ? own.layoutSizingHorizontal : "FIXED";
    occ.layoutSizingVertical = own ? own.layoutSizingVertical : "FIXED";
    occ.primaryAxisSizingMode = own ? own.primaryAxisSizingMode : "FIXED";
    occ.counterAxisSizingMode = own ? own.counterAxisSizingMode : "FIXED";
    const copyKids = (o, m) => (o.children || []).forEach((oc, i) => { for (const k of ["layoutAlign", "layoutGrow", "layoutSizingHorizontal", "layoutSizingVertical", "layoutMode", "itemSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "primaryAxisAlignItems", "counterAxisAlignItems", "primaryAxisSizingMode", "counterAxisSizingMode"]) if (m.children[i][k] !== undefined) oc[k] = m.children[i][k]; copyKids(oc, m.children[i]); });
    copyKids(occ, main);
  }
  instanceCount++;
};
const link = (root) => {
  const visit = (n) => {
    if (n.type === "FRAME") {
      const spec = pickSpec(n);
      if (spec) {
        const value = spec.value ? spec.value(n) : "Default", s = sig(n);
        const cands = mastersFor(spec).filter((m) => m.node && m.sig === s);
        const hit = cands.find((m) => m.matchValue === value) || cands[0];
        if (hit) { toInstance(n, hit.node, spec.name); instanceStats[spec.name] = (instanceStats[spec.name] || 0) + 1; return; }
        missed[spec.name] = (missed[spec.name] || 0) + 1;
      } else if (n.svgKey) {
        const im = iconMasters.find((m) => m.key === n.svgKey);
        if (im && im.node && im.sig === sig(n)) { toInstance(n, im.node, im.node.name); instanceStats["Icons and Mel"] = (instanceStats["Icons and Mel"] || 0) + 1; return; }
      }
    }
    (n.children || []).forEach(visit);
  };
  root.children.forEach(visit);
};

// ---------- prototype wiring ----------
const EASE = { type: "EASE_OUT" };
const routeOf = (key, n) => {
  const r = S.ROUTES[key] || {};
  const name = n.ctl.name;
  if (n.elId && r["#" + n.elId]) return r["#" + n.elId];
  if (r[name] !== undefined) return r[name];
  for (const [k, v] of Object.entries(r)) if (k.startsWith("/") && k.endsWith("/") && new RegExp(k.slice(1, -1)).test(name)) return v;
  if (n.ctl.href && S.HREF[n.ctl.href]) return S.HREF[n.ctl.href];
  return null;
};
const routeKey = (key) => key.replace(/-.*$/, "").replace(/^m$/, "");
function wire(proto) {
  let wired = 0, scrolls = 0;
  for (const [key, f] of Object.entries(proto.byKey)) {
    const byElId = {};
    walk(f, (n) => { if (n.elId) byElId[n.elId] = n; });
    walk(f, (n) => {
      if (!n.ctl) return;
      const href = n.ctl.href || "";
      if (href.startsWith("#") && href.length > 1 && byElId[href.slice(1)]) {
        n.interactions = [{ trigger: { type: "ON_CLICK" }, actions: [{ type: "NODE", destinationId: byElId[href.slice(1)].id, navigation: "SCROLL_TO", transition: { type: "SCROLL_ANIMATE", easing: EASE, duration: 300 } }] }];
        scrolls++;
        return;
      }
      const dest = routeOf(key, n);
      if (!dest || dest === key) return;
      if (dest === "BACK") { n.interactions = [{ trigger: { type: "ON_CLICK" }, actions: [{ type: "BACK" }] }]; wired++; return; }
      const target = proto.byKey[dest];
      if (!target) return;
      const samePage = routeKey(dest) === routeKey(key);
      n.interactions = [{ trigger: { type: "ON_CLICK" }, actions: [{ type: "NODE", destinationId: target.id, navigation: "NAVIGATE", transition: samePage ? { type: "SMART_ANIMATE", easing: EASE, duration: 200 } : { type: "DISSOLVE", easing: EASE, duration: 200 }, preserveScrollPosition: false }] }];
      wired++;
    });
  }
  return { wired, scrolls };
}

// ---------- colour variables and styles on every layer ----------
const byHex = {};
for (const [k, hex] of Object.entries(COLORS)) { const h = hex.replace("#", "").toUpperCase(); (byHex[h] = byHex[h] || []).push(k); }
const PREF = {
  text: ["ink", "muted", "white", "danger", "green-deep", "accent-deep", "surface", "ground", "line-input", "accent", "accent-tint", "line", "line-strong", "line-select", "divider", "dash", "sage-100", "sage-50"],
  fill: ["surface", "ground", "ink", "accent", "accent-tint", "accent-deep", "sage-100", "sage-50", "danger", "green-deep", "line", "line-strong", "line-select", "line-input", "divider", "dash", "muted", "white"],
  stroke: ["line", "line-strong", "line-select", "line-input", "divider", "dash", "ink", "danger", "accent", "accent-deep", "muted", "surface", "white", "ground", "accent-tint", "green-deep", "sage-100", "sage-50"],
};
let bound = 0;
const bind = (root) => walk(root, (n) => {
  const inkish = n.type === "TEXT" || n.type === "VECTOR";
  for (const [list, role] of [[n.fills, inkish ? "text" : "fill"], [n.strokes, n.type === "VECTOR" ? "text" : "stroke"]]) {
    (list || []).forEach((p) => {
      if (p.type !== "SOLID" || !p.color || p.boundVariables) return;
      const c = byHex[hex6(p.color)];
      if (!c) return;
      const tok = PREF[role].find((t) => c.includes(t));
      if (!tok) return;
      p.boundVariables = { color: { type: "VARIABLE_ALIAS", id: colorVar[tok] } };
      bound++;
    });
  }
  if (n.styleOverrideTable) for (const st of Object.values(n.styleOverrideTable)) (st.fills || []).forEach((p) => { const c = byHex[hex6(p.color)]; const tok = c && PREF.text.find((t) => c.includes(t)); if (tok) { p.boundVariables = { color: { type: "VARIABLE_ALIAS", id: colorVar[tok] } }; bound++; } });
});
let textStyled = 0, effectStyled = 0;
const styleUp = (root) => walk(root, (n) => {
  if (n.type === "TEXT" && !n.styles && n.style.fontFamily === "Figtree") {
    const st = n.style;
    const ts = TEXT_STYLES.find((s) => s.weight === st.fontWeight && s.size === st.fontSize && Math.abs(s.lh - st.lineHeightPx) < 0.6 && Math.abs(s.ls - (st.letterSpacing || 0)) < 0.05 && (s.tcase || null) === (st.textCase || null));
    if (ts) { n.styles = { text: ts.id }; textStyled++; }
  }
  if (n.effects && n.effects.length && !(n.styles && n.styles.effect)) {
    const k = n.effects.map((e) => [hex6(e.color), Math.round(e.color.a * 100), e.offset.x, e.offset.y, e.radius].join()).join("|");
    const es = EFFECT_STYLES.find((s) => s.key === k);
    if (es) { n.styles = { ...(n.styles || {}), effect: es.id }; effectStyled++; }
  }
});

// ---------- assemble ----------
const dsPage = { id: "0:1", type: "CANVAS", name: "Design system", backgroundColor: hexToRgb("#F7F8F5"), children: dsNodes };
dsNodes.forEach((n) => ids(n, 1));
for (const m of [...masters, ...iconMasters]) if (m.node) {
  componentsMeta[m.node.id] = { key: "mellow-" + m.node.id.replace(/\W/g, "-"), name: m.node.name, description: m.spec ? `${m.spec.name} · measured from the ${m.src.key} screen` : "Icon, " + m.key.replace("@", " · ") };
}
for (const list of bySpec.values()) if (list.setNode) {
  componentSets[list.setNode.id] = { key: "mellow-set-" + list.setNode.id.replace(/\W/g, "-"), name: list.setNode.name, description: "" };
  for (const m of list) if (m.node) componentsMeta[m.node.id].componentSetId = list.setNode.id;
}
const screens = screensPage(2), proto = prototypePage(3);
const wiring = wire(proto);
for (const page of [screens, proto]) for (const n of page.nodes) if (n.type === "FRAME") link(n);
for (const n of [...dsNodes, ...screens.nodes, ...proto.nodes]) { bind(n); styleUp(n); }
const scrollers = Object.entries(proto.byKey).filter(([, f]) => f.scrolls).map(([, f]) => f.id);
// Size variables on the component masters (bound after import): radius, gap and padding where they match a token.
const RADIUS_NAME = Object.fromEntries(S.RADIUS.map(([n, v]) => [v, n]));
const binds = {};
const addBind = (field, variable, id) => ((binds[field + "|" + variable] = binds[field + "|" + variable] || []).push(id));
for (const m of masters) if (m.node) {
  const c = m.node, full = / rounded-full /.test(" " + (c.cls || "") + " ");
  const r = full ? "full" : RADIUS_NAME[c.cornerRadius];
  if (r && (full || c.cornerRadius)) addBind("cornerRadius", "radius/" + r, c.id);
  if (c.layoutMode && S.SPACE.includes(c.itemSpacing)) addBind("gap", "space/" + c.itemSpacing, c.id);
  if (c.layoutMode) for (const side of ["Top", "Right", "Bottom", "Left"]) if (S.SPACE.includes(c["padding" + side])) addBind("padding" + side, "space/" + c["padding" + side], c.id);
}
[...screens.nodes, ...proto.nodes, ...dsNodes].forEach((n) => { strip(n); walk(n, (m) => delete m.scrolls); });
const flows = S.FLOWS.filter(([, k]) => proto.byKey[k]).map(([name, k]) => ({ nodeId: proto.byKey[k].id, name }));
const doc = {
  name: "Mellow",
  document: { id: "0:0", type: "DOCUMENT", name: "Document", children: [
    dsPage,
    { id: "0:2", type: "CANVAS", name: "Screens", backgroundColor: hexToRgb("#E9ECE6"), children: screens.nodes },
    { id: "0:3", type: "CANVAS", name: "Prototype", backgroundColor: hexToRgb("#E9ECE6"), flowStartingPoints: flows, children: proto.nodes },
  ] },
  components: componentsMeta, componentSets, styles, schemaVersion: 0,
};
writeFileSync(path.join(outDir, "Mellow.json"), JSON.stringify(doc));
writeFileSync(path.join(outDir, "Mellow.variables.json"), JSON.stringify(varsJson));
writeFileSync(path.join(outDir, "post.json"), JSON.stringify({ scrollers, generate: proto.byKey.generate.id, generateDone: proto.byKey["generate-done"].id, binds }));
const layouts = Object.values(componentsMeta).length;
console.log(JSON.stringify({ components: masters.length, componentSets: Object.keys(componentSets).length, icons: iconMasters.length, instances: instanceCount, instanceStats, missed, bound, textStyled, effectStyled, wiring, flows: flows.length, scrollers: scrollers.length, variables: vid, layouts }, null, 1));
console.log("wrote", path.join(outDir, "Mellow.json"), Math.round(JSON.stringify(doc).length / 1024) + " KB");
