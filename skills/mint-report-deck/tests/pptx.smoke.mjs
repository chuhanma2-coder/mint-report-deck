#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const skill = path.resolve(here, "..");
const workspace = path.join(root, ".work", "p108-pptx-smoke");
await fs.mkdir(workspace, { recursive: true });

const weekly = JSON.parse(await fs.readFile("/Users/mac/Documents/Mint/outputs/2026-08-18-weekly-kb-v05-test/deck-spec.json", "utf8"));
const equity = JSON.parse(await fs.readFile(path.join(root, "outputs/v04-equity-demo/deck-spec.json"), "utf8"));
const vodafone = JSON.parse(await fs.readFile(path.join(skill, "tests/fixtures/vodafone-deck.json"), "utf8"));
const chartSlide = {
  id: "PPTX-CHART",
  type: "chart",
  chapter: "趋势验证",
  pageRole: "evidence",
  titleLines: ["处理量连续四期提升，", "当前值达到63"],
  lead: "折线图数据必须在PPTX中保持可编辑。",
  primaryVisual: {
    kind: "trend-chart",
    data: {
      title: "处理量趋势",
      categories: ["1月", "2月", "3月", "4月"],
      series: [
        { name: "实际", values: [35, 42, 51, 63] },
        { name: "目标", values: [38, 45, 52, 60] }
      ],
      unit: "件",
      period: "1—4月",
      subject: "测试任务"
    }
  },
  source: "来源：P1-08回归测试构造数据",
  sourceRefs: ["TEST:PPTX-CHART"]
};
const deck = {
  schemaVersion: "0.6",
  id: "p108-pptx-regression",
  title: "P1-08 PPTX 回归",
  slides: [...weekly.slides, equity.slides[0], vodafone.slides[0], chartSlide]
};
const deckFile = path.join(workspace, "deck-spec.json");
const pptxFile = path.join(workspace, "report.pptx");
const qaFile = path.join(workspace, "qa-pptx.json");
await fs.writeFile(deckFile, `${JSON.stringify(deck, null, 2)}\n`);

function run(args, label) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", env: process.env, maxBuffer: 20_000_000 });
  if (result.status !== 0) throw new Error(`${label} failed\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

run([path.join(skill, "scripts/render-pptx.mjs"), deckFile, pptxFile], "render-pptx");
run([path.join(skill, "scripts/qa-pptx-editability.mjs"), pptxFile, qaFile, "--expect-native-chart"], "qa-pptx-editability");
const qa = JSON.parse(await fs.readFile(qaFile, "utf8"));
if (qa.metrics.slides !== deck.slides.length) throw new Error(`expected ${deck.slides.length} slides, got ${qa.metrics.slides}`);
if (!qa.assertions.titlesAndBodyEditable || !qa.assertions.simpleGraphicsEditable || !qa.assertions.noFullSlideImageSubstitute) throw new Error("editable-object assertions failed");
console.log(JSON.stringify({ passed: true, slides: qa.metrics.slides, editableTextRuns: qa.metrics.editableTextRuns, editableShapes: qa.metrics.editableShapes, nativeChartParts: qa.metrics.nativeChartParts, output: pptxFile }, null, 2));
