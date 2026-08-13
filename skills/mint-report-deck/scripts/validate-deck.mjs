#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !fs.existsSync(file)) {
  console.error("Usage: node validate-deck.mjs /absolute/path/deck-spec.json [/absolute/path/content-map.json]");
  process.exit(2);
}
const deck = JSON.parse(fs.readFileSync(file, "utf8"));
const mapFile = process.argv[3] ? path.resolve(process.argv[3]) : null;
const map = mapFile && fs.existsSync(mapFile) ? JSON.parse(fs.readFileSync(mapFile, "utf8")) : null;
const errors = [], warnings = [];
const allowed = new Set(["cover", "section-intro", "statement", "capability-chain", "architecture-brief", "process", "timeline", "dual-track-roadmap", "swimlane", "comparison", "matrix", "table", "chart", "heatmap", "media", "risk-spotlight", "decision"]);
const vague = ["赋能", "抓手", "闭环", "体系化", "战略期权"];
const arr = (v) => Array.isArray(v) ? v : [];
const text = (v) => typeof v === "string" ? v : Array.isArray(v) ? v.map(text).join(" ") : v && typeof v === "object" ? Object.values(v).map(text).join(" ") : "";

if (!new Set(["0.2", "0.3"]).has(deck.schemaVersion)) errors.push("schemaVersion 必须为 0.2 或 0.3");
if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(deck.id || "")) errors.push("id 必须是 3–64 位小写 slug");
if (!Number.isInteger(deck.version) || deck.version < 1) errors.push("version 必须是正整数");
if (!deck.title) errors.push("缺少 title");
if (!arr(deck.slides).length) errors.push("至少需要一页 slides");
if (!Number.isInteger(deck.pageBudget) || deck.pageBudget < 1) errors.push("pageBudget 必须为正整数");
if (deck.pageBudget !== arr(deck.slides).length) errors.push("pageBudget 必须与实际页数一致");
if (map && map.pageBudget?.planned !== arr(deck.slides).length) errors.push("deck 页数与 content-map.pageBudget.planned 不一致");
if (deck.schemaVersion === "0.3" && arr(deck.slides).length > 3 && !deck.deckPlan?.sections?.length) errors.push("多页材料必须包含 deckPlan.sections");
const sectionIntros = arr(deck.slides).filter((s) => s.pageRole === "section-intro");
if (sectionIntros.some((s) => s.type !== "section-intro")) errors.push("所有章节引言必须统一使用 section-intro 页面家族");
if (new Set(sectionIntros.map((s) => s.introFamily || "section-intro")).size > 1) errors.push("章节引言 introFamily 不一致");

const fullText = text(deck);
if (map) {
  for (const entity of arr(map.entities)) {
    if (entity.requiredOnSlides && !fullText.includes(entity.canonicalName)) errors.push(`缺少关键实体：${entity.canonicalName}`);
  }
  const known = new Set(arr(map.entities).flatMap((x) => [x.canonicalName, ...arr(x.aliases)]));
  for (const banned of ["Sinova", "Twende", "BaaS"]) if (fullText.includes(banned) && !known.has(banned)) errors.push(`出现来源未提供实体：${banned}`);
  for (const priority of arr(map.priorities).filter((p) => p.level === "material")) {
    const represented = arr(deck.slides).some((s) => arr(s.emphasis?.callouts).some((c) => c.kind === priority.kind && text(c).includes(priority.subject)));
    if (!represented) errors.push(`重要信息未突出展示：${priority.kind} · ${priority.subject}`);
  }
}

arr(deck.slides).forEach((slide, index) => {
  const at = `第 ${index + 1} 页`;
  if (!allowed.has(slide.type)) errors.push(`${at}：不支持组件 ${slide.type}`);
  const lines = arr(slide.titleLines);
  if (slide.type !== "cover" && (lines.length < 1 || lines.length > 2)) errors.push(`${at}：titleLines 必须为 1–2 行`);
  lines.forEach((line) => { const n = [...String(line).replace(/\s/g, "")].length; if (n > 24) warnings.push(`${at}：标题单行 ${n} 字，应在标点或语义边界换行`); });
  const all = text(slide);
  if (/无真实数列|不生成图表|请在此|占位|TBD|TODO|待确认|制作说明|点击编辑/i.test(all)) errors.push(`${at}：正式页出现提示语、制作说明或待确认占位`);
  vague.forEach((word) => { if (all.includes(word)) warnings.push(`${at}：抽象词“${word}”需要来源或具体定义`); });
  if (!arr(slide.sourceRefs).length) errors.push(`${at}：缺少 sourceRefs`);
  if (slide.type === "process" && (arr(slide.items).length < 3 || arr(slide.items).length > 6)) errors.push(`${at}：流程应为 3–6 个真实有序步骤`);
  if (slide.type === "capability-chain" && (arr(slide.stages).length < 3 || arr(slide.stages).length > 5)) errors.push(`${at}：能力链路应为 3–5 个阶段`);
  if (slide.type === "architecture-brief" && (arr(slide.layers).length < 3 || arr(slide.layers).length > 5)) errors.push(`${at}：分层架构应为 3–5 层`);
  if (slide.type === "dual-track-roadmap" && arr(slide.tracks).length !== 2) errors.push(`${at}：双轨路线图必须正好两条路径`);
  if (slide.type === "swimlane" && (arr(slide.lanes).length < 2 || arr(slide.lanes).length > 5)) errors.push(`${at}：泳道应为 2–5 个角色`);
  if (slide.type === "table" && arr(slide.columns).length > 5) warnings.push(`${at}：宽表超过 5 列；若表达业务关系，应改用能力链路或拆页`);
  const callouts = arr(slide.emphasis?.callouts);
  callouts.forEach((c, i) => { if (!["capital", "risk", "decision", "evidence"].includes(c.kind) || !c.label || !c.value) errors.push(`${at}：emphasis.callouts[${i}] 缺少有效 kind、label 或 value`); });
  if (slide.type === "chart") {
    const c = slide.chart || {};
    if (!arr(c.labels).length || !c.unit || !c.period || !c.subject || !arr(c.sourceRefs).length) errors.push(`${at}：图表缺少 labels、unit、period、subject 或 sourceRefs`);
    arr(c.series).forEach((s, i) => {
      if (!new Set(["bar", "line"]).has(s.type)) errors.push(`${at}：series ${i + 1} 仅支持 bar/line`);
      if (arr(s.values).length !== arr(c.labels).length || arr(s.values).some((v) => !Number.isFinite(Number(v)))) errors.push(`${at}：series ${i + 1} 数值必须与 labels 对齐`);
    });
  }
  if (slide.type === "heatmap") {
    const h = slide.heatmap || {};
    if (!arr(h.rows).length || !arr(h.columns).length || !h.unit || !h.period || !h.subject || !arr(h.sourceRefs).length) errors.push(`${at}：热力图缺少完整证据合同`);
    if (arr(h.values).length !== arr(h.rows).length || arr(h.values).some((row) => arr(row).length !== arr(h.columns).length)) errors.push(`${at}：热力图矩阵不完整`);
  }
});

console.log(JSON.stringify({ passed: errors.length === 0, errors, warnings }, null, 2));
process.exit(errors.length ? 1 : 0);
