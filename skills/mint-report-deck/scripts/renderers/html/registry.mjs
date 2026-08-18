import { arr, attrList, cjkText, emphasized, escapeHtml as e, normalizedItems, renderConnectors, renderItem, renderSupportModules, sourceText, zoneShell } from "../shared.mjs";

function renderParallel(slide, patternId) {
  const items = normalizedItems(slide);
  return `<div class="v06-parallel v06-parallel--${e(patternId)}" data-pattern-structure="${e(patternId)}" style="--item-count:${Math.max(1, items.length)}">${items.map((item, index) => renderItem(item, index, "v06-parallel__item")).join("")}</div>`;
}

function renderSequence(slide, patternId, vertical = false) {
  const items = normalizedItems(slide);
  const connectors = arr(slide.connectors);
  return `<ol class="v06-sequence v06-sequence--${vertical ? "vertical" : "horizontal"}" data-pattern-structure="${e(patternId)}" style="--item-count:${Math.max(1, items.length)}">${items.map((item, index) => `<li>${renderItem(item, index, "v06-sequence__item")}${index < items.length - 1 ? (connectors[index] ? renderConnectors({ connectors: [connectors[index]] }, 1) : "") : ""}</li>`).join("")}</ol>`;
}

function renderBeforeAfter(slide) {
  const items = normalizedItems(slide).slice(0, 2);
  return `<div class="v06-before-after" data-pattern-structure="before-after">${items.map((item, index) => `<section class="v06-before-after__${index ? "after" : "before"}">${renderItem(item, index, "v06-comparison__item")}</section>${index === 0 && arr(slide.connectors)[0] ? renderConnectors({ connectors: [slide.connectors[0]] }, 1) : ""}`).join("")}</div>`;
}

function renderHierarchy(slide, patternId) {
  const items = normalizedItems(slide);
  return `<div class="v06-hierarchy" data-pattern-structure="${e(patternId)}">${items.map((item, index) => `<section class="v06-hierarchy__level" style="--depth:${index}">${renderItem(item, index, "v06-hierarchy__item")}</section>`).join("")}${renderConnectors(slide, Math.max(0, items.length - 1))}</div>`;
}

function renderRadial(slide) {
  const items = normalizedItems(slide);
  const center = slide.center || slide.pageAnswer || slide.lead || slide.titleLines?.[0] || "核心主题";
  return `<div class="v06-radial" data-pattern-structure="radial-branches" style="--item-count:${Math.max(1, items.length)}"><div class="v06-radial__center">${cjkText(center)}</div><div class="v06-radial__branches">${items.map((item, index) => renderItem(item, index, "v06-radial__item")).join("")}</div></div>`;
}

function renderGrid(slide, patternId) {
  const items = normalizedItems(slide);
  return `<div class="v06-grid v06-grid--${e(patternId)}" data-pattern-structure="${e(patternId)}" style="--item-count:${Math.max(1, items.length)}">${items.map((item, index) => renderItem(item, index, "v06-grid__item")).join("")}</div>`;
}

function renderNumeric(slide) {
  const visual = slide.primaryVisual || {};
  const metrics = arr(visual.data?.metrics);
  const groups = arr(visual.data?.groups);
  if (metrics.length) return `<div class="v06-metrics" data-pattern-structure="numeric-story" style="--item-count:${metrics.length}">${metrics.map((metric,index) => `<article data-atom-refs="${attrList(slide.visibleClaims?.[index]?.atomRefs)}" data-claim-refs="${attrList(metric.claimRefs)}"><small>${cjkText(metric.label || "关键数字")}</small><strong><span class="cjk-token">${e(metric.value)}${e(metric.unit || "")}</span></strong>${metric.detail ? `<p>${cjkText(metric.detail)}</p>` : ""}</article>`).join("")}</div>`;
  if (groups.length) return `<div class="v06-quant-groups" data-pattern-structure="numeric-story">${groups.map((group) => `<article><header><small>${cjkText(group.kicker || "数字关系")}</small><h3>${cjkText(group.label || "")}</h3></header>${group.formula ? `<div class="v06-formula"><span class="cjk-token">${e(group.formula)}</span></div>` : ""}<div class="v06-allocation">${arr(group.segments).map((segment) => `<span style="--segment:${Number(segment.value || 0)}" data-value="${e(segment.value)}" data-unit="${e(segment.unit || "")}" data-claim-ref="${e(segment.claimRef || "")}"><b>${cjkText(segment.label || "")}</b><strong class="cjk-token">${e(segment.value)}${e(segment.unit || "")}</strong></span>`).join("")}</div>${group.implication ? `<p>${cjkText(group.implication)}</p>` : ""}</article>`).join("")}</div>`;
  return renderParallel(slide, "numeric-story");
}

function renderChart(slide) {
  if (!slide.chart) return renderNumeric(slide);
  const model = JSON.stringify(slide.chart).replace(/</g, "\\u003c");
  return `<div class="v06-chart" data-pattern-structure="chart-insight" data-atom-refs="${attrList(slide.primaryVisual?.atomRefs)}" data-mint-chart><div class="chart-toolbar"><div class="chart-legend"></div><label class="chart-range">时间窗口 <input type="range" min="0" value="0"></label></div><div class="chart-plot"></div><div class="chart-tooltip"></div><script type="application/json">${model}</script></div>`;
}

function renderRiskDecision(slide, patternId = "risk-decision") {
  const risk = slide.risk || {};
  const items = normalizedItems(slide);
  const judgment = risk.judgment || slide.decision || slide.pageAnswer || slide.lead || items[0]?.title || "需要管理层关注";
  const evidence = arr(risk.evidence).length ? arr(risk.evidence) : items.slice(0, 2).map((item) => item.title);
  const actions = arr(risk.actions).length ? arr(risk.actions) : arr(slide.actions).map((item) => item.action || item.text).filter(Boolean);
  return `<div class="v06-risk-decision" data-pattern-structure="${e(patternId)}"><section class="v06-risk-decision__judgment" data-atom-refs="${attrList(items[0]?.atomRefs)}"><small>${cjkText(risk.label || "关键判断")}</small><h3>${emphasized(judgment, slide)}</h3></section><section class="v06-risk-decision__evidence" data-atom-refs="${attrList(items.slice(0,2).flatMap((item)=>item.atomRefs))}"><small>依据</small>${evidence.map((text) => `<p>${cjkText(text)}</p>`).join("")}</section><section class="v06-risk-decision__action" data-atom-refs="${attrList(items.slice(2).flatMap((item)=>item.atomRefs))}"><small>需要推动</small>${actions.length ? actions.map((text) => `<p>${cjkText(text)}</p>`).join("") : `<p>${cjkText(slide.lead || "待明确下一步")}</p>`}</section>${renderConnectors(slide, 2)}</div>`;
}

function renderProblemSolution(slide) {
  const items = normalizedItems(slide);
  return `<div class="v06-problem-solution" data-pattern-structure="problem-cause-solution">${items.map((item, index) => `<section data-role="${index === 0 ? "problem" : index === items.length - 1 ? "solution" : "cause"}">${renderItem(item, index, "v06-problem-solution__item")}${index < items.length - 1 && arr(slide.connectors)[index] ? renderConnectors({ connectors: [slide.connectors[index]] }, 1) : ""}</section>`).join("")}</div>`;
}

function renderMedia(slide, context, fullBleed = false) {
  const src = context.mediaUrl(slide.image || slide.media?.source || "");
  const claims = normalizedItems(slide);
  return `<div class="v06-media ${fullBleed ? "v06-media--full" : ""}" data-pattern-structure="${fullBleed ? "full-bleed-media" : "media-evidence"}"><figure data-lightbox>${src ? `<img src="${src}" alt="${e(slide.caption || "汇报证据")}">` : `<div class="v06-media__missing">媒体待提供</div>`}${slide.caption ? `<figcaption>${e(slide.caption)}</figcaption>` : ""}</figure>${fullBleed ? "" : `<div class="v06-media__claims">${claims.map((item, index) => renderItem(item, index, "v06-media__claim")).join("")}</div>`}</div>`;
}

function renderHero(slide) {
  const statement = arr(slide.statementLines).length ? arr(slide.statementLines).join("<br>") : slide.pageAnswer || slide.lead || arr(slide.visibleClaims)[0]?.text || arr(slide.titleLines).join("，");
  return `<div class="v06-hero" data-pattern-structure="hero" data-atom-refs="${attrList(slide.atomRefs)}"><blockquote>${statement.includes("<br>") ? statement.split("<br>").map(cjkText).join("<br>") : cjkText(statement)}</blockquote></div>`;
}

function renderSection(slide) {
  return `<div class="v06-section-intro" data-pattern-structure="section-intro" data-atom-refs="${attrList(slide.atomRefs)}"><span>${e(slide.sectionNumber || "")}</span><h3>${e(slide.sectionTitle || arr(slide.titleLines).join(" "))}</h3><p>${e(slide.sectionClaim || slide.lead || "")}</p></div>`;
}

const renderers = {
  "hero": (slide) => renderHero(slide),
  "split-evidence": (slide) => renderParallel(slide, "split-evidence"),
  "parallel-columns": (slide) => renderParallel(slide, "parallel-columns"),
  "parallel-bands": (slide) => renderParallel(slide, "parallel-bands"),
  "four-grid": (slide) => renderGrid(slide, "four-grid"),
  "card-matrix": (slide) => renderGrid(slide, "card-matrix"),
  "radial-branches": (slide) => renderRadial(slide),
  "layered-capability-chain": (slide) => renderHierarchy(slide, "layered-capability-chain"),
  "horizontal-sequence": (slide) => renderSequence(slide, "horizontal-sequence", false),
  "vertical-sequence": (slide) => renderSequence(slide, "vertical-sequence", true),
  "timeline": (slide) => renderSequence(slide, "timeline", false),
  "before-after": (slide) => renderBeforeAfter(slide),
  "comparison": (slide) => renderParallel(slide, "comparison"),
  "problem-cause-solution": (slide) => renderProblemSolution(slide),
  "hierarchy": (slide) => renderHierarchy(slide, "hierarchy"),
  "numeric-story": (slide) => renderNumeric(slide),
  "chart-insight": (slide) => renderChart(slide),
  "risk-decision": (slide) => renderRiskDecision(slide, "risk-decision"),
  "media-evidence": (slide, context) => renderMedia(slide, context, false),
  "full-bleed-media": (slide, context) => renderMedia(slide, context, true),
  "section-intro": (slide) => renderSection(slide),
  "summary-decision": (slide) => renderRiskDecision(slide, "summary-decision")
};

export const registeredPatternIds = Object.freeze(Object.keys(renderers));

export function renderPatternPrimary(patternId, slide, context) {
  const renderer = renderers[patternId];
  if (!renderer) throw new Error(`V0.6 Pattern没有HTML renderer：${patternId}`);
  const html = renderer(slide, context);
  if (!String(html).trim()) throw new Error(`V0.6 Pattern primary为空：${patternId}`);
  return html;
}

export function renderV06Page(deck, slide, layoutPage, context) {
  if (!layoutPage || layoutPage.status !== "planned") throw new Error(`页面 ${slide.id} 缺少通过校验的Layout Plan`);
  const patternId = layoutPage.patternId;
  const selection = arr(deck.layoutSelection?.selections).find((item) => item.pageId === slide.id);
  if (selection?.patternId && selection.patternId !== patternId) throw new Error(`页面 ${slide.id} Pattern漂移：${selection.patternId} -> ${patternId}`);
  const zones = Object.fromEntries(arr(layoutPage.zones).map((zone) => [zone.id, zone]));
  const titleHtml = `<header class="v06-heading"><h2>${arr(slide.titleLines).map((line) => emphasized(line, slide)).join("<br>")}</h2></header>`;
  const answerHtml = `<p class="v06-page-answer">${emphasized(slide.pageAnswer || slide.lead || "", slide)}</p>`;
  const primaryHtml = `<div class="v06-primary-contract" data-primary-atom-refs="${attrList(slide.atomRefs)}" data-primary-claim-refs="${attrList(slide.primaryVisual?.claimRefs)}">${renderPatternPrimary(patternId, slide, context)}</div>`;
  const supportHtml = renderSupportModules(slide);
  const sourceHtml = `<footer class="v06-source"><span class="brand-mark">mint</span><span>${e(sourceText(slide, deck))}</span><span>${String(context.pageIndex + 1).padStart(2, "0")} / ${String(deck.slides.length).padStart(2, "0")}</span></footer>`;
  return `<div class="v06-layout" data-layout-template="${e(layoutPage.layoutTemplateId)}" data-pattern-id="${e(patternId)}" data-reading-axis="${e(layoutPage.readingAxis || "top-to-bottom")}">${zoneShell(zones.title, titleHtml)}${zoneShell(zones["page-answer"], answerHtml)}${zoneShell(zones.primary, primaryHtml, "v06-zone--focal")}${zones.support ? zoneShell(zones.support, supportHtml) : ""}${zoneShell(zones.source, sourceHtml)}</div>`;
}
