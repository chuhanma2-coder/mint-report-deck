#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

process.on("uncaughtException", (error) => {
  console.error("MINT_BUILD_ERROR", error?.message || String(error));
  console.error(String(error?.stack || "").split("\n").slice(0, 8).join("\n"));
  process.exit(1);
});
process.on("unhandledRejection", (error) => {
  console.error("MINT_BUILD_ERROR", error?.message || String(error));
  console.error(String(error?.stack || "").split("\n").slice(0, 8).join("\n"));
  process.exit(1);
});

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const output = path.resolve(process.argv[2] || path.join(root, "assets/presentation/Mint_Report_Component_Library.pptx"));
const qaDir = path.resolve(process.argv[3] || path.join(path.dirname(output), "qa"));
const C = { ivory: "F5F0E6", paper: "FFFDF8", ink: "162A24", forest: "0E453A", jade: "1C7866", mint: "8CCDB2", copper: "BC794D", blue: "547E89", sage: "8EA79D", line: "CBD3CE", muted: "69766F", white: "FFFFFF" };
const serif = "Songti SC";
const sans = "PingFang SC";

function shape(container, name, geometry, left, top, width, height, fill = "none", line = "none") {
  return container.shapes.add({ name, geometry, position: { left, top, width, height }, fill, line: { style: "solid", fill: line, width: line === "none" ? 0 : 1 } });
}
function textbox(container, name, value, left, top, width, height, size = 18, color = C.ink, bold = false, fontFamily = sans, align = "left") {
  const s = shape(container, name, "textbox", left, top, width, height);
  s.text = value;
  s.text.style = { fontSize: size, color, bold, fontFamily, alignment: align, verticalAlignment: "middle" };
  return s;
}
function rule(container, left, top, width, color = C.line, h = 1) { return shape(container, `rule-${left}-${top}`, "rect", left, top, width, h, color); }
function addChrome(slide, chapter, page) {
  rule(slide, 60, 45, 1160, C.line, 1);
  shape(slide, "chapter-accent", "rect", 60, 28, 28, 3, C.copper);
  textbox(slide, "chapter", chapter, 98, 18, 320, 26, 12, C.jade, true);
  textbox(slide, "page-number", String(page).padStart(2, "0"), 1172, 18, 48, 26, 11, C.muted, true, sans, "right");
  rule(slide, 60, 674, 1160, C.line, 1);
  textbox(slide, "brand", "mint", 60, 680, 90, 24, 16, "42B879", true, sans);
  textbox(slide, "source", "来源：组件母版示例，生成材料时替换", 430, 680, 430, 22, 9, C.muted, false, sans, "center");
  textbox(slide, "footer-page", `${String(page).padStart(2, "0")} / 25`, 1130, 680, 90, 22, 9, C.muted, false, sans, "right");
}
function addTitle(slide, title, lead = "") {
  textbox(slide, "page-title", title, 60, 70, 1160, 66, 30, C.ink, true, serif);
  if (lead) textbox(slide, "page-lead", lead, 60, 132, 1160, 34, 14, C.muted, false, sans);
}
function addLabel(slide, value, left, top, width, color = C.jade) { textbox(slide, `label-${left}-${top}`, value, left, top, width, 20, 10, color, true, sans); }
function addCard(slide, name, left, top, width, height, title, detail, accent = C.jade) {
  shape(slide, `${name}-bg`, "rect", left, top, width, height, C.paper, C.line);
  shape(slide, `${name}-accent`, "rect", left, top, 5, height, accent);
  textbox(slide, `${name}-title`, title, left + 22, top + 16, width - 44, 34, 18, C.ink, true, serif);
  textbox(slide, `${name}-detail`, detail, left + 22, top + 54, width - 44, height - 66, 12, C.muted, false, sans);
}
function addQuantBar(slide, name, left, top, width, height, segments, total = 100, threshold = null) {
  let x = left;
  for (const [index, segment] of segments.entries()) {
    const segmentWidth = width * Number(segment.value) / total;
    const compact = segmentWidth < 70;
    shape(slide, `${name}-segment-${index}`, "rect", x, top, segmentWidth, height, segment.fill);
    if (!compact) textbox(slide, `${name}-segment-label-${index}`, segment.label, x + 8, top + 8, Math.max(25, segmentWidth - 16), 22, 11, segment.textColor || C.paper, true, sans, "center");
    if (segment.showValue !== false) textbox(slide, `${name}-segment-value-${index}`, `${segment.value}${segment.unit || ""}`, x + (compact ? 1 : 8), top + (compact ? 15 : 31), Math.max(25, segmentWidth - (compact ? 2 : 16)), compact ? Math.max(28, height - 30) : 34, compact ? 13 : 20, segment.textColor || C.paper, true, sans, "center");
    x += segmentWidth;
  }
  if (threshold) {
    const tx = left + width * Number(threshold.value) / total;
    shape(slide, `${name}-threshold`, "rect", tx, top - 22, 2, height + 35, C.copper);
    textbox(slide, `${name}-threshold-label`, `${threshold.label} ${threshold.value}${threshold.unit || ""}`, Math.max(left, tx - 190), top - 45, 185, 24, 11, C.copper, true, sans, "right");
  }
}

const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const master = p.masters.add("Mint Formal Master");

const recipeNames = ["封面", "管理层总览", "三层合作架构", "双轨路线图", "横向流程", "时间轴", "角色泳道", "方案对比", "二维矩阵", "KPI 与精确表格", "数据图表", "风险行动 Owner", "管理层决策", "能力链路", "风险聚焦", "资金决策", "关键数字", "实际与目标", "阈值与监管上限", "构成与权益分配", "公式与差额桥", "定量双对象比较", "情景与预测", "章节页", "结尾页"];
const layouts = new Map();
for (const name of recipeNames) {
  const layout = p.layouts.add(`Mint · ${name}`);
  layout.setParentLayoutId(master.id);
  layout.placeholders.add({ type: "title", index: 0, geometry: "textbox", position: { left: 60, top: 70, width: 1160, height: 66 }, text: `${name}标题` });
  layouts.set(name, layout);
}

function slideFor(name, page, chapter = "MINT · COMPONENT LIBRARY") {
  const slide = p.slides.add();
  slide.setLayout(layouts.get(name));
  slide.background.fill = C.ivory;
  addChrome(slide, chapter, page);
  return slide;
}

// 01 Cover
{
  const s = p.slides.add(); s.setLayout(layouts.get("封面")); s.background.fill = C.forest;
  shape(s, "cover-light-panel", "rect", 760, 0, 520, 720, C.ivory);
  textbox(s, "cover-eyebrow", "MINT · REPORT SYSTEM V0.4", 70, 78, 500, 30, 13, C.mint, true);
  textbox(s, "cover-title", "Mint 汇报组件母版库", 70, 160, 650, 95, 42, C.paper, true, serif);
  textbox(s, "cover-subtitle", "从事实和逻辑出发，生成可编辑 PPTX 与互动 HTML", 70, 270, 610, 70, 20, "DCECE5", false, sans);
  rule(s, 70, 585, 610, "3D6B61", 1); textbox(s, "cover-meta", "16:9  ·  中文管理层材料  ·  2026.08", 70, 605, 600, 28, 12, C.mint, true);
  for (let i = 0; i < 4; i++) { shape(s, `arc-${i}`, "ellipse", 830 + i * 52, 150 + i * 48, 300 - i * 18, 300 - i * 18, i === 3 ? C.jade : "none", i === 3 ? "none" : [C.mint, C.copper, C.blue][i]); }
  textbox(s, "cover-mark", "M", 930, 245, 140, 100, 60, C.paper, true, serif, "center");
  textbox(s, "cover-brand", "mint", 1070, 655, 120, 28, 18, "42B879", true, sans, "right");
}

// 02 Executive overview
{
  const s = slideFor("管理层总览", 2, "管理层总览"); addTitle(s, "一个页面回答：判断、证据、风险与行动", "用于复杂材料的管理层首屏，不把内容拆成低密度卡片。");
  shape(s, "takeaway", "rect", 60, 190, 500, 185, C.forest);
  addLabel(s, "核心判断", 88, 210, 180, C.mint); textbox(s, "takeaway-copy", "在事实边界内形成一条可推动决策的管理层判断", 88, 244, 430, 92, 27, C.paper, true, serif);
  addCard(s, "evidence", 590, 190, 300, 185, "证据", "列出支撑判断的事实、数字与来源，不混入假设。", C.jade);
  addCard(s, "risk", 920, 190, 300, 185, "风险", "只显示需要管理层看见的限制和影响。", C.copper);
  addCard(s, "action", 60, 405, 1160, 190, "下一步行动", "动作一：明确 Owner 与时间    ·    动作二：补齐关键证据    ·    动作三：形成可验证交付", C.blue);
}

// 03 Architecture
{
  const s = slideFor("三层合作架构", 3, "合作架构"); addTitle(s, "合作由客户入口、能力协同与银行承接三层组成", "只展示来源提供的主体和关系，不为填版式补写产出。");
  const rows = [["01","前台","客户入口","M-PESA","移动支付入口","Mint APP","Mint 用户入口",C.copper],["02","中台","流量与风险能力","M-PESA / Transsion","提供流量","微众","提供风险能力",C.jade],["03","后台","银行服务承接","传音银行","银行机构","其他 Mint 接入银行","银行机构",C.blue]];
  rows.forEach((r,i)=>{const y=195+i*133;shape(s,`layer-${i}`,"rect",60,y,1160,115,C.paper,C.line);shape(s,`layer-accent-${i}`,"rect",60,y,7,115,r[7]);textbox(s,`layer-no-${i}`,r[0],84,y+18,42,25,13,r[7],true);textbox(s,`layer-name-${i}`,r[1],126,y+15,130,35,22,C.ink,true,serif);textbox(s,`layer-role-${i}`,r[2],126,y+55,160,26,11,C.muted);addCard(s,`entity-a-${i}`,310,y+16,400,82,r[3],r[4],r[7]);addCard(s,`entity-b-${i}`,740,y+16,450,82,r[5],r[6],r[7]);});
}

// 04 Dual track
{
  const s = slideFor("双轨路线图", 4, "战略与牌照"); addTitle(s, "业务演进与牌照升级并行推进", "两条路径分别表达，底部集中管理层动作。");
  [["路径 01","业务路径","先生态，后现金",C.jade],["路径 02","牌照路径","DRB → 运营三年 → DFB",C.blue]].forEach((r,ti)=>{const y=185+ti*180;shape(s,`track-${ti}`,"rect",60,y,1160,160,C.paper,C.line);shape(s,`track-accent-${ti}`,"rect",60,y,7,160,r[3]);textbox(s,`track-label-${ti}`,r[0],85,y+20,120,20,10,C.copper,true);textbox(s,`track-name-${ti}`,r[1],85,y+47,180,35,22,C.ink,true,serif);textbox(s,`track-summary-${ti}`,r[2],85,y+88,190,30,12,C.muted,true);["起点","推进","验证","目标"].forEach((v,i)=>{const x=305+i*220;textbox(s,`track-${ti}-${i}-stage`,v,x,y+24,160,20,10,r[3],true);textbox(s,`track-${ti}-${i}-title`,["核心企业生态","首发产品","积累数据","扩展业务"][i],x,y+50,165,32,16,C.ink,true,serif);textbox(s,`track-${ti}-${i}-detail`,"在此填写已确认的阶段内容",x,y+86,165,44,10,C.muted);if(i<3)textbox(s,`track-${ti}-${i}-arrow`,"→",x+178,y+60,30,24,18,C.copper,true);});});
  shape(s,"action-bg","rect",60,555,1160,92,C.forest);textbox(s,"action-title","下一步",82,574,130,44,23,C.paper,true,serif);["合作","资本","申报"].forEach((v,i)=>{textbox(s,`action-${i}`,`${v}｜填写动作、Owner 与时间`,250+i*310,572,290,48,13,C.paper,true);});
}

// 05 Process
{
  const s=slideFor("横向流程",5,"流程与阶段门");addTitle(s,"输入经过有序处理，形成可验证输出","仅当内容存在真实顺序时使用流程图。");rule(s,95,390,1060,C.jade,3);["确认输入","核对事实","形成判断","执行行动","验证结果"].forEach((v,i)=>{const x=70+i*235;shape(s,`process-${i}`,"ellipse",x+72,372,36,36,i===2?C.forest:C.paper,i===2?"none":C.copper);textbox(s,`process-no-${i}`,String(i+1).padStart(2,"0"),x,230,180,30,14,C.copper,true);textbox(s,`process-title-${i}`,v,x,275,190,36,20,C.ink,true,serif,"center");textbox(s,`process-detail-${i}`,"填写该步骤的动作和结果",x,318,190,45,11,C.muted,false,sans,"center");});
}

// 06 Timeline
{
  const s=slideFor("时间轴",6,"时间与里程碑");addTitle(s,"关键节点沿同一时间轴推进","时间、里程碑和交付物必须来自原始材料。");rule(s,110,385,1020,C.jade,2);["当前","T+1","T+2","目标节点"].forEach((v,i)=>{const x=95+i*300;shape(s,`time-dot-${i}`,"ellipse",x,367,36,36,i===3?C.copper:C.jade);textbox(s,`time-${i}`,v,x-20,220,150,28,13,C.jade,true);textbox(s,`time-title-${i}`,["当前基础","完成审批","进入运营","形成目标能力"][i],x-20,270,220,36,20,C.ink,true,serif);textbox(s,`time-detail-${i}`,"填写来源确认的时间与里程碑",x-20,312,220,42,11,C.muted);});
}

// 07 Swimlane
{
  const s=slideFor("角色泳道",7,"角色与职责");addTitle(s,"每个角色沿同一流程承担明确责任","用角色和动作组织阅读，不把职责拆成孤立卡片。");["业务 Owner","数据 / 风险","合作机构","管理层"].forEach((actor,i)=>{const y=190+i*105;shape(s,`lane-${i}`,"rect",60,y,1160,92,i%2?"EEF4F1":C.paper,C.line);textbox(s,`lane-actor-${i}`,actor,80,y+20,170,45,18,C.ink,true,serif);["输入","判断","行动","结果"].forEach((v,j)=>{textbox(s,`lane-${i}-${j}`,j===i%4?`${v}：主要责任`:`${v}：配合`,290+j*220,y+20,190,45,12,j===i%4?C.jade:C.muted,j===i%4);});});
}

// 08 Comparison
{
  const s=slideFor("方案对比",8,"方案比较");addTitle(s,"两个方案按同一维度比较，差异一眼可见","评价维度保持一致，结论不能由版式制造。");["方案 A","方案 B"].forEach((v,i)=>{const x=60+i*590;shape(s,`comparison-${i}`,"rect",x,190,570,390,C.paper,C.line);shape(s,`comparison-accent-${i}`,"rect",x,190,570,6,i?C.blue:C.jade);textbox(s,`comparison-title-${i}`,v,x+30,220,510,44,25,C.ink,true,serif);["适用场景","关键优势","主要限制","验证条件"].forEach((d,j)=>{rule(s,x+30,292+j*64,510,C.line,1);textbox(s,`comparison-label-${i}-${j}`,d,x+30,302+j*64,120,32,12,C.muted,true);textbox(s,`comparison-value-${i}-${j}`,"填写已确认内容",x+165,302+j*64,360,32,14,C.ink);});});
}

// 09 Matrix
{
  const s=slideFor("二维矩阵",9,"分类矩阵");addTitle(s,"两个分类维度交叉定位机会与风险","用于类别 × 类别，不用于伪造数值热力图。");["低影响","中影响","高影响"].forEach((v,i)=>textbox(s,`matrix-col-${i}`,v,320+i*280,190,260,38,15,C.paper,true,sans,"center"));shape(s,"matrix-head", "rect", 300,180,840,55,C.forest);["高可行性","中可行性","低可行性"].forEach((v,r)=>{textbox(s,`matrix-row-${r}`,v,70,255+r*110,200,80,16,C.ink,true,serif);[0,1,2].forEach(c=>{const fills=[["DCECE5","B8DACB","8CCDB2"],["EEF4F1","DCECE5","B8DACB"],["FFFDF8","EEF4F1","DCECE5"]];shape(s,`matrix-cell-${r}-${c}`,"rect",300+c*280,245+r*110,280,110,fills[r][c],C.line);textbox(s,`matrix-copy-${r}-${c}`,"填写分类判断",325+c*280,280+r*110,230,36,14,C.ink,false,sans,"center");});});
}

// 10 Table
{
  const s=slideFor("KPI 与精确表格",10,"精确数据");addTitle(s,"精确数字优先用表格，指标口径同时可见","每个指标保留单位、期间、统计对象和来源。");const cols=["指标","本期","目标","变化","口径 / 说明"];const widths=[250,160,160,160,430];let x=60;cols.forEach((v,i)=>{shape(s,`th-${i}`,"rect",x,190,widths[i],52,C.forest);textbox(s,`th-text-${i}`,v,x+15,198,widths[i]-30,36,13,C.paper,true);x+=widths[i];});["核心指标 A","核心指标 B","核心指标 C","核心指标 D"].forEach((v,r)=>{let xx=60;[v,"—","—","—","填写统计口径与来源"].forEach((cell,i)=>{shape(s,`td-${r}-${i}`,"rect",xx,242+r*75,widths[i],75,r%2?"EEF4F1":C.paper,C.line);textbox(s,`td-text-${r}-${i}`,cell,xx+15,255+r*75,widths[i]-30,48,i===0?14:13,i===0?C.ink:C.muted,i===0);xx+=widths[i];});});
}

// 11 Charts
{
  const s=slideFor("数据图表",11,"数据与趋势");addTitle(s,"类别对比用柱状图，连续时间用折线图","图表必须包含真实数值、单位、期间、统计对象和来源。");
  s.charts.add("bar",{name:"editable-bar",position:{left:70,top:200,width:520,height:350},categories:["类别 A","类别 B","类别 C","类别 D"],series:[{name:"本期",values:[42,58,73,65],fill:C.jade}],hasLegend:false,dataLabels:{showValue:true,position:"outEnd"},yAxis:{majorGridlines:{style:"solid",fill:C.line,width:1}}});
  s.charts.add("line",{name:"editable-line",position:{left:660,top:200,width:520,height:350},categories:["1月","2月","3月","4月","5月"],series:[{name:"实际",values:[35,42,48,57,63],line:{fill:C.blue,width:3}},{name:"目标",values:[38,44,50,56,62],line:{fill:C.copper,width:2}}],hasLegend:true,yAxis:{majorGridlines:{style:"solid",fill:C.line,width:1}}});
  textbox(s,"chart-note","单位：示例单位   ·   期间：示例期间   ·   统计对象：示例对象   ·   生成时必须替换数据与来源",70,575,1110,30,11,C.muted,false,sans,"center");
}

// 12 Risk action owner
{
  const s=slideFor("风险行动 Owner",12,"风险与行动");addTitle(s,"风险必须对应行动、Owner 与验证节点","风险不是背景说明，而是需要被管理的事项。");["风险","影响","行动","Owner / 时间"].forEach((v,i)=>{const x=[60,340,650,950][i],w=[280,310,300,270][i];shape(s,`risk-head-${i}`,"rect",x,190,w,52,i===0?C.copper:C.forest);textbox(s,`risk-head-text-${i}`,v,x+18,198,w-36,36,13,C.paper,true);});[0,1,2].forEach(r=>{const y=242+r*110;[[60,280,"填写已确认风险"],[340,310,"说明可能影响"],[650,300,"填写应对动作"],[950,270,"Owner · 时间"]].forEach((c,i)=>{shape(s,`risk-${r}-${i}`,"rect",c[0],y,c[1],110,r%2?"EEF4F1":C.paper,C.line);textbox(s,`risk-text-${r}-${i}`,c[2],c[0]+18,y+25,c[1]-36,60,14,i===0?C.ink:C.muted,i===0);});});
}

// 13 Decision
{
  const s=slideFor("管理层决策",13,"决策与下一步");addTitle(s,"管理层只需回答一个决策问题","行动项比背景信息更醒目。");shape(s,"decision-main","rect",60,190,650,390,C.forest);addLabel(s,"DECISION",95,220,160,C.mint);textbox(s,"decision-copy","是否批准进入下一阶段，并以明确的事实和结果标准复盘？",95,280,560,120,29,C.paper,true,serif);textbox(s,"decision-reason","依据 01｜填写关键证据\n依据 02｜填写风险边界",95,430,540,90,14,"DCECE5");["确认范围","落实 Owner","设定验证节点"].forEach((v,i)=>addCard(s,`decision-action-${i}`,750,190+i*130,470,110,v,"填写动作、责任人和时间",[C.jade,C.blue,C.copper][i]));
}

// 14 Capability chain
{
  const s=slideFor("能力链路",14,"业务能力链路");addTitle(s,"入口、能力与服务承接形成一条完整链路","重要主体作为视觉锚点，说明文字保持辅助地位。若有重大决策，可使用右侧强调模块。");
  // Draw the flow behind the nodes first.
  rule(s,120,397,755,C.jade,4);textbox(s,"chain-arrow-1","→",330,380,42,34,25,C.copper,true,serif,"center");textbox(s,"chain-arrow-2","→",585,380,42,34,25,C.copper,true,serif,"center");
  const stages=[
    ["01","前台入口","客户触达","M-PESA\nMint APP","形成双入口",C.copper],
    ["02","能力协同","流量与风险","Transsion\n微众","流量 + 风险能力",C.jade],
    ["03","银行承接","金融服务","传音银行\n接入银行","承接银行业务",C.blue]
  ];
  stages.forEach((r,i)=>{const x=65+i*260;shape(s,`chain-node-${i}`,"rect",x,210,220,365,C.paper,C.line);shape(s,`chain-node-accent-${i}`,"rect",x,210,220,7,r[5]);textbox(s,`chain-no-${i}`,r[0],x+24,238,55,25,12,r[5],true);textbox(s,`chain-role-${i}`,r[2],x+24,278,170,24,11,C.muted,true);textbox(s,`chain-name-${i}`,r[1],x+24,311,175,48,25,C.ink,true,serif);textbox(s,`chain-entities-${i}`,r[3],x+24,380,175,72,19,C.forest,true,serif);rule(s,x+24,474,172,C.line,1);textbox(s,`chain-capability-${i}`,r[4],x+24,492,175,44,16,C.ink,true);});
  shape(s,"chain-callout","rect",870,210,350,365,C.forest);addLabel(s,"讨论重点",900,242,140,C.mint);textbox(s,"chain-callout-title","是否继续探索\n三层合作",900,300,285,100,31,C.paper,true,serif);textbox(s,"chain-callout-detail","围绕入口、能力协同与银行承接进一步确认",900,440,270,70,14,"DCECE5");
}

// 15 Risk spotlight
{
  const s=slideFor("风险聚焦",15,"关键风险判断");addTitle(s,"正式合作证据不足，可能影响监管真实性审核","风险页先给出判断，再说明证据、影响和需要推动的动作。");
  shape(s,"risk-judgment","rect",60,190,670,410,"7B2427");addLabel(s,"KEY RISK",95,225,150,"F0B5A1");textbox(s,"risk-level","高影响",590,220,100,32,13,C.paper,true,sans,"center");textbox(s,"risk-title","合作真实性证据\n仍不充分",95,300,560,115,36,C.paper,true,serif);textbox(s,"risk-summary","重要风险判断应独立成页或进入显著风险模块，不能埋在正文说明中。",95,470,540,70,15,"F4D9CF");
  [["判断依据","目前仅有意向材料",C.jade],["可能影响","影响监管真实性审核",C.copper],["需要推动","尽快签署正式协议",C.blue]].forEach((r,i)=>{const y=190+i*136;shape(s,`risk-side-${i}`,"rect",755,y,465,118,C.paper,C.line);shape(s,`risk-side-accent-${i}`,"rect",755,y,6,118,r[2]);textbox(s,`risk-side-label-${i}`,r[0],785,y+18,150,25,12,r[2],true);textbox(s,`risk-side-value-${i}`,r[1],785,y+51,390,45,19,C.ink,true,serif);});
}

// 16 Capital decision
{
  const s=slideFor("资金决策",16,"资本与决策");addTitle(s,"启动资金约 5,000 万美元，股权及出资安排仍待明确","资金、规模和审批条件必须从普通说明中单独拎出。");
  shape(s,"capital-main","rect",60,190,510,400,C.copper);addLabel(s,"CAPITAL",95,225,130,"FFE3CF");textbox(s,"capital-value","5,000",95,285,360,100,65,C.paper,true,serif);textbox(s,"capital-unit","万美元",380,330,130,42,22,C.paper,true,serif);textbox(s,"capital-status","当前状态｜启动资金规模已讨论，具体股权比例与出资安排待定",95,445,405,85,15,"FFF0E6");
  textbox(s,"capital-decision-label","管理层需要推动",620,205,300,28,13,C.jade,true);["明确资本方案","确认股权结构","锁定出资安排"].forEach((v,i)=>{const y=255+i*105;shape(s,`capital-action-${i}`,"rect",620,y,600,82,C.paper,C.line);textbox(s,`capital-action-no-${i}`,String(i+1).padStart(2,"0"),645,y+20,45,32,13,C.copper,true);textbox(s,`capital-action-title-${i}`,v,710,y+16,250,38,21,C.ink,true,serif);textbox(s,`capital-action-detail-${i}`,"填写 Owner 与确认时间",960,y+18,225,35,12,C.muted);});shape(s,"capital-decision","rect",620,575,600,55,C.forest);textbox(s,"capital-decision-text","决策｜是否按该规模继续细化资本与股权方案",645,585,550,34,16,C.paper,true);
}

// 17 Hero metrics
{
  const s=slideFor("关键数字",17,"关键数字");addTitle(s,"关键数字先回答管理问题，再补充口径","只突出真正影响判断的 1–4 个数字；说明文字保持辅助地位。");
  [["21%","直接持股","肯尼亚结构示例",C.jade],["25%","示例上限","边界标记",C.copper],["20%","直接持股","坦桑尼亚结构示例",C.blue],["5.5%","权益补足","理论权益与直接持股差额",C.forest]].forEach((r,i)=>{const x=60+i*290;shape(s,`metric-${i}`,"rect",x,210,270,320,i===3?C.forest:C.paper,i===3?"none":C.line);shape(s,`metric-top-${i}`,"rect",x,210,270,7,r[3]);textbox(s,`metric-value-${i}`,r[0],x+25,260,220,82,48,i===3?C.paper:r[3],true,serif);textbox(s,`metric-label-${i}`,r[1],x+25,365,220,42,21,i===3?C.paper:C.ink,true,serif);textbox(s,`metric-note-${i}`,r[2],x+25,430,220,60,13,i===3?"DCECE5":C.muted);});
}

// 18 Actual vs target
{
  const s=slideFor("实际与目标",18,"实际—目标");addTitle(s,"实际值与目标值的差距需要被直接看见","显示实际、目标、差距和管理含义，不把数字埋进说明文字。");
  shape(s,"at-panel","rect",60,205,1160,330,C.paper,C.line);textbox(s,"at-actual-label","实际",105,245,140,28,13,C.jade,true);textbox(s,"at-actual","72",105,285,230,92,58,C.jade,true,serif);textbox(s,"at-target-label","目标",400,245,140,28,13,C.blue,true);textbox(s,"at-target","80",400,285,230,92,58,C.blue,true,serif);textbox(s,"at-gap-label","差距",700,245,140,28,13,C.copper,true);textbox(s,"at-gap","-8",700,285,230,92,58,C.copper,true,serif);shape(s,"at-callout","rect",950,235,220,235,C.forest);textbox(s,"at-callout-kicker","IMPLICATION",980,265,165,24,11,C.mint,true);textbox(s,"at-callout-title","差距尚未收口",980,315,165,60,24,C.paper,true,serif);textbox(s,"at-callout-note","填写需要推动的动作与 Owner",980,395,165,52,12,"DCECE5");addQuantBar(s,"at-progress",105,430,765,32,[{label:"实际",value:72,fill:C.jade},{label:"差距",value:8,fill:"DDE6E2"}],80,{value:80,label:"目标",unit:""});
}

// 19 Threshold
{
  const s=slideFor("阈值与监管上限",19,"阈值与边界");addTitle(s,"21% 低于 25% 示例上限，结构在示例边界内","实际值、阈值和结论必须在同一视觉中完成核对。");
  shape(s,"threshold-main","rect",60,200,1160,340,C.paper,C.line);textbox(s,"threshold-formula","70%  ×  30%  =  21%",95,245,720,70,39,C.ink,true,serif);textbox(s,"threshold-result","21%",930,235,220,88,52,C.jade,true,serif,"right");addQuantBar(s,"threshold-bar",95,365,1050,56,[{label:"直接持股",value:21,fill:C.jade},{label:"距上限",value:4,fill:"DDE6E2"}],25,{value:25,label:"示例上限",unit:"%"});textbox(s,"threshold-boundary","示例上限 25%",920,435,225,30,15,C.copper,true,sans,"right");shape(s,"threshold-implication","rect",95,485,1050,62,C.forest);textbox(s,"threshold-implication-text","结论｜21% 低于示例上限，可按方案直接承接",120,497,1000,38,18,C.paper,true);
}

// 20 Allocation
{
  const s=slideFor("构成与权益分配",20,"权益构成");addTitle(s,"直接持股 20%，另以 5.5% 经济权益补足","构成条保持总量一致，重点展示直接承接、差额与剩余权益。");
  textbox(s,"allocation-country","坦桑尼亚",65,205,260,40,24,C.ink,true,serif);textbox(s,"allocation-headline","理论权益 25.5%",930,205,260,40,20,C.jade,true,serif,"right");addQuantBar(s,"allocation-bar",65,285,1130,86,[{label:"直接持股 20%",value:20,fill:C.jade},{label:"补足 5.5%",value:5.5,fill:C.copper},{label:"其余股权",value:74.5,fill:"DDE6E2"}],100,null);textbox(s,"allocation-formula","85%  ×  30%  =  25.5%",65,420,520,55,28,C.ink,true,serif);shape(s,"allocation-gap","rect",700,410,495,95,C.forest);textbox(s,"allocation-gap-value","5.5%",730,430,120,42,28,C.paper,true,serif);textbox(s,"allocation-gap-note","超出直接持股方案的部分，以等额经济权益补足",870,425,290,58,14,"DCECE5",true);
}

// 21 Formula and gap bridge
{
  const s=slideFor("公式与差额桥",21,"公式与差额");addTitle(s,"从理论权益到直接持股，5.5% 差额需要被单独解释","公式、结构安排和业务含义沿单一阅读路径展开。");
  [["85%","可控股份"],["30%","合作权益系数"],["25.5%","理论权益"],["20%","直接持股"],["5.5%","权益补足"]].forEach((r,i)=>{const x=60+i*232;const dark=i===2||i===4;shape(s,`bridge-${i}`,"rect",x,245,205,200,i===4?C.copper:(i===2?C.forest:C.paper),dark?"none":C.line);textbox(s,`bridge-value-${i}`,r[0],x+20,280,165,65,36,dark?C.paper:([C.jade,C.blue,C.ink,C.jade][i]||C.ink),true,serif,"center");textbox(s,`bridge-label-${i}`,r[1],x+20,360,165,45,14,dark?"DCECE5":C.muted,true,sans,"center");if(i<4)textbox(s,`bridge-op-${i}`,["×","=","−","="][i],x+198,315,34,34,21,C.copper,true,serif,"center");});shape(s,"bridge-note","rect",60,500,1130,68,"EEF4F1");textbox(s,"bridge-note-text","解释｜理论权益由公式计算；直接持股之外的差额，以用户确认的经济权益安排补足。",85,513,1080,42,16,C.ink,true);
}

// 22 Quantitative comparison
{
  const s=slideFor("定量双对象比较",22,"双对象定量比较");addTitle(s,"两国权益结构差异集中在阈值与差额处理","国家只是组织方式；主逻辑是公式、构成、边界和结论。");
  [["肯尼亚","70% × 30% = 21%","21% 低于 25% 示例上限",[{label:"直接持股 21%",value:21,fill:C.jade},{label:"其余股权",value:79,fill:"DDE6E2"}],null],["坦桑尼亚","85% × 30% = 25.5%","20% 直接持股 + 5.5% 权益补足",[{label:"直接持股 20%",value:20,fill:C.jade},{label:"补足 5.5%",value:5.5,fill:C.copper},{label:"其余股权",value:74.5,fill:"DDE6E2"}],null]].forEach((r,i)=>{const y=205+i*180;shape(s,`qcmp-${i}`,"rect",60,y,1160,160,C.paper,C.line);textbox(s,`qcmp-country-${i}`,r[0],90,y+23,170,40,23,C.ink,true,serif);textbox(s,`qcmp-formula-${i}`,r[1],285,y+20,400,44,25,C.jade,true,serif);textbox(s,`qcmp-conclusion-${i}`,r[2],760,y+25,420,40,17,i?C.copper:C.forest,true,sans,"right");addQuantBar(s,`qcmp-bar-${i}`,285,y+88,895,40,r[3],100,null);});
}

// 23 Scenario and forecast
{
  const s=slideFor("情景与预测",23,"情景与预测");addTitle(s,"预测用区间和情景表达，不把不确定值包装成承诺","基准、保守、乐观情景必须共享同一口径与期间。");
  [["保守情景",18,"下行假设",C.blue],["基准情景",21,"当前主要判断",C.jade],["乐观情景",24,"上行假设",C.copper]].forEach((r,i)=>{const x=80+i*385;shape(s,`scenario-${i}`,"rect",x,210,345,330,i===1?C.forest:C.paper,i===1?"none":C.line);textbox(s,`scenario-label-${i}`,r[0],x+28,245,280,35,18,i===1?C.mint:r[3],true,serif);textbox(s,`scenario-value-${i}`,String(r[1]),x+28,305,230,90,58,i===1?C.paper:r[3],true,serif);textbox(s,`scenario-unit-${i}`,"万户",x+225,350,80,32,18,i===1?C.paper:C.ink,true,serif,"right");rule(s,x+28,420,285,i===1?"4F746A":C.line,1);textbox(s,`scenario-note-${i}`,r[2],x+28,445,285,52,14,i===1?"DCECE5":C.muted);});
}

// 24 Section
{
  const s=p.slides.add();s.setLayout(layouts.get("章节页"));s.background.fill=C.jade;textbox(s,"section-number","01",70,100,240,140,70,C.paper,false,serif);textbox(s,"section-title","战略与目标",70,270,600,70,34,C.paper,true,serif);textbox(s,"section-claim","先明确本章节需要回答的问题，再进入证据与行动",70,350,720,55,20,"DCECE5",false,sans);textbox(s,"section-en","STRATEGY & DIRECTION",70,430,500,32,15,C.mint,true);rule(s,70,630,1140,"58A28F",1);textbox(s,"section-brand","mint",70,650,100,30,16,C.paper,true);
}

// 25 Closing
{
  const s=p.slides.add();s.setLayout(layouts.get("结尾页"));s.background.fill=C.ivory;textbox(s,"closing-brand","Mint",70,65,160,45,24,"42B879",true);textbox(s,"closing-title","谢谢",70,235,430,80,46,C.jade,true,serif);textbox(s,"closing-en","THANK YOU",70,320,360,34,16,C.copper,true);for(let i=0;i<4;i++)shape(s,`closing-wave-${i}`,"ellipse",720+i*55,120+i*50,430-i*35,430-i*35,i===3?C.forest:"none",[C.mint,C.copper,C.blue,C.forest][i]);
}

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.mkdir(qaDir, { recursive: true });
for (const [index, slide] of p.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await p.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(qaDir, `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(qaDir, `${stem}.layout.json`), await layout.text());
}
const montage = await p.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(path.join(qaDir, "deck-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
const pptx = await PresentationFile.exportPptx(p);
await pptx.save(output);
console.log(JSON.stringify({ output, qaDir, slides: p.slides.items.length, layouts: p.layouts.items.length, masters: p.masters.items.length }, null, 2));
