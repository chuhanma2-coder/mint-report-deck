#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPageContracts } from "../scripts/build-page-contracts.mjs";
import { selectLayout } from "../scripts/select-layout.mjs";
import { validateSemanticLayout } from "../scripts/validate-semantic-layout.mjs";
import { validateReadingContract } from "../scripts/validate-reading-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "tests/fixtures");
const registry = JSON.parse(fs.readFileSync(path.join(root, "assets/layout-patterns.json"), "utf8"));
const forcedSource = JSON.parse(fs.readFileSync(path.join(fixtures, "forced-one-page-content-map.json"), "utf8"));
const forced = { ...forcedSource, schemaVersion:"0.6", semanticGraph:{ schemaVersion:"0.6", sourceContentMapVersion:"0.4", nodes:forcedSource.contentAtoms.map((atom) => ({ id:`ATOM:${atom.id}`, kind:"atom", label:atom.text, sourceRefs:[atom.sourceRef], materiality:atom.materiality, needsReview:false })), edges:[], migrationWarnings:[] } };
const plan = buildPageContracts(forced);
const selections = { schemaVersion:"0.6", status:"selected", selections:plan.pageContracts.map((page) => ({ pageId:page.id, ...selectLayout(page, forced.semanticGraph, registry) })) };
const validSemantic = validateSemanticLayout(plan, forced, selections, registry);
const validReading = validateReadingContract(plan, selections, registry);
if (!validSemantic.passed || !validReading.passed) throw new Error(`valid contracts failed: ${[...validSemantic.errors, ...validReading.errors].join(" | ")}`);

const wrongPattern = structuredClone(selections);
wrongPattern.selections[0].patternId = "horizontal-sequence";
wrongPattern.selections[0].status = "selected";
const wrongPatternResult = validateSemanticLayout(plan, forced, wrongPattern, registry);
if (wrongPatternResult.passed || !wrongPatternResult.errors.some((error) => error.includes("不兼容"))) throw new Error("semantic mismatch was not blocked");

const brokenReadingPlan = structuredClone(plan);
brokenReadingPlan.pageContracts[0].contentOrder = ["title","proof-object","page-answer"];
brokenReadingPlan.pageContracts[0].focalAnchor = "missing-anchor";
const brokenReading = validateReadingContract(brokenReadingPlan, selections, registry);
if (brokenReading.passed || !brokenReading.errors.some((error) => error.includes("第二阅读位置")) || !brokenReading.errors.some((error) => error.includes("focalAnchor"))) throw new Error("unclear reading order was not blocked");

const weeklyDir = "/Users/mac/Documents/Mint/outputs/2026-08-18-weekly-kb-v05-test";
const oldMap = JSON.parse(fs.readFileSync(path.join(weeklyDir, "content-map.json"), "utf8"));
const oldDeck = JSON.parse(fs.readFileSync(path.join(weeklyDir, "deck-spec.json"), "utf8"));
const knownBad = validateSemanticLayout(oldDeck.deckPlan, oldMap, oldDeck.layoutSelection, registry, oldDeck);
if (knownBad.passed) throw new Error("known V0.5 weekly layout unexpectedly passed V0.6 semantic QA");

console.log(JSON.stringify({ passed:true, validSemanticPages:validSemantic.metrics.pages, validReadingPaths:validReading.metrics.clearReadingPaths, semanticMismatchesBlocked:1, unclearReadingPathsBlocked:1, knownBadWeeklyBlocked:1 }, null, 2));
