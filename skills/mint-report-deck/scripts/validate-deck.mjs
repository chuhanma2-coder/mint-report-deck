#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !fs.existsSync(file)) {
  console.error("Usage: node validate-deck.mjs /absolute/path/deck.json");
  process.exit(2);
}

const deck = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const warnings = [];
const allowed = new Set(["cover", "statement", "process", "architecture", "cycle", "timeline", "comparison", "table", "chart", "heatmap", "media", "decision"]);
const vague = ["赋能", "抓手", "闭环", "体系化", "战略期权"];
const arr = (v) => Array.isArray(v) ? v : [];
const text = (v) => typeof v === "string" ? v : Array.isArray(v) ? v.map(text).join(" ") : v && typeof v === "object" ? Object.values(v).map(text).join(" ") : "";

if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(deck.id || "")) errors.push("id 必须是 3–64 位小写 slug");
if (!Number.isInteger(deck.version) || deck.version < 1) errors.push("version 必须是正整数");
if (!deck.title) errors.push("缺少 title");
if (!arr(deck.slides).length) errors.push("至少需要一页 slides");
if (deck.slides?.length > 20) warnings.push("超过 20 页，建议拆分汇报");

arr(deck.slides).forEach((slide, index) => {
  const at = `第 ${index + 1} 页`;
  if (!allowed.has(slide.type)) errors.push(`${at}：不支持组件 ${slide.type}`);
  const titleLines = arr(slide.titleLines);
  if (slide.type !== "cover" && (titleLines.length < 1 || titleLines.length > 2)) errors.push(`${at}：titleLines 必须为 1–2 行`);
  titleLines.forEach((line) => {
    const n = [...String(line).replace(/\s/g, "")].length;
    if (n > 24) warnings.push(`${at}：标题单行 ${n} 字，建议语义改写或换行`);
  });
  const all = text(slide);
  if (/无真实数列|不生成图表|请在此|占位|TBD|TODO|待确认/i.test(all)) errors.push(`${at}：正式页出现提示语或待确认占位`);
  vague.forEach((word) => { if (all.includes(word)) warnings.push(`${at}：抽象词“${word}”需要来源或具体定义`); });
  if (slide.type === "process" && (arr(slide.items).length < 3 || arr(slide.items).length > 6)) errors.push(`${at}：流程应为 3–6 步`);
  if (slide.type === "architecture" && (arr(slide.items).length < 3 || arr(slide.items).length > 5)) errors.push(`${at}：架构应为 3–5 层`);
  if (slide.type === "chart") {
    const c = slide.chart || {};
    if (!arr(c.labels).length || !c.unit || !c.period || !arr(c.sourceRefs).length) errors.push(`${at}：图表缺少 labels、unit、period 或 sourceRefs`);
    arr(c.series).forEach((s, i) => {
      if (!new Set(["bar", "line"]).has(s.type)) errors.push(`${at}：series ${i + 1} 仅支持 bar/line`);
      if (arr(s.values).length !== arr(c.labels).length || arr(s.values).some((v) => !Number.isFinite(Number(v)))) errors.push(`${at}：series ${i + 1} 数值必须与 labels 对齐`);
    });
  }
  if (slide.type === "heatmap") {
    const h = slide.heatmap || {};
    if (!arr(h.rows).length || !arr(h.columns).length || !h.unit || !h.period || !arr(h.sourceRefs).length) errors.push(`${at}：热力图缺少完整证据合同`);
    if (arr(h.values).length !== arr(h.rows).length || arr(h.values).some((row) => arr(row).length !== arr(h.columns).length)) errors.push(`${at}：热力图矩阵不完整`);
  }
});

const result = { passed: errors.length === 0, errors, warnings };
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
