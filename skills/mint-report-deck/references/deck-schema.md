# Deck spec contract V0.2

Top level:

```json
{
  "schemaVersion": "0.2",
  "id": "unique-project-slug",
  "version": 1,
  "title": "汇报标题",
  "subtitle": "可选副标题",
  "date": "原始口径，可为空",
  "confidentiality": "内部材料",
  "pageBudget": 1,
  "slides": []
}
```

Every slide has `type`, `chapter`, `titleLines`, `sourceRefs[]` and optional `lead`, `source`. `titleLines` contains one or two intentional semantic lines. Do not insert HTML.

## Page recipes

- `cover`: `subtitle`, `meta[]`, `visual` (`phone-card`, `waves`, `product-flow`).
- `statement`: `statementLines[]`, `support[]`.
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
- `decision`: `decision`, `why[]`, `actions[{owner,action,time}]`.

Visible `source` is a concise source line. Detailed locators live in evidence artifacts. Unknowns, conflicts, prompts and QA text never enter a slide.
