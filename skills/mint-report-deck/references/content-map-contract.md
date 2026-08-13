# Content map contract

`content-map.json` is the immutable semantic layer shared by PPTX and HTML.

```json
{
  "schemaVersion": "0.2",
  "communicationJob": {
    "audience": "管理层",
    "purpose": "说明合作架构",
    "desiredOutcome": "判断是否继续讨论",
    "managementTakeaway": "一条可验证的核心判断"
  },
  "facts": [{"id":"F1","text":"原始事实","sourceRef":"USER:1"}],
  "entities": [{"id":"E1","canonicalName":"Vodafone","aliases":[]}],
  "relationships": [{"id":"R1","type":"hierarchy","from":["E1"],"to":[],"statement":"前台—中台—后台"}],
  "numbers": [{"id":"N1","value":5000,"unit":"万美元","period":"未提供","subject":"启动资金","sourceRef":"USER:8"}],
  "actions": [{"id":"A1","action":"签署协议","owner":"待确认","time":"周四","expectedResult":"正式协议","sourceRef":"USER:9"}],
  "unknowns": [],
  "conflicts": [],
  "pageBudget": {"requested":null,"minimum":1,"planned":1,"reason":"一个背景命题和一个三层关系可在一页讲清"},
  "riskLevel": "ordinary"
}
```

Rules:

- Every fact, number and action has a source reference.
- `canonicalName` is copied from the source and is not silently normalized to another legal entity.
- Relationship types: `hierarchy`, `sequence`, `time`, `cause`, `parallel`, `flow`, `responsibility`, `comparison`, `matrix`, `one-conclusion`.
- `pageBudget.planned` starts at one and increases only for an independent proposition or verified capacity failure.
- `unknowns` and `conflicts` are excluded from formal slide copy.
- `riskLevel` is `ordinary` or `confirm-first`. Regulation, legal, capital, credit, pricing and customer-policy material is `confirm-first` unless the user explicitly confirms the relevant facts and wording.
