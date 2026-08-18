const arr = (value) => Array.isArray(value) ? value : [];

function shapeMap(slide) {
  return new Map(arr(slide.shapes?.items).map((shape) => [shape.name, shape]));
}

function setText(map, name, value, required = false) {
  const shape = map.get(name);
  if (!shape) {
    if (required) throw new Error(`missing inherited edit target: ${name}`);
    return;
  }
  shape.text = value == null ? "" : String(value);
  shape.text.style = { autoFit: "shrinkText", wrap: "square", typeface: "PingFang SC" };
}

function removeByPrefix(slide, prefixes) {
  for (const shape of [...arr(slide.shapes?.items)]) {
    if (prefixes.some((prefix) => String(shape.name || "").startsWith(prefix))) shape.delete();
  }
}

function removeByNames(slide, names) {
  const set = new Set(names);
  for (const shape of [...arr(slide.shapes?.items)]) if (set.has(shape.name)) shape.delete();
}

function common(slide, source, slideData, pageIndex, pageCount) {
  try {
    const inheritedTitle = slide.placeholders.getItem("title");
    if (inheritedTitle) inheritedTitle.text = "";
  } catch {
    // Some source slides intentionally have no title placeholder.
  }
  const map = shapeMap(slide);
  const title = arr(slideData.titleLines).filter(Boolean).join("\n") || slideData.title || "";
  setText(map, "chapter", slideData.chapter || "MINT 汇报");
  setText(map, "page-number", String(pageIndex + 1).padStart(2, "0"));
  setText(map, "footer-page", `${String(pageIndex + 1).padStart(2, "0")} / ${String(pageCount).padStart(2, "0")}`);
  setText(map, "page-title", title);
  setText(map, "page-lead", slideData.lead || "");
  setText(map, "source", source || slideData.source || "来源：用户提供材料");
  return map;
}

function editCapabilityChain(slide, map, data) {
  const stages = arr(data.stages);
  if (!stages.length || stages.length > 3) throw new Error("capability-chain requires 1-3 stages");
  for (let i = 0; i < 3; i += 1) {
    const stage = stages[i];
    if (!stage) {
      removeByNames(slide, [`chain-node-${i}`, `chain-no-${i}`, `chain-role-${i}`, `chain-name-${i}`, `chain-entities-${i}`, `chain-capability-${i}`]);
      continue;
    }
    setText(map, `chain-no-${i}`, String(i + 1).padStart(2, "0"));
    setText(map, `chain-role-${i}`, stage.role || "");
    setText(map, `chain-name-${i}`, stage.name || "");
    setText(map, `chain-entities-${i}`, arr(stage.entities).join("\n"));
    setText(map, `chain-capability-${i}`, stage.capability || stage.detail || "");
  }
  const callout = data.emphasis?.callouts?.[0];
  setText(map, "chain-callout-title", callout?.value || arr(data.titleLines)[0] || "核心结论");
  setText(map, "chain-callout-detail", callout?.detail || data.pageAnswer || data.lead || "");
  setText(map, "chain-callout-kicker", callout?.label || "核心判断");
}

function editCapabilityBands(slide, map, data) {
  const stages = arr(data.stages);
  if (!stages.length || stages.length > 4) throw new Error("capability-bands requires 1-4 stages");
  for (let i = 0; i < 4; i += 1) {
    const stage = stages[i];
    if (!stage) {
      removeByPrefix(slide, [`lane-${i}`]);
      removeByNames(slide, [`lane-actor-${i}`]);
      continue;
    }
    setText(map, `lane-actor-${i}`, stage.name || stage.role || `能力 ${i + 1}`);
    const cells = [stage.role, arr(stage.entities).join(" · "), stage.capability, stage.detail];
    cells.forEach((value, j) => setText(map, `lane-${i}-${j}`, value || ""));
  }
}

function editProcess(slide, map, data) {
  const items = arr(data.items?.length ? data.items : data.steps);
  if (!items.length || items.length > 5) throw new Error("process requires 1-5 items");
  const centers = items.length === 1 ? [640] : items.map((_, i) => 145 + i * (990 / (items.length - 1)));
  for (let i = 0; i < 5; i += 1) {
    const item = items[i];
    if (!item) {
      removeByNames(slide, [`process-${i}`, `process-no-${i}`, `process-title-${i}`, `process-detail-${i}`]);
      continue;
    }
    const center = centers[i];
    const node = map.get(`process-${i}`);
    if (node) node.position = { ...node.position, left: center - 18 };
    for (const [name, left, width] of [[`process-no-${i}`, center - 90, 180], [`process-title-${i}`, center - 100, 200], [`process-detail-${i}`, center - 100, 200]]) {
      const shape = map.get(name);
      if (shape) shape.position = { ...shape.position, left, width };
    }
    setText(map, `process-no-${i}`, String(i + 1).padStart(2, "0"));
    setText(map, `process-title-${i}`, item.title || item.name || "");
    setText(map, `process-detail-${i}`, item.detail || item.description || "");
  }
}

function editArchitecture(slide, map, data) {
  const stages = arr(data.stages);
  if (!stages.length || stages.length > 3) throw new Error("architecture requires 1-3 layers");
  for (let i = 0; i < 3; i += 1) {
    const stage = stages[i];
    if (!stage) {
      removeByPrefix(slide, [`layer-${i}`, `layer-accent-${i}`, `layer-no-${i}`, `layer-name-${i}`, `layer-role-${i}`, `entity-a-${i}`, `entity-b-${i}`]);
      continue;
    }
    const entities = arr(stage.entities);
    setText(map, `layer-no-${i}`, String(i + 1).padStart(2, "0"));
    setText(map, `layer-name-${i}`, stage.name || `层级 ${i + 1}`);
    setText(map, `layer-role-${i}`, stage.role || "");
    setText(map, `entity-a-${i}-title`, entities[0] || "");
    setText(map, `entity-a-${i}-detail`, stage.capability || "");
    setText(map, `entity-b-${i}-title`, entities.slice(1).join(" / "));
    setText(map, `entity-b-${i}-detail`, stage.detail || "");
  }
}

function editMetrics(slide, map, data) {
  const metrics = arr(data.primaryVisual?.data?.metrics || data.metrics);
  if (!metrics.length || metrics.length > 4) throw new Error("metrics requires 1-4 metrics");
  const supporting = arr(data.supportModules).slice(0, Math.max(0, 4 - metrics.length)).map((module)=>({
    value: module.data?.label || "补充判断",
    unit: "",
    label: module.data?.value || "",
    detail: module.data?.detail || ""
  }));
  const cards = [...metrics, ...supporting];
  for (let i = 0; i < 4; i += 1) {
    const metric = cards[i];
    if (!metric) {
      removeByNames(slide, [`metric-${i}`, `metric-top-${i}`, `metric-value-${i}`, `metric-label-${i}`, `metric-note-${i}`]);
      continue;
    }
    setText(map, `metric-value-${i}`, `${metric.value ?? ""}${metric.unit || ""}`);
    setText(map, `metric-label-${i}`, metric.label || "");
    setText(map, `metric-note-${i}`, metric.detail || "");
  }
}

function editQuantitativeComparison(slide, map, data) {
  const groups = arr(data.primaryVisual?.data?.groups);
  if (groups.length !== 2) throw new Error("quantitative-comparison requires exactly 2 groups");
  groups.forEach((group, i) => {
    setText(map, `qcmp-country-${i}`, group.label || group.id || "");
    setText(map, `qcmp-formula-${i}`, group.formula || group.headline || "");
    setText(map, `qcmp-conclusion-${i}`, group.implication || "");
    const segments = arr(group.segments);
    for (let j = 0; j < 3; j += 1) {
      const segment = segments[j];
      const label = map.get(`qcmp-bar-${i}-segment-label-${j}`);
      const value = map.get(`qcmp-bar-${i}-segment-value-${j}`);
      if (segment) {
        if (label) label.text = segment.label || "";
        if (value) value.text = segment.showValue === false ? "" : `${segment.value}${segment.unit || ""}`;
      } else {
        label?.delete(); value?.delete();
      }
    }
  });
}

function editChart(slide, map, data) {
  const chartData = data.primaryVisual?.data || data.chart || {};
  const categories = arr(chartData.categories);
  const series = arr(chartData.series);
  const charts = arr(slide.charts?.items);
  if (!categories.length || !series.length || !charts.length) throw new Error("chart page requires categories, series and inherited native chart object");
  const chart = charts.find((item) => item.chartType === "line") || charts[0];
  chart.title = chartData.title || "";
  chart.hasLegend = series.length > 1;
  series.forEach((item, index) => {
    const target = chart.series.items?.[index];
    if (!target) throw new Error(`source chart lacks series ${index + 1}`);
    target.name = item.name || `系列 ${index + 1}`;
    target.categories = categories;
    target.values = arr(item.values).map(Number);
  });
  for (const other of charts) {
    if (other === chart) continue;
    const first = other.series.items?.[0];
    if (first) {
      first.name = series[0].name || "系列 1";
      first.categories = categories;
      first.values = arr(series[0].values).map(Number);
    }
  }
  setText(map, "chart-note", [chartData.unit && `单位：${chartData.unit}`, chartData.period && `期间：${chartData.period}`, chartData.subject && `统计对象：${chartData.subject}`].filter(Boolean).join("  ·  "));
}

function editRisk(slide, map, data) {
  const modules = arr(data.supportModules);
  const evidence = modules.find((item) => /evidence|basis/.test(item.kind))?.data || {};
  const action = modules.find((item) => /action|decision/.test(item.kind))?.data || {};
  setText(map, "risk-title", data.pageAnswer || arr(data.titleLines).join("\n"));
  setText(map, "risk-summary", data.lead || "");
  setText(map, "risk-side-value-0", evidence.value || "依据见原始材料");
  setText(map, "risk-side-value-1", data.impact || modules[0]?.data?.detail || "");
  setText(map, "risk-side-value-2", action.value || data.action || "待确认行动");
}

function editDecision(slide, map, data) {
  setText(map, "decision-copy", data.pageAnswer || arr(data.titleLines).join("\n"));
  setText(map, "decision-reason", data.lead || "");
  const actions = arr(data.actions || data.items).slice(0, 3);
  actions.forEach((item, i) => {
    setText(map, `decision-action-${i}-title`, item.title || item.action || "");
    setText(map, `decision-action-${i}-detail`, item.detail || [item.owner, item.time].filter(Boolean).join(" · "));
  });
}

export function editMintSlide(slide, frame, slideData, pageIndex, pageCount) {
  const map = common(slide, slideData.source, slideData, pageIndex, pageCount);
  switch (frame.recipe) {
    case "capability-chain": editCapabilityChain(slide, map, slideData); break;
    case "capability-bands": editCapabilityBands(slide, map, slideData); break;
    case "process": editProcess(slide, map, slideData); break;
    case "architecture": editArchitecture(slide, map, slideData); break;
    case "metrics": editMetrics(slide, map, slideData); break;
    case "quantitative-comparison": editQuantitativeComparison(slide, map, slideData); break;
    case "chart": editChart(slide, map, slideData); break;
    case "risk": editRisk(slide, map, slideData); break;
    case "decision": editDecision(slide, map, slideData); break;
    default: throw new Error(`needs-layout-review: PPTX recipe ${frame.recipe} is mapped but not yet implemented`);
  }
  const relation = slideData.primaryVisual?.kind || slideData.visualBrief?.relationship || slideData.type;
  const notes = [
    slideData.pageQuestion && `页面问题：${slideData.pageQuestion}`,
    slideData.pageAnswer && `页面结论：${slideData.pageAnswer}`,
    relation && `主关系：${relation}`,
    arr(slideData.atomRefs).length && `AtomRefs：${arr(slideData.atomRefs).join(", ")}`,
    arr(slideData.sourceRefs).length && `来源引用：${arr(slideData.sourceRefs).join(", ")}`
  ].filter(Boolean).join("\n");
  if (notes) slide.speakerNotes.textFrame.setText(notes);
}
