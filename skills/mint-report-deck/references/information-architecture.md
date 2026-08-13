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

When more than one primary visual competes for attention, split the page. When the page is only a list of modules with no dominant answer, replan it rather than styling it.

## Coverage invariant

- 100% of primary atoms and numeric claims are visibly represented.
- 100% of formal claims have evidence or explicit hypothesis status.
- 0 unapproved entities, numbers or conclusions are added.
- Every omission has a recorded reason.
- Formal output is blocked after two failed repair rounds.
