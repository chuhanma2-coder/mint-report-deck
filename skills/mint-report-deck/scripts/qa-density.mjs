#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const arr=(value)=>Array.isArray(value)?value:[];
const area=(rect)=>Math.max(0,rect?.width||0)*Math.max(0,rect?.height||0);
const intersect=(a,b)=>{const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),right=Math.min(a.x+a.width,b.x+b.width),bottom=Math.min(a.y+a.height,b.y+b.height);return right>x&&bottom>y?{x,y,width:right-x,height:bottom-y}:null;};
const profiles={default:{minEnvelope:.10,maxEmpty:.62,minFont:14,maxDecoration:.16,maxInk:.48},hero:{minEnvelope:.07,maxEmpty:.70,minFont:18,maxDecoration:.20,maxInk:.40},media:{minEnvelope:.06,maxEmpty:.72,minFont:14,maxDecoration:.12,maxInk:.45},numeric:{minEnvelope:.10,maxEmpty:.64,minFont:15,maxDecoration:.12,maxInk:.42},dense:{minEnvelope:.18,maxEmpty:.50,minFont:14,maxDecoration:.10,maxInk:.55}};
const profileFor=(patternId,densityProfile)=>densityProfile==="compact"?profiles.dense:["hero","section-intro","full-bleed-media"].includes(patternId)?profiles.hero:patternId==="media-evidence"?profiles.media:["numeric-story","chart-insight","risk-decision"].includes(patternId)?profiles.numeric:profiles.default;

function largestEmptyRatio(primary,textRects,cols=24,rows=14){
  if(!primary||!area(primary))return 1;
  const grid=Array.from({length:rows},()=>Array(cols).fill(0));
  for(let row=0;row<rows;row+=1)for(let col=0;col<cols;col+=1){const cell={x:primary.x+col*primary.width/cols,y:primary.y+row*primary.height/rows,width:primary.width/cols,height:primary.height/rows};if(textRects.some((rect)=>intersect(cell,rect)))grid[row][col]=1;}
  const heights=Array(cols).fill(0);let best=0;
  for(let row=0;row<rows;row+=1){for(let col=0;col<cols;col+=1)heights[col]=grid[row][col]?0:heights[col]+1;const stack=[];for(let col=0;col<=cols;col+=1){const height=col===cols?0:heights[col];while(stack.length&&heights[stack.at(-1)]>height){const index=stack.pop(),width=stack.length?col-stack.at(-1)-1:col;best=Math.max(best,heights[index]*width);}stack.push(col);}}
  return best/(cols*rows);
}
function envelopeRatio(primary,textRects){const inside=textRects.map((rect)=>intersect(primary,rect)).filter(Boolean);if(!inside.length)return 0;const left=Math.min(...inside.map((r)=>r.x)),top=Math.min(...inside.map((r)=>r.y)),right=Math.max(...inside.map((r)=>r.x+r.width)),bottom=Math.max(...inside.map((r)=>r.y+r.height));return area({x:left,y:top,width:right-left,height:bottom-top})/area(primary);}

export function validateDensity(measuredPage){
  const errors=[],warnings=[],patternId=measuredPage?.patternId||"unknown",profile=profileFor(patternId,measuredPage?.densityProfile);
  const primary=arr(measuredPage?.zones).find((zone)=>zone.id==="primary")?.rect||measuredPage?.primaryRect;
  if(!primary)return{passed:false,errors:[`页面 ${measuredPage?.pageId||"<unknown>"} 缺少primary区域`],warnings,metrics:{}};
  const textItems=arr(measuredPage?.textRects).filter((item)=>item.visible!==false&&item.textLength>0),textRects=textItems.map((item)=>item.rect);
  const emptyRatio=largestEmptyRatio(primary,textRects),envelope=envelopeRatio(primary,textRects),fontSizes=textItems.map((item)=>Number(item.fontSize)).filter(Number.isFinite),minFont=fontSizes.length?Math.min(...fontSizes):0;
  const inkArea=textRects.reduce((sum,rect)=>sum+area(intersect(primary,rect)),0)/Math.max(1,area(primary));
  const decorationArea=arr(measuredPage?.decorations).reduce((sum,item)=>sum+area(intersect(primary,item.rect)),0)/Math.max(1,area(primary));
  const safeArea=measuredPage?.safeArea||{x:96,y:54,width:1728,height:944};
  const primaryShare=Number.isFinite(measuredPage?.plannedPrimaryShare)?measuredPage.plannedPrimaryShare:area(primary)/Math.max(1,area(safeArea));
  if(!textRects.length)errors.push(`页面 ${measuredPage?.pageId} 主视觉没有可测量文字`);
  if(envelope<profile.minEnvelope)errors.push(`页面 ${measuredPage?.pageId} 有效内容包络仅${(envelope*100).toFixed(1)}%，低于${(profile.minEnvelope*100).toFixed(0)}%`);
  if(emptyRatio>profile.maxEmpty)errors.push(`页面 ${measuredPage?.pageId} 最大空区占${(emptyRatio*100).toFixed(1)}%，疑似假留白`);
  if(minFont&&minFont<profile.minFont)errors.push(`页面 ${measuredPage?.pageId} 最小字号${minFont}px，低于${profile.minFont}px`);
  if(inkArea>profile.maxInk)errors.push(`页面 ${measuredPage?.pageId} 文字面积过密：${(inkArea*100).toFixed(1)}%`);
  if(decorationArea>profile.maxDecoration)errors.push(`页面 ${measuredPage?.pageId} 装饰面积${(decorationArea*100).toFixed(1)}%挤压信息`);
  if(primaryShare<.55||primaryShare>.70)errors.push(`页面 ${measuredPage?.pageId} 主视觉区域占比${(primaryShare*100).toFixed(1)}%，应在55%–70%`);
  return{passed:errors.length===0,errors,warnings,metrics:{patternId,profile,envelopeRatio:Number(envelope.toFixed(4)),largestEmptyRatio:Number(emptyRatio.toFixed(4)),minFontSize:minFont,inkAreaRatio:Number(inkArea.toFixed(4)),decorationRatio:Number(decorationArea.toFixed(4)),primaryShare:Number(primaryShare.toFixed(4))}};
}
function runCli(){const[input,output]=process.argv.slice(2);if(!input||!fs.existsSync(input)){console.error("Usage: node qa-density.mjs geometry.json [report.json]");process.exit(2);}const geometry=JSON.parse(fs.readFileSync(path.resolve(input),"utf8"));const pages=arr(geometry.pages).map((page)=>({pageId:page.pageId,...validateDensity(page)}));const report={passed:pages.every((page)=>page.passed),pages,errors:pages.flatMap((page)=>page.errors)};if(output)fs.writeFileSync(path.resolve(output),`${JSON.stringify(report,null,2)}\n`);console.log(JSON.stringify(report,null,2));process.exit(report.passed?0:1);}
if(process.argv[1]&&decodeURIComponent(new URL(import.meta.url).pathname)===path.resolve(process.argv[1]))runCli();
