#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const input = path.resolve(process.argv[2] || "");
const output = path.resolve(process.argv[3] || "report.html");
if (!process.argv[2] || !fs.existsSync(input)) {
  console.error("Usage: node render-deck.mjs /absolute/path/deck.json /absolute/path/report.html");
  process.exit(2);
}
const deck = JSON.parse(fs.readFileSync(input, "utf8"));
const css = fs.readFileSync(path.join(root, "assets/runtime/mint-runtime.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/runtime/mint-runtime.js"), "utf8");
const e = (v = "") => String(v).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const arr = (v) => Array.isArray(v) ? v : [];
const title = (s) => arr(s.titleLines).map(e).join("<br>");
const emphasized = (value, slide) => {
  let safe = e(value);
  for (const term of arr(slide?.emphasis?.terms).sort((a, b) => String(b).length - String(a).length)) {
    const escaped = e(term);
    safe = safe.split(escaped).join(`<strong class="term-emphasis">${escaped}</strong>`);
  }
  return safe;
};
const callouts = (slide) => arr(slide.emphasis?.callouts).length ? `<aside class="emphasis-rail">${arr(slide.emphasis.callouts).map((x) => `<article class="callout callout--${e(x.kind)}"><small>${e(x.label)}</small><strong>${e(x.value)}</strong>${x.detail ? `<p>${e(x.detail)}</p>` : ""}</article>`).join("")}</aside>` : "";
const numericSupport = (slide) => arr(slide.supportModules).length ? `<div class="quant-support">${arr(slide.supportModules).map((module) => `<article class="quant-support__item quant-support__item--${e(module.kind)}" data-claim-refs="${e(arr(module.claimRefs).join(" "))}"><small>${e(module.data?.label || module.kind)}</small><strong>${e(module.data?.value || module.data?.text || "")}</strong>${module.data?.detail ? `<p>${e(module.data.detail)}</p>` : ""}</article>`).join("")}</div>` : "";
const supportBand = (slide) => arr(slide.supportModules).length ? `<div class="support-band">${arr(slide.supportModules).map((module) => `<article class="support-band__item support-band__item--${e(module.kind)}"><small>${e(module.data?.label || module.kind)}</small><strong>${e(module.data?.value || module.data?.text || "")}</strong>${module.data?.detail ? `<p>${e(module.data.detail)}</p>` : ""}</article>`).join("")}</div>` : "";
function quantitativeVisual(slide) {
  const visual = slide.primaryVisual || {};
  const data = visual.data || {};
  const groups = arr(data.groups);
  if (["hero-metric", "metric-strip"].includes(visual.kind)) {
    const metrics = arr(data.metrics).length ? arr(data.metrics) : groups;
    return `<div class="metric-stage metric-stage--${e(visual.kind)}">${metrics.map((metric) => `<article data-claim-refs="${e(arr(metric.claimRefs).join(" "))}"><small>${e(metric.label || metric.subject)}</small><strong class="quant-value">${e(metric.value)}<em>${e(metric.unit || "")}</em></strong>${metric.detail ? `<p>${e(metric.detail)}</p>` : ""}</article>`).join("")}</div>`;
  }
  return `<div class="quant-groups quant-groups--${e(visual.kind)}" data-primary-visual="${e(visual.kind)}" data-claim-refs="${e(arr(visual.claimRefs).join(" "))}">${groups.map((group) => {
    const segments = arr(group.segments);
    const total = Number(group.total ?? (segments.every((segment) => segment.unit === "%") ? 100 : Math.max(1, segments.reduce((sum, segment) => sum + Number(segment.value || 0), 0))));
    const threshold = group.threshold ? Math.max(0, Math.min(100, Number(group.threshold.value) / total * 100)) : null;
    const segmentHtml = segments.map((segment) => {
      const width = Math.max(0, Number(segment.value || 0) / total * 100);
      const compact = width < 10 && segment.showValue !== false;
      return `<button class="quant-segment quant-segment--${e(segment.tone || "jade")}${compact ? " quant-segment--compact" : ""}" style="--segment:${width}%" title="${e(segment.label)}${segment.showValue === false ? "" : `：${e(segment.value)}${e(segment.unit || "")}`}" data-value="${e(segment.value)}" data-unit="${e(segment.unit || "")}" data-claim-ref="${e(segment.claimRef || "")}">${compact ? "" : `<span>${e(segment.label)}</span>`}${segment.showValue === false ? "" : `<strong data-structured-value>${e(segment.value)}${e(segment.unit || "")}</strong>`}</button>`;
    }).join("");
    const metrics = arr(group.metrics).map((metric) => `<span><small>${e(metric.label)}</small><b>${e(metric.value)}${e(metric.unit || "")}</b></span>`).join("");
    return `<article class="quant-group" data-group="${e(group.id || group.label)}" data-total="${e(total)}"><header><div><small>${e(group.kicker || "权益结构")}</small><h3>${emphasized(group.label || "", slide)}</h3></div><strong class="quant-headline">${e(group.headline || "")}</strong></header>${group.formula ? `<div class="formula-band"><span>${e(group.formulaLabel || "计算")}</span><strong>${e(group.formula)}</strong></div>` : ""}${segments.length ? `<div class="allocation-wrap"><div class="allocation-bar">${segmentHtml}${threshold != null ? `<span class="threshold-marker" style="--threshold:${threshold}%" data-value="${e(group.threshold.value)}" data-unit="${e(group.threshold.unit || "")}" data-claim-ref="${e(group.threshold.claimRef || "")}"><i></i><b>${e(group.threshold.label || "阈值")} ${e(group.threshold.value)}${e(group.threshold.unit || "")}</b></span>` : ""}</div></div>` : ""}${metrics ? `<div class="quant-metrics">${metrics}</div>` : ""}${group.implication ? `<p class="quant-implication">${e(group.implication)}</p>` : ""}</article>`;
  }).join("")}</div>`;
}
const mime = (p) => ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4" }[path.extname(p).toLowerCase()]);
const builtIn = { "phone-card": "mint-phone-card.png", waves: "mint-waves.png", "product-flow": "mint-product-flow.png" };

function mediaUrl(source) {
  if (!source) return "";
  if (/^data:/.test(source)) return source;
  let file;
  if (source.startsWith("built-in:")) file = path.join(root, "assets/media", builtIn[source.slice(9)] || "");
  else file = path.resolve(path.dirname(input), source);
  if (!file || !fs.existsSync(file) || !mime(file)) return "";
  return `data:${mime(file)};base64,${fs.readFileSync(file).toString("base64")}`;
}

function chrome(slide, i) {
  return `<div class="chrome top-chrome"><span class="chapter">${e(slide.chapter || deck.title)}</span><span class="page-no">${String(i + 1).padStart(2, "0")}</span></div>`;
}
function footer(slide, i) {
  return `<div class="footer"><span class="brand-mark">mint</span><span>${e(slide.source || slide.chapter || "内部材料")}</span><span>${String(i + 1).padStart(2, "0")} / ${String(deck.slides.length).padStart(2, "0")}</span></div>`;
}
function heading(slide) {
  return `<div class="slide-heading"><h2 class="headline-cn">${arr(slide.titleLines).map((x) => emphasized(x, slide)).join("<br>")}</h2>${slide.lead ? `<p class="lead-cn">${emphasized(slide.lead, slide)}</p>` : ""}</div>`;
}
function slideContent(slide) {
  if (slide.type === "cover") {
    const src = mediaUrl(`built-in:${slide.visual || "phone-card"}`);
    const coverLines = arr(slide.titleLines).map((line, i) => i ? `<span>${e(line)}</span>` : e(line)).join("<br>");
    return `<div class="cover-split"><div class="cover-dark"></div><div class="cover-light"></div></div><div class="cover-copy arc-cover-copy"><div class="eyebrow">MINT · EXECUTIVE BRIEF</div><h1 class="cover-title-cn">${coverLines}</h1><p class="cover-subtitle-cn">${e(slide.subtitle || deck.subtitle || "")}</p><div class="cover-meta">${arr(slide.meta).map((x) => `<span>${e(x)}</span>`).join("")}</div></div><figure class="arc-cover-image editorial-image" data-lightbox><img src="${src}" alt="Mint 品牌视觉"></figure><div class="cover-foot">MINT ARC · ${e(deck.date || "")}</div>`;
  }
  if (slide.type === "section-intro") return `<div class="section-intro section-intro--${e(slide.accentTone || "jade")}"><div class="section-number">${e(slide.sectionNumber)}</div><div class="section-copy"><small>${e(slide.chapter || "SECTION")}</small><h2>${emphasized(slide.sectionTitle, slide)}</h2><p>${emphasized(slide.sectionClaim, slide)}</p>${slide.sectionQuestion ? `<blockquote>${e(slide.sectionQuestion)}</blockquote>` : ""}</div><div class="section-progress"><span></span><b>${e(slide.sectionNumber)}</b></div></div>`;
  if (slide.type === "statement") return `${heading(slide)}<div class="statement-grid"><blockquote>${arr(slide.statementLines).map(e).join("<br>")}</blockquote><div class="statement-support">${arr(slide.support).map((x, i) => `<article><b>${String(i + 1).padStart(2, "0")}</b><p>${e(x)}</p></article>`).join("")}</div></div>`;
  if (slide.type === "quantitative-story") return `${heading(slide)}<div class="quantitative-story">${quantitativeVisual(slide)}${numericSupport(slide)}</div>`;
  if (slide.type === "capability-chain") return `${heading(slide)}${arr(slide.contextRibbon).length ? `<div class="context-ribbon">${arr(slide.contextRibbon).map((x) => `<article><small>${e(x.label)}</small><strong>${e(x.value)}</strong></article>`).join("")}</div>` : ""}<div class="capability-layout"><div class="capability-chain">${arr(slide.stages).map((x, i) => `<article class="capability-stage"><div class="stage-index">${String(i + 1).padStart(2, "0")}</div><small>${e(x.role || "")}</small><h3>${emphasized(x.name, slide)}</h3><div class="stage-entities">${arr(x.entities).map((v) => `<b>${emphasized(v, slide)}</b>`).join("")}</div><strong class="stage-capability">${emphasized(x.capability || "", slide)}</strong>${x.detail ? `<p>${e(x.detail)}</p>` : ""}</article>`).join("")}</div>${callouts(slide)}</div>`;
  if (slide.type === "process") return `${heading(slide)}<div class="arc-process">${arr(slide.items).map((x, i) => `<article class="${i === slide.focusIndex ? "focus" : ""}"><b>${String(i + 1).padStart(2, "0")}</b><h3>${e(x.title)}</h3><p>${e(x.detail)}</p></article>`).join("")}</div>`;
  if (slide.type === "architecture-brief") return `${heading(slide)}${arr(slide.contextStrip).length ? `<div class="context-strip">${arr(slide.contextStrip).map((x) => `<article><small>${e(x.label)}</small><strong>${e(x.value)}</strong><span>${e(x.detail || "")}</span></article>`).join("")}</div>` : ""}<div class="ecosystem-stack">${arr(slide.layers).map((x, i) => `<article class="ecosystem-layer" style="--tone:${["#bc794d", "#1c7866", "#547e89", "#8ea79d", "#0e453a"][i]}"><header><b>${String(i + 1).padStart(2, "0")}</b><div><h3>${e(x.name)}</h3><small>${e(x.role || "")}</small></div></header><div class="layer-entities">${arr(x.entities).map((v) => `<section><strong>${e(v.name)}</strong><p>${e(v.detail || "")}</p></section>`).join("")}</div>${x.detail ? `<p class="layer-note">${e(x.detail)}</p>` : ""}</article>`).join("")}</div>`;
  if (slide.type === "timeline") return `${heading(slide)}<div class="timeline-composite"><div class="arc-timeline">${arr(slide.items).map((x, i) => `<article><time>${e(x.time)}</time><b>${String(i + 1).padStart(2, "0")}</b><h3>${e(x.title)}</h3><p>${e(x.detail)}</p></article>`).join("")}</div>${supportBand(slide)}</div>`;
  if (slide.type === "dual-track-roadmap") return `${heading(slide)}<div class="dual-roadmap">${arr(slide.tracks).map((track, ti) => `<section class="roadmap-track"><header><small>路径 0${ti + 1}</small><h3>${e(track.label)}</h3><p>${e(track.summary || "")}</p></header><div class="roadmap-items">${arr(track.items).map((x, i) => `<article><b>${e(x.stage || String(i + 1).padStart(2, "0"))}</b><h4>${e(x.title)}</h4><p>${e(x.detail)}</p></article>`).join("")}</div></section>`).join("")}</div>${arr(slide.actionBanner).length ? `<div class="action-banner"><strong>下一步</strong>${arr(slide.actionBanner).map((x) => `<article><small>${e(x.label)}</small><b>${e(x.text)}</b></article>`).join("")}</div>` : ""}`;
  if (slide.type === "swimlane") return `${heading(slide)}<div class="swimlane">${arr(slide.lanes).map((lane, i) => `<section><header><b>${String(i + 1).padStart(2, "0")}</b><h3>${e(lane.actor)}</h3></header><div>${arr(lane.items).map((x) => `<article><strong>${e(x.title)}</strong><p>${e(x.detail || "")}</p></article>`).join("")}</div></section>`).join("")}</div>`;
  if (slide.type === "comparison") return `${heading(slide)}<div class="comparison-grid">${arr(slide.columns).map((x, i) => `<article><span>0${i + 1}</span><h3>${e(x.title)}</h3><p>${e(x.subtitle || "")}</p><ul>${arr(x.items).map((v) => `<li>${e(v)}</li>`).join("")}</ul></article>`).join("")}</div>`;
  if (slide.type === "matrix") return `${heading(slide)}<div class="logic-matrix" style="--cols:${arr(slide.columns).length}"><div></div>${arr(slide.columns).map((x) => `<b>${e(x)}</b>`).join("")}${arr(slide.rows).flatMap((row, ri) => [`<strong>${e(row)}</strong>`, ...arr(slide.cells?.[ri]).map((cell) => `<article>${e(cell)}</article>`)]).join("")}</div>`;
  if (slide.type === "table") return `${heading(slide)}<div class="table-shell"><table><thead><tr>${arr(slide.columns).map((x) => `<th>${e(x)}</th>`).join("")}</tr></thead><tbody>${arr(slide.rows).map((row) => `<tr>${arr(row).map((x) => `<td>${e(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  if (slide.type === "chart") { const model = JSON.stringify(slide.chart).replace(/</g, "\\u003c"); return `${heading(slide)}<div class="chart-shell" data-mint-chart><div class="chart-toolbar"><div class="chart-legend"></div><label class="chart-range">时间窗口 <input type="range" min="0" value="0"></label></div><div class="chart-plot"></div><div class="chart-tooltip"></div><script type="application/json">${model}</script></div>`; }
  if (slide.type === "heatmap") { const h = slide.heatmap; const vals = arr(h.values).flat().map(Number); const min = Math.min(...vals), max = Math.max(...vals); const tone = (v) => { const p = max === min ? 1 : (Number(v) - min) / (max - min); return `color-mix(in srgb, #dcece5 ${Math.round((1-p)*100)}%, #1c7866)`; }; return `${heading(slide)}<div class="heat-shell" style="--cols:${h.columns.length}"><div></div>${h.columns.map((x) => `<b>${e(x)}</b>`).join("")}${h.rows.flatMap((r, ri) => [`<strong>${e(r)}</strong>`, ...h.values[ri].map((v, ci) => `<button style="background:${tone(v)}" title="${e(r)} · ${e(h.columns[ci])}：${e(v)}${e(h.unit)}">${e(v)}</button>`)]).join("")}</div>`; }
  if (slide.type === "media") { const src = mediaUrl(slide.image); return `${heading(slide)}<div class="media-layout"><div class="media-copy">${arr(slide.body).map((x) => `<p>${e(x)}</p>`).join("")}</div><figure class="editorial-image" data-lightbox><img src="${src}" alt="${e(slide.caption || "汇报配图")}"><figcaption>${e(slide.caption || "")}</figcaption></figure></div>`; }
  if (slide.type === "risk-spotlight") { const r = slide.risk || {}; return `${heading(slide)}<div class="risk-spotlight"><section class="risk-judgment"><small>${e(r.label || "关键风险")}</small><div class="risk-severity">${e(r.severity || "重要")}</div><h3>${emphasized(r.judgment || "", slide)}</h3></section><section class="risk-evidence"><h4>判断依据</h4>${arr(r.evidence).map((x) => `<p>${e(x)}</p>`).join("")}</section><section class="risk-impact"><h4>可能影响</h4>${arr(r.impacts).map((x) => `<p>${e(x)}</p>`).join("")}</section><section class="risk-action"><h4>需要推动</h4>${arr(r.actions).map((x) => `<p>${e(x)}</p>`).join("")}</section></div>`; }
  if (slide.type === "decision") return `${heading(slide)}<div class="decision-with-callouts"><div class="decision-grid"><section class="decision-main"><span>DECISION</span><h3>${emphasized(slide.decision, slide)}</h3><div>${arr(slide.why).map((x) => `<p>${e(x)}</p>`).join("")}</div></section><section class="action-list">${arr(slide.actions).map((x, i) => `<article><b>${String(i + 1).padStart(2, "0")}</b><div><h3>${e(x.action)}</h3><p>${e(x.owner)} · ${e(x.time)}</p></div></article>`).join("")}</section></div>${callouts(slide)}</div>`;
  return "";
}

const fullBleed = (slide) => ["cover", "section-intro"].includes(slide.type);
const pages = deck.slides.map((slide, i) => `<section class="slide ${slide.type === "cover" ? "cover" : slide.type === "section-intro" ? "slide--section" : slide.dark ? "slide--forest" : ""} ${i === 0 ? "is-active" : ""}" data-title="${e(arr(slide.titleLines).join("｜") || deck.title)}">${fullBleed(slide) ? slideContent(slide) : `<div class="page">${chrome(slide, i)}<div class="body">${slideContent(slide)}</div>${footer(slide, i)}</div>`}</section>`).join("\n");
const extra = fs.readFileSync(path.join(root, "assets/runtime/mint-components.css"), "utf8");
const model = JSON.stringify(deck).replace(/</g, "\\u003c");
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="mint-deck-id" content="${e(deck.id)}"><meta name="mint-deck-version" content="${e(deck.version)}"><title>${e(deck.title)}</title><style>${css}\n${extra}</style></head><body><main class="deck-shell"><div class="deck-stage" id="mintDeckStage">${pages}</div></main><nav class="deck-nav" id="deckNav"><div class="nav-title">页面导航 · 悬停展开</div><div class="nav-list" id="navList"></div></nav><div class="deck-actions"><button class="deck-action" id="editButton" title="编辑文字（E）">✎</button><button class="deck-action" id="downloadButton" title="下载 HTML">↓</button><button class="deck-action" id="fullscreenButton" title="全屏（F）">⛶</button></div><div class="modal-layer" id="lightbox" aria-hidden="true"><button class="modal-close" data-modal-close>×</button><div class="lightbox-content"></div></div><div class="modal-layer" id="drawer" aria-hidden="true"><button class="modal-close" data-modal-close>×</button><div class="drawer-panel"></div></div><div class="edit-toast" id="editToast"></div><script type="application/json" id="mint-deck-data">${model}</script><script>${js}</script></body></html>`;
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, html);
console.log(output);
