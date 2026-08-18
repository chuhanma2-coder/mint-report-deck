#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSemanticGraph } from "./validate-semantic-graph.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const markers = JSON.parse(fs.readFileSync(path.join(root, "references/chinese-discourse-markers.json"), "utf8"));
const arr = (value) => Array.isArray(value) ? value : [];
const startsWithAny = (text, values) => values.some((value) => String(text || "").trim().startsWith(value));
const includesAny = (text, values) => values.some((value) => String(text || "").includes(value));
const hasEnumerationPrefix = (text) => /^(?:[（(]?\d+[）).、]|第[一二三四五六七八九十\d]+点|[一二三四五六七八九十]是)/.test(String(text || "").trim());
const unitNodeId = (unit) => `DU:${unit.id}`;
const hasAction = (unit) => includesAny(`${unit.predicate || ""}${unit.text || ""}`, markers.actionVerbs) || unit.role === "action";
const edge = ({ id, source, target, relationType, direction, evidenceRefs, confidence, orderBasis = "none", connectorPolicy = "none", assertionStatus, needsReview = false }) => ({
  id,
  source,
  target,
  relationType,
  direction,
  evidenceRefs: [...new Set(evidenceRefs.filter(Boolean))],
  confidence,
  orderBasis: { type: orderBasis, ...(orderBasis === "none" ? {} : { evidenceRef: evidenceRefs.filter(Boolean).at(-1) }) },
  connectorPolicy,
  ...(assertionStatus ? { assertionStatus } : {}),
  needsReview
});

function explicitHint(previous, current) {
  const hint = current.semanticRelationToPrevious || current.relationHint;
  if (!hint) return null;
  const mapping = {
    parallel: ["parallel", "none", "none", "none"],
    comparison: ["comparison", "undirected", "none", "none"],
    "before-after": ["before-after", "directed", "explicit-marker", "arrow"],
    sequence: ["sequence", "directed", "explicit-marker", "arrow"],
    temporal: ["temporal", "directed", "timestamp", "axis"],
    flow: ["flow", "directed", "input-output-handoff", "arrow"],
    dependency: ["dependency", "directed", "dependency", "arrow"],
    causal: ["causal", "directed", "dependency", "arrow"],
    evidence: ["evidence", "directed", "none", "line"]
  };
  const selected = mapping[hint];
  if (!selected) return null;
  return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: selected[0], direction: selected[1], evidenceRefs: [previous.sourceRef, current.sourceRef], confidence: 1, orderBasis: selected[2], connectorPolicy: selected[3], assertionStatus: hint === "causal" ? (current.modality === "confirmed" ? "confirmed" : "hypothesis") : undefined });
}

function inferPair(previous, current) {
  const previousText = String(previous.text || "").trim();
  const currentText = String(current.text || "").trim();
  const evidenceRefs = [previous.sourceRef, current.sourceRef];
  const hinted = explicitHint(previous, current);
  if (hinted) return hinted;

  if (previous.sectionId !== current.sectionId && (previous.sectionId || current.sectionId)) return null;
  if (current.subjectResolution === "unknown") return null;

  const sameListGroup = current.listGroup && previous.listGroup && current.listGroup === previous.listGroup;
  const enumeratedParallel = (startsWithAny(previousText, markers.parallelEnumeration) || hasEnumerationPrefix(previousText)) && (startsWithAny(currentText, markers.parallelEnumeration) || hasEnumerationPrefix(currentText));
  if (sameListGroup || enumeratedParallel) {
    return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: "parallel", direction: "none", evidenceRefs, confidence: 0.99, orderBasis: "none", connectorPolicy: "none" });
  }

  const pastToPresent = includesAny(previousText, markers.temporalPast) && includesAny(currentText, markers.temporalPresent);
  if (pastToPresent || current.relationToPrevious === "contrasts" && /(V1|原来|过去|此前)/i.test(previousText) && /(V2|现在|目前|本轮|当前)/i.test(currentText)) {
    return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: "before-after", direction: "directed", evidenceRefs, confidence: 0.98, orderBasis: "explicit-marker", connectorPolicy: "arrow" });
  }

  if (startsWithAny(currentText, markers.dependency) || includesAny(currentText, markers.dependency)) {
    return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: "dependency", direction: "directed", evidenceRefs, confidence: 0.97, orderBasis: "dependency", connectorPolicy: "arrow" });
  }

  const sequenceMarker = startsWithAny(currentText, markers.sequence) || current.relationToPrevious === "sequences";
  if (sequenceMarker && hasAction(previous) && hasAction(current)) {
    return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: "sequence", direction: "directed", evidenceRefs, confidence: 0.95, orderBasis: "explicit-marker", connectorPolicy: "arrow" });
  }
  if (sequenceMarker) {
    return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: "parallel", direction: "none", evidenceRefs, confidence: 0.55, orderBasis: "none", connectorPolicy: "none", needsReview: true });
  }

  if (startsWithAny(currentText, markers.effect) || ["results-in", "concludes"].includes(current.relationToPrevious)) {
    const assertionStatus = current.modality === "confirmed" ? "confirmed" : "hypothesis";
    return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: "causal", direction: "directed", evidenceRefs, confidence: 0.9, orderBasis: "dependency", connectorPolicy: "arrow", assertionStatus });
  }
  if (startsWithAny(currentText, markers.cause) || current.relationToPrevious === "causes") {
    const assertionStatus = current.modality === "confirmed" ? "confirmed" : "hypothesis";
    return edge({ id: "", source: unitNodeId(current), target: unitNodeId(previous), relationType: "causal", direction: "directed", evidenceRefs, confidence: 0.9, orderBasis: "dependency", connectorPolicy: "arrow", assertionStatus });
  }

  if (startsWithAny(currentText, markers.contrast) || current.relationToPrevious === "contrasts") {
    return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: "comparison", direction: "undirected", evidenceRefs, confidence: 0.94, orderBasis: "none", connectorPolicy: "none" });
  }

  if (current.relationToPrevious === "supports" || current.role === "evidence" && previous.role === "claim") {
    return edge({ id: "", source: unitNodeId(current), target: unitNodeId(previous), relationType: "evidence", direction: "directed", evidenceRefs, confidence: 0.92, orderBasis: "none", connectorPolicy: "line" });
  }

  if (startsWithAny(currentText, markers.parallel) || current.relationToPrevious === "elaborates") {
    return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: "parallel", direction: "none", evidenceRefs, confidence: 0.85, orderBasis: "none", connectorPolicy: "none" });
  }

  if (includesAny(`${previousText}${currentText}`, markers.flow) && hasAction(previous) && hasAction(current)) {
    return edge({ id: "", source: unitNodeId(previous), target: unitNodeId(current), relationType: "flow", direction: "directed", evidenceRefs, confidence: 0.78, orderBasis: "input-output-handoff", connectorPolicy: "arrow", needsReview: true });
  }
  return null;
}

export function compileSemanticGraph(map) {
  const units = arr(map.discourseUnits);
  const migrationWarnings = [];
  const nodes = units.map((unit) => ({
    id: unitNodeId(unit),
    kind: "atom",
    label: unit.text || unit.id,
    sourceRefs: [unit.sourceRef].filter(Boolean),
    materiality: arr(map.contentAtoms).some((atom) => atom.materiality === "primary" && arr(atom.discourseRefs).includes(unit.id)) ? "primary" : "supporting",
    needsReview: unit.subjectResolution === "unknown" || unit.modality === "unknown"
  }));
  for (const unit of units) {
    if (unit.subjectResolution === "unknown") migrationWarnings.push(`Discourse unit ${unit.id} has an unresolved subject; no formal relation may be inferred from it.`);
  }

  const edges = [];
  for (let index = 1; index < units.length; index += 1) {
    const previous = units[index - 1];
    const current = units[index];
    const inferred = inferPair(previous, current);
    if (!inferred) {
      migrationWarnings.push(`No safe relation was inferred between ${previous.id} and ${current.id}; keep them unconnected pending review.`);
      continue;
    }
    inferred.id = `SGE-${String(edges.length + 1).padStart(3, "0")}`;
    edges.push(inferred);
    if (inferred.needsReview || inferred.confidence < 0.75) migrationWarnings.push(`Edge ${inferred.id} (${inferred.relationType}) is low confidence and requires review.`);
  }

  const graph = {
    schemaVersion: "0.6",
    sourceContentMapVersion: String(map.schemaVersion || "legacy"),
    nodes,
    edges,
    migrationWarnings
  };
  const validation = validateSemanticGraph(graph);
  if (!validation.passed) throw new Error(`semantic graph compilation failed: ${validation.errors.join(" | ")}`);
  return graph;
}

function runCli() {
  const input = path.resolve(process.argv[2] || "");
  const graphOutput = path.resolve(process.argv[3] || "semantic-graph.json");
  const mapOutput = process.argv[4] ? path.resolve(process.argv[4]) : null;
  if (!process.argv[2] || !fs.existsSync(input)) {
    console.error("Usage: node compile-semantic-graph.mjs /absolute/path/content-map.json /absolute/path/semantic-graph.json [/absolute/path/content-map-v06.json]");
    process.exit(2);
  }
  const map = JSON.parse(fs.readFileSync(input, "utf8"));
  const graph = compileSemanticGraph(map);
  fs.mkdirSync(path.dirname(graphOutput), { recursive: true });
  fs.writeFileSync(graphOutput, `${JSON.stringify(graph, null, 2)}\n`);
  if (mapOutput) {
    fs.mkdirSync(path.dirname(mapOutput), { recursive: true });
    fs.writeFileSync(mapOutput, `${JSON.stringify({ ...map, schemaVersion: "0.6", semanticGraph: graph }, null, 2)}\n`);
  }
  console.log(JSON.stringify({ passed: true, nodes: graph.nodes.length, edges: graph.edges.length, reviewItems: graph.migrationWarnings.length, graphOutput, mapOutput }, null, 2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
