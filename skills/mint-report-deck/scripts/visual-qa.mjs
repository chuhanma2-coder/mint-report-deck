#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateReadingOrder } from "./qa-reading-order.mjs";
import { validateLayoutGeometry } from "./qa-layout-geometry.mjs";
import { validateDensity } from "./qa-density.mjs";
import { validateCjkRender } from "./qa-cjk-render.mjs";

const input = path.resolve(process.argv[2] || "");
const outputDir = path.resolve(process.argv[3] || "visual-qa");
const reportFile = path.resolve(process.argv[4] || path.join(outputDir, "visual-qa.json"));
const layoutFile = path.resolve(process.argv[5] || path.join(path.dirname(input),"layout-plan.json"));
const layoutPlan = fs.existsSync(layoutFile) ? JSON.parse(fs.readFileSync(layoutFile,"utf8")) : null;
const playwrightModule = process.env.MINT_PLAYWRIGHT_MODULE || "playwright";
if (!fs.existsSync(input)) {
  console.error("Usage: MINT_PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node visual-qa.mjs report.html output-dir [report.json]");
  process.exit(2);
}

const { chromium } = await import(playwrightModule.startsWith("/") ? pathToFileURL(playwrightModule).href : playwrightModule);
fs.mkdirSync(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.MINT_CHROMIUM_EXECUTABLE || undefined
});
const viewports = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1280x720", width: 1280, height: 720 },
  { name: "390x844", width: 390, height: 844 }
];
const checks = [];
for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  await page.goto(pathToFileURL(input).href);
  await page.waitForTimeout(700);
  const slideCount = await page.locator(".slide").count();
  for (let index = 0; index < slideCount; index += 1) {
    await page.evaluate((i) => { location.hash = `slide-${i + 1}`; }, index);
    // The Mint runtime uses a 280 ms page fade and may use delayed element
    // transitions. Capture only after the formal presentation state settles.
    await page.waitForTimeout(700);
    const active = page.locator(".slide.is-active");
    const result = await active.evaluate((slide) => {
      const body = slide.querySelector(".quant-implication, .lead-cn, p");
      const keys = [...slide.querySelectorAll("[data-structured-value], .quant-headline, .quant-value")];
      const bodySize = body ? parseFloat(getComputedStyle(body).fontSize) : null;
      const keySize = keys.length ? Math.max(...keys.map((key) => parseFloat(getComputedStyle(key).fontSize))) : null;
      const primary = slide.querySelector("[data-primary-visual], .metric-stage, .v06-zone--focal");
      const headline = slide.querySelector(".headline-cn, .cover-title-cn, .v06-heading h2");
      const headlineStyle = headline ? getComputedStyle(headline) : null;
      const headlineLineHeight = headlineStyle ? (Number.parseFloat(headlineStyle.lineHeight) || Number.parseFloat(headlineStyle.fontSize) * 1.2) : null;
      const headlineLines = headline && headlineLineHeight ? Math.round(headline.getBoundingClientRect().height / headlineLineHeight) : null;
      const renderedLines=(node)=>{
        if(!node)return [];
        const rows=[];
        const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
        let textNode;
        while((textNode=walker.nextNode())){
          [...textNode.textContent].forEach((char,index)=>{
            if(!char.trim())return;
            const range=document.createRange();range.setStart(textNode,index);range.setEnd(textNode,index+1);
            const rect=range.getBoundingClientRect();
            if(!rect.width&&!rect.height)return;
            let row=rows.find((item)=>Math.abs(item.top-rect.top)<2);
            if(!row){row={top:rect.top,text:""};rows.push(row);}
            row.text+=char;
          });
        }
        return rows.sort((a,b)=>a.top-b.top).map((row)=>row.text);
      };
      const visualSelectors = [".comparison-grid", ".capability-chain", ".arc-process", ".dual-roadmap", ".swimlane", ".architecture-brief", ".matrix", ".chart-shell", ".v06-primary-contract"];
      const emptyVisuals = visualSelectors.flatMap((selector) => [...slide.querySelectorAll(selector)]
        .filter((node) => getComputedStyle(node).display !== "none" && node.innerText.trim().length < 2)
        .map(() => selector));
      const pageBody = slide.querySelector(".body, .v06-layout");
      const ratio = primary && pageBody ? (primary.getBoundingClientRect().width * primary.getBoundingClientRect().height) / (pageBody.getBoundingClientRect().width * pageBody.getBoundingClientRect().height) : null;
      const slideRect = slide.getBoundingClientRect();
      const overflow = [...slide.querySelectorAll(".page, .body, .quant-group, .allocation-bar, .capability-stage, .quant-support__item, .v06-zone, .v06-primary-contract")].filter((node) => {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const rect = node.getBoundingClientRect();
        return rect.left < slideRect.left - 3 || rect.top < slideRect.top - 3 || rect.right > slideRect.right + 3 || rect.bottom > slideRect.bottom + 3;
      }).map((node) => node.className || node.tagName);
      const scaleX=1920/slideRect.width, scaleY=1080/slideRect.height;
      const norm=(rect)=>({x:(rect.left-slideRect.left)*scaleX,y:(rect.top-slideRect.top)*scaleY,width:rect.width*scaleX,height:rect.height*scaleY});
      const zones=[...slide.querySelectorAll("[data-zone-id]")].map((node)=>({id:node.dataset.zoneId,readingOrder:Number(node.dataset.readingOrder),rect:norm(node.getBoundingClientRect())}));
      const candidates=[...new Set([...slide.querySelectorAll("[data-element-id], .v06-risk-decision>section, .v06-media>figure, .v06-radial__center, .v06-metrics>article, .v06-quant-groups>article")])];
      const blocks=candidates.map((node,index)=>{
        const zone=node.closest("[data-zone-id]");
        return {id:node.dataset.elementId||`${node.className||node.tagName}-${index+1}`,zoneId:zone?.dataset.zoneId||"primary",readingOrder:Number(zone?.dataset.readingOrder||3)*100+index,rect:norm(node.getBoundingClientRect()),textLength:node.innerText.trim().length,cardLike:/item|article|section|judgment|evidence|action|claim/.test(String(node.className)),visible:getComputedStyle(node).display!=="none"&&getComputedStyle(node).visibility!=="hidden"};
      });
      const textRects=primary?[...primary.querySelectorAll("[data-editable]")].filter((node)=>node.children.length===0&&node.textContent.trim()).map((node)=>({rect:norm(node.getBoundingClientRect()),textLength:node.textContent.trim().length,fontSize:parseFloat(getComputedStyle(node).fontSize),visible:getComputedStyle(node).display!=="none"&&getComputedStyle(node).visibility!=="hidden"})):[];
      const decorations=[...slide.querySelectorAll(".orbit,.rule,[data-decoration]")].filter((node)=>getComputedStyle(node).display!=="none").map((node)=>({rect:norm(node.getBoundingClientRect())}));
      const bodyTextNodes=[...slide.querySelectorAll(".v06-page-answer,.v06-primary-contract p,.v06-primary-contract small,.v06-primary-contract h3,.v06-primary-contract h4")].filter((node)=>getComputedStyle(node).display!=="none"&&getComputedStyle(node).visibility!=="hidden"&&node.textContent.trim());
      const minimumBodyFont=bodyTextNodes.length?Math.min(...bodyTextNodes.map((node)=>parseFloat(getComputedStyle(node).fontSize))):null;
      const textOverflow=bodyTextNodes.filter((node)=>node.scrollWidth>node.clientWidth+1||node.scrollHeight>node.clientHeight+1).map((node)=>`${node.tagName.toLowerCase()}:${node.textContent.trim().slice(0,24)}`);
      const splitProtectedTokens=[...slide.querySelectorAll(".cjk-token")].filter((node)=>node.getClientRects().length>1).map((node)=>node.textContent.trim());
      const fontCandidates=["Noto Sans SC","Source Han Sans SC","PingFang SC","Microsoft YaHei","Microsoft JhengHei"];
      const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d"),sentinel="汉字排版Mint 1234 WWWmmm";
      const fontWidth=(font)=>{ctx.font=`32px ${font}`;return ctx.measureText(sentinel).width;};
      const mono=fontWidth("monospace"),serif=fontWidth("serif");
      const availableCjkFonts=fontCandidates.filter((font)=>{const widthMono=fontWidth(`"${font}",monospace`),widthSerif=fontWidth(`"${font}",serif`);return Math.abs(widthMono-mono)>.2&&Math.abs(widthSerif-serif)>.2;});
      const declaredFontFamily=getComputedStyle(slide).fontFamily;
      const resolvedCjkFont=fontCandidates.find((font)=>availableCjkFonts.includes(font)&&declaredFontFamily.includes(font))||null;
      return { pageId:slide.dataset.slideId,patternId:slide.dataset.patternId,bodySize,keySize,salienceRatio:bodySize&&keySize?keySize/bodySize:null,primaryAreaRatio:ratio,headlineLines,titleRenderedLines:renderedLines(headline),declaredFontFamily,availableCjkFonts,resolvedCjkFont,minimumBodyFont,textOverflow,splitProtectedTokens,emptyVisuals,overflow,zones,blocks,textRects,decorations };
    });
    const screenshot = path.join(outputDir, `${viewport.name}-slide-${String(index + 1).padStart(2, "0")}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    await active.evaluate((slide)=>{
      const layer=document.createElement("div");layer.className="qa-overlay-layer";layer.style.cssText="position:absolute;inset:0;z-index:9999;pointer-events:none";
      [...slide.querySelectorAll("[data-zone-id]")].forEach((zone)=>{const marker=document.createElement("div");marker.style.cssText=`position:absolute;left:${zone.offsetLeft}px;top:${zone.offsetTop}px;width:${zone.offsetWidth}px;height:${zone.offsetHeight}px;border:2px dashed rgba(155,33,33,.75);color:#fff;background:rgba(155,33,33,.78);font:700 14px sans-serif;padding:4px;`;marker.textContent=`${zone.dataset.readingOrder} · ${zone.dataset.zoneId}`;layer.appendChild(marker);});slide.appendChild(layer);
    });
    const annotatedScreenshot=path.join(outputDir,`${viewport.name}-slide-${String(index+1).padStart(2,"0")}-annotated.png`);
    await page.screenshot({path:annotatedScreenshot,fullPage:true});
    await active.locator(".qa-overlay-layer").evaluate((node)=>node.remove());
    checks.push({ viewport: viewport.name, slide: index + 1, screenshot, annotatedScreenshot, ...result });
  }
  await page.close();
}
await browser.close();
const errors = checks.flatMap((check) => {
  const out = [];
  if (check.overflow.length) out.push(`${check.viewport} slide ${check.slide}: overflow ${check.overflow.join(", ")}`);
  if (check.headlineLines != null && check.headlineLines > 2) out.push(`${check.viewport} slide ${check.slide}: title renders as ${check.headlineLines} lines; maximum is 2`);
  if (check.emptyVisuals.length) out.push(`${check.viewport} slide ${check.slide}: empty primary visual ${check.emptyVisuals.join(", ")}`);
  if (check.salienceRatio != null && check.salienceRatio < 1.8) out.push(`${check.viewport} slide ${check.slide}: numeric salience ${check.salienceRatio.toFixed(2)} < 1.8`);
  return out;
});
const geometryChecks=[];
if(layoutPlan?.schemaVersion==="0.6"){
  for(const check of checks){
    const layoutPage=layoutPlan.pages.find((page)=>page.pageId===check.pageId);
    const reading=validateReadingOrder(layoutPage,check);
    const geometry=validateLayoutGeometry(check,{canvas:layoutPlan.canvas});
    const density=validateDensity({...check,plannedPrimaryShare:layoutPage?.primaryVisualShare,safeArea:layoutPlan.safeArea});
    const cjk=validateCjkRender(check);
    geometryChecks.push({viewport:check.viewport,pageId:check.pageId,reading,geometry,density,cjk});
    errors.push(...reading.errors.map((error)=>`${check.viewport}: ${error}`),...geometry.errors.map((error)=>`${check.viewport}: ${error}`),...density.errors.map((error)=>`${check.viewport}: ${error}`),...cjk.errors.map((error)=>`${check.viewport} ${check.pageId}: ${error}`));
  }
}
const report = { passed: errors.length === 0, input, layoutPlan:layoutPlan?layoutFile:null, viewports, checks, geometryChecks, errors };
fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, screenshots: checks.length, errors }, null, 2));
process.exit(report.passed ? 0 : 1);
