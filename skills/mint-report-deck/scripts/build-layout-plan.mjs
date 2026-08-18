#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const arr = (value) => Array.isArray(value) ? value : [];
const rectOverlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const area = (rect) => rect.width * rect.height;

function boundsFor(zone, safeArea, grid) {
  const columnWidth = (safeArea.width - (grid.columns - 1) * grid.columnGap) / grid.columns;
  const rowHeight = (safeArea.height - (grid.rows - 1) * grid.rowGap) / grid.rows;
  return {
    x: Number((safeArea.x + (zone.col - 1) * (columnWidth + grid.columnGap)).toFixed(2)),
    y: Number((safeArea.y + (zone.row - 1) * (rowHeight + grid.rowGap)).toFixed(2)),
    width: Number((zone.colSpan * columnWidth + (zone.colSpan - 1) * grid.columnGap).toFixed(2)),
    height: Number((zone.rowSpan * rowHeight + (zone.rowSpan - 1) * grid.rowGap).toFixed(2))
  };
}

function bindSemanticZones(pattern, zones) {
  const result = {};
  const zoneIds = new Set(zones.map((zone) => zone.id));
  for (const semanticZone of arr(pattern.requiredZones)) {
    if (semanticZone === "title") result[semanticZone] = "title";
    else if (semanticZone === "source") result[semanticZone] = "source";
    else if (/evidence|insight|implication|decision|action|method|caption|explanation|recommendation|result|focus|context/.test(semanticZone) && zoneIds.has("support")) result[semanticZone] = "support";
    else result[semanticZone] = "primary";
  }
  return result;
}

export function validateLayoutPlan(layoutPlan) {
  const errors = [];
  const { canvas, safeArea, grid } = layoutPlan || {};
  if (layoutPlan?.schemaVersion !== "0.6") errors.push("layout plan schemaVersion 必须为0.6");
  if (!canvas?.width || !canvas?.height || !safeArea?.width || !safeArea?.height || !grid?.columns || !grid?.rows) errors.push("canvas/safeArea/grid 不完整");
  for (const page of arr(layoutPlan?.pages)) {
    const prefix = `页面 ${page.pageId || "<empty>"}`;
    if (page.status === "layout-blocked") {
      if (!arr(page.blockedReasons).length) errors.push(`${prefix} layout-blocked但缺少原因`);
      continue;
    }
    const ids = new Set();
    const orders = new Set();
    for (const zone of arr(page.zones)) {
      if (ids.has(zone.id)) errors.push(`${prefix} zone id重复：${zone.id}`); else ids.add(zone.id);
      if (orders.has(zone.readingOrder)) errors.push(`${prefix} readingOrder重复：${zone.readingOrder}`); else orders.add(zone.readingOrder);
      const b = zone.bounds || {};
      if (b.x < safeArea.x - .1 || b.y < safeArea.y - .1 || b.x + b.width > safeArea.x + safeArea.width + .1 || b.y + b.height > safeArea.y + safeArea.height + .1) errors.push(`${prefix} zone越出安全区：${zone.id}`);
      if (!(zone.minArea > 0 && zone.maxArea >= zone.minArea && area(b) >= zone.minArea - 1 && area(b) <= zone.maxArea + 1)) errors.push(`${prefix} zone面积合同无效：${zone.id}`);
    }
    const zones = arr(page.zones);
    for (let i = 0; i < zones.length; i += 1) for (let j = i + 1; j < zones.length; j += 1) if (rectOverlap(zones[i].bounds, zones[j].bounds)) errors.push(`${prefix} zone重叠：${zones[i].id}/${zones[j].id}`);
    for (const required of ["title","primary","source"]) if (!ids.has(required)) errors.push(`${prefix} 缺少${required} zone`);
    const path = arr(page.readingPath);
    if (path[0]?.zoneId !== "title") errors.push(`${prefix} 唯一阅读起点必须为title`);
    if (path.some((item, index) => item.order !== index + 1)) errors.push(`${prefix} readingPath必须连续递增`);
    if (new Set(path.map((item) => item.zoneId)).size !== path.length) errors.push(`${prefix} readingPath存在重复zone`);
    if (!(page.primaryVisualShare >= .55 && page.primaryVisualShare <= .70)) errors.push(`${prefix} 主视觉权重不在55%–70%`);
    for (const [semantic, zoneId] of Object.entries(page.semanticZoneBindings || {})) if (!ids.has(zoneId)) errors.push(`${prefix} 语义区${semantic}映射到不存在zone：${zoneId}`);
  }
  return {passed:errors.length===0,errors,metrics:{pages:arr(layoutPlan?.pages).length,zones:arr(layoutPlan?.pages).reduce((sum,page)=>sum+arr(page.zones).length,0)}};
}

export function buildLayoutPlan(deckPlan, layoutSelection, registry, deckSpec = null) {
  const defaults = registry?.layoutDefaults;
  if (!defaults?.canvas || !defaults?.safeArea || !defaults?.grid || !registry?.layoutTemplates || !registry?.patternTemplates) throw new Error("Pattern Registry缺少layoutDefaults/layoutTemplates/patternTemplates");
  const selectionById = new Map(arr(layoutSelection?.selections).map((item) => [item.pageId,item]));
  const patternById = new Map(arr(registry?.patterns).map((item) => [item.id,item]));
  const slideById = new Map(arr(deckSpec?.slides).map((item) => [item.id,item]));
  const pages = arr(deckPlan?.pageContracts).map((page) => {
    const selection = selectionById.get(page.id);
    const pattern = patternById.get(selection?.patternId);
    const templateId = registry.patternTemplates?.[selection?.patternId];
    const template = registry.layoutTemplates?.[templateId];
    const blockedReasons = [];
    if (!selection || selection.status !== "selected") blockedReasons.push("页面没有通过Layout Selection");
    if (!pattern) blockedReasons.push(`Pattern不存在：${selection?.patternId || "<empty>"}`);
    if (!template) blockedReasons.push(`Pattern未注册布局模板：${selection?.patternId || "<empty>"}`);
    if (blockedReasons.length) return {pageId:page.id,patternId:selection?.patternId || "",layoutTemplateId:templateId || "",status:"layout-blocked",readingAxis:page.readingAxis,focalZoneId:"primary",primaryVisualShare:defaults.primaryVisualShare.target,zones:[],readingPath:[],semanticZoneBindings:{},constraints:[],blockedReasons};
    const slide = slideById.get(page.id);
    const supportCount = arr(slide?.supportModules).length;
    const zones = template.zones
      .filter((zone) => !(zone.optional && zone.role === "support" && supportCount === 0))
      .map((zone, zoneIndex) => {
        const bounds = boundsFor(zone,defaults.safeArea,defaults.grid);
        const exactArea = area(bounds);
        return {id:zone.id,role:zone.role,grid:{col:zone.col,colSpan:zone.colSpan,row:zone.row,rowSpan:zone.rowSpan},bounds,readingOrder:zoneIndex+1,minArea:Number((exactArea*.9).toFixed(2)),maxArea:Number((exactArea*1.1).toFixed(2)),alignment:zone.role === "primary" ? "stretch" : "start",...(zone.optional?{optional:true}:{})};
      });
    const readingPath = zones.slice().sort((a,b)=>a.readingOrder-b.readingOrder).map((zone,index)=>({zoneId:zone.id,order:index+1,x:Number((zone.bounds.x+zone.bounds.width/2).toFixed(2)),y:Number((zone.bounds.y+zone.bounds.height/2).toFixed(2))}));
    return {
      pageId:page.id,patternId:pattern.id,layoutTemplateId:templateId,status:"planned",readingAxis:page.readingAxis,focalZoneId:"primary",primaryVisualShare:defaults.primaryVisualShare.target,
      zones,readingPath,semanticZoneBindings:bindSemanticZones(pattern,zones),
      constraints:["all-elements-inside-safe-area","zones-do-not-overlap","title-is-unique-reading-start","primary-before-support","source-is-last","no-random-absolute-position"]
    };
  });
  const result = {schemaVersion:"0.6",canvas:defaults.canvas,safeArea:defaults.safeArea,grid:defaults.grid,pages};
  const validation = validateLayoutPlan(result);
  if (!validation.passed) throw new Error(`layout plan validation failed: ${validation.errors.join(" | ")}`);
  return result;
}

function runCli() {
  const [planArg,selectionArg,registryArg,outputArg,deckArg] = process.argv.slice(2);
  const files = [planArg,selectionArg,registryArg].map((item)=>path.resolve(item||""));
  if (files.some((file)=>!fs.existsSync(file))) {
    console.error("Usage: node build-layout-plan.mjs deck-plan.json layout-selection.json layout-patterns.json layout-plan.json [deck-spec.json]");
    process.exit(2);
  }
  const [plan,selection,registry] = files.map((file)=>JSON.parse(fs.readFileSync(file,"utf8")));
  const deckFile = deckArg ? path.resolve(deckArg) : null;
  const deck = deckFile && fs.existsSync(deckFile) ? JSON.parse(fs.readFileSync(deckFile,"utf8")) : null;
  const output = path.resolve(outputArg || "layout-plan.json");
  const layoutPlan = buildLayoutPlan(plan,selection,registry,deck);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,`${JSON.stringify(layoutPlan,null,2)}\n`);
  console.log(JSON.stringify({passed:true,pages:layoutPlan.pages.length,zones:layoutPlan.pages.reduce((sum,page)=>sum+page.zones.length,0),output},null,2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
