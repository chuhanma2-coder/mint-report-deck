#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateDensity } from "../scripts/qa-density.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),fixture=JSON.parse(fs.readFileSync(path.join(root,"tests/fixtures/density-cases.json"),"utf8"));let positive=0,blocked=0;
for(const item of fixture.cases){const result=validateDensity({...item,pageId:item.id,plannedPrimaryShare:.64});if(item.expect==="pass"){if(!result.passed)throw new Error(`${item.id}正例失败：${result.errors.join(" | ")}`);positive+=1;}else{if(result.passed||!result.errors.some((error)=>error.includes(item.reason)))throw new Error(`${item.id}负例未按${item.reason}阻断：${result.errors.join(" | ")}`);blocked+=1;}}
console.log(JSON.stringify({passed:true,positiveCases:positive,negativeCasesBlocked:blocked,cases:fixture.cases.map((item)=>item.id)},null,2));
