# Deck spec contract V0.4

Top level keeps the existing deck identity and plan fields. V0.2/V0.3 decks remain renderable; all new work uses V0.4.

```json
{
  "schemaVersion": "0.4",
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

Every V0.4 slide has:

- `type`, `chapter`, `titleLines`, `sourceRefs[]`.
- `pageQuestion`: the audience question.
- `pageAnswer`: the one-sentence takeaway.
- `primaryVisual`: `{kind, claimRefs[], atomRefs[], data}`.
- `supportModules[]`: at most two `{kind, atomRefs[], claimRefs[], data}` modules.
- `readingOrder[]`: ordered ids such as `title`, `formula`, `allocation`, `implication`.
- `atomRefs[]`: all content atoms represented on the page.
- Optional `sectionId`, `pageRole`, `emphasis`, `lead`, `source`.

`primaryVisual.kind` may be:

`hero-metric`, `metric-strip`, `threshold-bar`, `allocation-bar`, `formula-band`, `gap-bridge`, `actual-target`, `range-band`, `ranked-comparison`, `trend-chart`, `waterfall`, `distribution`, `scenario-comparison`, `capability-chain`, `architecture`, `process`, `timeline`, `roadmap`, `swimlane`, `comparison`, `matrix`, `table`, `heatmap`, `media`, `risk` or `decision`.

`supportModules.kind` may be `formula-band`, `threshold-bar`, `gap-bridge`, `risk-alert`, `decision-callout`, `capital-callout`, `implication`, `action-banner`, `evidence-note` or `boundary-note`.

## Quantitative story

Use `type: quantitative-story` for formula, threshold, allocation, gap, target, scenario or range-led pages. The renderer consumes `primaryVisual.data.groups[]`:

```json
{
  "type": "quantitative-story",
  "primaryVisual": {
    "kind": "allocation-bar",
    "claimRefs": ["N1", "N2"],
    "atomRefs": ["A1", "A2"],
    "data": {
      "groups": [
        {
          "id": "KENYA",
          "label": "肯尼亚",
          "headline": "直接持股 21%",
          "formula": "70% × 30% = 21%",
          "segments": [
            {"label":"直接持股","value":21,"unit":"%","tone":"jade"},
            {"label":"其余股权","value":79,"unit":"%","tone":"remainder"}
          ],
          "threshold": {"value":25,"unit":"%","label":"单一股东上限原则"},
          "implication": "21%低于示例上限，按方案全部直接入股"
        }
      ]
    }
  }
}
```

Segments sharing a bar must reconcile to `total`, default 100 for percentage allocation. A compensation or gap segment must remain visually and semantically distinct from direct ownership.

## Legacy recipes

Keep the V0.3 recipes for `cover`, `section-intro`, `statement`, `capability-chain`, `architecture-brief`, `process`, `timeline`, `dual-track-roadmap`, `swimlane`, `comparison`, `matrix`, `table`, `chart`, `heatmap`, `media`, `risk-spotlight`, and `decision`. V0.4 metadata is mandatory for newly generated slides even when a legacy renderer family is used.

Visible `source` is a concise source line. Detailed locators live in evidence artifacts. Unknowns, conflicts, prompts and QA text never enter a slide.
