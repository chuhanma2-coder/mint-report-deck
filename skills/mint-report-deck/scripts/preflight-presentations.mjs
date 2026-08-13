#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const roots = [
  process.env.CODEX_HOME && path.join(process.env.CODEX_HOME, "skills"),
  path.join(os.homedir(), ".codex", "skills"),
  path.join(os.homedir(), ".codex", "plugins", "cache")
].filter(Boolean);
const found = [];
function walk(dir, depth = 0) {
  if (depth > 6 || !fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, depth + 1);
    else if (entry.name === "SKILL.md" && /presentations/i.test(file)) found.push(file);
  }
}
roots.forEach((root) => walk(root));
const result = {
  available: found.length > 0,
  matches: [...new Set(found)],
  behavior: found.length ? "load Mint and Presentations; generate editable PPTX from the bundled component library" : "deliver content-map, deck-spec and HTML; do not claim PPTX completion"
};
console.log(JSON.stringify(result, null, 2));
process.exit(0);
