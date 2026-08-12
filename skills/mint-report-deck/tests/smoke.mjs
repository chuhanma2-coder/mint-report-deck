#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spec = path.join(root, "assets/examples/example-deck.json");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mint-skill-test-"));
const out = path.join(tmp, "report.html");
const run = (script, args) => spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], { encoding: "utf8" });
const validation = run("validate-deck.mjs", [spec]);
if (validation.status !== 0) throw new Error(validation.stdout + validation.stderr);
const render = run("render-deck.mjs", [spec, out]);
if (render.status !== 0) throw new Error(render.stdout + render.stderr);
const html = fs.readFileSync(out, "utf8");
const required = ["mint-deck-id", "mintDeckStage", "data-mint-chart", "mint-deck-edits:${deckId}:${deckVersion}", "项目进展", "data-lightbox"];
for (const marker of required) if (!html.includes(marker)) throw new Error(`missing marker: ${marker}`);
if ((html.match(/<section class="slide/g) || []).length !== 4) throw new Error("expected 4 slides");
if (html.includes("../../")) throw new Error("rendered HTML must not depend on repository-relative assets");
console.log(JSON.stringify({ passed: true, slides: 4, bytes: html.length, output: out }, null, 2));
