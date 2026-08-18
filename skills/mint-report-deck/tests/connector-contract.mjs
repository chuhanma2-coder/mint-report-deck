#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateConnectorContract } from "../scripts/validate-connector-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "tests/fixtures");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mint-connector-v06-"));
const load = (name) => JSON.parse(fs.readFileSync(path.join(fixtures, name), "utf8"));
const valid = load("connector-contract-valid.json");
const invalid = load("connector-contract-invalid.json");

const validResult = validateConnectorContract(valid.deck, valid.map);
if (!validResult.passed) throw new Error(`valid connector contract failed: ${validResult.errors.join(" | ")}`);
const invalidResult = validateConnectorContract(invalid.deck, invalid.map);
if (invalidResult.passed) throw new Error("invalid connector contract unexpectedly passed");
for (const marker of ["parallel 不得使用 arrow", "未授权可见连接器", "toElementId 未在本页 elementIds[] 注册", "relationRef 不存在"]) {
  if (!invalidResult.errors.some((error) => error.includes(marker))) throw new Error(`invalid connector case did not report: ${marker}`);
}

const validDeckPath = path.join(tmp, "connector-contract-valid.deck.json");
const validMapPath = path.join(tmp, "connector-contract-valid.map.json");
fs.writeFileSync(validDeckPath, `${JSON.stringify(valid.deck, null, 2)}\n`);
fs.writeFileSync(validMapPath, `${JSON.stringify(valid.map, null, 2)}\n`);
try {
  const cli = spawnSync(process.execPath, [path.join(root, "scripts/validate-deck.mjs"), validDeckPath, validMapPath], { encoding:"utf8" });
  if (cli.status !== 0) throw new Error(`validate-deck rejected valid V0.6 deck:\n${cli.stdout}${cli.stderr}`);
} finally {
  fs.rmSync(validDeckPath, { force:true });
  fs.rmSync(validMapPath, { force:true });
}

console.log(JSON.stringify({
  passed:true,
  validConnectors:validResult.metrics.connectors,
  blockedConnectorErrors:invalidResult.errors.length,
  parallelArrowErrors:invalidResult.errors.filter((error) => error.includes("parallel")).length,
  endpointErrors:invalidResult.errors.filter((error) => error.includes("ElementId")).length
}, null, 2));
