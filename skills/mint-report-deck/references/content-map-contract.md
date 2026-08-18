# Content map contract V0.6

`content-map.json` is the immutable semantic layer shared by HTML and PPTX. Preserve legacy `facts`, `numbers`, `relationships` and `actions`, compile discourse units plus narrative commitment, then add an evidence-bearing `semanticGraph` before page planning. Follow [chinese-content-compiler.md](chinese-content-compiler.md) and validate the graph with [semantic-relation-contract.md](semantic-relation-contract.md).

```json
{
  "schemaVersion": "0.6",
  "communicationJob": {
    "audience": "管理层",
    "purpose": "说明权益结构",
    "desiredOutcome": "确认协议原则",
    "managementTakeaway": "先锁定可入股比例及限制下的经济补偿"
  },
  "semanticGraph": {
    "schemaVersion": "0.6",
    "sourceContentMapVersion": "0.4",
    "nodes": [
      {"id":"A1","kind":"atom","label":"肯尼亚理论权益为21%","sourceRefs":["USER:KENYA"],"materiality":"primary","needsReview":false},
      {"id":"N1","kind":"numeric-claim","label":"70% × 30% = 21%","sourceRefs":["USER:KENYA"],"materiality":"primary","needsReview":false}
    ],
    "edges": [
      {"id":"SG1","source":"N1","target":"A1","relationType":"evidence","direction":"directed","evidenceRefs":["USER:KENYA"],"confidence":1,"orderBasis":{"type":"none"},"connectorPolicy":"line"}
    ],
    "migrationWarnings": []
  },
  "contentAtoms": [
    {
      "id": "A1",
      "kind": "numeric",
      "text": "肯尼亚理论权益为21%",
      "materiality": "primary",
      "displayRequirement": "primary-visual",
      "coverageStatus": "planned",
      "sourceRef": "USER:KENYA"
    }
  ],
  "numericClaims": [
    {
      "id": "N1",
      "raw": "70% × 30% = 21%",
      "value": 21,
      "unit": "%",
      "subject": "肯尼亚理论权益",
      "period": "未提供",
      "role": "formula-result",
      "materiality": "primary",
      "displayRequirement": "primary-visual",
      "formula": {"operator":"multiply","operands":[70,30],"operandUnits":["%","%"],"result":21},
      "groupId": "KENYA",
      "sourceRef": "USER:KENYA"
    }
  ],
  "claimGraph": [
    {"id":"G1","from":["N1"],"relation":"supports","to":["J1"]}
  ],
  "discourseUnits": [
    {"id":"D1","text":"肯尼亚理论权益为21%","subject":"肯尼亚理论权益","subjectResolution":"explicit","predicate":"为21%","polarity":"affirmative","modality":"confirmed","role":"evidence","relationToPrevious":"starts","entityRefs":["E-KENYA"],"numericClaimRefs":["N1"],"sourceRef":"USER:KENYA"}
  ],
  "narrativeCommitment": {
    "audienceShift":"从看到比例转为理解权益承接差异",
    "coreThesis":"两国按同一系数换算，但承接方式不同",
    "decision":"确认协议中的直接持股与差额补足原则",
    "mustShowAtomRefs":["A1"],
    "mustNotInfer":["监管已批准该结构"],
    "narrativeSpine":["evidence","implication","decision"],
    "deEmphasizeAtomRefs":[],
    "pageBudgetPriority":"exact"
  },
  "ghostDeck": [
    {"pageId":"P1","actionTitle":"两国理论权益按同一公式计算，承接方式不同","pageRole":"evidence","managementQuestion":"两国权益如何计算和承接？","answer":"肯尼亚直接承接，坦桑尼亚由直接持股与差额补足共同承接。","atomRefs":["A1"],"evidenceRefs":["N1"],"relationshipRefs":["R1"],"transitionFromPrevious":{"fromPageId":null,"bridge":"开篇直接回答权益结构"},"pageNecessity":{"type":"opening","reason":"一页完成计算、差异与协议原则","removalTest":{"losesPrimaryEvidence":true,"breaksDecisionChain":true,"exceedsCapacityElsewhere":false}}}
  ],
  "decisionThreads": [
    {"id":"DT1","managementQuestion":"管理层需要判断什么","answer":"已知事实支持的回答","atomRefs":["A1"],"relationshipRefs":["R1"],"roles":["evidence","implication"],"pageAssignment":"P1","independenceTest":{"differentDecision":false,"understandableWithoutOtherThreads":false,"ownEvidenceAndImplication":false,"separationPreservesLogic":false}}
  ],
  "facts": [{"id":"F1","text":"原始事实","sourceRef":"USER:1"}],
  "entities": [{"id":"E1","canonicalName":"MINT","aliases":[]}],
  "relationships": [{"id":"R1","type":"comparison","from":["E1"],"to":[],"statement":"两个国家的权益承接方式不同"}],
  "numbers": [{"id":"N1","value":21,"unit":"%","period":"未提供","subject":"肯尼亚理论权益","sourceRef":"USER:KENYA"}],
  "actions": [{"id":"ACT1","action":"写入协议","owner":"待确认","time":"入股前","expectedResult":"形成明确权益安排","sourceRef":"USER:RIGHTS"}],
  "priorities": [{"id":"P1","kind":"risk","subject":"监管上限","level":"material","sourceRef":"USER:KENYA"}],
  "unknowns": [],
  "conflicts": [],
  "pageBudget": {"requested":1,"minimum":1,"planned":1,"constraint":"exact","overflowPolicy":"block","reason":"用户要求必须一页"},
  "riskLevel": "confirm-first"
}
```

## Required rules

- V0.6 requires a valid `semanticGraph`; page planning may not route directly from legacy `relationships[]`.
- A newly compiled V0.6 formal map also requires `discourseUnits`, `narrativeCommitment` and `ghostDeck`. A migration-only map may omit them temporarily but is not formal-ready until P0-02 recompiles the Chinese source.
- Every semantic edge names valid node endpoints, evidence, confidence, direction, order basis and connector policy.
- `parallel` is never directed and never authorizes an arrow.
- `sequence`, `temporal`, `flow`, `before-after` and `dependency` require a non-`none` order basis.
- Legacy relations remain available for audit, but they do not become graph edges without recompilation from source evidence.
- Every fact, atom, numeric claim, action and priority has a `sourceRef`.
- `contentAtoms.kind` is `fact`, `numeric`, `relationship`, `judgment`, `action`, `evidence` or `boundary`.
- `materiality` is `primary`, `supporting` or `appendix`.
- `displayRequirement` is `primary-visual`, `callout`, `annotation` or `source-only`.
- `coverageStatus` is `planned`, `visible` or `omitted-with-reason`; omissions require `omissionReason`.
- Primary atoms cannot use `source-only` or `omitted-with-reason`.
- Numeric roles follow [information-architecture.md](information-architecture.md).
- `canonicalName` is copied from the source and is not silently normalized to another legal entity.
- Relationships may be `hierarchy`, `sequence`, `time`, `cause`, `parallel`, `flow`, `responsibility`, `comparison`, `matrix`, `composition`, `constraint`, `calculation`, `dependency` or `one-conclusion`.
- Every primary atom belongs to exactly one decision thread. A second page requires a second independently decidable management question, not merely another heading or content type.
- Every discourse unit preserves original text, subject, `subjectResolution`, predicate, polarity, modality, rhetorical role, relation to the prior unit and `sourceRef`.
- An inherited subject requires `inheritedFrom`; an unknown subject creates an `unknowns` item and cannot support a primary formal judgment.
- Every primary content atom carries `discourseRefs[]`; each reference must resolve to a discourse unit.
- Every primary numeric claim is referenced by at least one discourse unit.
- `narrativeCommitment.narrativeSpine` contains 2–7 page-role beats and `deEmphasizeAtomRefs` is an array.
- Every primary atom appears exactly once in `ghostDeck`; every page maps to one ghost page with the same action title, question and answer.
- Every page after the first records why it is necessary and passes `removalTest`. Only an independent decision, verified capacity limit or consistent section-intro role can justify another page.
- `pageBudget.constraint` is `exact`, `maximum`, `flexible` or `minimum-needed`.
- `exact` means `planned === requested`; `maximum` means `planned <= requested`. `overflowPolicy` must be `block` for both.
- Under an exact one-page contract, capacity failure triggers recomposition or blocking, never a second page.
- When no hard count exists, `pageBudget.planned` starts at one and increases only for an independent proposition or verified capacity failure.
- `unknowns` and `conflicts` are excluded from formal slide copy.
- Material priorities must map to visible callouts or a primary visual.
- A risk judgment atom uses `judgmentType: "risk"` and a `risk` object with `judgment`, `evidence`, `impact`, and `action`; missing fields block formal delivery.
- A judgment uses `assertionStatus: "formal" | "proposal" | "hypothesis"`. A primary `formal` judgment must have an incoming `claimGraph` edge from facts, numbers, evidence or an explicitly labelled hypothesis.
- Actions preserve `action`, `owner`, `time`, and `expectedResult`. Missing fields stay in QA and are never invented.
- Regulation, legal, capital, credit, pricing and customer-policy material is `confirm-first` unless the user explicitly confirms the relevant facts and wording.

## Legacy compatibility

V0.2–V0.5 maps remain readable. Run `migrate-content-map.mjs` to create V0.6 graph fields. Existing V0.5 discourse and narrative fields are preserved. Older maps require a new Chinese compilation pass because migration must not invent discourse roles or narrative commitment from headings. Migration may derive atoms and graph nodes from frozen records, but it must mark ambiguous numeric roles as `unknown`, keep legacy relations unchanged, leave graph edges unresolved, and never invent formula operands, denominators, periods, thresholds, materiality, direction or ordering evidence. Pass a third output path when a standalone `semantic-graph.json` artifact is required.
