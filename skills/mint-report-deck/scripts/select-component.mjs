const has = (value) => value !== undefined && value !== null && value !== "";

function evidenceContract(numeric) {
  const labels = numeric?.labels;
  const values = numeric?.values;
  const aligned = Array.isArray(labels) && Array.isArray(values) && labels.length > 0 && labels.length === values.length;
  return Boolean(aligned && has(numeric.unit) && has(numeric.period) && Array.isArray(numeric.sourceRefs) && numeric.sourceRefs.length);
}

function result(component, reason, confidence = "high") {
  return { component, reason, confidence };
}

export function selectComponent(page) {
  const relationship = page.relationship || "one-conclusion";
  const n = page.numericEvidence || null;

  if (page.numbersAreOrdinal || page.numbersAreDecorative) {
    if (relationship === "sequence") return result("process", "step numbers express order, not magnitude");
    return result("takeaway", "decorative or ordinal numbers cannot trigger a chart");
  }

  const quantitativeRelationships = new Set([
    "trend", "quantity", "comparison", "part-to-whole", "distribution", "correlation",
    "matrix", "flow", "funnel", "change-bridge", "target", "geography"
  ]);
  if (quantitativeRelationships.has(relationship) && !evidenceContract(n)) {
    return result("needs-review", "numeric visual requires aligned values, labels, unit, period and sourceRefs", "blocked");
  }

  if (relationship === "trend") {
    if (!n.orderedTime) return result("needs-review", "trend requires a naturally ordered time axis", "blocked");
    if ((n.seriesCount || 1) > 4) return result("small-multiples", "more than four time series would make a shared line chart unreadable");
    if (n.emphasizeVolume === true) return result("area", "ordered time series where accumulated volume is the message");
    return result("line", "ordered time series; slope and turning points are the analytical focus");
  }

  if (relationship === "comparison" || relationship === "quantity") {
    if (n.target !== undefined && (n.values?.length || 0) === 1) return result("bullet", "one actual value is compared with a target");
    if (n.longLabels || (n.labels?.length || 0) > 7) return result("bar-horizontal", "long or numerous category labels need a shared horizontal baseline");
    if ((n.seriesCount || 1) > 3) return result("dot-plot", "many series are easier to compare as points than clustered bars");
    return result("column", "a small set of categories can be compared from a common zero baseline");
  }

  if (relationship === "part-to-whole") {
    const positive = n.values.every((value) => Number(value) >= 0);
    if (!positive) return result("needs-review", "part-to-whole charts cannot contain negative values", "blocked");
    if (n.multipleWholes || n.orderedTime) return result("100%-stacked-bar", "composition is compared across several wholes or periods");
    if (n.values.length >= 2 && n.values.length <= 5) return result("donut", "one positive whole with no more than five parts");
    return result("bar-horizontal", "too many parts for a readable donut; rank them on a common baseline");
  }

  if (relationship === "distribution") {
    return n.showOutliers || n.compareGroups ? result("box-plot", "distribution comparison needs median, spread and outliers") : result("histogram", "frequency by numeric bins shows the shape of one distribution");
  }

  if (relationship === "correlation") {
    if (!Array.isArray(n.xValues) || n.xValues.length !== n.values.length) return result("needs-review", "correlation requires paired x/y observations", "blocked");
    return n.sizeValues ? result("bubble", "paired x/y observations include a third magnitude") : result("scatter", "paired observations reveal association without implying causation");
  }

  if (relationship === "matrix") {
    if (!n.rows?.length || !n.columns?.length || n.values.length !== n.rows.length * n.columns.length) return result("needs-review", "heatmap requires a complete row-by-column numeric matrix", "blocked");
    return result("heatmap", "two categorical dimensions share one comparable numeric scale");
  }

  if (relationship === "funnel") {
    return n.sameCohort && n.orderedStages ? result("funnel", "ordered stages share a valid cohort and denominator") : result("needs-review", "funnel requires ordered stages from the same cohort", "blocked");
  }

  if (relationship === "flow") {
    if (n.weightedLinks && n.reconciledTotals) return result("sankey", "reconciled weighted links show movement between sources and destinations");
    return result("process", "unweighted movement is clearer as a process, not a Sankey diagram");
  }

  if (relationship === "change-bridge") {
    return n.reconcilesOpeningClosing ? result("waterfall", "additive contributions reconcile opening and closing values") : result("needs-review", "waterfall contributions must reconcile to the closing value", "blocked");
  }

  if (relationship === "target") return result((n.values?.length || 0) === 1 ? "bullet" : "progress", "actual performance is evaluated against a confirmed target");
  if (relationship === "geography") return result(n.precisionFirst ? "ranked-bar" : "map", n.precisionFirst ? "ranking supports precise geographic comparison" : "location pattern is the analytical focus");

  const nonChart = {
    sequence: "process", time: page.hasDurations ? "gantt" : "timeline", cause: "causal-chain",
    roles: "swimlane", hierarchy: page.numericHierarchy ? "treemap" : "layered-architecture",
    "exact-values": "table", action: "decision", "one-conclusion": "takeaway", opening: "cover"
  };
  return result(nonChart[relationship] || "takeaway", `relationship '${relationship}' selects a controlled non-chart component`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(selectComponent(JSON.parse(process.argv[2])), null, 2));
}
