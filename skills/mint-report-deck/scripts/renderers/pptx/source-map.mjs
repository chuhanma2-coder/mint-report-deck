const SOURCE = Object.freeze({
  architecture: 3,
  process: 5,
  timeline: 6,
  capabilityBands: 7,
  comparison: 8,
  matrix: 9,
  chart: 11,
  decision: 13,
  capabilityChain: 14,
  risk: 15,
  metrics: 17,
  actualTarget: 18,
  threshold: 19,
  allocation: 20,
  formulaGap: 21,
  quantitativeComparison: 22,
  scenario: 23,
  section: 24,
  closing: 25
});

function visualKind(slide) {
  return slide?.primaryVisual?.kind || slide?.visualKind || "";
}

export function sourceSlideFor(slide) {
  const kind = visualKind(slide);
  if (slide.type === "section-intro") return { sourceSlide: SOURCE.section, recipe: "section" };
  if (slide.type === "closing") return { sourceSlide: SOURCE.closing, recipe: "closing" };
  if (slide.type === "architecture-brief" || kind === "hierarchy" || kind === "layered-architecture") return { sourceSlide: SOURCE.architecture, recipe: "architecture" };
  if (slide.type === "capability-chain" || kind === "capability-chain") {
    const count = Array.isArray(slide.stages) ? slide.stages.length : 0;
    return count > 3
      ? { sourceSlide: SOURCE.capabilityBands, recipe: "capability-bands" }
      : { sourceSlide: SOURCE.capabilityChain, recipe: "capability-chain" };
  }
  if (slide.type === "process" || ["process", "sequence", "problem-cause-solution"].includes(kind)) return { sourceSlide: SOURCE.process, recipe: "process" };
  if (slide.type === "timeline" || kind === "timeline") return { sourceSlide: SOURCE.timeline, recipe: "timeline" };
  if (slide.type === "comparison" || ["comparison", "before-after"].includes(kind)) return { sourceSlide: SOURCE.comparison, recipe: "comparison" };
  if (slide.type === "matrix" || kind === "matrix") return { sourceSlide: SOURCE.matrix, recipe: "matrix" };
  if (slide.type === "chart" || ["trend-chart", "ranked-comparison", "distribution"].includes(kind)) return { sourceSlide: SOURCE.chart, recipe: "chart" };
  if (slide.type === "risk-spotlight" || kind === "risk-alert") return { sourceSlide: SOURCE.risk, recipe: "risk" };
  if (slide.type === "decision") return { sourceSlide: SOURCE.decision, recipe: "decision" };
  if (slide.type === "quantitative-story") {
    if (kind === "gap-bridge") return { sourceSlide: SOURCE.quantitativeComparison, recipe: "quantitative-comparison" };
    if (kind === "actual-target") return { sourceSlide: SOURCE.actualTarget, recipe: "actual-target" };
    if (kind === "threshold-bar") return { sourceSlide: SOURCE.threshold, recipe: "threshold" };
    if (kind === "allocation-bar") return { sourceSlide: SOURCE.allocation, recipe: "allocation" };
    if (kind === "formula-band") return { sourceSlide: SOURCE.formulaGap, recipe: "formula-gap" };
    if (kind === "scenario-comparison" || kind === "range-band") return { sourceSlide: SOURCE.scenario, recipe: "scenario" };
    return { sourceSlide: SOURCE.metrics, recipe: "metrics" };
  }
  if (slide.type === "statement" || slide.type === "summary") return { sourceSlide: SOURCE.decision, recipe: "decision" };
  throw new Error(`needs-layout-review: no controlled PPTX source page for type=${slide.type || "<empty>"}, visual=${kind || "<empty>"}`);
}

export function buildFrameMap(deck) {
  return {
    schemaVersion: "1.0",
    source: "assets/presentation/Mint_Report_Component_Library.pptx",
    outputSlides: deck.slides.map((slide, index) => {
      const route = sourceSlideFor(slide);
      return {
        outputSlide: index + 1,
        sourceSlide: route.sourceSlide,
        recipe: route.recipe,
        narrativeRole: slide.pageRole || slide.type || route.recipe,
        reuseMode: "duplicate-slide",
        editTargets: ["chapter", "page-number", "footer-page", "page-title", "page-lead", "source", `${route.recipe}-content`]
      };
    })
  };
}
