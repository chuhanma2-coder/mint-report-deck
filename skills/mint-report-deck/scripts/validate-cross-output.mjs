#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith("--"));
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const [deckArg, htmlArg, pdfArg, pptxArg, outputArg] = positional;
if (![deckArg, htmlArg, pdfArg, pptxArg].every(Boolean)) {
  console.error("Usage: node validate-cross-output.mjs deck-spec.json report.html report.pdf report.pptx [cross-output-report.json] [--manifest export-manifest.json]");
  process.exit(2);
}

const files = Object.fromEntries(Object.entries({ deck:deckArg, html:htmlArg, pdf:pdfArg, pptx:pptxArg }).map(([key,value])=>[key,path.resolve(value)]));
const output = outputArg ? path.resolve(outputArg) : null;
const manifestFile = path.resolve(option("--manifest") || path.join(path.dirname(files.pdf), "export-manifest.json"));
const missing = Object.entries(files).filter(([,file])=>!fs.existsSync(file));
if (missing.length) {
  const report = { schemaVersion:"0.6", status:"unverified", passed:false, errors:missing.map(([kind,file])=>`${kind}文件不存在：${file}`), warnings:[], checks:[] };
  if (output) fs.writeFileSync(output, `${JSON.stringify(report,null,2)}\n`);
  console.log(JSON.stringify(report,null,2));
  process.exit(1);
}

const deck = JSON.parse(fs.readFileSync(files.deck,"utf8"));
const html = fs.readFileSync(files.html,"utf8");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const decode = (value) => String(value || "").replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#39;/g,"'");
const stripTags = (value) => decode(String(value || "").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());
const normalize = (value) => String(value || "").normalize("NFKC").toLowerCase().replace(/[\s\u3000，。；：、｜|·“”‘’（）()【】\[\]《》<>！？!?—–-]/g,"");
const attr = (tag,name) => decode(tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] || "");
const numberPattern = /(?<![A-Za-z0-9])(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:%|个百分点|万|亿|元|美元|个月|年|页|份|个|件)?/g;
const canonicalNumber = (raw) => {
  const clean = String(raw).replace(/,/g,"");
  const match = clean.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return clean;
  const numeric = match[1].includes(".") ? String(Number(match[1])) : String(parseInt(match[1],10));
  return `${numeric}${match[2]}`;
};
const numbers = (text) => new Set([...String(text || "").matchAll(numberPattern)].map((match)=>canonicalNumber(match[0])));
const numericCore = (value) => String(value).match(/^\d+(?:\.\d+)?/)?.[0] || String(value);
const containsNumber = (set,value) => set.has(value) || [...set].some((candidate)=>numericCore(candidate)===numericCore(value));
const walkText = (value, key = "") => {
  if (value == null) return [];
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item)=>walkText(item,key));
  const ignored = /^(id|sourceRefs?|atomRefs?|claimRefs?|threadRefs?|sectionId|relationshipRefs?|elementIds?|connectors?|readingOrder|visualShare|schemaVersion|version)$/i;
  return Object.entries(value).flatMap(([childKey,child])=>ignored.test(childKey)?[]:walkText(child,childKey));
};
const expectedText = (slide) => [
  ...(slide.titleLines || []), slide.pageAnswer, slide.lead,
  ...(slide.visibleClaims || []).map((item)=>item.text),
  ...walkText(slide.primaryVisual?.data || {}), ...walkText(slide.supportModules || []),
  ...walkText(slide.stages || []), ...walkText(slide.items || []), ...walkText(slide.columns || []),
  ...walkText(slide.contextRibbon || []), ...walkText(slide.emphasis?.callouts || [])
].filter(Boolean).join(" ");
const expectedEntities = (slide) => {
  const headline = `${(slide.titleLines || []).join(" ")} ${slide.pageAnswer || ""}`;
  // Cross-output entity blocking is intentionally limited to headline/answer entities.
  // Full body/entity coverage remains the responsibility of information-coverage QA.
  const values = (slide.emphasis?.terms || []).filter((term)=>normalize(headline).includes(normalize(term)));
  return [...new Set(values.filter((item)=>/[A-Za-z]/.test(item) && !numbers(item).has(String(item).replace(/,/g,""))))];
};
const expected = deck.slides.map((slide,index)=>({
  index:index+1, id:slide.id, title:(slide.titleLines || []).join(""), answer:slide.pageAnswer || "",
  relation:slide.primaryVisual?.kind || slide.visualBrief?.relationship || slide.type,
  atomRefs:slide.atomRefs || [], numbers:[...numbers(expectedText(slide))], entities:expectedEntities(slide),
  allowedNumbers:[...numbers(`${expectedText(slide)} ${slide.source || ""} ${(slide.sourceRefs || []).join(" ")} ${index+1} ${deck.slides.length} ${Array.from({length:Math.max((slide.items||[]).length,(slide.stages||[]).length,(slide.layers||[]).length,(slide.actions||[]).length)},(_,i)=>i+1).join(" ")}`)]
}));

function extractHtml() {
  const embeddedText = html.match(/<script type="application\/json" id="mint-deck-data">([\s\S]*?)<\/script>/)?.[1];
  if (!embeddedText) throw new Error("HTML缺少mint-deck-data");
  const embedded = JSON.parse(embeddedText);
  const matches = [...html.matchAll(/<section class="slide[^>]*>[\s\S]*?(?=<section class="slide|<\/div><\/main>)/g)];
  if (!matches.length) throw new Error("HTML未找到slide页面");
  return { embeddedText, embedded, pageCount:matches.length, slides:matches.map((match,index)=>{
    const tag = match[0].match(/^<section[^>]*>/)?.[0] || "";
    return { index:index+1, text:stripTags(match[0]), title:attr(tag,"data-title"), relation:attr(tag,"data-primary-kind"), atomRefs:attr(tag,"data-atom-refs").split(/\s+/).filter(Boolean) };
  }) };
}

function extractPdf() {
  const info = spawnSync("pdfinfo",[files.pdf],{encoding:"utf8"});
  if (info.status !== 0) throw new Error(`pdfinfo失败：${info.stderr || info.stdout}`);
  const text = spawnSync("pdftotext",["-layout",files.pdf,"-"],{encoding:"utf8",maxBuffer:20_000_000});
  if (text.status !== 0) throw new Error(`pdftotext失败：${text.stderr || text.stdout}`);
  const pageCount = Number(info.stdout.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
  const pages = text.stdout.split("\f").filter((item,index,array)=>item.trim() || index < array.length - 1).slice(0,pageCount);
  return {pageCount,slides:pages.map((item,index)=>({index:index+1,text:item.replace(/\s+/g," ").trim()}))};
}

function extractPptx() {
  const python = process.env.MINT_PYTHON || "python3";
  const run = spawnSync(python,[path.join(here,"extract-pptx-content.py"),files.pptx],{encoding:"utf8",maxBuffer:20_000_000});
  let parsed;
  try { parsed = JSON.parse(run.stdout || "{}"); } catch { throw new Error(`PPTX解析器输出无效：${run.stdout || run.stderr}`); }
  if (run.status !== 0 || !parsed.passed) throw new Error(parsed.error || "PPTX解析失败");
  return parsed;
}

const errors = [], warnings = [], checks = [];
let htmlOut, pdfOut, pptxOut;
for (const [name,extractor] of [["html",extractHtml],["pdf",extractPdf],["pptx",extractPptx]]) {
  try {
    const value = extractor();
    if (name === "html") htmlOut = value;
    if (name === "pdf") pdfOut = value;
    if (name === "pptx") pptxOut = value;
    checks.push({name:`parse-${name}`,passed:true,pageCount:value.pageCount});
  } catch (error) {
    errors.push(`${name}解析失败：${error.message}`);
    checks.push({name:`parse-${name}`,passed:false,error:error.message});
  }
}

if (htmlOut && pdfOut && pptxOut) {
  for (const [name,value] of [["html",htmlOut],["pdf",pdfOut],["pptx",pptxOut]]) if (value.pageCount !== expected.length) errors.push(`${name}页数${value.pageCount} != deck-spec页数${expected.length}`);
  if (htmlOut.embedded.schemaVersion !== deck.schemaVersion) errors.push(`HTML schemaVersion漂移：${htmlOut.embedded.schemaVersion} != ${deck.schemaVersion}`);
  if (htmlOut.embedded.id !== deck.id) errors.push(`HTML deck id漂移：${htmlOut.embedded.id} != ${deck.id}`);
  const embeddedHash = sha256(htmlOut.embeddedText);
  if (!fs.existsSync(manifestFile)) errors.push(`PDF导出清单缺失：${manifestFile}`);
  else {
    const manifest = JSON.parse(fs.readFileSync(manifestFile,"utf8"));
    if (manifest.status !== "matched") errors.push(`PDF导出清单状态不是matched：${manifest.status}`);
    if (manifest.contentHash !== embeddedHash) errors.push("PDF内容哈希与当前HTML不一致");
    if (manifest.pageCount !== expected.length) errors.push(`PDF导出清单页数${manifest.pageCount} != ${expected.length}`);
  }
  const formats = {html:htmlOut.slides,pdf:pdfOut.slides,pptx:pptxOut.slides};
  expected.forEach((page,index)=>{
    for (const [format,slides] of Object.entries(formats)) {
      const slide = slides[index];
      if (!slide) continue;
      const combined = `${slide.text || ""}\n${slide.notes || ""}`;
      if (page.title && !normalize(combined).includes(normalize(page.title))) errors.push(`${format}第${index+1}页缺少标题：${page.title}`);
      if (page.answer && !normalize(combined).includes(normalize(page.answer))) errors.push(`${format}第${index+1}页缺少页面结论`);
      const foundNumbers = numbers(combined);
      for (const value of page.numbers) if (!containsNumber(foundNumbers,value)) errors.push(`${format}第${index+1}页缺少关键数字：${value}`);
      for (const entity of page.entities) if (!normalize(combined).includes(normalize(entity))) errors.push(`${format}第${index+1}页缺少关键实体：${entity}`);
      const unexpected = [...foundNumbers].filter((value)=>!page.allowedNumbers.some((allowed)=>numericCore(allowed)===numericCore(value)));
      if (unexpected.length) errors.push(`${format}第${index+1}页出现deck-spec外数字：${unexpected.join(", ")}`);
    }
    const htmlSlide = htmlOut.slides[index];
    if (htmlSlide?.relation !== page.relation) errors.push(`HTML第${index+1}页主关系漂移：${htmlSlide?.relation || "<empty>"} != ${page.relation}`);
    for (const ref of page.atomRefs) if (!htmlSlide?.atomRefs?.includes(ref)) errors.push(`HTML第${index+1}页缺少atomRef：${ref}`);
    const pptxNotes = pptxOut.slides[index]?.notes || "";
    if (!pptxNotes.includes(`主关系：${page.relation}`)) errors.push(`PPTX第${index+1}页缺少主关系标记：${page.relation}`);
    for (const ref of page.atomRefs) if (!pptxNotes.includes(ref)) errors.push(`PPTX第${index+1}页缺少atomRef：${ref}`);
  });
}

const status = checks.some((check)=>!check.passed) ? "unverified" : errors.length ? "blocked" : "formal-ready";
const report = {schemaVersion:"0.6",generatedAt:new Date().toISOString(),status,passed:status==="formal-ready",files:{...files,manifest:manifestFile},metrics:{expectedPages:expected.length,htmlPages:htmlOut?.pageCount ?? null,pdfPages:pdfOut?.pageCount ?? null,pptxPages:pptxOut?.pageCount ?? null},checks,errors:[...new Set(errors)],warnings};
if (output) fs.writeFileSync(output,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));
process.exit(report.passed?0:1);
