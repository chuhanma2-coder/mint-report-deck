#!/usr/bin/env node
import { selectComponent } from "./select-component.mjs";

const input = JSON.parse(process.argv[2] || "{}");
const selected = selectComponent(input);
const families = {
  cover: { required: ["title"], optional: ["subtitle", "brand-visual"] },
  "section-intro": { required: ["section-number", "section-claim"], optional: ["section-question"] },
  statement: { required: ["claim"], optional: ["evidence-note", "decision-callout"] },
  "capability-chain": { required: ["linked-stages"], optional: ["context-ribbon", "capital-callout", "risk-alert", "decision-callout"] },
  "architecture-brief": { required: ["layers"], optional: ["context-ribbon"] },
  process: { required: ["ordered-steps"], optional: ["focus-step"] },
  timeline: { required: ["milestones"], optional: ["decision-callout"] },
  "dual-track-roadmap": { required: ["two-tracks"], optional: ["action-banner", "capital-callout"] },
  swimlane: { required: ["actors", "responsibilities"], optional: ["handoffs"] },
  comparison: { required: ["shared-dimensions"], optional: ["recommendation"] },
  matrix: { required: ["two-dimensions"], optional: ["highlight-cell"] },
  table: { required: ["exact-values"], optional: ["evidence-note"] },
  chart: { required: ["numeric-evidence"], optional: ["implication"] },
  heatmap: { required: ["complete-matrix"], optional: ["highlight-cell"] },
  media: { required: ["media"], optional: ["caption", "claim"] },
  "risk-spotlight": { required: ["risk-judgment"], optional: ["evidence", "impact", "action"] },
  decision: { required: ["decision"], optional: ["actions", "capital-callout", "risk-alert"] }
};
const requestedFamily = input.preferredFamily || selected.component;
const familyName = String(requestedFamily).split(":")[0] === "chart" ? "chart" : requestedFamily;
const family = families[familyName];
const secondaryBlocks = Number(input.secondaryBlocks || 0);
const calloutCount = Math.min(Number(input.calloutCount || 0), 2);
const estimatedVisualShare = Math.max(0.3, 0.72 - secondaryBlocks * 0.08 - calloutCount * 0.06);
const result = family ? {
  status: estimatedVisualShare >= 0.55 ? "ready" : "split-required",
  family: familyName,
  modules: family,
  estimatedVisualShare,
  reason: estimatedVisualShare >= 0.55 ? selected.reason : "primary relationship would receive less than 55% of the usable canvas"
} : {
  status: "needs-layout-review",
  family: null,
  modules: null,
  estimatedVisualShare: 0,
  reason: "no controlled page family expresses this relationship; do not fall back to a table or card grid"
};
console.log(JSON.stringify(result, null, 2));
