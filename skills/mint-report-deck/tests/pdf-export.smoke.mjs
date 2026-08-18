#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mint-pdf-export-v06-"));
const playwrightModule = process.env.MINT_PLAYWRIGHT_MODULE;
const chromiumExecutable = process.env.MINT_CHROMIUM_EXECUTABLE;
if (!playwrightModule) throw new Error("MINT_PLAYWRIGHT_MODULE is required for pdf-export.smoke.mjs");

const html = path.join(tmp, "report.html");
const pdf = path.join(tmp, "report.pdf");
const manifest = path.join(tmp, "export-manifest.json");
const render = spawnSync(process.execPath, [path.join(root, "scripts/render-deck.mjs"), path.join(root, "assets/examples/example-deck.json"), html], { encoding:"utf8" });
if (render.status !== 0) throw new Error(`${render.stdout}${render.stderr}`);
const before = fs.readFileSync(html, "utf8");
if (!before.includes('name="mint-pdf-state" content="unavailable"') || !before.includes("打印 / 导出当前版本")) throw new Error("HTML fallback export state is dishonest or missing");

const env = { ...process.env, MINT_PLAYWRIGHT_MODULE:playwrightModule, ...(chromiumExecutable ? { MINT_CHROMIUM_EXECUTABLE:chromiumExecutable } : {}) };
const exported = spawnSync(process.execPath, [path.join(root, "scripts/export-pdf.mjs"), html, pdf, manifest], { encoding:"utf8", env });
if (exported.status !== 0) throw new Error(`PDF export failed:\n${exported.stdout}${exported.stderr}`);
if (!fs.existsSync(pdf) || fs.readFileSync(pdf).subarray(0, 4).toString() !== "%PDF") throw new Error("output is not a PDF file");
const info = spawnSync("pdfinfo", [pdf], { encoding:"utf8" });
const pageCount = Number(info.stdout.match(/^Pages:\s+(\d+)/m)?.[1]);
const slideCount = (before.match(/<section class="slide/g) || []).length;
if (pageCount !== slideCount) throw new Error(`PDF pages ${pageCount} != HTML slides ${slideCount}`);
const exportManifest = JSON.parse(fs.readFileSync(manifest, "utf8"));
if (exportManifest.status !== "matched" || exportManifest.pageCount !== slideCount || !exportManifest.htmlHash || !exportManifest.pdfHash) throw new Error("export manifest is incomplete");
const after = fs.readFileSync(html, "utf8");
if (!after.includes('name="mint-pdf-state" content="available"') || !after.includes('name="mint-pdf-url" content="./report.pdf"')) throw new Error("exported HTML did not receive PDF availability metadata");

const { chromium } = await import(pathToFileURL(playwrightModule).href);
const browser = await chromium.launch({ headless:true, executablePath:chromiumExecutable || undefined });
const context = await browser.newContext({ acceptDownloads:true });
const page = await context.newPage();
await page.goto(pathToFileURL(html).href);
await page.waitForTimeout(250);
if (!(await page.locator("#exportPdfButton").innerText()).startsWith("下载 PDF")) throw new Error("matching PDF did not enable one-click download");
const downloadIntent = await page.evaluate(() => {
  window.__mintDownload = null;
  HTMLAnchorElement.prototype.click = function click() { window.__mintDownload = { href:this.href, download:this.download }; };
  document.querySelector("#exportPdfButton").click();
  return window.__mintDownload;
});
if (!downloadIntent?.href.endsWith("/report.pdf") || !downloadIntent.download.endsWith(".pdf")) throw new Error("PDF button did not create a direct PDF download intent");
await page.locator("[data-editable]").first().evaluate((node) => { node.textContent = `${node.textContent}（已编辑）`; node.dispatchEvent(new Event("input", { bubbles:true })); });
await page.waitForTimeout(50);
if (!(await page.locator("#exportPdfButton").innerText()).startsWith("打印 / 导出当前编辑版")) throw new Error("inline edits did not invalidate the pre-generated PDF state");
await browser.close();

const fallbackHtml = path.join(tmp, "fallback.html");
fs.copyFileSync(html, fallbackHtml);
const failurePdf = path.join(tmp, "should-not-exist.pdf");
const failed = spawnSync(process.execPath, [path.join(root, "scripts/export-pdf.mjs"), fallbackHtml, failurePdf], { encoding:"utf8", env:{ ...process.env, MINT_PLAYWRIGHT_MODULE:"/missing/playwright.mjs" } });
if (failed.status === 0 || !fs.existsSync(fallbackHtml) || fs.existsSync(failurePdf)) throw new Error("dependency failure did not preserve HTML safely");

console.log(JSON.stringify({ passed:true, pageCount, directDownloads:1, editedFallbacks:1, dependencyFallbacks:1, pdf, manifest, output:tmp }, null, 2));
