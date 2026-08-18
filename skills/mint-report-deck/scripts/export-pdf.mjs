#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const input = path.resolve(process.argv[2] || "");
const pdfFile = path.resolve(process.argv[3] || (input ? path.join(path.dirname(input), "report.pdf") : "report.pdf"));
const manifestFile = path.resolve(process.argv[4] || path.join(path.dirname(pdfFile), "export-manifest.json"));
if (!fs.existsSync(input)) {
  console.error("Usage: MINT_PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node export-pdf.mjs report.html [report.pdf] [export-manifest.json]");
  process.exit(2);
}

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sourceHtml = fs.readFileSync(input, "utf8");
const meta = (name) => sourceHtml.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, "i"))?.[1] || "";
const deckId = meta("mint-deck-id") || path.basename(input, ".html");
const deckVersion = meta("mint-deck-version") || "1";
const dataText = sourceHtml.match(/<script type="application\/json" id="mint-deck-data">([\s\S]*?)<\/script>/)?.[1] || "";

async function loadPlaywright() {
  const moduleName = process.env.MINT_PLAYWRIGHT_MODULE || "playwright";
  try { return await import(moduleName.startsWith("/") ? pathToFileURL(moduleName).href : moduleName); }
  catch (error) { throw new Error(`无法加载Playwright：${moduleName}。请先安装运行依赖或设置 MINT_PLAYWRIGHT_MODULE。${error.message}`); }
}

fs.mkdirSync(path.dirname(pdfFile), { recursive:true });
const temporaryPdf = `${pdfFile}.tmp`;
try {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless:true, executablePath:process.env.MINT_CHROMIUM_EXECUTABLE || undefined });
  const page = await browser.newPage({ viewport:{ width:1920, height:1080 } });
  await page.goto(pathToFileURL(input).href, { waitUntil:"load" });
  await page.emulateMedia({ media:"print" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
  const slideCount = await page.locator(".slide").count();
  if (!slideCount) throw new Error("HTML中没有.slide页面，无法导出PDF");
  await page.pdf({ path:temporaryPdf, width:"16in", height:"9in", printBackground:true, preferCSSPageSize:true, margin:{ top:"0", right:"0", bottom:"0", left:"0" } });
  await browser.close();
  fs.renameSync(temporaryPdf, pdfFile);

  let pageCount = slideCount;
  const pdfinfo = spawnSync("pdfinfo", [pdfFile], { encoding:"utf8" });
  if (pdfinfo.status === 0) pageCount = Number(pdfinfo.stdout.match(/^Pages:\s+(\d+)/m)?.[1] || slideCount);
  if (pageCount !== slideCount) throw new Error(`PDF页数${pageCount}与HTML页数${slideCount}不一致`);

  const pdfUrl = `./${path.basename(pdfFile)}`;
  let finalHtml = sourceHtml
    .replace(/<meta name="mint-pdf-state" content="[^"]*">/g, "")
    .replace(/<meta name="mint-pdf-url" content="[^"]*">/g, "")
    .replace(/<meta name="mint-pdf-content-hash" content="[^"]*">/g, "")
    .replace("</head>", `<meta name="mint-pdf-state" content="available"><meta name="mint-pdf-url" content="${pdfUrl}"><meta name="mint-pdf-content-hash" content="${sha256(dataText)}"></head>`);
  fs.writeFileSync(input, finalHtml);
  finalHtml = fs.readFileSync(input, "utf8");
  const manifest = {
    schemaVersion:"0.6", status:"matched", deckId, deckVersion,
    htmlFile:path.basename(input), pdfFile:path.basename(pdfFile),
    htmlHash:sha256(finalHtml), pdfHash:sha256(fs.readFileSync(pdfFile)), contentHash:sha256(dataText),
    pageCount, generatedAt:new Date().toISOString()
  };
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ passed:true, pdfFile, manifestFile, pageCount, pdfBytes:fs.statSync(pdfFile).size }, null, 2));
} catch (error) {
  fs.rmSync(temporaryPdf, { force:true });
  console.error(JSON.stringify({ passed:false, error:error.message, htmlPreserved:fs.existsSync(input), pdfPreserved:fs.existsSync(pdfFile) }, null, 2));
  process.exit(1);
}
