#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const relationTypes = new Set(["parallel", "sequence", "temporal", "causal", "comparison", "hierarchy", "composition", "flow", "evidence", "before-after", "problem-cause-solution", "dependency"]);
const nodeKinds = new Set(["atom", "entity", "numeric-claim", "action", "decision-thread", "unknown"]);
const directions = new Set(["directed", "undirected", "none"]);
const connectorPolicies = new Set(["none", "branch", "line", "arrow", "bracket", "axis"]);
const orderBasisTypes = new Set(["none", "explicit-marker", "timestamp", "dependency", "input-output-handoff"]);
const orderedRelations = new Set(["sequence", "temporal", "flow", "before-after", "dependency"]);
const directedRelations = new Set(["sequence", "temporal", "causal", "flow", "before-after", "dependency"]);
const arr = (value) => Array.isArray(value) ? value : [];

export function validateSemanticGraph(input) {
  const graph = input?.semanticGraph || input;
  const errors = [];
  const warnings = [];

  if (!graph || typeof graph !== "object" || Array.isArray(graph)) {
    return { passed: false, errors: ["semanticGraph 必须为对象"], warnings };
  }
  if (graph.schemaVersion !== "0.6") errors.push("semanticGraph.schemaVersion 必须为 0.6");
  if (!String(graph.sourceContentMapVersion || "").trim()) errors.push("semanticGraph.sourceContentMapVersion 缺失");
  if (!Array.isArray(graph.nodes) || graph.nodes.length < 1) errors.push("semanticGraph.nodes 至少需要一个节点");
  if (!Array.isArray(graph.edges)) errors.push("semanticGraph.edges 必须为数组");
  if (!Array.isArray(graph.migrationWarnings)) errors.push("semanticGraph.migrationWarnings 必须为数组");

  const nodeIds = new Set();
  arr(graph.nodes).forEach((node, index) => {
    const label = `nodes[${index}]`;
    if (!String(node?.id || "").trim()) errors.push(`${label} 缺少 id`);
    else if (nodeIds.has(node.id)) errors.push(`${label} id 重复：${node.id}`);
    else nodeIds.add(node.id);
    if (!nodeKinds.has(node?.kind)) errors.push(`${label} kind 无效`);
    if (!String(node?.label || "").trim()) errors.push(`${label} 缺少 label`);
    if (!arr(node?.sourceRefs).length || arr(node?.sourceRefs).some((ref) => !String(ref || "").trim())) errors.push(`${label} 必须包含有效 sourceRefs`);
  });

  const edgeIds = new Set();
  arr(graph.edges).forEach((edge, index) => {
    const label = `edges[${index}]`;
    if (!String(edge?.id || "").trim()) errors.push(`${label} 缺少 id`);
    else if (edgeIds.has(edge.id)) errors.push(`${label} id 重复：${edge.id}`);
    else edgeIds.add(edge.id);
    if (!nodeIds.has(edge?.source)) errors.push(`${label} source 未引用有效节点：${edge?.source || "<empty>"}`);
    if (!nodeIds.has(edge?.target)) errors.push(`${label} target 未引用有效节点：${edge?.target || "<empty>"}`);
    if (edge?.source && edge.source === edge.target) errors.push(`${label} 不得连接同一节点`);
    if (!relationTypes.has(edge?.relationType)) errors.push(`${label} relationType 无效`);
    if (!directions.has(edge?.direction)) errors.push(`${label} direction 无效`);
    if (!connectorPolicies.has(edge?.connectorPolicy)) errors.push(`${label} connectorPolicy 无效`);
    if (!Number.isFinite(edge?.confidence) || edge.confidence < 0 || edge.confidence > 1) errors.push(`${label} confidence 必须在 0 到 1 之间`);
    if (!arr(edge?.evidenceRefs).length || arr(edge?.evidenceRefs).some((ref) => !String(ref || "").trim())) errors.push(`${label} 必须包含有效 evidenceRefs`);
    if (!edge?.orderBasis || !orderBasisTypes.has(edge.orderBasis.type)) errors.push(`${label} orderBasis.type 无效`);

    if (directedRelations.has(edge?.relationType) && edge?.direction !== "directed") errors.push(`${label} ${edge?.relationType} 必须为 directed`);
    if (orderedRelations.has(edge?.relationType) && (!edge?.orderBasis || edge.orderBasis.type === "none")) errors.push(`${label} ${edge?.relationType} 缺少可验证的 orderBasis`);
    if (edge?.relationType === "parallel") {
      if (edge.direction === "directed") errors.push(`${label} parallel 不得为 directed`);
      if (edge.connectorPolicy === "arrow") errors.push(`${label} parallel 不得授权 arrow`);
      if (edge.orderBasis?.type !== "none") warnings.push(`${label} parallel 不需要 orderBasis，建议使用 none`);
    }
    if (edge?.connectorPolicy === "arrow" && edge?.direction !== "directed") errors.push(`${label} arrow 只能用于 directed edge`);
    if (edge?.relationType === "causal") {
      if (!new Set(["confirmed", "proposal", "hypothesis"]).has(edge.assertionStatus)) errors.push(`${label} causal 必须声明 assertionStatus`);
      if (edge.assertionStatus === "confirmed" && !arr(edge.evidenceRefs).length) errors.push(`${label} confirmed causal 缺少证据`);
    }
  });

  arr(graph.migrationWarnings).forEach((warning, index) => {
    if (!String(warning || "").trim()) errors.push(`migrationWarnings[${index}] 不能为空`);
  });
  if (arr(graph.migrationWarnings).length) warnings.push(`存在 ${graph.migrationWarnings.length} 条迁移关系待 P0-02 重新编译`);

  return { passed: errors.length === 0, errors, warnings };
}

function runCli() {
  const file = path.resolve(process.argv[2] || "");
  if (!process.argv[2] || !fs.existsSync(file)) {
    console.error("Usage: node validate-semantic-graph.mjs /absolute/path/semantic-graph-or-content-map.json");
    process.exit(2);
  }
  let input;
  try {
    input = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.log(JSON.stringify({ passed: false, errors: [`JSON 无法解析：${error.message}`], warnings: [] }, null, 2));
    process.exit(1);
  }
  const result = validateSemanticGraph(input);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
