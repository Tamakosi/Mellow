// The steps FigCraft's importer doesn't cover, as one command batch (run it with FigCraft's batch tool after opening Mellow.json):
// pages that scroll inside their prototype frame, the "Generating" screen moving on by itself, and size variables on components.
// Usage: node design/export/post.mjs   -> design/export/out/post-commands.json
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const post = JSON.parse(readFileSync(path.join(here, "out/post.json"), "utf8"));
const map = JSON.parse(readFileSync(path.join(here, "out/idmap.json"), "utf8")).byRestId;
const commands = [
  { command: "node.set", params: { ids: post.scrollers.map((id) => map[id]), overflow: "vertical" } },
  { command: "proto.interaction.add", params: { id: map[post.generate], trigger: { type: "afterDelay", ms: 4000 }, action: { type: "navigate", dest: map[post.generateDone] }, transition: { type: "dissolve" }, durationMs: 300, easing: "easeOut" } },
  ...Object.entries(post.binds).map(([key, ids]) => { const [field, variable] = key.split("|"); return { command: "variable.bind", params: { ids: ids.map((id) => map[id]), field, variable } }; }),
];
writeFileSync(path.join(here, "out/post-commands.json"), JSON.stringify(commands));
console.log(commands.length, "commands,", Object.values(post.binds).flat().length, "variable bindings");
