import { buildLayoutRequest } from "./select-layout.mjs";
import { patternCompatible } from "./validate-pattern-registry.mjs";

const arr=(value)=>Array.isArray(value)?value:[];
export function patternFamily(patternId){
  if(["hero","section-intro","split-evidence"].includes(patternId))return"narrative";
  if(["parallel-columns","parallel-bands","four-grid","card-matrix","comparison","before-after"].includes(patternId))return"comparative";
  if(["horizontal-sequence","vertical-sequence","timeline","problem-cause-solution"].includes(patternId))return"directional";
  if(["radial-branches","layered-capability-chain","hierarchy"].includes(patternId))return"structural";
  if(["numeric-story","chart-insight"].includes(patternId))return"quantitative";
  if(["risk-decision","summary-decision"].includes(patternId))return"decision";
  if(["media-evidence","full-bleed-media"].includes(patternId))return"media";
  return"unknown";
}

export function validateDeckRhythm(deckPlan,layoutSelection,registry,semanticGraph){
  const errors=[],warnings=[],suggestions=[];
  const patterns=new Map(arr(registry?.patterns).map((pattern)=>[pattern.id,pattern]));
  const contracts=new Map(arr(deckPlan?.pageContracts).map((page)=>[page.id,page]));
  const selections=arr(layoutSelection?.selections);
  let runPattern=null,runLength=0,maxRun=0;
  for(const selection of selections){
    const contract=contracts.get(selection.pageId),pattern=patterns.get(selection.patternId);
    if(!contract||!pattern){errors.push(`页面 ${selection.pageId} 缺少合同或Pattern`);continue;}
    const request=buildLayoutRequest(contract,semanticGraph);
    const compatibility=request.blocked?{compatible:false,reasons:[request.reason]}:patternCompatible(pattern,request);
    if(!compatibility.compatible)errors.push(`页面 ${selection.pageId} 为追求节奏选择了语义不兼容Pattern ${selection.patternId}：${compatibility.reasons.join("；")}`);
    if(!selection.selectionReason)errors.push(`页面 ${selection.pageId} 缺少版式选择解释`);
    if(selection.patternId===runPattern)runLength+=1;else{runPattern=selection.patternId;runLength=1;}
    maxRun=Math.max(maxRun,runLength);
    if(runLength>2&&!selection.rhythmException){
      errors.push(`页面 ${selection.pageId} 连续第${runLength}页使用${selection.patternId}且无语义约束例外`);
      const alternative=arr(selection.candidates).find((candidate)=>candidate.patternId!==selection.patternId);
      if(alternative)suggestions.push({pageId:selection.pageId,from:selection.patternId,to:alternative.patternId,reason:"兼容候选可避免机械重复"});
    }
  }
  const families=new Set(selections.map((selection)=>patternFamily(selection.patternId)).filter((family)=>family!=="unknown"));
  if(selections.length>=10&&families.size<4&&!layoutSelection?.deckRhythmException){errors.push(`10页材料仅使用${families.size}个Pattern family，且无语义受限例外`);}
  const introContracts=arr(deckPlan?.pageContracts).filter((page)=>page.pageRole==="section-intro");
  if(introContracts.length>=2){
    const introPatterns=new Set(introContracts.map((page)=>selections.find((selection)=>selection.pageId===page.id)?.patternId));
    const introFamilies=new Set(introContracts.map((page)=>page.introFamily));
    const introStructures=new Set(introContracts.map((page)=>`${page.readingAxis}|${arr(page.contentOrder).join(",")}`));
    if(introPatterns.size>1||introFamilies.size>1||introStructures.size>1)errors.push("章节引言的introFamily、Pattern或阅读结构不一致");
  }
  return{passed:errors.length===0,errors,warnings,suggestions,metrics:{pages:selections.length,patternFamilies:[...families],familyCount:families.size,maxConsecutivePattern:maxRun,sectionIntros:introContracts.length}};
}
