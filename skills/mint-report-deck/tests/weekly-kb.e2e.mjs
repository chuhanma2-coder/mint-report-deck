#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildPageContracts } from "../scripts/build-page-contracts.mjs";
import { selectLayout } from "../scripts/select-layout.mjs";
import { validateSemanticLayout } from "../scripts/validate-semantic-layout.mjs";
import { validateReadingContract } from "../scripts/validate-reading-contract.mjs";
import { buildLayoutPlan } from "../scripts/build-layout-plan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const repo = path.resolve(root, "../..");
const output = path.join(repo, "outputs/v06-weekly-kb-e2e");
const sourceFile = path.join(root, "tests/fixtures/weekly-kb-source.md");
const expected = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/weekly-kb-expected.json"), "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(root, "assets/layout-patterns.json"), "utf8"));
const SRC = "USER:WEEKLY-KB:2026-08-18";

if (!fs.readFileSync(sourceFile, "utf8").includes("36,868")) throw new Error("source fixture incomplete");
const du = (id, sectionId, text, subject, predicate, role, relationToPrevious, sourceRef, extra = {}) => ({
  id, sectionId, text, subject, subjectResolution:"explicit", predicate, polarity:"affirmative", modality:"confirmed", role, relationToPrevious, entityRefs:[], numericClaimRefs:[], sourceRef, ...extra
});
const atom = (id, kind, text, discourseRefs, sourceRef, extra = {}) => ({
  id, kind, text, materiality:"primary", displayRequirement:"primary-visual", coverageStatus:"planned", discourseRefs, sourceRef, ...extra
});
const graphNode = (unit) => ({ id:`DU:${unit.id}`, kind:"atom", label:unit.text, sourceRefs:[unit.sourceRef], materiality:"primary", needsReview:false });
const edge = (id, source, target, relationType, connectorPolicy, evidenceRefs, extra = {}) => ({
  id, source:`DU:${source}`, target:`DU:${target}`, relationType,
  direction:relationType === "parallel" ? "none" : "directed", evidenceRefs, confidence:1,
  orderBasis:{ type:relationType === "parallel" ? "none" : relationType === "flow" ? "input-output-handoff" : relationType === "before-after" ? "explicit-marker" : "dependency", ...(relationType === "parallel" ? {} : { evidenceRef:evidenceRefs.at(-1) }) },
  connectorPolicy, needsReview:false, ...extra
});

const discourseUnits = [
  du("D1","S1","覆盖扩大：目前覆盖140个具体贷款页面，并由live sitemap自动发现新增页面。","周报系统","扩大覆盖并自动发现新增页面","evidence","starts",`${SRC}#weekly-1`,{numericClaimRefs:["N-140"]}),
  du("D2","S1","分析加深：从利率扩展到各项成本费用。","周报系统","扩展成本分析范围","claim","elaborates",`${SRC}#weekly-1`),
  du("D3","S1","交付完整：每次运行全量复查，并输出完整累计报告。","周报系统","全量复查并累计交付","claim","elaborates",`${SRC}#weekly-1`),
  du("D4","S1","抓取Google Play评论。","客户评论抓取","抓取评论","claim","starts",`${SRC}#weekly-2`),
  du("D5","S1","识别真正发生的有效变化，无有效负面变化时不改写文档。","客户评论抓取","识别有效变化","claim","sequences",`${SRC}#weekly-2`,{polarity:"negative"}),
  du("D6","S1","保留系统结论、用户原文、具体时间和评论链接。","客户评论抓取结果","保留原文证据","evidence","sequences",`${SRC}#weekly-2`),
  du("D7","S1","将竞品问题转化为Mint产品检查和验证项。","客户评论抓取结果","转化为产品检查项","effect","results-in",`${SRC}#weekly-2`),
  du("D8","S2","V1按关键词截取部分段落，依赖少量固定Topic，追溯与限定分析不足。","知识库V1","按局部命中形成固定分类","contrast","starts",`${SRC}#kb-2`,{polarity:"negative"}),
  du("D9","S2","V2完成83份文件全文解析，形成36,868个可定位区块，并支持动态分类、Claim追溯和限定分析范围。","知识库V2","以全文区块建立可追溯分析","contrast","contrasts",`${SRC}#kb-1-2`,{numericClaimRefs:["N-83","N-36868"]}),
  du("D10","S2","当前实际投入261.53，二次复核约占成本58%。","知识库本轮测试","确认复核成本问题","evidence","starts",`${SRC}#kb-3-4`,{numericClaimRefs:["N-26153","N-58"]}),
  du("D11","S2","高风险词触发范围过宽，普通条目也进入DeepSeek V4 Pro逐条复核。","当前复核机制","造成重复上下文和长推理","cause","causes",`${SRC}#kb-4`),
  du("D12","S2","建议改为低、中、高风险三级复核，只有高风险内容调用DeepSeek V4 Pro。","复核方案","按风险分流模型调用","action","results-in",`${SRC}#kb-5`,{modality:"proposal"}),
  du("D13","S2","下一阶段先开展小额熔断测试。","知识库团队","开展小额熔断测试","action","starts",`${SRC}#kb-6`,{modality:"plan"}),
  du("D14","S2","验证后封装只读知识库MCP。","知识库团队","封装只读MCP","action","sequences",`${SRC}#kb-7`,{modality:"plan"}),
  du("D15","S2","MCP开放检索、追溯、过滤和治理查询，不开放上传、发布、驳回和删除。","知识库MCP","限定只读能力边界","boundary","elaborates",`${SRC}#kb-7`,{polarity:"negative",modality:"plan"})
];

const contentAtoms = [
  atom("A1","fact","覆盖140个贷款页面，并自动发现新增页面",["D1"],`${SRC}#weekly-1`),
  atom("A2","fact","分析从利率扩展到各项成本费用",["D2"],`${SRC}#weekly-1`),
  atom("A3","fact","每次运行全量复查并输出完整累计报告",["D3"],`${SRC}#weekly-1`),
  atom("A4","fact","抓取Google Play评论",["D4"],`${SRC}#weekly-2`),
  atom("A5","fact","只识别真正发生的有效变化",["D5"],`${SRC}#weekly-2`),
  atom("A6","evidence","保留用户原文、时间和评论链接",["D6"],`${SRC}#weekly-2`),
  atom("A7","judgment","将竞品问题转化为Mint检查项",["D7"],`${SRC}#weekly-2`,{assertionStatus:"formal"}),
  atom("A8","fact","V1局部截取并依赖固定Topic",["D8"],`${SRC}#kb-2`),
  atom("A9","fact","V2完成83份文件解析并形成36,868个可定位区块",["D9"],`${SRC}#kb-1-2`),
  atom("A10","judgment","261.53投入中二次复核约占58%",["D10"],`${SRC}#kb-3-4`,{assertionStatus:"formal",judgmentType:"risk",risk:{judgment:"二次复核约占58%成本",evidence:["当前实际投入261.53"],impact:["高价模型调用过多"],action:["改为三级复核"]}}),
  atom("A11","fact","触发范围过宽并重复提交上下文",["D11"],`${SRC}#kb-4`),
  atom("A12","action","三级复核只让高风险内容调用DeepSeek V4 Pro",["D12"],`${SRC}#kb-5`,{displayRequirement:"callout"}),
  atom("A13","action","开展小额熔断测试",["D13"],`${SRC}#kb-6`),
  atom("A14","action","封装只读知识库MCP",["D14"],`${SRC}#kb-7`),
  atom("A15","boundary","开放检索、追溯、过滤和治理查询，不开放写操作",["D15"],`${SRC}#kb-7`)
];
const numericClaims = [
  {id:"N-140",raw:"140个具体贷款页面",value:140,unit:"个页面",subject:"周报覆盖范围",period:"当前",role:"category-value",materiality:"supporting",displayRequirement:"callout",sourceRef:`${SRC}#weekly-1`},
  {id:"N-83",raw:"83份文件",value:83,unit:"份文件",subject:"已解析文件",period:"当前",role:"category-value",materiality:"supporting",displayRequirement:"callout",sourceRef:`${SRC}#kb-1`},
  {id:"N-36868",raw:"36,868个可定位原文区块",value:36868,unit:"个区块",subject:"可定位原文区块",period:"当前",role:"category-value",materiality:"supporting",displayRequirement:"callout",sourceRef:`${SRC}#kb-1`},
  {id:"N-26153",raw:"当前实际投入261.53",value:261.53,unit:"未提供",subject:"当前实际投入",period:"本轮",role:"actual",materiality:"primary",displayRequirement:"primary-visual",sourceRef:`${SRC}#kb-3`},
  {id:"N-58",raw:"二次复核占成本约58%",value:58,unit:"%",subject:"二次复核成本占比",period:"本轮",role:"part",materiality:"primary",displayRequirement:"primary-visual",sourceRef:`${SRC}#kb-4`}
];
const edges = [
  edge("E-P1-1","D1","D2","parallel","none",[`${SRC}#weekly-1`]),
  edge("E-P1-2","D2","D3","parallel","none",[`${SRC}#weekly-1`]),
  edge("E-P2-1","D4","D5","flow","arrow",[`${SRC}#weekly-2`]),
  edge("E-P2-2","D5","D6","flow","arrow",[`${SRC}#weekly-2`]),
  edge("E-P2-3","D6","D7","flow","arrow",[`${SRC}#weekly-2`]),
  edge("E-P3-1","D8","D9","before-after","arrow",[`${SRC}#kb-2`,`${SRC}#kb-1-2`]),
  edge("E-P4-1","D10","D11","causal","arrow",[`${SRC}#kb-3-4`,`${SRC}#kb-4`],{assertionStatus:"confirmed"}),
  edge("E-P4-2","D11","D12","causal","arrow",[`${SRC}#kb-4`,`${SRC}#kb-5`],{assertionStatus:"proposal"}),
  edge("E-P5-1","D13","D14","sequence","arrow",[`${SRC}#kb-6`,`${SRC}#kb-7`]),
  edge("E-P5-2","D14","D15","sequence","arrow",[`${SRC}#kb-7`])
];
const page = (pageId, actionTitle, pageRole, managementQuestion, answer, atomRefs, relationshipRefs, evidenceRefs, transitionFromPrevious, reason) => ({
  pageId, actionTitle, pageRole, managementQuestion, answer, atomRefs, relationshipRefs, evidenceRefs,
  transitionFromPrevious,
  pageNecessity:{type:pageId === "P1" ? "opening" : "independent-decision",reason,removalTest:{losesPrimaryEvidence:true,breaksDecisionChain:pageId !== "P2",exceedsCapacityElsewhere:pageId !== "P1"}}
});
const ghostDeck = [
  page("P1","周报系统覆盖140页，三项能力并列升级","evidence","周报系统本轮增强了什么？","覆盖、分析和交付三项能力同步升级，但彼此不是流程关系。",["A1","A2","A3"],["E-P1-1","E-P1-2"],["N-140"],{fromPageId:null,bridge:"先看周报系统的三项独立升级"},"三项升级共同回答周报系统的阶段成果"),
  page("P2","评论变化经证据保留，转成Mint检查项","action","客户评论如何从抓取变成产品输入？","系统只处理有效变化，保留原文证据，再转成Mint产品检查项。",["A4","A5","A6","A7"],["E-P2-1","E-P2-2","E-P2-3"],["A6"],{fromPageId:"P1",bridge:"从贷款页面监测延伸到评论变化监测"},"评论链路是一组必须按顺序执行的产品动作"),
  page("P3","知识库从局部命中升级为全文可追溯","contrast","知识库V2相对V1改变了什么？","V2以全文原文区块为底座，并建立动态分类、Claim追溯和限定范围分析。",["A8","A9"],["E-P3-1"],["N-83","N-36868"],{fromPageId:"P2",bridge:"从外部信息监测转向内部知识沉淀"},"V1与V2的本质差异需要独立对比"),
  page("P4","二次复核占成本58%，需改为三级分流","risk","成本消耗在哪里，如何调整？","本轮投入261.53中，二次复核约占58%；应缩小高价模型触发范围并按风险分级。",["A10","A11","A12"],["E-P4-1","E-P4-2"],["N-26153","N-58"],{fromPageId:"P3",bridge:"能力落地后继续检查实际运行成本"},"成本问题、原因和方案形成独立管理决策"),
  page("P5","先做熔断测试，再封装只读MCP","action","下一阶段先验证什么，再开放什么？","先验证三级复核的成本与质量，再按只读边界开放检索和追溯能力。",["A13","A14","A15"],["E-P5-1","E-P5-2"],["A13","A14","A15"],{fromPageId:"P4",bridge:"把成本判断转化为验证动作和开放边界"},"下一阶段动作和服务边界需要形成清晰顺序")
];

const map = {
  schemaVersion:"0.6",
  communicationJob:{audience:"内部管理层",purpose:"说明周报系统与知识库阶段进展",desiredOutcome:"确认三级复核、小额熔断测试和只读MCP方向",managementTakeaway:"两项能力已具备增量维护和证据追溯基础，下一步优先降低复核成本并验证只读服务"},
  discourseUnits, contentAtoms, numericClaims,
  claimGraph:[
    {id:"CG1",from:["A6"],relation:"supports",to:["A7"]},
    {id:"CG2",from:["N-26153","N-58"],relation:"supports",to:["A10"]},
    {id:"CG3",from:["A10","A11"],relation:"results-in",to:["A12"]}
  ],
  semanticGraph:{schemaVersion:"0.6",sourceContentMapVersion:"0.6",nodes:discourseUnits.map(graphNode),edges,migrationWarnings:[]},
  narrativeCommitment:{audienceShift:"从功能清单转为理解成果、成本瓶颈和下一步",coreThesis:"周报系统与知识库已形成可维护、可追溯基础",decision:"确认三级复核与小额熔断测试方向",mustShowAtomRefs:contentAtoms.map((item)=>item.id),mustNotInfer:["261.53的单位","未提供的评论案例","MCP已正式发布"],narrativeSpine:["evidence","evidence","contrast","risk","action"],deEmphasizeAtomRefs:[],pageBudgetPriority:"minimum-needed"},
  ghostDeck,
  decisionThreads:ghostDeck.map((item,index)=>({id:`DT${index+1}`,managementQuestion:item.managementQuestion,answer:item.answer,atomRefs:item.atomRefs,relationshipRefs:item.relationshipRefs,roles:[item.pageRole === "contrast" ? "evidence" : item.pageRole],pageAssignment:item.pageId,independenceTest:{differentDecision:true,understandableWithoutOtherThreads:true,ownEvidenceAndImplication:true,separationPreservesLogic:true}})),
  facts:[
    {id:"F1",text:"周报系统三项升级",sourceRef:`${SRC}#weekly-1`},
    {id:"F2",text:"评论证据链",sourceRef:`${SRC}#weekly-2`},
    {id:"F3",text:"知识库V1/V2变化",sourceRef:`${SRC}#kb-1-2`},
    {id:"F4",text:"复核成本及三级方案",sourceRef:`${SRC}#kb-3-5`},
    {id:"F5",text:"小额熔断与只读MCP",sourceRef:`${SRC}#kb-6-7`}
  ],
  entities:[
    {id:"E1",canonicalName:"周报系统",aliases:[],requiredOnSlides:true},
    {id:"E2",canonicalName:"Google Play",aliases:[],requiredOnSlides:true},
    {id:"E3",canonicalName:"Mint",aliases:[],requiredOnSlides:true},
    {id:"E4",canonicalName:"DeepSeek V4 Pro",aliases:[],requiredOnSlides:true},
    {id:"E5",canonicalName:"知识库MCP",aliases:["MCP"],requiredOnSlides:true}
  ],
  relationships:edges.map((item)=>({id:item.id,type:item.relationType,statement:`${item.source} ${item.relationType} ${item.target}`})),
  numbers:numericClaims.map((item)=>({id:item.id,value:item.value,unit:item.unit,period:item.period,subject:item.subject,sourceRef:item.sourceRef})),
  actions:[],
  priorities:[
    {id:"PR1",kind:"capital",subject:"261.53",level:"material",sourceRef:`${SRC}#kb-3`},
    {id:"PR2",kind:"risk",subject:"58%",level:"material",sourceRef:`${SRC}#kb-4`},
    {id:"PR3",kind:"decision",subject:"三级复核",level:"material",sourceRef:`${SRC}#kb-5`}
  ],
  unknowns:[{id:"U1",text:"261.53的单位未提供",sourceRef:`${SRC}#kb-3`}], conflicts:[],
  pageBudget:{requested:null,minimum:1,planned:5,constraint:"minimum-needed",overflowPolicy:"recompose-then-split",reason:"五个独立管理问题，不增加封面和章节页"},
  riskLevel:"ordinary"
};

const plan = buildPageContracts(map);
const selections = [];
let adjacent = {};
for (const pageContract of plan.pageContracts) {
  const selected = selectLayout(pageContract, map.semanticGraph, registry, adjacent);
  selections.push({pageId:pageContract.id,...selected});
  if (selected.status === "selected") adjacent = {lastPatternId:selected.patternId,lastRendererKey:registry.patterns.find((item)=>item.id===selected.patternId)?.rendererKeys.html};
}
const layoutSelection = {schemaVersion:"0.6",status:selections.every((item)=>item.status==="selected")?"selected":"needs-layout-review",selections};
if (layoutSelection.status !== "selected") throw new Error(`layout selection failed: ${JSON.stringify(layoutSelection.selections.filter((item)=>item.status!=="selected"),null,2)}`);

const contractById = new Map(plan.pageContracts.map((item)=>[item.id,item]));
const visible = (text, atomRefs) => ({text,atomRefs});
const connector = (id, relationRef, fromElementId, toElementId) => ({id,relationRef,connectorType:"arrow",direction:"forward",fromElementId,toElementId});
const base = (id, type, chapter, primaryVisual, atomRefs, sourceRefs, visibleClaims, visualBrief, elementIds, connectors = []) => {
  const contract = contractById.get(id);
  return {id,type,chapter,sectionId:contract.sectionId,pageRole:contract.pageRole,threadRefs:[`DT${Number(id.slice(1))}`],titleLines:contract.titleLines,pageQuestion:contract.pageQuestion,pageAnswer:contract.pageAnswer,lead:contract.pageAnswer,primaryVisual,supportModules:[],readingOrder:contract.contentOrder,atomRefs,sourceRefs,visibleClaims,visualBrief,elementIds,connectors,source:`来源：用户提供的周报系统与知识库阶段材料`};
};
const slides = [
  {...base("P1","comparison","周报系统",{kind:"parallel-columns",claimRefs:["N-140"],atomRefs:["A1","A2","A3"],data:{}},["A1","A2","A3"],[`${SRC}#weekly-1`],[visible("覆盖140个贷款页面，并自动发现新增页面",["A1"]),visible("分析从利率扩展到各项成本费用",["A2"]),visible("每次运行全量复查并输出完整累计报告",["A3"])],{relationship:"parallel",focalPoint:"140页覆盖与三项并列升级",readingDirection:"left-to-right"},["title","page-answer","proof-object","upgrade-1","upgrade-2","upgrade-3"]),columns:[
    {title:"140页覆盖 + 自动发现",subtitle:"覆盖扩大",items:["live sitemap重新发现新增贷款页面"]},
    {title:"成本费用分析",subtitle:"分析加深",items:["从利率扩展到各项成本费用"]},
    {title:"完整累计报告",subtitle:"交付完整",items:["全量复查新增与变化"]}
  ],emphasis:{terms:["140页","成本费用","完整累计报告"]}},
  {...base("P2","process","客户评论",{kind:"horizontal-sequence",claimRefs:[],atomRefs:["A4","A5","A6","A7"],data:{}},["A4","A5","A6","A7"],[`${SRC}#weekly-2`],[visible("抓取Google Play评论",["A4"]),visible("只识别真正发生的有效变化",["A5"]),visible("保留用户原文、时间和评论链接",["A6"]),visible("将竞品问题转化为Mint检查项",["A7"])],{relationship:"flow",focalPoint:"有效变化到产品检查项",readingDirection:"left-to-right"},["title","page-answer","proof-object","step-1","step-2","step-3","step-4"],[connector("C-P2-1","E-P2-1","step-1","step-2"),connector("C-P2-2","E-P2-2","step-2","step-3"),connector("C-P2-3","E-P2-3","step-3","step-4")]),items:[
    {title:"抓取Google Play",detail:"单独监测客户评论"},
    {title:"识别有效变化",detail:"无有效负面变化时不改写、不提醒"},
    {title:"保留原文证据",detail:"同时保留时间与评论链接"},
    {title:"形成Mint检查项",detail:"把竞品问题转为产品验证输入"}
  ],emphasis:{terms:["有效变化","原文证据","Mint检查项"]}},
  {...base("P3","comparison","知识库V2",{kind:"before-after",claimRefs:["N-83","N-36868"],atomRefs:["A8","A9"],data:{}},["A8","A9"],[`${SRC}#kb-1-2`],[visible("V1局部截取并依赖固定Topic",["A8"]),visible("V2完成83份文件解析并形成36,868个可定位区块",["A9"])],{relationship:"before-after",focalPoint:"V1到V2的底座变化",readingDirection:"left-to-right"},["title","page-answer","proof-object","before","after"],[connector("C-P3-1","E-P3-1","before","after")]),columns:[
    {title:"V1｜局部命中",subtitle:"部分段落 + 固定Topic",items:["长文件可能只处理前面部分","来源与Topic可能脱节","不能稳定限定分析范围"]},
    {title:"V2｜全文可追溯",subtitle:"83份文件 · 36,868个区块",items:["全文区块保留位置与状态","动态知识树 + Claim原文引用","支持指定文件和分析范围"]}
  ],emphasis:{terms:["83份","36,868个","全文可追溯"]}},
  {...base("P4","quantitative-story","成本治理",{kind:"metric-strip",claimRefs:["N-26153","N-58"],atomRefs:["A10"],data:{metrics:[
    {label:"当前实际投入",value:"261.53",unit:"",detail:"单位未提供，按原文口径展示",claimRefs:["N-26153"]},
    {label:"二次复核成本占比",value:"58",unit:"%",detail:"当前主要成本消耗项",claimRefs:["N-58"]}
  ]}},["A10","A11","A12"],[`${SRC}#kb-3-5`],[visible("261.53投入中二次复核约占58%",["A10"]),visible("触发范围过宽并重复提交上下文",["A11"]),visible("三级复核只让高风险内容调用DeepSeek V4 Pro",["A12"])],{relationship:"causal",focalPoint:"58%成本问题到三级复核方案",readingDirection:"top-to-bottom"},["title","page-answer","proof-object","problem","cause","solution"],[connector("C-P4-1","E-P4-1","problem","cause"),connector("C-P4-2","E-P4-2","cause","solution")]),supportModules:[
    {kind:"risk-alert",atomRefs:["A11"],claimRefs:[],data:{label:"原因",value:"触发范围过宽",detail:"普通条目逐条进入DeepSeek V4 Pro，重复上下文并返回长推理"}},
    {kind:"decision-callout",atomRefs:["A12"],claimRefs:[],data:{label:"三级复核",value:"低风险程序核对｜中风险低价或批量｜高风险才用Pro",detail:"只返回结构化结论"}}
  ],emphasis:{terms:["261.53","58%","三级复核","DeepSeek V4 Pro"],callouts:[{kind:"capital",label:"本轮投入",value:"261.53"},{kind:"risk",label:"二次复核占比",value:"58%"}]}},
  {...base("P5","timeline","下一阶段",{kind:"timeline",claimRefs:[],atomRefs:["A13","A14","A15"],data:{}},["A13","A14","A15"],[`${SRC}#kb-6-7`],[visible("开展小额熔断测试",["A13"]),visible("封装只读知识库MCP",["A14"]),visible("开放检索、追溯、过滤和治理查询，不开放写操作",["A15"])],{relationship:"sequence",focalPoint:"先验证、再封装、最后守住只读边界",readingDirection:"left-to-right"},["title","page-answer","proof-object","next-1","next-2","next-3"],[connector("C-P5-1","E-P5-1","next-1","next-2"),connector("C-P5-2","E-P5-2","next-2","next-3")]),items:[
    {time:"第一步",title:"小额熔断测试",detail:"先验证三级复核的成本与质量"},
    {time:"验证后",title:"封装只读知识库MCP",detail:"开放检索、追溯、过滤和治理查询"},
    {time:"持续边界",title:"守住只读范围",detail:"不开放上传、发布、驳回和删除"}
  ],emphasis:{terms:["小额熔断测试","只读知识库MCP","不开放"]}}
];
const deck = {schemaVersion:"0.6",id:"weekly-kb-v06-e2e",version:1,title:"周报系统与知识库阶段进展",subtitle:"能力升级、成本问题与下一步验证",date:"2026-08-18",confidentiality:"内部材料",pageBudget:5,pageConstraint:"minimum-needed",deckPlan:plan,layoutSelection,slides};

fs.mkdirSync(output,{recursive:true});
const layoutPlan = buildLayoutPlan(plan,layoutSelection,registry,deck);
const files = {map:path.join(output,"content-map.json"),graph:path.join(output,"semantic-graph.json"),plan:path.join(output,"deck-plan.json"),selection:path.join(output,"layout-selection.json"),layout:path.join(output,"layout-plan.json"),deck:path.join(output,"deck-spec.json"),html:path.join(output,"report.html"),qa:path.join(output,"qa-report.json")};
for (const [file,value] of [[files.map,map],[files.graph,map.semanticGraph],[files.plan,plan],[files.selection,layoutSelection],[files.layout,layoutPlan],[files.deck,deck]]) fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`);

const semantic = validateSemanticLayout(plan,map,layoutSelection,registry,deck);
const reading = validateReadingContract(plan,layoutSelection,registry);
if (!semantic.passed || !reading.passed) throw new Error(`semantic/read QA failed: ${[...semantic.errors,...reading.errors].join(" | ")}`);
const run = (script,args=[]) => {
  const result = spawnSync(process.execPath,[path.join(root,"scripts",script),...args],{encoding:"utf8",env:process.env});
  if (result.status !== 0) throw new Error(`${script} failed\n${result.stdout}\n${result.stderr}`);
  return result;
};
run("qa-deck.mjs",[files.deck,files.map,files.qa]);
run("render-deck.mjs",[files.deck,files.html,files.layout]);

if (deck.slides.length !== expected.pageCount) throw new Error(`expected ${expected.pageCount} pages, got ${deck.slides.length}`);
for (const expectedPage of expected.pages) {
  const slide = deck.slides.find((item)=>item.id===expectedPage.id);
  const selected = layoutSelection.selections.find((item)=>item.pageId===expectedPage.id);
  if (!slide || selected?.patternId !== expectedPage.patternId) throw new Error(`${expectedPage.id}: expected ${expectedPage.patternId}, got ${selected?.patternId}`);
  const relation = map.semanticGraph.edges.find((item)=>item.id===contractById.get(expectedPage.id).primaryRelationRef);
  if (relation?.relationType !== expectedPage.relationType) throw new Error(`${expectedPage.id}: relation drifted to ${relation?.relationType}`);
  if (slide.connectors.length !== expectedPage.arrowCount) throw new Error(`${expectedPage.id}: expected ${expectedPage.arrowCount} arrows, got ${slide.connectors.length}`);
  const serialized = JSON.stringify(slide);
  for (const required of expectedPage.requiredTexts) if (!serialized.includes(required)) throw new Error(`${expectedPage.id}: missing ${required}`);
}
if (deck.slides[0].connectors.length || deck.slides[0].type !== "comparison") throw new Error("parallel upgrades must not render arrows");
if (deck.slides.some((slide)=>!slide.visibleClaims.length)) throw new Error("blank page contract detected");

console.log(JSON.stringify({passed:true,pages:deck.slides.length,patterns:layoutSelection.selections.map((item)=>item.patternId),connectors:deck.slides.map((slide)=>slide.connectors.length),semanticPages:semantic.metrics.pages,readingPaths:reading.metrics.clearReadingPaths,output,files},null,2));
