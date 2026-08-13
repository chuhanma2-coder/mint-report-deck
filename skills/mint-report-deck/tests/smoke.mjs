#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { selectComponent } from "../scripts/select-component.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "tests/fixtures");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mint-skill-v03-"));
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

const fullDeck = path.join(fixtures, "full-deck-three-sections.json");
const fullDeckOut = path.join(tmp, "full-deck.html");
mustRun("validate-deck.mjs", [fullDeck]);
mustRun("render-deck.mjs", [fullDeck, fullDeckOut]);
const fullHtml = fs.readFileSync(fullDeckOut, "utf8");
if ((fullHtml.match(/class="section-intro/g) || []).length !== 3) throw new Error("all three sections must use the same section-intro family");
if (!fullHtml.includes("risk-spotlight")) throw new Error("full deck must render a distinct risk spotlight");

const planned = JSON.parse(mustRun("plan-page-family.mjs", [JSON.stringify({ relationship: "front-middle-back", secondaryBlocks: 1, calloutCount: 1 })]).stdout);
if (planned.status !== "ready" || planned.family !== "capability-chain" || planned.estimatedVisualShare < 0.55) throw new Error("front-middle-back must plan as a readable capability chain");
const overloaded = JSON.parse(mustRun("plan-page-family.mjs", [JSON.stringify({ relationship: "front-middle-back", secondaryBlocks: 4, calloutCount: 2 })]).stdout);
if (overloaded.status !== "split-required") throw new Error("overloaded page must split before shrinking the main visual");
const unmatched = JSON.parse(mustRun("plan-page-family.mjs", [JSON.stringify({ relationship: "other", preferredFamily: "uncontrolled-freeform" })]).stdout);
if (unmatched.status !== "needs-layout-review") throw new Error("unknown family must stop for layout review instead of forcing a table");

console.log(JSON.stringify({ passed: true, routingCases: routing.length, promptCases: prompts.length, deterministicRuns: routing.length * 3, renderedDecks: 4, sectionIntros: 3, pageFamilyPlans: 3, output: tmp }, null, 2));
