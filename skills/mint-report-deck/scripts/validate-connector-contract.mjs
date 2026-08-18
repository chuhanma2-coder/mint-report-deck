#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (value) => Array.isArray(value) ? value : [];
const connectorTypes = new Set(["arrow", "axis", "branch", "line", "bracket", "none"]);
const directions = new Set(["forward", "backward", "bidirectional", "none"]);
const arrowRelations = new Set(["sequence", "temporal", "flow", "before-after", "dependency", "causal"]);

export function validateConnectorContract(deck, map) {
  const errors = [];
  const warnings = [];
  if (deck?.schemaVersion !== "0.6") return { passed: true, errors, warnings, metrics: { connectors: 0 } };
  const graph = map?.semanticGraph;
  if (!graph || graph.schemaVersion !== "0.6") return { passed: false, errors: ["V0.6 connector contract 需要 content-map.semanticGraph"], warnings, metrics: { connectors: 0 } };
  const edgeById = new Map(arr(graph.edges).map((item) => [item.id, item]));
  const seenConnectorIds = new Set();
  let connectorCount = 0;

  arr(deck.slides).forEach((slide, slideIndex) => {
    const at = `第 ${slideIndex + 1} 页`;
    const elementIds = new Set(arr(slide.elementIds));
    if (!Array.isArray(slide.elementIds) || elementIds.size !== slide.elementIds.length || [...elementIds].some((id) => typeof id !== "string" || !id)) {
      errors.push(`${at}：V0.6 必须声明唯一且非空的 elementIds[]`);
    }
    if (!Array.isArray(slide.connectors)) {
      errors.push(`${at}：V0.6 必须声明 connectors[]，无连接器时使用空数组`);
      return;
    }
    arr(slide.connectors).forEach((connector, connectorIndex) => {
      connectorCount += 1;
      const label = `${at} connectors[${connectorIndex}]`;
      if (!connector.id) errors.push(`${label} 缺少 id`);
      else if (seenConnectorIds.has(connector.id)) errors.push(`${label} id 重复：${connector.id}`);
      else seenConnectorIds.add(connector.id);
      if (!connectorTypes.has(connector.connectorType)) errors.push(`${label} connectorType 无效`);
      if (!directions.has(connector.direction)) errors.push(`${label} direction 无效`);
      if (!connector.relationRef || !edgeById.has(connector.relationRef)) {
        errors.push(`${label} relationRef 不存在：${connector.relationRef || "<empty>"}`);
        return;
      }
      const relation = edgeById.get(connector.relationRef);
      if (relation.needsReview || Number(relation.confidence) < 0.75) errors.push(`${label} 引用了未确认关系：${relation.id}`);
      if (connector.connectorType !== "none") {
        if (!connector.fromElementId || !connector.toElementId) errors.push(`${label} 可见连接器必须包含 fromElementId 和 toElementId`);
        if (connector.fromElementId && !elementIds.has(connector.fromElementId)) errors.push(`${label} fromElementId 未在本页 elementIds[] 注册：${connector.fromElementId}`);
        if (connector.toElementId && !elementIds.has(connector.toElementId)) errors.push(`${label} toElementId 未在本页 elementIds[] 注册：${connector.toElementId}`);
      }
      if (relation.connectorPolicy === "none" && connector.connectorType !== "none") errors.push(`${label} 语义边 ${relation.id} 未授权可见连接器`);
      if (relation.connectorPolicy !== "none" && connector.connectorType !== relation.connectorPolicy) errors.push(`${label} connectorType 必须服从语义边策略 ${relation.connectorPolicy}`);
      if (connector.connectorType === "none" && connector.direction !== "none") errors.push(`${label} none 连接器必须 direction=none`);
      if (connector.connectorType === "arrow") {
        if (!arrowRelations.has(relation.relationType)) errors.push(`${label} ${relation.relationType} 不允许使用 arrow`);
        if (relation.direction !== "directed") errors.push(`${label} arrow 对应的语义边必须为 directed`);
        if (!new Set(["forward", "backward"]).has(connector.direction)) errors.push(`${label} arrow 必须声明 forward 或 backward`);
      }
      if (relation.relationType === "parallel") {
        if (connector.connectorType === "arrow") errors.push(`${label} parallel 不得使用 arrow`);
        if (connector.direction !== "none") errors.push(`${label} parallel 必须 direction=none`);
        if (!["none", "branch", "line", "bracket"].includes(connector.connectorType)) errors.push(`${label} parallel 只能使用 none/branch/line/bracket`);
      }
      if (relation.relationType === "comparison" && connector.connectorType === "arrow") errors.push(`${label} comparison 不得用箭头制造方向`);
      if (["branch", "bracket"].includes(connector.connectorType) && connector.direction !== "none") errors.push(`${label} ${connector.connectorType} 必须 direction=none`);
      if (connector.connectorType === "axis" && relation.relationType !== "temporal") errors.push(`${label} axis 仅可表达 temporal 关系`);
      if (relation.relationType === "causal" && !relation.assertionStatus) errors.push(`${label} causal 关系缺少 assertionStatus`);
      if (relation.relationType === "causal" && relation.assertionStatus === "hypothesis" && connector.certaintyLabel !== "假设") warnings.push(`${label} 因果假设建议显示 certaintyLabel=假设`);
    });
  });

  return { passed: errors.length === 0, errors, warnings, metrics: { connectors: connectorCount, semanticEdges: edgeById.size } };
}

function runCli() {
  const deckFile = path.resolve(process.argv[2] || "");
  const mapFile = path.resolve(process.argv[3] || "");
  if (!fs.existsSync(deckFile) || !fs.existsSync(mapFile)) {
    console.error("Usage: node validate-connector-contract.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json");
    process.exit(2);
  }
  const result = validateConnectorContract(JSON.parse(fs.readFileSync(deckFile, "utf8")), JSON.parse(fs.readFileSync(mapFile, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
