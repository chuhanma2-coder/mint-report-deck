#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { protectedTokens, suggestTitleLines, validateCjkLines, protectCjkTokensHtml } from "../scripts/cjk-text-fit.mjs";
import { validateCjkRender } from "../scripts/qa-cjk-render.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(fs.readFileSync(path.join(here, "fixtures/cjk-cases.json"), "utf8"));
for (const item of fixture.titleCases.filter((item) => item.text)) {
  const result = suggestTitleLines(item.text);
  assert.equal(result.status, item.status, item.id);
  if (item.status === "fit") assert.ok(result.lines.length <= 2 && validateCjkLines(result.lines).passed, item.id);
}
for (const item of fixture.titleCases.filter((item) => item.lines)) assert.equal(validateCjkLines(item.lines).passed, item.valid, item.id);
const tokens = protectedTokens(fixture.protectedText).map((token) => token.text);
fixture.protectedTokens.forEach((token) => assert.ok(tokens.includes(token), `missing protected token ${token}`));
const html = protectCjkTokensHtml(fixture.protectedText, (value) => value);
fixture.protectedTokens.forEach((token) => assert.ok(html.includes(`<span class="cjk-token">${token}</span>`)));
assert.equal(validateCjkRender({titleRenderedLines:["知识库成本下降，","高风险复核更聚焦"],textOverflow:[],minimumBodyFont:15,declaredFontFamily:'"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',availableCjkFonts:["PingFang SC"],resolvedCjkFont:"PingFang SC",splitProtectedTokens:[]}).passed,true);
assert.equal(validateCjkRender({titleRenderedLines:["知识库成本下降","，高风险复核更聚焦"],textOverflow:["body"],minimumBodyFont:10,declaredFontFamily:"Arial",availableCjkFonts:[],splitProtectedTokens:["36,868个"]}).passed,false);
console.log(JSON.stringify({passed:true,titleCases:fixture.titleCases.length,protectedTokens:fixture.protectedTokens.length,renderCases:2},null,2));
