# Information architecture and decision salience

Use a finite semantic grammar instead of topic-specific templates. Every source block becomes one or more content atoms; every formal page must account for the atoms it uses or omits.

## Atom classes

- `fact`: state, event, result, background or definition.
- `numeric`: amount, ratio, count, rank, date, duration or range.
- `relationship`: parallel, comparison, hierarchy, sequence, time, cause, dependency, flow, responsibility or composition.
- `judgment`: conclusion, opportunity, issue, risk, impact or hypothesis.
- `action`: decision, next step, owner, time or expected result.
- `evidence`: source, locator, quotation, media, metric definition or confidence state.
- `boundary`: unknown, conflict, legal or regulatory assumption, limitation or confirmation item.

## Numeric roles

Classify a number before routing it:

| Role | Meaning | Default visual |
| --- | --- | --- |
| `input` / `formula-result` | operands and calculated result | `formula-band` |
| `actual` / `target` | performance against a goal | `actual-target` |
| `upper-bound` / `lower-bound` | cap, floor or regulatory boundary | `threshold-bar` |
| `part` / `remainder` | components of a known whole | `allocation-bar` |
| `theoretical` / `direct` / `gap` | entitlement, delivered amount and compensation | `gap-bridge` |
| `trend` | ordered time observations | `trend-chart` |
| `forecast` / `range` | future estimate or uncertainty band | `range-band` |
| `scenario` | mutually exclusive cases | `scenario-comparison` |
| `rank` / `category-value` | objects on a common measure | `ranked-comparison` |
| `distribution` / `anomaly` | spread or outlier | `distribution` |

Do not convert formulas, caps or gaps into generic bar charts. Do not generate statistical charts from isolated numbers.

## Materiality and display

- `primary`: changes the page answer, decision, risk or management action. Must be `primary-visual` or `callout`.
- `supporting`: explains or qualifies a primary item. May be `annotation`.
- `appendix`: needed for lookup or audit, not for the speaker-led page. May be `source-only`.

Every atom has `displayRequirement` and `coverageStatus`. Allowed coverage statuses are `planned`, `visible`, and `omitted-with-reason`. A primary atom cannot be `source-only` or omitted.

## Page grammar

Before layout, write:

1. `pageQuestion`: the audience question.
2. `pageAnswer`: the single sentence the presenter should say.
3. `primaryVisual`: the evidence or relationship that makes the answer clear.
4. `supportModules`: at most two implications, boundaries, risks or actions.
5. `readingOrder`: the intended reading path.
6. `atomRefs`: every atom represented on the page.

When more than one primary visual competes for attention, first select the one that proves the page answer and demote the other relationship to a support band. Split only under a flexible page contract and only after the decision-thread independence test passes. When the page is only a list of modules with no dominant answer, replan it rather than styling it.

## Decision-thread parsing

Before page planning, assign each primary atom to a `decisionThread`:

```json
{
  "id": "DT1",
  "managementQuestion": "管理层需要理解或决定什么",
  "answer": "基于已知事实可以说什么",
  "atomRefs": ["A1", "A2"],
  "relationshipRefs": ["R1"],
  "roles": ["background", "evidence", "mechanism", "implication", "risk", "action"],
  "pageAssignment": "P1",
  "independenceTest": {
    "differentDecision": false,
    "understandableWithoutOtherThreads": false,
    "ownEvidenceAndImplication": false,
    "separationPreservesLogic": false
  }
}
```

A new page is allowed only when all four independence checks are true, or when a flexible page contract has a verified capacity failure. Headings, numbering, paragraph breaks, chart opportunities, risk labels and action lists are not independent-page evidence.

Within one decision thread, parse content roles before visual routing:

- `background`: why the topic exists; normally a context ribbon or lead.
- `evidence`: facts and numbers supporting the answer; normally the primary visual.
- `mechanism`: flow, architecture, formula or causal relationship; primary visual when it explains the decision.
- `implication`: what the evidence means; title, conclusion or callout.
- `risk`: a visible risk callout, not a separate page by default.
- `action`: decision/action band, not a separate page by default.
- `boundary`: source footer, annotation or review drawer.

Do not summarize away primary atoms while assigning roles. Parsing changes placement, not evidence coverage.

## Coverage invariant

- 100% of primary atoms and numeric claims are visibly represented.
- 100% of formal claims have evidence or explicit hypothesis status.
- 0 unapproved entities, numbers or conclusions are added.
- Every omission has a recorded reason.
- Formal output is blocked after two failed repair rounds.
