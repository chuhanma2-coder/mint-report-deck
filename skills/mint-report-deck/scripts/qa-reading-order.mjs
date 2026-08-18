#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const arr = (value) => Array.isArray(value) ? value : [];
const center = (rect) => ({x:rect.x+rect.width/2,y:rect.y+rect.height/2});
const overlapRatio = (a,b) => {
  const top=Math.max(a.y,b.y), bottom=Math.min(a.y+a.height,b.y+b.height);
  return Math.max(0,bottom-top)/Math.max(1,Math.min(a.height,b.height));
};

export function validateReadingOrder(layoutPage, measuredPage) {
  const errors=[], warnings=[];
  const prefix=`页面 ${layoutPage?.pageId || measuredPage?.pageId || "<unknown>"}`;
  const expected=arr(layoutPage?.readingPath).slice().sort((a,b)=>a.order-b.order);
  const observed=arr(measuredPage?.zones).slice().sort((a,b)=>a.readingOrder-b.readingOrder);
  if (!expected.length || !observed.length) errors.push(`${prefix} 缺少可验证的阅读路径`);
  if (new Set(observed.map((zone)=>zone.readingOrder)).size!==observed.length) errors.push(`${prefix} DOM reading order重复`);
  if (observed.some((zone,index)=>zone.readingOrder!==index+1)) errors.push(`${prefix} DOM reading order不连续`);
  if (observed[0]?.id!=="title") errors.push(`${prefix} 第一阅读位置不是标题`);
  if (observed.at(-1)?.id!=="source") errors.push(`${prefix} 最后阅读位置不是来源区`);
  const expectedIds=expected.map((item)=>item.zoneId), observedIds=observed.map((item)=>item.id);
  if (expectedIds.join("|")!==observedIds.join("|")) errors.push(`${prefix} DOM阅读顺序与Layout Plan不一致：${observedIds.join("→")} != ${expectedIds.join("→")}`);
  for (let index=1; index<observed.length; index+=1) {
    const previous=observed[index-1], current=observed[index];
    const a=center(previous.rect), b=center(current.rect);
    const sameRow=overlapRatio(previous.rect,current.rect)>=.5;
    if (sameRow && b.x<a.x-3) errors.push(`${prefix} 同行阅读方向逆序：${previous.id}→${current.id}`);
    if (!sameRow && b.y<a.y-3) errors.push(`${prefix} 跨行阅读方向逆序：${previous.id}→${current.id}`);
  }
  if (layoutPage?.readingAxis==="center-out") {
    const focal=observed.find((zone)=>zone.id===layoutPage.focalZoneId);
    if (!focal) errors.push(`${prefix} center-out缺少焦点区`);
    else if (focal.readingOrder<=1) errors.push(`${prefix} center-out焦点不能覆盖标题入口`);
  }
  return {passed:errors.length===0,errors,warnings,metrics:{zones:observed.length,path:observedIds,axis:layoutPage?.readingAxis || "unspecified"}};
}

function runCli(){
  const [layoutArg,geometryArg,outputArg]=process.argv.slice(2);
  if (!layoutArg || !geometryArg || !fs.existsSync(layoutArg) || !fs.existsSync(geometryArg)) { console.error("Usage: node qa-reading-order.mjs layout-plan.json geometry.json [report.json]"); process.exit(2); }
  const layout=JSON.parse(fs.readFileSync(path.resolve(layoutArg),"utf8"));
  const geometry=JSON.parse(fs.readFileSync(path.resolve(geometryArg),"utf8"));
  const results=arr(layout.pages).map((page)=>validateReadingOrder(page,arr(geometry.pages).find((item)=>item.pageId===page.pageId)));
  const report={passed:results.every((item)=>item.passed),pages:results,errors:results.flatMap((item)=>item.errors),warnings:results.flatMap((item)=>item.warnings)};
  if (outputArg) fs.writeFileSync(path.resolve(outputArg),`${JSON.stringify(report,null,2)}\n`);
  console.log(JSON.stringify(report,null,2)); process.exit(report.passed?0:1);
}
if (process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) runCli();
