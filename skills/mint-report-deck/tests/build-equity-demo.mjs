#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const deckFile = path.resolve(process.argv[2]);
const output = path.resolve(process.argv[3]);
const qaDir = path.resolve(process.argv[4]);
const deck = JSON.parse(await fs.readFile(deckFile, "utf8"));
const C={ivory:"F5F0E6",paper:"FFFDF8",ink:"162A24",forest:"0E453A",jade:"1C7866",mint:"8CCDB2",copper:"BC794D",blue:"547E89",line:"CBD3CE",muted:"69766F"};
const serif="Songti SC",sans="PingFang SC";
const p=Presentation.create({slideSize:{width:1280,height:720}});
const sh=(s,n,g,l,t,w,h,fill="none",line="none")=>s.shapes.add({name:n,geometry:g,position:{left:l,top:t,width:w,height:h},fill,line:{style:"solid",fill:line,width:line==="none"?0:1}});
function tx(s,n,v,l,t,w,h,size=18,color=C.ink,bold=false,font= sans,align="left"){const x=sh(s,n,"textbox",l,t,w,h);x.text=v;x.text.style={fontSize:size,color,bold,fontFamily:font,alignment:align,verticalAlignment:"middle"};return x;}
const rect=(s,n,l,t,w,h,fill,line="none")=>sh(s,n,"rect",l,t,w,h,fill,line);
function chrome(s,chapter,page,total){rect(s,"top-rule",60,46,1160,1,C.line);rect(s,"accent",60,29,28,3,C.copper);tx(s,"chapter",chapter,98,18,360,26,12,C.jade,true);tx(s,"page",String(page).padStart(2,"0"),1168,18,52,26,11,C.muted,true,sans,"right");rect(s,"bottom-rule",60,674,1160,1,C.line);tx(s,"brand","mint",60,681,90,22,16,"42B879",true);tx(s,"source","来源：用户提供的交易结构示例；比例不代表监管批准结果",360,681,560,20,9,C.muted,false,sans,"center");tx(s,"counter",`${String(page).padStart(2,"0")} / ${String(total).padStart(2,"0")}`,1130,681,90,20,9,C.muted,false,sans,"right");}
function title(s,lines,lead){tx(s,"title",lines.join("\n"),60,72,840,105,34,C.ink,true,serif);tx(s,"lead",lead,915,110,305,55,13,C.muted,false,sans,"right");}
function allocation(s,name,y,label,formula,headline,segments,threshold,implication){rect(s,`${name}-panel`,60,y,1160,175,C.paper,C.line);tx(s,`${name}-label`,label,85,y+18,170,36,23,C.ink,true,serif);tx(s,`${name}-formula`,formula,285,y+15,440,42,26,C.jade,true,serif);tx(s,`${name}-headline`,headline,760,y+18,420,40,19,threshold?C.forest:C.copper,true,sans,"right");let x=285;const barW=895;for(const [i,seg] of segments.entries()){const w=barW*seg.value/100;rect(s,`${name}-seg-${i}`,x,y+82,w,45,seg.fill);if(seg.show!==false)tx(s,`${name}-val-${i}`,`${seg.value}%`,x+2,y+88,Math.max(24,w-4),30,w<70?13:18,seg.text||C.paper,true,sans,"center");x+=w;}if(threshold){const mx=285+barW*threshold/100;rect(s,`${name}-threshold`,mx,y+64,2,80,C.copper);tx(s,`${name}-threshold-label`,`示例上限 ${threshold}%`,mx-160,y+48,155,24,11,C.copper,true,sans,"right");}tx(s,`${name}-implication`,implication,285,y+132,895,30,14,C.ink,true);}

const first=deck.slides[0];
{
  const s=p.slides.add();s.background.fill=C.ivory;chrome(s,first.chapter||"权益结构",1,2);title(s,first.titleLines,first.lead);
  const groups=first.primaryVisual.data.groups;
  allocation(s,"kenya",205,groups[0].label,groups[0].formula,groups[0].headline,groups[0].segments.map(x=>({value:x.value,fill:x.tone==="jade"?C.jade:"DDE6E2",show:x.showValue,text:x.tone==="remainder"?C.muted:C.paper})),groups[0].threshold.value,groups[0].implication);
  allocation(s,"tanzania",395,groups[1].label,groups[1].formula,groups[1].headline,groups[1].segments.map(x=>({value:x.value,fill:x.tone==="jade"?C.jade:x.tone==="gap"?C.copper:"DDE6E2",show:x.showValue,text:x.tone==="remainder"?C.muted:C.paper})),null,groups[1].implication);
  rect(s,"boundary",60,585,1160,55,C.forest);tx(s,"boundary-label","法律边界",85,596,100,28,11,C.mint,true);tx(s,"boundary-value","交易结构示例，不是监管批准结果；具体安排需专项法律意见",205,593,975,32,16,C.paper,true);
}
const second=deck.slides[1];
{
  const s=p.slides.add();s.background.fill=C.ivory;chrome(s,second.chapter||"权益保护",2,2);title(s,second.titleLines,second.lead);
  const items=second.stages||[];rect(s,"chain-line",130,392,770,4,C.jade);items.forEach((item,i)=>{const x=65+i*275;rect(s,`node-${i}`,x,215,235,340,C.paper,C.line);rect(s,`node-accent-${i}`,x,215,235,6,[C.jade,C.blue,C.copper][i]);tx(s,`node-no-${i}`,String(i+1).padStart(2,"0"),x+24,240,60,25,12,[C.jade,C.blue,C.copper][i],true);tx(s,`node-title-${i}`,item.name,x+24,286,185,55,24,C.ink,true,serif);tx(s,`node-entity-${i}`,(item.entities||[]).join("\n"),x+24,370,185,58,18,C.forest,true,serif);tx(s,`node-detail-${i}`,item.detail||item.capability||"",x+24,455,185,60,13,C.muted,false,sans);if(i<items.length-1)tx(s,`arrow-${i}`,"→",x+235,370,40,35,24,C.copper,true,serif,"center");});rect(s,"decision",915,215,305,340,C.forest);tx(s,"decision-kicker","投入前锁定",945,245,220,25,12,C.mint,true);tx(s,"decision-title",second.pageAnswer,945,300,220,130,23,C.paper,true,serif);tx(s,"decision-note","具体条款与法律安排进入待确认项",945,470,220,50,13,"DCECE5");
}

await fs.mkdir(path.dirname(output),{recursive:true});await fs.mkdir(qaDir,{recursive:true});
for(const [i,s] of p.slides.items.entries()){const png=await p.export({slide:s,format:"png",scale:1});await fs.writeFile(path.join(qaDir,`slide-${String(i+1).padStart(2,"0")}.png`),new Uint8Array(await png.arrayBuffer()));const layout=await s.export({format:"layout"});await fs.writeFile(path.join(qaDir,`slide-${String(i+1).padStart(2,"0")}.layout.json`),await layout.text());}
const pptx=await PresentationFile.exportPptx(p);await pptx.save(output);console.log(JSON.stringify({output,slides:p.slides.items.length},null,2));
