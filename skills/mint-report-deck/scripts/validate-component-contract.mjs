#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (value) => Array.isArray(value) ? value : [];
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;

export function validateComponentContract(deck) {
  const errors = [], warnings = [];
  const child = (value, fields, at) => {
    if (!value || typeof value !== "object") return errors.push(`${at} 必须为对象`);
    for (const field of fields) if (!nonempty(value[field])) errors.push(`${at}.${field} 缺失`);
  };
  const list = (value, min, max, at) => {
    const items = arr(value);
    if (items.length < min || items.length > max) errors.push(`${at} 必须包含 ${min}–${max} 项`);
    return items;
  };

  arr(deck.slides).forEach((slide, index) => {
    const at = `第 ${index + 1} 页(${slide.type})`;
    switch (slide.type) {
      case "cover":
        if (!arr(slide.titleLines).length) errors.push(`${at}.titleLines 不能为空`);
        break;
      case "section-intro":
        for (const field of ["sectionNumber", "sectionTitle", "sectionClaim"]) if (!nonempty(slide[field])) errors.push(`${at}.${field} 缺失`);
        break;
      case "statement":
        list(slide.statementLines, 1, 2, `${at}.statementLines`);
        list(slide.support, 1, 3, `${at}.support`);
        break;
      case "capability-chain":
        list(slide.stages, 3, 5, `${at}.stages`).forEach((item, i) => {
          child(item, ["name", "role", "capability", "detail"], `${at}.stages[${i}]`);
          if (!arr(item.entities).length || arr(item.entities).some((entity) => !nonempty(entity))) errors.push(`${at}.stages[${i}].entities 必须为非空字符串数组`);
        });
        break;
      case "architecture-brief":
        list(slide.layers, 3, 5, `${at}.layers`).forEach((item, i) => {
          child(item, ["name", "role"], `${at}.layers[${i}]`);
          list(item.entities, 1, 6, `${at}.layers[${i}].entities`).forEach((entity, j) => child(entity, ["name", "detail"], `${at}.layers[${i}].entities[${j}]`));
        });
        break;
      case "process":
        list(slide.items, 3, 6, `${at}.items`).forEach((item, i) => child(item, ["title", "detail"], `${at}.items[${i}]`));
        break;
      case "timeline":
        list(slide.items, 2, 6, `${at}.items`).forEach((item, i) => child(item, ["time", "title", "detail"], `${at}.items[${i}]`));
        break;
      case "dual-track-roadmap":
        list(slide.tracks, 2, 2, `${at}.tracks`).forEach((track, i) => {
          child(track, ["label", "summary"], `${at}.tracks[${i}]`);
          list(track.items, 2, 5, `${at}.tracks[${i}].items`).forEach((item, j) => child(item, ["stage", "title", "detail"], `${at}.tracks[${i}].items[${j}]`));
        });
        break;
      case "swimlane":
        list(slide.lanes, 2, 5, `${at}.lanes`).forEach((lane, i) => {
          child(lane, ["actor"], `${at}.lanes[${i}]`);
          list(lane.items, 1, 6, `${at}.lanes[${i}].items`).forEach((item, j) => child(item, ["title"], `${at}.lanes[${i}].items[${j}]`));
        });
        break;
      case "comparison":
        list(slide.columns, 2, 5, `${at}.columns`).forEach((column, i) => {
          child(column, ["title"], `${at}.columns[${i}]`);
          if (!arr(column.items).length || arr(column.items).some((item) => !nonempty(item))) errors.push(`${at}.columns[${i}].items 必须为非空字符串数组`);
        });
        break;
      case "matrix": {
        const columns = list(slide.columns, 2, 5, `${at}.columns`);
        const rows = list(slide.rows, 2, 5, `${at}.rows`);
        if (arr(slide.cells).length !== rows.length || arr(slide.cells).some((row) => arr(row).length !== columns.length || arr(row).some((cell) => !nonempty(cell)))) errors.push(`${at}.cells 必须是与 rows × columns 对齐的非空矩阵`);
        break;
      }
      case "table": {
        const columns = list(slide.columns, 2, 5, `${at}.columns`);
        const rows = list(slide.rows, 1, 12, `${at}.rows`);
        if (rows.some((row) => arr(row).length !== columns.length)) errors.push(`${at}.rows 必须与 columns 列数一致`);
        break;
      }
      case "chart":
        if (!slide.chart || !arr(slide.chart.labels).length || !arr(slide.chart.series).length) errors.push(`${at}.chart 缺少 labels 或 series`);
        break;
      case "heatmap":
        if (!slide.heatmap || !arr(slide.heatmap.rows).length || !arr(slide.heatmap.columns).length || !arr(slide.heatmap.values).length) errors.push(`${at}.heatmap 数据不完整`);
        break;
      case "media":
        if (!nonempty(slide.image) || !nonempty(slide.caption) || !arr(slide.body).length) errors.push(`${at} 必须包含 image、caption 和 body[]`);
        break;
      case "risk-spotlight":
        child(slide.risk, ["label", "judgment", "severity"], `${at}.risk`);
        for (const field of ["evidence", "impacts", "actions"]) if (!arr(slide.risk?.[field]).length) errors.push(`${at}.risk.${field} 不能为空`);
        break;
      case "decision":
        if (!nonempty(slide.decision)) errors.push(`${at}.decision 缺失`);
        list(slide.actions, 1, 3, `${at}.actions`).forEach((item, i) => child(item, ["action", "owner", "time"], `${at}.actions[${i}]`));
        break;
      case "quantitative-story": {
        const data = slide.primaryVisual?.data || {};
        if (!arr(data.groups).length && !arr(data.metrics).length && !data.chart) errors.push(`${at}.primaryVisual.data 缺少 groups、metrics 或 chart`);
        break;
      }
      default:
        errors.push(`${at} 没有受控组件合同`);
    }
  });
  return { passed: errors.length === 0, errors, warnings, metrics: { pages: arr(deck.slides).length } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = path.resolve(process.argv[2] || "");
  if (!fs.existsSync(file)) {
    console.error("Usage: node validate-component-contract.mjs /absolute/path/deck-spec.json");
    process.exit(2);
  }
  const result = validateComponentContract(JSON.parse(fs.readFileSync(file, "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
