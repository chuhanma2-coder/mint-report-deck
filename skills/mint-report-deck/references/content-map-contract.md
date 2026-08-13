# Content map contract V0.4

`content-map.json` is the immutable semantic layer shared by HTML and PPTX. Preserve legacy `facts`, `numbers`, `relationships` and `actions`, but compile the V0.4 atom and claim structures before page planning.

```json
{
  "schemaVersion": "0.4",
  "communicationJob": {
    "audience": "管理层",
    "purpose": "说明权益结构",
    "desiredOutcome": "确认协议原则",
    "managementTakeaway": "先锁定可入股比例及限制下的经济补偿"
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
  "facts": [{"id":"F1","text":"原始事实","sourceRef":"USER:1"}],
  "entities": [{"id":"E1","canonicalName":"MINT","aliases":[]}],
  "relationships": [{"id":"R1","type":"comparison","from":["E1"],"to":[],"statement":"两个国家的权益承接方式不同"}],
  "numbers": [{"id":"N1","value":21,"unit":"%","period":"未提供","subject":"肯尼亚理论权益","sourceRef":"USER:KENYA"}],
  "actions": [{"id":"ACT1","action":"写入协议","owner":"待确认","time":"入股前","expectedResult":"形成明确权益安排","sourceRef":"USER:RIGHTS"}],
  "priorities": [{"id":"P1","kind":"risk","subject":"监管上限","level":"material","sourceRef":"USER:KENYA"}],
  "unknowns": [],
  "conflicts": [],
  "pageBudget": {"requested":null,"minimum":1,"planned":1,"reason":"一个权益结构命题"},
  "riskLevel": "confirm-first"
}
```

## Required rules

- Every fact, atom, numeric claim, action and priority has a `sourceRef`.
- `contentAtoms.kind` is `fact`, `numeric`, `relationship`, `judgment`, `action`, `evidence` or `boundary`.
- `materiality` is `primary`, `supporting` or `appendix`.
- `displayRequirement` is `primary-visual`, `callout`, `annotation` or `source-only`.
- `coverageStatus` is `planned`, `visible` or `omitted-with-reason`; omissions require `omissionReason`.
- Primary atoms cannot use `source-only` or `omitted-with-reason`.
- Numeric roles follow [information-architecture.md](information-architecture.md).
- `canonicalName` is copied from the source and is not silently normalized to another legal entity.
- Relationships may be `hierarchy`, `sequence`, `time`, `cause`, `parallel`, `flow`, `responsibility`, `comparison`, `matrix`, `composition`, `constraint`, `calculation`, `dependency` or `one-conclusion`.
- `pageBudget.planned` starts at one and increases only for an independent proposition or verified capacity failure.
- `unknowns` and `conflicts` are excluded from formal slide copy.
- Material priorities must map to visible callouts or a primary visual.
- A risk judgment atom uses `judgmentType: "risk"` and a `risk` object with `judgment`, `evidence`, `impact`, and `action`; missing fields block formal delivery.
- A judgment uses `assertionStatus: "formal" | "proposal" | "hypothesis"`. A primary `formal` judgment must have an incoming `claimGraph` edge from facts, numbers, evidence or an explicitly labelled hypothesis.
- Actions preserve `action`, `owner`, `time`, and `expectedResult`. Missing fields stay in QA and are never invented.
- Regulation, legal, capital, credit, pricing and customer-policy material is `confirm-first` unless the user explicitly confirms the relevant facts and wording.

## Legacy compatibility

V0.2/V0.3 maps remain readable. Run `migrate-content-map.mjs` to create V0.4 fields. Migration may derive atoms from existing frozen records but must mark ambiguous numeric roles as `unknown` and must never invent formula operands, denominators, periods, thresholds or materiality.
