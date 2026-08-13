#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const input = path.resolve(process.argv[2] || "");
const outputDir = path.resolve(process.argv[3] || "visual-qa");
const reportFile = path.resolve(process.argv[4] || path.join(outputDir, "visual-qa.json"));
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
  await page.waitForTimeout(300);
  const slideCount = await page.locator(".slide").count();
  for (let index = 0; index < slideCount; index += 1) {
    await page.evaluate((i) => { location.hash = `slide-${i + 1}`; }, index);
    await page.waitForTimeout(120);
    const active = page.locator(".slide.is-active");
    const result = await active.evaluate((slide) => {
      const body = slide.querySelector(".quant-implication, .lead-cn, p");
      const keys = [...slide.querySelectorAll("[data-structured-value], .quant-headline, .quant-value")];
      const bodySize = body ? parseFloat(getComputedStyle(body).fontSize) : null;
      const keySize = keys.length ? Math.max(...keys.map((key) => parseFloat(getComputedStyle(key).fontSize))) : null;
      const primary = slide.querySelector("[data-primary-visual], .metric-stage");
      const pageBody = slide.querySelector(".body");
      const ratio = primary && pageBody ? (primary.getBoundingClientRect().width * primary.getBoundingClientRect().height) / (pageBody.getBoundingClientRect().width * pageBody.getBoundingClientRect().height) : null;
      const slideRect = slide.getBoundingClientRect();
      const overflow = [...slide.querySelectorAll(".page, .body, .quant-group, .allocation-bar, .capability-stage, .quant-support__item")].filter((node) => {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const rect = node.getBoundingClientRect();
        return rect.left < slideRect.left - 3 || rect.top < slideRect.top - 3 || rect.right > slideRect.right + 3 || rect.bottom > slideRect.bottom + 3;
      }).map((node) => node.className || node.tagName);
      return { bodySize, keySize, salienceRatio: bodySize && keySize ? keySize / bodySize : null, primaryAreaRatio: ratio, overflow };
    });
    const screenshot = path.join(outputDir, `${viewport.name}-slide-${String(index + 1).padStart(2, "0")}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    checks.push({ viewport: viewport.name, slide: index + 1, screenshot, ...result });
  }
  await page.close();
}
await browser.close();
const errors = checks.flatMap((check) => {
  const out = [];
  if (check.overflow.length) out.push(`${check.viewport} slide ${check.slide}: overflow ${check.overflow.join(", ")}`);
  if (check.salienceRatio != null && check.salienceRatio < 1.8) out.push(`${check.viewport} slide ${check.slide}: numeric salience ${check.salienceRatio.toFixed(2)} < 1.8`);
  return out;
});
const report = { passed: errors.length === 0, input, viewports, checks, errors };
fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, screenshots: checks.length, errors }, null, 2));
process.exit(report.passed ? 0 : 1);
