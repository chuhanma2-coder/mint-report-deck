#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url)),skill=path.resolve(here,".."),repo=path.resolve(skill,"../.."),work=path.join(repo,".work","p110-v06-regression");
fs.mkdirSync(work,{recursive:true});
const env={...process.env,MINT_PLAYWRIGHT_MODULE:process.env.MINT_PLAYWRIGHT_MODULE||"/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs",MINT_CHROMIUM_EXECUTABLE:process.env.MINT_CHROMIUM_EXECUTABLE||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",MINT_PYTHON:process.env.MINT_PYTHON||"/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"};
const run=(command,args,label)=>{const r=spawnSync(command,args,{cwd:repo,encoding:"utf8",env,maxBuffer:40_000_000});if(r.status!==0)throw new Error(`${label}\n${r.stdout}\n${r.stderr}`);return r;};
const test=(name)=>run(process.execPath,[path.join(skill,"tests",name)],name);
const adversarial=JSON.parse(fs.readFileSync(path.join(here,"fixtures/semantic-adversarial.json"),"utf8"));
if(adversarial.length<30)throw new Error("semantic adversarial set must contain at least 30 cases");
const directional=new Set(["sequence","flow","temporal","causal","problem-cause-solution","before-after","hierarchy","dependency"]);
for(const item of adversarial){if(item.relation==="unknown"&&item.connector!=="blocked")throw new Error(`${item.name}: unknown must block`);if(!directional.has(item.relation)&&!["none","line","blocked"].includes(item.connector))throw new Error(`${item.name}: non-directional relation received ${item.connector}`);}
const promptCount=JSON.parse(fs.readFileSync(path.join(here,"fixtures/prompt-regression.json"),"utf8")).length;
for(const name of ["chinese-relations.mjs","layout-selection.mjs","deck-rhythm.mjs","cjk-typography.mjs","density.mjs"])test(name);

const fixture=(name)=>JSON.parse(fs.readFileSync(path.join(here,"fixtures",name),"utf8"));
const vodafone=fixture("vodafone-deck.json").slides[0],equity=fixture("equity-deck.json").slides[0];
const base=(id,type,title,lead,extra={})=>({id,type,chapter:`验证 ${id}`,titleLines:[title],lead,pageAnswer:"",source:"来源：P1-10受控回归数据",sourceRefs:[`TEST:${id}`],atomRefs:[`A-${id}`],visibleClaims:[{text:lead,atomRefs:[`A-${id}`]}],...extra});
const slides=[
  {...vodafone,id:"P1",pageAnswer:"",atomRefs:["A-P1"],primaryVisual:{kind:"capability-chain"}},
  base("P2","process","评论变化经核验后形成检查项","识别变化、保留证据，再形成产品检查项。",{primaryVisual:{kind:"process"},items:[{title:"识别变化",detail:"只处理有效变化"},{title:"保留证据",detail:"保留原文与时间"},{title:"形成检查项",detail:"进入产品验证"}]}),
  base("P3","capability-chain","知识库形成三项并列能力","全文保留、动态分类与来源追溯共同构成知识底座。",{primaryVisual:{kind:"capability-chain"},stages:[{name:"全文保留",role:"原文",entities:["区块"],capability:"位置可查"},{name:"动态分类",role:"组织",entities:["知识树"],capability:"随资料变化"},{name:"来源追溯",role:"证据",entities:["Claim"],capability:"回到原文"}]}),
  base("P4","architecture-brief","合作结构分为入口、能力与承接层","三层分别承担触达、判断和执行。",{primaryVisual:{kind:"layered-architecture"},stages:[{name:"入口",role:"触达",entities:["渠道"],capability:"接收需求"},{name:"能力层",role:"判断",entities:["规则"],capability:"形成方案"},{name:"承接层",role:"执行",entities:["团队"],capability:"完成行动"}],layers:[{name:"入口",role:"触达",entities:[{name:"渠道",detail:"接收需求"}]},{name:"能力层",role:"判断",entities:[{name:"规则",detail:"形成方案"}]},{name:"承接层",role:"执行",entities:[{name:"团队",detail:"完成行动"}]}]}),
  base("P5","quantitative-story","本轮完成128件并高于目标8件","关键结果需要用数字主视觉呈现。",{primaryVisual:{kind:"metric-strip",data:{metrics:[{label:"本轮完成",value:"128",unit:"件",detail:"实际结果"},{label:"高于目标",value:"8",unit:"件",detail:"完成差额"}]}}}),
  base("P6","risk-spotlight","成本触发范围过宽需要分级治理","普通条目不应与高风险事项使用同一复核策略。",{primaryVisual:{kind:"risk-alert"},risk:{label:"成本风险",severity:"中",judgment:"成本触发范围过宽需要分级治理。",evidence:["普通条目重复进入高成本复核"],impacts:["成本和处理时间增加"],actions:["按风险等级分流"]},supportModules:[{kind:"evidence",data:{value:"重复复核"}},{kind:"decision-callout",data:{value:"分级治理"}}]}),
  base("P7","risk-spotlight","高风险内容必须保留人工复核","法规、金额与处罚结论在正式使用前必须人工确认。",{primaryVisual:{kind:"risk-alert"},risk:{label:"关键风险",severity:"高",judgment:"法规、金额与处罚结论在正式使用前必须人工确认。",evidence:["自动提取可能存在识别误差"],impacts:["错误内容可能进入正式判断"],actions:["关键结论由人工确认"]},supportModules:[{kind:"evidence",data:{value:"高风险口径"}},{kind:"decision-callout",data:{value:"人工确认"}}]}),
  base("P8","decision","下一步先验证再决定扩大范围","先完成小额测试，再根据质量与成本决定是否扩大。",{primaryVisual:{kind:"decision"},decision:"先完成小额测试，再根据质量与成本决定是否扩大。",why:["先取得真实质量与成本数据"],actions:[{title:"完成测试",action:"完成测试",detail:"记录质量与成本",owner:"项目组",time:"第一步"},{title:"复盘结果",action:"复盘结果",detail:"确认适用边界",owner:"项目组",time:"第二步"},{title:"决定范围",action:"决定范围",detail:"管理层确认",owner:"管理层",time:"第三步"}]}),
  base("P9","architecture-brief","能力按入口、处理与承接分层","入口负责触达，处理中台负责判断，后台负责业务承接。",{primaryVisual:{kind:"layered-architecture"},stages:[{name:"入口",role:"触达",entities:["业务入口"],capability:"接收需求"},{name:"处理中台",role:"判断",entities:["规则系统"],capability:"形成判断"},{name:"承接后台",role:"执行",entities:["业务团队"],capability:"完成行动"}],layers:[{name:"入口",role:"触达",entities:[{name:"业务入口",detail:"接收需求"}]},{name:"处理中台",role:"判断",entities:[{name:"规则系统",detail:"形成判断"}]},{name:"承接后台",role:"执行",entities:[{name:"业务团队",detail:"完成行动"}]}]}),
  base("P10","process","交付前依次完成三项检查","先核对事实，再检查版式，最后确认导出文件。",{primaryVisual:{kind:"process"},items:[{title:"事实核对",detail:"数字与实体一致"},{title:"版式检查",detail:"阅读顺序明确"},{title:"文件确认",detail:"HTML、PDF、PPTX一致"}]})
];
const deck={schemaVersion:"0.5",id:"p110-ten-page",version:1,title:"P1-10十页盲测",pageBudget:10,slides};
const deckFile=path.join(work,"deck-spec.json"),html=path.join(work,"report.html"),pdf=path.join(work,"report.pdf"),pptx=path.join(work,"report.pptx"),report=path.join(work,"cross-output-report.json");fs.writeFileSync(deckFile,JSON.stringify(deck,null,2));
run(process.execPath,[path.join(skill,"scripts/render-deck.mjs"),deckFile,html],"render 10-page HTML");
run(process.execPath,[path.join(skill,"scripts/render-pptx.mjs"),deckFile,pptx],"render 10-page PPTX");
run(process.execPath,[path.join(skill,"scripts/export-pdf.mjs"),html,pdf,path.join(work,"export-manifest.json")],"export 10-page PDF");
const cross=run(process.execPath,[path.join(skill,"scripts/validate-cross-output.mjs"),deckFile,html,pdf,pptx,report,"--manifest",path.join(work,"export-manifest.json")],"validate 10-page outputs");
const crossReport=JSON.parse(cross.stdout);if(crossReport.metrics.htmlPages!==10||crossReport.metrics.pdfPages!==10||crossReport.metrics.pptxPages!==10)throw new Error("10-page output count drift");
const families=new Set(slides.map((slide)=>slide.type));let maxRun=1,runLength=1;for(let i=1;i<slides.length;i++){runLength=slides[i].type===slides[i-1].type?runLength+1:1;maxRun=Math.max(maxRun,runLength);}if(families.size<4||maxRun>2)throw new Error("10-page diversity contract failed");
console.log(JSON.stringify({passed:true,adversarialCases:adversarial.length,promptCases:promptCount,pages:10,families:families.size,maxConsecutiveType:maxRun,crossOutputStatus:crossReport.status,workspace:work},null,2));
