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
  textbox(slide, "footer-page", `${String(page).padStart(2, "0")} / 15`, 1130, 680, 90, 22, 9, C.muted, false, sans, "right");
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

const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const master = p.masters.add("Mint Formal Master");

const recipeNames = ["封面", "管理层总览", "三层合作架构", "双轨路线图", "横向流程", "时间轴", "角色泳道", "方案对比", "二维矩阵", "KPI 与精确表格", "数据图表", "风险行动 Owner", "管理层决策", "章节页", "结尾页"];
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
  textbox(s, "cover-eyebrow", "MINT · REPORT SYSTEM V0.2", 70, 78, 500, 30, 13, C.mint, true);
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

// 14 Section
{
  const s=p.slides.add();s.setLayout(layouts.get("章节页"));s.background.fill=C.jade;textbox(s,"section-number","01",70,100,240,140,70,C.paper,false,serif);textbox(s,"section-title","战略与目标",70,270,600,70,34,C.paper,true,serif);textbox(s,"section-en","STRATEGY & DIRECTION",70,340,500,32,15,C.mint,true);rule(s,70,630,1140,"58A28F",1);textbox(s,"section-brand","mint",70,650,100,30,16,C.paper,true);
}

// 15 Closing
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
