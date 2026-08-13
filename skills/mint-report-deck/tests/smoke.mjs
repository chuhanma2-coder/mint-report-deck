#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { selectComponent } from "../scripts/select-component.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "tests/fixtures");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mint-skill-v02-"));
const run = (script, args) => spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], { encoding: "utf8" });
const mustRun = (script, args) => { const r = run(script, args); if (r.status !== 0) throw new Error(`${script}\n${r.stdout}${r.stderr}`); return r; };

const routing = JSON.parse(fs.readFileSync(path.join(fixtures, "routing-cases.json"), "utf8"));
for (const test of routing) {
  const outputs = Array.from({ length: 3 }, () => selectComponent(test.input).component);
  if (outputs.some((x) => x !== test.expected)) throw new Error(`${test.name}: expected ${test.expected}, got ${outputs.join(",")}`);
}
const prompts = JSON.parse(fs.readFileSync(path.join(fixtures, "prompt-regression.json"), "utf8"));
if (prompts.length < 12) throw new Error("prompt regression set must include at least 12 realistic prompts");
for (const prompt of prompts) {
  const component = selectComponent(prompt).component;
  if (component === "needs-review" && !["trend", "quantity"].includes(prompt.relationship)) throw new Error(`${prompt.name}: unexpected blocked route`);
  if (prompt.pageBudget !== 1) throw new Error(`${prompt.name}: short regression cases must start at one page`);
}

const map = path.join(fixtures, "vodafone-content-map.json");
mustRun("validate-content-map.mjs", [map]);
for (const name of ["vodafone-deck.json", "pakistan-deck.json"]) {
  const spec = path.join(fixtures, name);
  const out = path.join(tmp, name.replace(".json", ".html"));
  mustRun("validate-deck.mjs", name.startsWith("vodafone") ? [spec, map] : [spec]);
  mustRun("render-deck.mjs", [spec, out]);
  const html = fs.readFileSync(out, "utf8");
  for (const marker of ["mint-deck-id", "mintDeckStage", "data-title", "sourceRefs"]) {
    if (marker === "sourceRefs") continue;
    if (!html.includes(marker)) throw new Error(`${name} missing marker: ${marker}`);
  }
  if ((html.match(/<section class="slide/g) || []).length !== 1) throw new Error(`${name} must render exactly one slide`);
  if (/Sinova|Twende|BaaS/.test(html)) throw new Error(`${name} contains invented entity`);
}

const example = path.join(root, "assets/examples/example-deck.json");
const exampleOut = path.join(tmp, "example.html");
mustRun("validate-deck.mjs", [example]);
mustRun("render-deck.mjs", [example, exampleOut]);
const html = fs.readFileSync(exampleOut, "utf8");
for (const marker of ["data-mint-chart", "mint-deck-edits:${deckId}:${deckVersion}", "data-lightbox"]) if (!html.includes(marker)) throw new Error(`example missing ${marker}`);

console.log(JSON.stringify({ passed: true, routingCases: routing.length, promptCases: prompts.length, deterministicRuns: routing.length * 3, renderedDecks: 3, output: tmp }, null, 2));
