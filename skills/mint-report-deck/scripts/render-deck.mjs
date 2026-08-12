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
  return `<div class="slide-heading"><h2 class="headline-cn">${title(slide)}</h2>${slide.lead ? `<p class="lead-cn">${e(slide.lead)}</p>` : ""}</div>`;
}
function slideContent(slide) {
  if (slide.type === "cover") {
    const src = mediaUrl(`built-in:${slide.visual || "phone-card"}`);
    const coverLines = arr(slide.titleLines).map((line, i) => i ? `<span>${e(line)}</span>` : e(line)).join("<br>");
    return `<div class="cover-split"><div class="cover-dark"></div><div class="cover-light"></div></div><div class="cover-copy arc-cover-copy"><div class="eyebrow">MINT · EXECUTIVE BRIEF</div><h1 class="cover-title-cn">${coverLines}</h1><p class="cover-subtitle-cn">${e(slide.subtitle || deck.subtitle || "")}</p><div class="cover-meta">${arr(slide.meta).map((x) => `<span>${e(x)}</span>`).join("")}</div></div><figure class="arc-cover-image editorial-image" data-lightbox><img src="${src}" alt="Mint 品牌视觉"></figure><div class="cover-foot">MINT ARC · ${e(deck.date || "")}</div>`;
  }
  if (slide.type === "statement") return `${heading(slide)}<div class="statement-grid"><blockquote>${arr(slide.statementLines).map(e).join("<br>")}</blockquote><div class="statement-support">${arr(slide.support).map((x, i) => `<article><b>${String(i + 1).padStart(2, "0")}</b><p>${e(x)}</p></article>`).join("")}</div></div>`;
  if (slide.type === "process") return `${heading(slide)}<div class="arc-process">${arr(slide.items).map((x, i) => `<article class="${i === slide.focusIndex ? "focus" : ""}"><b>${String(i + 1).padStart(2, "0")}</b><h3>${e(x.title)}</h3><p>${e(x.detail)}</p></article>`).join("")}</div>`;
  if (slide.type === "architecture") return `${heading(slide)}<div class="arch-table"><div class="arch-columns"><span>层级</span><span>职责</span><span>处理内容</span><span>交付结果</span></div>${arr(slide.items).map((x, i) => `<article class="arch-row" style="--tone:${["#0e453a", "#1c7866", "#547e89", "#bc794d", "#8ea79d"][i]}"><b>${String(i + 1).padStart(2, "0")}</b><div><h3>${e(x.name)}</h3><small>${e(x.role)}</small></div><p>${e(x.process)}</p><strong>${e(x.output)}</strong></article>`).join("")}</div>`;
  if (slide.type === "cycle") return `${heading(slide)}<div class="arc-cycle"><div class="cycle-core">${e(slide.core)}</div>${arr(slide.items).map((x, i, xs) => `<article style="--i:${i};--n:${xs.length}"><b>${String(i + 1).padStart(2, "0")}</b><h3>${e(x.title)}</h3><p>${e(x.detail)}</p></article>`).join("")}</div>`;
  if (slide.type === "timeline") return `${heading(slide)}<div class="arc-timeline">${arr(slide.items).map((x, i) => `<article><time>${e(x.time)}</time><b>${String(i + 1).padStart(2, "0")}</b><h3>${e(x.title)}</h3><p>${e(x.detail)}</p></article>`).join("")}</div>`;
  if (slide.type === "comparison") return `${heading(slide)}<div class="comparison-grid">${arr(slide.columns).map((x, i) => `<article><span>0${i + 1}</span><h3>${e(x.title)}</h3><p>${e(x.subtitle || "")}</p><ul>${arr(x.items).map((v) => `<li>${e(v)}</li>`).join("")}</ul></article>`).join("")}</div>`;
  if (slide.type === "table") return `${heading(slide)}<div class="table-shell"><table><thead><tr>${arr(slide.columns).map((x) => `<th>${e(x)}</th>`).join("")}</tr></thead><tbody>${arr(slide.rows).map((row) => `<tr>${arr(row).map((x) => `<td>${e(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  if (slide.type === "chart") { const model = JSON.stringify(slide.chart).replace(/</g, "\\u003c"); return `${heading(slide)}<div class="chart-shell" data-mint-chart><div class="chart-toolbar"><div class="chart-legend"></div><label class="chart-range">时间窗口 <input type="range" min="0" value="0"></label></div><div class="chart-plot"></div><div class="chart-tooltip"></div><script type="application/json">${model}</script></div>`; }
  if (slide.type === "heatmap") { const h = slide.heatmap; const vals = arr(h.values).flat().map(Number); const min = Math.min(...vals), max = Math.max(...vals); const tone = (v) => { const p = max === min ? 1 : (Number(v) - min) / (max - min); return `color-mix(in srgb, #dcece5 ${Math.round((1-p)*100)}%, #1c7866)`; }; return `${heading(slide)}<div class="heat-shell" style="--cols:${h.columns.length}"><div></div>${h.columns.map((x) => `<b>${e(x)}</b>`).join("")}${h.rows.flatMap((r, ri) => [`<strong>${e(r)}</strong>`, ...h.values[ri].map((v, ci) => `<button style="background:${tone(v)}" title="${e(r)} · ${e(h.columns[ci])}：${e(v)}${e(h.unit)}">${e(v)}</button>`)]).join("")}</div>`; }
  if (slide.type === "media") { const src = mediaUrl(slide.image); return `${heading(slide)}<div class="media-layout"><div class="media-copy">${arr(slide.body).map((x) => `<p>${e(x)}</p>`).join("")}</div><figure class="editorial-image" data-lightbox><img src="${src}" alt="${e(slide.caption || "汇报配图")}"><figcaption>${e(slide.caption || "")}</figcaption></figure></div>`; }
  if (slide.type === "decision") return `${heading(slide)}<div class="decision-grid"><section class="decision-main"><span>DECISION</span><h3>${e(slide.decision)}</h3><div>${arr(slide.why).map((x) => `<p>${e(x)}</p>`).join("")}</div></section><section class="action-list">${arr(slide.actions).map((x, i) => `<article><b>${String(i + 1).padStart(2, "0")}</b><div><h3>${e(x.action)}</h3><p>${e(x.owner)} · ${e(x.time)}</p></div></article>`).join("")}</section></div>`;
  return "";
}

const pages = deck.slides.map((slide, i) => `<section class="slide ${slide.type === "cover" ? "cover" : slide.dark ? "slide--forest" : ""} ${i === 0 ? "is-active" : ""}" data-title="${e(arr(slide.titleLines).join("｜") || deck.title)}">${slide.type === "cover" ? "" : `<div class="page">${chrome(slide, i)}<div class="body">${slideContent(slide)}</div>${footer(slide, i)}</div>`}${slide.type === "cover" ? slideContent(slide) : ""}</section>`).join("\n");
const extra = fs.readFileSync(path.join(root, "assets/runtime/mint-components.css"), "utf8");
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="mint-deck-id" content="${e(deck.id)}"><meta name="mint-deck-version" content="${e(deck.version)}"><title>${e(deck.title)}</title><style>${css}\n${extra}</style></head><body><main class="deck-shell"><div class="deck-stage" id="mintDeckStage">${pages}</div></main><nav class="deck-nav" id="deckNav"><div class="nav-title">页面导航 · 悬停展开</div><div class="nav-list" id="navList"></div></nav><div class="deck-actions"><button class="deck-action" id="editButton" title="编辑文字（E）">✎</button><button class="deck-action" id="downloadButton" title="下载 HTML">↓</button><button class="deck-action" id="fullscreenButton" title="全屏（F）">⛶</button></div><div class="modal-layer" id="lightbox" aria-hidden="true"><button class="modal-close" data-modal-close>×</button><div class="lightbox-content"></div></div><div class="modal-layer" id="drawer" aria-hidden="true"><button class="modal-close" data-modal-close>×</button><div class="drawer-panel"></div></div><div class="edit-toast" id="editToast"></div><script>${js}</script></body></html>`;
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, html);
console.log(output);
