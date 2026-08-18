#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const arr=(value)=>Array.isArray(value)?value:[];
const center=(rect)=>({x:rect.x+rect.width/2,y:rect.y+rect.height/2});
const area=(rect)=>Math.max(0,rect.width)*Math.max(0,rect.height);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const multiFocalPatterns=new Set(["parallel-columns","parallel-bands","comparison","before-after","four-grid","card-matrix","split-evidence"]);
const cardPatterns=new Set(["parallel-columns","parallel-bands","four-grid","card-matrix","horizontal-sequence","vertical-sequence","timeline","comparison","before-after","problem-cause-solution"]);

function occupiedQuadrants(blocks,canvas){
  const cx=canvas.width/2,cy=canvas.height/2;
  return new Set(blocks.map((block)=>{const c=center(block.rect);return `${c.x<cx?"L":"R"}${c.y<cy?"T":"B"}`;}));
}

export function validateLayoutGeometry(measuredPage, options={}) {
  const errors=[],warnings=[];
  const canvas=options.canvas || {width:1920,height:1080};
  const patternId=measuredPage?.patternId || "unknown";
  const blocks=arr(measuredPage?.blocks).filter((block)=>block.visible!==false && (block.textLength||0)>0 && area(block.rect)>0);
  const diagonal=Math.hypot(canvas.width,canvas.height);
  if (!blocks.length) errors.push(`页面 ${measuredPage?.pageId || "<unknown>"} 没有可见内容块`);
  const totalArea=blocks.reduce((sum,block)=>sum+area(block.rect),0);
  const centroid=totalArea?blocks.reduce((sum,block)=>{const c=center(block.rect),weight=area(block.rect);return{x:sum.x+c.x*weight,y:sum.y+c.y*weight};},{x:0,y:0}):{x:canvas.width/2,y:canvas.height/2};
  if (totalArea){centroid.x/=totalArea;centroid.y/=totalArea;}
  const centroidOffset=distance(centroid,{x:canvas.width/2,y:canvas.height/2})/diagonal;
  if (centroidOffset>.28) errors.push(`页面 ${measuredPage?.pageId} 视觉重心偏移过大：${centroidOffset.toFixed(3)}`);
  const quadrants=occupiedQuadrants(blocks,canvas);
  const central=blocks.some((block)=>{const c=center(block.rect);return Math.abs(c.x-canvas.width/2)<canvas.width*.18&&Math.abs(c.y-canvas.height/2)<canvas.height*.18;});
  if (quadrants.size===4&&!central&&patternId!=="radial-branches") errors.push(`页面 ${measuredPage?.pageId} 内容散落四角且缺少中心锚点`);
  const ordered=blocks.filter((block)=>Number.isFinite(block.readingOrder)).sort((a,b)=>a.readingOrder-b.readingOrder);
  let maxReadingGap=0;
  for(let index=1;index<ordered.length;index+=1) maxReadingGap=Math.max(maxReadingGap,distance(center(ordered[index-1].rect),center(ordered[index].rect))/diagonal);
  if(maxReadingGap>.58) errors.push(`页面 ${measuredPage?.pageId} 阅读路径断裂：最大跨距${maxReadingGap.toFixed(3)}`);
  const cardBlocks=blocks.filter((block)=>block.cardLike);
  const smallCards=cardBlocks.filter((block)=>area(block.rect)<canvas.width*canvas.height*.09);
  const maxCards=cardPatterns.has(patternId)?8:patternId==="radial-branches"?7:4;
  if(smallCards.length>maxCards) errors.push(`页面 ${measuredPage?.pageId} 过度碎片化：${smallCards.length}个独立小卡片，${patternId}上限${maxCards}`);
  const byArea=[...blocks].sort((a,b)=>area(b.rect)-area(a.rect));
  let focalDistance=0;
  if(byArea.length>1){
    focalDistance=distance(center(byArea[0].rect),center(byArea[1].rect))/diagonal;
    const ratio=area(byArea[1].rect)/Math.max(1,area(byArea[0].rect));
    if(ratio>.72&&focalDistance>.43&&!multiFocalPatterns.has(patternId)) errors.push(`页面 ${measuredPage?.pageId} 出现两个竞争焦点`);
  }
  return {passed:errors.length===0,errors,warnings,metrics:{blocks:blocks.length,cardBlocks:cardBlocks.length,smallCards:smallCards.length,quadrants:quadrants.size,hasCentralAnchor:central,centroidOffset:Number(centroidOffset.toFixed(4)),maxReadingGap:Number(maxReadingGap.toFixed(4)),focalDistance:Number(focalDistance.toFixed(4))}};
}

function runCli(){
  const [geometryArg,outputArg]=process.argv.slice(2);
  if(!geometryArg||!fs.existsSync(geometryArg)){console.error("Usage: node qa-layout-geometry.mjs geometry.json [report.json]");process.exit(2);}
  const geometry=JSON.parse(fs.readFileSync(path.resolve(geometryArg),"utf8"));
  const results=arr(geometry.pages).map((page)=>({pageId:page.pageId,...validateLayoutGeometry(page,{canvas:geometry.canvas})}));
  const report={passed:results.every((item)=>item.passed),pages:results,errors:results.flatMap((item)=>item.errors),warnings:results.flatMap((item)=>item.warnings)};
  if(outputArg)fs.writeFileSync(path.resolve(outputArg),`${JSON.stringify(report,null,2)}\n`);
  console.log(JSON.stringify(report,null,2));process.exit(report.passed?0:1);
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))runCli();
