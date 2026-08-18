#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const htmlFile = path.resolve(process.argv[2] || "");
const deckFile = path.resolve(process.argv[3] || "");
if (!fs.existsSync(htmlFile) || !fs.existsSync(deckFile)) {
  console.error("Usage: node validate-rendered-html.mjs /absolute/path/report.html /absolute/path/deck-spec.json");
  process.exit(2);
}
const html = fs.readFileSync(htmlFile, "utf8");
const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
const tags = html.match(/<section class="slide\s[^>]*>/g) || [];
const tagOffsets = [...html.matchAll(/<section class="slide\s[^>]*>/g)].map((match) => match.index);
const pageFragments = tagOffsets.map((offset,index)=>html.slice(offset,tagOffsets[index+1] ?? html.indexOf('<nav class="deck-nav"')));
const errors = [], warnings = [];
if (tags.length !== deck.slides.length) errors.push(`渲染页数 ${tags.length} 与 deck-spec ${deck.slides.length} 不一致`);
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] || "";
tags.forEach((tag, index) => {
  const expected = deck.slides[index] || {};
  const fragment = pageFragments[index] || "";
  const id = attr(tag, "data-slide-id");
  const type = attr(tag, "data-slide-type");
  const primaryItems = Number(attr(tag, "data-primary-items"));
  const visibleText = Number(attr(tag, "data-visible-text"));
  if (attr(tag, "data-render-contract") !== "pass") errors.push(`第 ${index + 1} 页未通过渲染合同`);
  if (expected.id && id !== expected.id) errors.push(`第 ${index + 1} 页 id 漂移：${id} != ${expected.id}`);
  if (type !== expected.type) errors.push(`第 ${index + 1} 页 type 漂移：${type} != ${expected.type}`);
  if (!Number.isFinite(primaryItems) || primaryItems < 1) errors.push(`第 ${index + 1} 页主视觉为空`);
  if (!Number.isFinite(visibleText) || visibleText < 2) errors.push(`第 ${index + 1} 页没有可见内容`);
  const atomRefs = new Set(attr(tag, "data-atom-refs").split(/\s+/).filter(Boolean));
  for (const ref of Array.isArray(expected.atomRefs) ? expected.atomRefs : []) if (!atomRefs.has(ref)) errors.push(`第 ${index + 1} 页未携带 atomRef：${ref}`);
  const visibleClaimRefs = new Set(attr(tag, "data-visible-claim-refs").split(/\s+/).filter(Boolean));
  const expectedClaimRefs = new Set((Array.isArray(expected.visibleClaims) ? expected.visibleClaims : []).flatMap((claim) => Array.isArray(claim.atomRefs) ? claim.atomRefs : []));
  for (const ref of expectedClaimRefs) if (!visibleClaimRefs.has(ref)) errors.push(`第 ${index + 1} 页 visibleClaim 未实际渲染：${ref}`);
  if (deck.schemaVersion === "0.6") {
    const patternId = attr(tag,"data-pattern-id");
    const selectedPattern = deck.layoutSelection?.selections?.find((item)=>item.pageId===expected.id)?.patternId;
    if (!patternId || patternId!==selectedPattern) errors.push(`第 ${index + 1} 页 Pattern漂移：${patternId || "<empty>"} != ${selectedPattern || "<empty>"}`);
    const zones=[...fragment.matchAll(/data-zone-id="([^"]+)"[^>]*data-reading-order="([^"]+)"/g)].map((match)=>({id:match[1],order:Number(match[2])}));
    const uniqueOrders=new Set(zones.map((zone)=>zone.order));
    if (!zones.length) errors.push(`第 ${index + 1} 页缺少V0.6 zone DOM`);
    if (uniqueOrders.size!==zones.length) errors.push(`第 ${index + 1} 页reading order重复`);
    const sorted=zones.slice().sort((a,b)=>a.order-b.order);
    if (sorted.some((zone,zoneIndex)=>zone.order!==zoneIndex+1)) errors.push(`第 ${index + 1} 页reading order不连续`);
    if (sorted[0]?.id!=="title") errors.push(`第 ${index + 1} 页阅读入口不是title`);
    if (sorted.at(-1)?.id!=="source") errors.push(`第 ${index + 1} 页阅读终点不是source`);
    for (const required of ["title","primary","source"]) if (!zones.some((zone)=>zone.id===required)) errors.push(`第 ${index + 1} 页缺少${required} zone`);
    if (!fragment.includes(`data-pattern-structure="${patternId}"`)) errors.push(`第 ${index + 1} 页Pattern语义DOM缺失：${patternId}`);
  }
});
const report = { passed: errors.length === 0, html: htmlFile, deck: deckFile, pages: tags.length, errors, warnings };
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
