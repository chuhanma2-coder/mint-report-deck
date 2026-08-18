#!/usr/bin/env node
import { validateReadingOrder } from "../scripts/qa-reading-order.mjs";
import { validateLayoutGeometry } from "../scripts/qa-layout-geometry.mjs";

const rect=(x,y,width,height)=>({x,y,width,height});
const layout=(axis,zones,patternId="parallel-columns")=>({pageId:"P1",patternId,readingAxis:axis,focalZoneId:"primary",readingPath:zones.map((zone,index)=>({zoneId:zone.id,order:index+1})),zones:zones.map((zone,index)=>({...zone,readingOrder:index+1}))});
const measured=(zones,blocks,patternId="parallel-columns")=>({pageId:"P1",patternId,zones:zones.map((zone,index)=>({id:zone.id,readingOrder:index+1,rect:zone.rect})),blocks});
const lrZones=[{id:"title",rect:rect(96,54,1000,140)},{id:"page-answer",rect:rect(1120,54,704,140)},{id:"primary",rect:rect(96,220,1728,650)},{id:"source",rect:rect(96,920,1728,60)}];
const tbZones=[{id:"title",rect:rect(96,54,1728,130)},{id:"primary",rect:rect(96,210,1728,600)},{id:"support",rect:rect(96,830,1728,120)},{id:"source",rect:rect(96,970,1728,40)}];
const centerZones=[{id:"title",rect:rect(96,54,1728,130)},{id:"primary",rect:rect(96,210,1728,700)},{id:"source",rect:rect(96,950,1728,50)}];
for(const [axis,zones] of [["left-to-right",lrZones],["top-to-bottom",tbZones],["center-out",centerZones]]){
  const result=validateReadingOrder(layout(axis,zones,axis==="center-out"?"radial-branches":"parallel-columns"),measured(zones,[],axis==="center-out"?"radial-branches":"parallel-columns"));
  if(!result.passed)throw new Error(`${axis}正例失败：${result.errors.join(" | ")}`);
}
const reversed=measured([{id:"title",rect:rect(96,54,1000,140)},{id:"page-answer",rect:rect(40,54,704,140)},{id:"primary",rect:rect(96,220,1728,650)},{id:"source",rect:rect(96,920,1728,60)}],[]);
const reverseResult=validateReadingOrder(layout("left-to-right",lrZones),reversed);
if(reverseResult.passed||!reverseResult.errors.some((error)=>error.includes("逆序")))throw new Error("逆序负例未阻断");

const goodBlocks=[
  {id:"b1",rect:rect(140,250,500,520),textLength:90,cardLike:false,readingOrder:1},
  {id:"b2",rect:rect(710,250,500,520),textLength:90,cardLike:false,readingOrder:2},
  {id:"b3",rect:rect(1280,250,500,520),textLength:90,cardLike:false,readingOrder:3}
];
const good=validateLayoutGeometry({pageId:"P1",patternId:"parallel-columns",blocks:goodBlocks});
if(!good.passed)throw new Error(`标准并列页失败：${good.errors.join(" | ")}`);
const corners=[
  {id:"a",rect:rect(20,20,150,90),textLength:10,cardLike:true,readingOrder:1},
  {id:"b",rect:rect(1750,20,150,90),textLength:10,cardLike:true,readingOrder:2},
  {id:"c",rect:rect(20,970,150,90),textLength:10,cardLike:true,readingOrder:3},
  {id:"d",rect:rect(1750,970,150,90),textLength:10,cardLike:true,readingOrder:4}
];
const scattered=validateLayoutGeometry({pageId:"P2",patternId:"hero",blocks:corners});
if(scattered.passed||!scattered.errors.some((error)=>error.includes("散落四角")))throw new Error("四角散落负例未阻断");
const fragments=Array.from({length:5},(_,index)=>({id:`f${index}`,rect:rect(300+index*250,400+(index%2)*130,170,90),textLength:20,cardLike:true,readingOrder:index+1}));
const fragmented=validateLayoutGeometry({pageId:"P3",patternId:"hero",blocks:fragments});
if(fragmented.passed||!fragmented.errors.some((error)=>error.includes("碎片化")))throw new Error("五段论述卡片化负例未阻断");
const twinFocus=validateLayoutGeometry({pageId:"P4",patternId:"hero",blocks:[{id:"x",rect:rect(100,300,650,450),textLength:80,cardLike:false,readingOrder:1},{id:"y",rect:rect(1170,300,650,440),textLength:80,cardLike:false,readingOrder:2}]});
if(twinFocus.passed||!twinFocus.errors.some((error)=>error.includes("竞争焦点")))throw new Error("双焦点负例未阻断");

console.log(JSON.stringify({passed:true,readingOrderPositiveCases:3,readingOrderReversedBlocked:1,geometryPositiveCases:1,scatteredCornersBlocked:1,fragmentedCardsBlocked:1,competingFociBlocked:1},null,2));
