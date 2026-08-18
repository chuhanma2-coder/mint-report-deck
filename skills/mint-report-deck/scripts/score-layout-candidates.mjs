#!/usr/bin/env node

const arr = (value) => Array.isArray(value) ? value : [];

function capacityScore(pattern, nodeCount) {
  const min = pattern.cardinality.min;
  const max = pattern.cardinality.max;
  if (min === max) return nodeCount === min ? 20 : 0;
  const midpoint = (min + max) / 2;
  const halfRange = Math.max((max - min) / 2, 1);
  return Math.max(8, 20 - Math.abs(nodeCount - midpoint) / halfRange * 8);
}

export function scoreLayoutCandidates(candidates, request, adjacentPageSummary = {}) {
  return candidates.map((pattern) => {
    const semantic = 50;
    const capacity = capacityScore(pattern, request.nodeCount);
    const proof = arr(pattern.dataShapes).includes(request.dataShape) ? 15 : 0;
    const rhythm = adjacentPageSummary.lastPatternId === pattern.id ? 2 : adjacentPageSummary.lastRendererKey === pattern.rendererKeys.html ? 6 : 10;
    const media = request.dataShape === "media" ? (pattern.dataShapes.includes("media") ? 5 : 0) : 5;
    const total = semantic + capacity + proof + rhythm + media;
    return {
      patternId: pattern.id,
      total: Number(total.toFixed(2)),
      score: { semantic, capacity: Number(capacity.toFixed(2)), proof, rhythm, media },
      reason: `语义硬匹配；容量${pattern.cardinality.min}-${pattern.cardinality.max}项；阅读轴${request.readingAxis}；连接策略${request.connectorPolicy}`
    };
  }).sort((a, b) => b.total - a.total || a.patternId.localeCompare(b.patternId, "en"));
}
