# Controlled relationship and component contract V2.1

Select a visual from the business question, evidence contract and data shape. Page number, visual variety, and the presence of isolated numbers never select a chart.

## Chart evidence contract

Every quantitative visual requires aligned labels and values, unit, period, statistical object, and `sourceRefs`. Missing or conflicting fields produce `needs-review`; they are never repaired by inference.

## Controlled visual catalog

| Analytical question | Preferred components | Required shape |
| --- | --- | --- |
| Trend and turning point | line, area, small-multiples | ordered time series |
| Category comparison | horizontal bar, column, dot plot | categories on a common measure |
| Part-to-whole | donut, stacked bar, 100% stacked bar | positive parts of one or more valid wholes |
| Distribution | histogram, box plot | observations or valid bins/quantiles |
| Association | scatter, bubble | paired x/y observations; optional third magnitude |
| Two-dimensional intensity | heatmap | complete row-by-column numeric matrix |
| Ordered conversion | funnel | same cohort and denominator across ordered stages |
| Weighted movement | Sankey | reconciled weighted source-destination links |
| Additive change | waterfall | contributions reconcile opening to closing value |
| Actual versus target | bullet, progress | confirmed actual and target |
| Time plan | timeline, roadmap, Gantt | milestones or tasks with dates/durations |
| Geography | map, ranked bar | confirmed geographic key and measure |
| Exact value or mapping | table, KPI | precise values or lookup relationships |
| Formula or calculated entitlement | formula band | explicit operands, operator and result |
| Actual versus cap or floor | threshold bar | actual and confirmed boundary on one scale |
| Allocation or ownership structure | allocation bar | reconciled parts and known total |
| Entitlement versus delivered amount | gap bridge | theoretical, direct and compensating gap |
| Forecast range | range band | confirmed bounds or scenarios |
| Sequence | process, stage-gate | ordered actions, not decorative numbers |
| Cause | causal chain, problem tree | supported causal or hypothesis structure |
| Roles | swimlane, responsibility matrix | actors and responsibilities |
| Hierarchy | tree, treemap, layered architecture | parent-child or nested quantity structure |
| Front-middle-back or ecosystem layers | architecture-brief | 3-5 layers with explicit entities and roles |
| Two parallel evolution paths | dual-track-roadmap | exactly two tracks with ordered stages |
| Management actions | decision, action banner | action, owner, time and expected result |
| Business capability handoff | capability-chain | 3–5 stages with entities, capabilities and direction |
| Material risk judgment | risk-spotlight | concise judgment, evidence, impact and action |

## Hard guards

- Use a donut only for one positive whole with 2-5 parts.
- Use a line only for a naturally ordered continuous axis, normally time.
- Use a heatmap only when every cell uses one comparable scale.
- Use a funnel only for the same cohort; independent stage totals are not a funnel.
- Use a Sankey only when link weights reconcile with node totals.
- Use a waterfall only when contributions reconcile opening and closing values.
- A scatter plot can show association but must not state causation without evidence.
- Prefer ranked bars over maps when precise comparison is more important than location.
- Prefer a table when the audience must read exact values.
- A numbered list is not a process unless the items form a real sequence.
- Architecture layers do not require invented outputs. Show only supplied entities, roles and relationships.
- Page recipes are selected from content, not assigned to fixed page numbers.
- Use a table only for exact lookup or cell-by-cell comparison. Never use a wide table as the default expression for a business chain.
- Render entity names, monetary values and decisions as primary anchors; explanations are secondary.
- Reserve at least 55% of the usable body for the primary relationship visual.
- A primary number hidden only in a sentence, list or subtitle fails coverage even if its characters appear on the page.
- Prefer a numeric story over a generic comparison when the conclusion depends on a formula, threshold, allocation, target or gap.

## Presentation and interaction

Formal slides show only report content, concise sources, and unobtrusive navigation. Authoring warnings such as “no data, no chart,” component names, or template instructions belong in QA/editor mode and must not appear on the slide.

Charts may support presenter interaction when it helps explanation: hover for exact value, click to isolate a series or row, drag to change a time window, and click a region/category to update an insight panel. Interaction must not alter the underlying data or the printed final state.

Use a restrained 280-450 ms cross-fade with no large spatial movement between pages. Respect `prefers-reduced-motion`. Do not use flip, cube, bounce, or decorative parallax transitions in leadership reports.
