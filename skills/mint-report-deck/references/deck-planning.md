# Whole-deck planning and page-family grammar

Use this contract for multi-page or multi-section reports.

## 1. Plan the whole story before selecting pages

Create `deck-plan.json` with:

```json
{
  "communicationJob": "By the end, management should decide ... because ...",
  "narrativeArc": ["context", "stakes", "evidence", "implication", "action"],
  "visualSystem": {"introFamily":"section-intro","contentFamily":"mint-formal","riskTreatment":"risk-alert"},
  "sections": [
    {"id":"S1","title":"业务策略","question":"先做什么，为什么","accentTone":"jade","introSlideId":"P2","slideIds":["P2","P3","P4"]}
  ]
}
```

Do not select pages independently. Every page must answer a question created by the prior page or prepare the next decision.

### Exact one-page contract

When the user requires one page, create `onePagePlan` before choosing a component:

```json
{
  "managementQuestion": "这一页要推动什么判断或决定",
  "pageAnswer": "看完后必须记住的一句话",
  "primaryRelationship": "本页唯一主关系",
  "readingPath": ["answer", "primary-visual", "risk-or-decision", "source"],
  "atomPlacement": [
    {"atomRef":"A1","zone":"primary-visual"},
    {"atomRef":"A2","zone":"support-band"}
  ],
  "demotedDetails": [{"atomRef":"A3","zone":"source-drawer","reason":"辅助口径，不影响主判断"}]
}
```

Allowed zones are `title`, `primary-visual`, `support-band`, `risk-callout`, `decision-callout`, `source-footer`, and `source-drawer`. Every primary atom remains visible; only supporting or appendix detail may move to a drawer or notes.

Treat the following as parts of one decision chain unless the user requests otherwise: background → evidence → mechanism/relationship → implication → risk → action. A numbered list, multiple subheadings, or multiple visual forms does not by itself justify multiple pages.

## 2. Keep section openings consistent

- Every top-level section uses the same `section-intro` composition, title position, type scale, chapter number and progress marker.
- Accent color may identify the section, but geometry and hierarchy remain identical.
- Do not alternate between photo, large number, card grid and full-color chapter pages for equivalent section openings.

## 3. Controlled page families

A specimen PPT page is a tested example, not a fixed page-number template. Select a family, then fill or combine only its allowed modules:

| Family | Required modules | Optional modules | Maximum |
| --- | --- | --- | --- |
| `section-intro` | chapter number, section claim | one-line question | 1 claim |
| `capability-chain` | 3–5 linked stages | context ribbon, one callout | 5 stages |
| `evidence` | claim, evidence visual | one implication | 1 chart/table |
| `quantitative-story` | one numeric question, one primary numeric visual | formula, threshold, gap, implication | 1 primary + 2 support |
| `risk` | risk judgment, evidence | impact, action | 2 risks |
| `decision` | decision | 3 actions, capital callout | 1 decision |

Allowed emphasis modules:

- `capital-callout`: amount, currency/unit, status and decision implication.
- `risk-alert`: one concise risk judgment, severity and consequence.
- `decision-callout`: the decision or approval requested.
- `evidence-note`: source-backed proof; lower visual weight than the judgment.

## 4. Fallback when no specimen matches

1. Select the closest **page family**, not the closest complete page.
2. Compose from its allowed modules and the fixed Mint grid, type scale and colors.
3. Run capacity validation. If a primary diagram receives less than 55% of the usable canvas, shorten repeated copy, merge labels into nodes, or move only supporting detail to a source drawer/notes.
4. If more than one primary relationship competes for attention, determine whether both serve the same decision. Under an exact one-page contract, choose one as the primary visual and express the other as a support band or callout. If primary information still cannot fit, block; do not split.
5. Under a flexible contract, a genuinely independent management question may become another page.
5. If no controlled family can express the relationship truthfully, emit `needs-layout-review`; do not substitute a table or card grid.

## 5. Density and hierarchy

- Reserve 55–70% of the usable body for the primary relationship or evidence visual.
- Explanatory copy normally occupies no more than 25% of the page.
- Key entity or amount: at least 1.8× body size and normally 34–64 pt in PPT; supporting explanation: 16–20 pt.
- Prefer labels directly attached to nodes over a separate legend.
- Use whitespace to separate semantic groups, not to leave an unfinished lower half.
