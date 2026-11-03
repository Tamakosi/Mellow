// Maps the built JSON to FigCraft's numeric layer ids (assigned depth-first from 1 on open).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const doc = JSON.parse(readFileSync(path.join(here, "out/Mellow.json"), "utf8"));
let id = 1;
const map = { pages: {}, top: {}, components: {}, byRestId: {} };
for (const page of doc.document.children) {
  map.pages[page.name] = ++id;
  const visit = (n, depth, pageName) => {
    const my = ++id;
    map.byRestId[n.id] = my;
    if (depth === 0) (map.top[pageName] = map.top[pageName] || []).push([my, n.name, n.type]);
    if (n.type === "COMPONENT" || n.type === "COMPONENT_SET") map.components[n.name + (n.type === "COMPONENT_SET" ? " (set)" : "")] = my;
    (n.children || []).forEach((c) => visit(c, depth + 1, pageName));
  };
  page.children.forEach((n) => visit(n, 0, page.name));
}
writeFileSync(path.join(here, "out/idmap.json"), JSON.stringify(map));
console.log(JSON.stringify(map.pages), "last id", id);
console.log(map.top.Screens.slice(0, 6).map((t) => t.join(" ")).join("\n"));
