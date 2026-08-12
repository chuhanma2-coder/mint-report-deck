# Deck JSON contract

Top level:

```json
{
  "id": "unique-project-slug",
  "version": 1,
  "title": "汇报标题",
  "subtitle": "可选副标题",
  "date": "2026.08",
  "confidentiality": "内部材料",
  "slides": []
}
```

Every slide has `type`, `chapter`, `titleLines` and optional `lead`, `source`. `titleLines` contains one or two semantic lines. Do not insert HTML.

Component fields:

- `cover`: `subtitle`, `meta[]`, `visual` (`phone-card`, `waves`, `product-flow`).
- `statement`: `statementLines[]`, `support[]`.
- `process`: `items[{title,detail}]`, 3–6 items, optional `focusIndex`.
- `architecture`: `items[{name,role,process,output}]`, 3–5 rows.
- `cycle`: `core`, `items[{title,detail}]`, 4–6 items.
- `timeline`: `items[{time,title,detail}]`, 3–6 items.
- `comparison`: `columns[{title,subtitle,items[]}]`, 2–4 columns.
- `table`: `columns[]`, `rows[][]`, maximum 7 columns and 8 rows.
- `chart`: `chart{title,labels[],unit,period,window,series[{name,type,values[]}]}` where `type` is `bar` or `line`; values align with labels; include `sourceRefs[]`.
- `heatmap`: `heatmap{rows[],columns[],values[][],unit,period,sourceRefs[]}` with a complete rectangular numeric matrix.
- `media`: `image`, `caption`, `body[]`; image may be `built-in:phone-card`, `built-in:waves`, `built-in:product-flow`, or a local path.
- `decision`: `decision`, `why[]`, `actions[{owner,action,time}]`.

Use `source` for a short visible source line such as `来源：项目周报，2026-08-10` and keep detailed evidence outside the formal slide.
