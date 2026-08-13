# Deck spec contract V0.3

Top level:

```json
{
  "schemaVersion": "0.3",
  "id": "unique-project-slug",
  "version": 1,
  "title": "汇报标题",
  "subtitle": "可选副标题",
  "date": "原始口径，可为空",
  "confidentiality": "内部材料",
  "pageBudget": 1,
  "deckPlan": {
    "narrativeArc": ["context", "evidence", "action"],
    "introFamily": "section-intro",
    "sections": [{"id":"S1","title":"业务策略","accentTone":"jade"}]
  },
  "slides": []
}
```

Every slide has `type`, `chapter`, `titleLines`, `sourceRefs[]` and optional `sectionId`, `pageRole`, `emphasis`, `lead`, `source`. `titleLines` contains one or two intentional semantic lines. Do not insert HTML.

`emphasis` may contain:

```json
{
  "terms": ["M-PESA", "风险能力"],
  "callouts": [
    {"kind":"capital","label":"启动资金","value":"5,000 万美元","detail":"股权及出资安排待定"},
    {"kind":"risk","label":"关键风险","value":"缺少正式合作协议","detail":"可能影响监管真实性审核"}
  ]
}
```

## Page recipes

- `cover`: `subtitle`, `meta[]`, `visual` (`phone-card`, `waves`, `product-flow`).
- `section-intro`: `sectionNumber`, `sectionTitle`, `sectionClaim`, optional `sectionQuestion`, `accentTone`.
- `statement`: `statementLines[]`, `support[]`.
- `capability-chain`: optional `contextRibbon[{label,value}]`; `stages[{name,role,entities[],capability,detail}]`, 3–5 stages; optional one `emphasis.callout`.
- `architecture-brief`: optional `contextStrip[{label,value,detail}]`; `layers[{name,role,entities[{name,detail}],detail}]`, 3–5 layers. Do not require a manufactured output column.
- `process`: `items[{title,detail}]`, 3–6 genuinely ordered steps, optional `focusIndex`.
- `timeline`: `items[{time,title,detail}]`, 3–6 milestones.
- `dual-track-roadmap`: `tracks[{label,summary,items[{stage,title,detail}]}]` exactly 2; optional `actionBanner[{label,text}]`.
- `swimlane`: `lanes[{actor,items[{title,detail}]}]`, 2–5 actors.
- `comparison`: `columns[{title,subtitle,items[]}]`, 2–4 columns.
- `matrix`: `rows[]`, `columns[]`, `cells[][]` for categorical content.
- `table`: `columns[]`, `rows[][]`, maximum 7 columns and 8 rows.
- `chart`: `chart{title,labels[],unit,period,subject,series[{name,type,values[]}],sourceRefs[]}`; HTML supports `bar` or `line` and Presentations may use editable native variants allowed by routing.
- `heatmap`: `heatmap{rows[],columns[],values[][],unit,period,subject,sourceRefs[]}`.
- `media`: `image`, `caption`, `body[]`.
- `risk-spotlight`: `risk{label,judgment,severity,evidence[],impacts[],actions[]}`.
- `decision`: `decision`, `why[]`, `actions[{owner,action,time}]`.

Visible `source` is a concise source line. Detailed locators live in evidence artifacts. Unknowns, conflicts, prompts and QA text never enter a slide.
