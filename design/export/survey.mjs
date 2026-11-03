import { readFileSync, readdirSync } from "node:fs";
const caps = readdirSync("captures").map((f) => JSON.parse(readFileSync("captures/" + f, "utf8")));
const cls = new Map(), icons = new Map(), texts = new Map();
const walk = (n, screen) => {
  if (n.type === "FRAME" && n.cls) { const k = n.tag + " | " + n.cls; const e = cls.get(k) || { n: 0, screens: new Set(), name: n.name }; e.n++; e.screens.add(screen); cls.set(k, e); }
  if (n.svgKey) icons.set(n.svgKey, (icons.get(n.svgKey) || 0) + 1);
  if (n.type === "TEXT") { const s = n.style; const k = `${s.fontFamily} ${s.fontWeight} ${s.fontSize}/${s.lineHeightPx} ls${s.letterSpacing}${s.textCase ? " " + s.textCase : ""}`; texts.set(k, (texts.get(k) || 0) + 1); }
  (n.children || []).forEach((c) => walk(c, screen));
};
caps.forEach((c) => walk(c, c.key));
console.log("== repeated frames (>=3 uses, 2+ screens)");
[...cls].filter(([, e]) => e.n >= 3 && e.screens.size >= 2).sort((a, b) => b[1].n - a[1].n).slice(0, 70).forEach(([k, e]) => console.log(e.n, e.screens.size, JSON.stringify(e.name).slice(0, 40), k.slice(0, 200)));
console.log("== icons", icons.size); console.log([...icons].sort().map(([k, v]) => k + " ×" + v).join(", "));
console.log("== text styles"); [...texts].sort((a, b) => b[1] - a[1]).slice(0, 40).forEach(([k, v]) => console.log(v, k));
