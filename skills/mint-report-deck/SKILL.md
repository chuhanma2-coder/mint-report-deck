---
name: mint-report-deck
description: Create source-grounded Mint management reports from rough Chinese notes or Word, PDF, Excel, PowerPoint, HTML and text. Compile facts and relationships into the minimum necessary pages, route to the right diagram or chart, render editable interactive HTML, and orchestrate the Codex Presentations skill for editable PPTX when available. Use for project updates, operating reviews, decision materials, one-page briefs, chart selection, or repairing unsupported claims, entity drift, repetitive cards and unclear reading order.
---

# Mint Report Deck V0.4.1

Mint decides **what the material means and how it should be shown**. The bundled HTML renderer and Codex Presentations are output engines; neither may invent the content model.

Read, in order:

1. [input-templates.md](references/input-templates.md) to normalize rough notes.
2. [content-policy.md](references/content-policy.md) before writing any conclusion.
3. [content-map-contract.md](references/content-map-contract.md) to compile `content-map.json`.
4. [information-architecture.md](references/information-architecture.md) to classify atoms, numeric roles, materiality and display requirements.
5. [component-contract.md](references/component-contract.md) and [text-layout-contract.md](references/text-layout-contract.md) before routing pages.
6. [deck-planning.md](references/deck-planning.md) when the input contains multiple topics, sections or more than three pages.
7. [deck-schema.md](references/deck-schema.md) before writing `deck-spec.json`.
8. [presentations-integration.md](references/presentations-integration.md) when PPTX is requested or part of the default output.

## Default workflow

1. Preserve the original notes verbatim. Normalize them into the quick input template; automatically use the full template for finance, regulation, legal, credit, pricing, customer-policy or conflicting-source material.
2. Freeze facts, exact entity names, numbers, relative dates and source locations. Put missing or conflicting information in `unknowns` / `conflicts`, never on a formal page.
3. Compile `content-map.json`: audience and intended decision, one management takeaway, content atoms, numeric claims, claim graph, decision threads, facts, entities, relationships, actions, unknowns, conflicts and page budget. Classify every primary atom with a content role and display requirement. Do not plan pages directly from headings or numbered notes.
4. For a full report, first create a deck-level narrative and section plan. Give every section the same `section-intro` family and typography; vary content pages by relationship while preserving the deck system.
5. Parse the page-count contract before planning. “必须一页、强制一页、不要拆页、只做一页” means `pageBudget.constraint = "exact"`, `requested = planned = 1`, and `overflowPolicy = "block"`. Under this contract, background, evidence, relationship, risk and action serving the same management decision are zones of one page, not separate propositions. Without an explicit hard request, start at one page per independent proposition.
6. Define `pageQuestion` and `pageAnswer`, then choose one `primaryVisual` from communication role, relationship, numeric role, density and materiality. Use `node scripts/select-component.mjs '<page-json>'` for deterministic routing. A page may have at most two support modules.
7. Write shared `deck-spec.json`, then run the strict V0.4 gate:

   ```bash
   node scripts/qa-deck.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json
   ```

8. If the gate fails, run `node scripts/repair-deck.mjs ...` for at most two rounds. It may promote a numeric module, reroute a quantitative comparison, shorten supporting copy or reorganize support bands. It may split only when the page contract is flexible. Under an exact one-page contract, an unresolved capacity failure blocks delivery and must never create page two.
9. Render standalone HTML:

   ```bash
   node scripts/render-deck.mjs /absolute/path/deck-spec.json /absolute/path/report.html
   ```

10. If PPTX is requested, first check whether the `Presentations` skill is available. If available, load it and follow [presentations-integration.md](references/presentations-integration.md), using the bundled `assets/presentation/Mint_Report_Component_Library.pptx`. If unavailable, deliver HTML plus the validated content artifacts and explicitly say PPTX was not produced. Never hand-roll a substitute PPTX.
11. Inspect every HTML and PPTX page at 16:9. Fix text, data or component choice before reducing font size. Verify entity names, facts, numbers, formulas, page count and reading order agree across outputs.

## Non-negotiable rules

- Use only facts supplied by the user or traceable to supplied sources. Do not browse unless explicitly asked.
- Preserve exact entities: Vodafone must not become Vodacom; do not add Sinova, Twende, BaaS or any other entity absent from the source.
- Do not turn relative dates such as “周四” into calendar dates without a dated anchor.
- Numbered notes are not automatically a process. Route by the semantic relationship.
- No chart without aligned values, labels, unit, period and source reference. Missing evidence goes to QA, not the formal page.
- Numeric presence is not numeric communication. Classify each important number as input, result, target, threshold, gap, composition, trend, forecast, scenario or anomaly, then give it the corresponding visual role.
- Every `primary` atom and numeric claim must be visible through `atomRefs` / `claimRefs`. A number hidden only in body copy does not satisfy coverage.
- Do not manufacture “职责、产出、价值、结果” to fill a layout.
- Default to the fewest pages that communicate the material. Short material is normally one page.
- A user-specified exact page count overrides automatic splitting. Do not reinterpret “一页” as a preference. A one-page formal deliverable has no separate cover or section page.
- Notes are independent propositions only when they answer different management questions or require separate decisions. Background, evidence, mechanism, implication, risk and action that support one decision must be composed into one page.
- One page has one proposition and one obvious reading path. Do not default to card grids, wide bordered tables or dashboard panels.
- Give important entities and key nouns at least 1.5× the visual weight of their explanatory copy; key numeric values use at least 1.8× the body size. Do not render every text fragment at the same level.
- Use `capital-callout`, `risk-alert` and `decision-callout` for material items. Do not bury capital, regulatory gates or high-impact risk inside body paragraphs.
- Use tables only when exact lookup or cell-by-cell comparison is the audience task. Use a capability chain for business roles, handoffs and value creation.
- Titles state the conclusion. Formal pages contain no prompts, production notes, placeholders or QA warnings.
- Split or change the layout before shrinking Chinese type. Keep stable `id` and increment `version` after structural changes.

## Controlled page recipes

Use only: `cover`, `section-intro`, `statement`, `quantitative-story`, `capability-chain`, `architecture-brief`, `process`, `timeline`, `dual-track-roadmap`, `swimlane`, `comparison`, `matrix`, `table`, `chart`, `heatmap`, `media`, `risk-spotlight`, and `decision`.

- `capability-chain`: 3–5 linked capability stages with dominant entity names and concise explanations; default for front–middle–back, input–capability–service, or ecosystem handoff.
- `architecture-brief`: use only when the audience must inspect strict layer membership rather than follow a business chain.
- `dual-track-roadmap`: two parallel paths plus optional bottom action banner.
- `process`: only a real ordered input–processing–output or stage-gate sequence.
- `chart`: editable quantitative chart in PPTX and interactive chart in HTML.
- `quantitative-story`: formula, threshold, allocation, gap, target or scenario led page. Use when the management question depends on what a number means, not merely on comparing categories.
- `decision`: one conclusion plus prominent actions, owners and timing.

If no complete specimen slide matches, do not choose the closest wrong page. Assemble a page from the controlled family grammar in [deck-planning.md](references/deck-planning.md). If the combination exceeds its slot or density budget, split the proposition across pages; never free-design a new global style.

## Output artifacts

Keep these beside the report for deterministic repair:

- `content-map.json`
- `deck-spec.json`
- `presentation-content.json` when PPTX is requested
- `report.html`
- `report.pptx` only when Presentations actually generated and visually verified it
- `qa-report.json`

For screenshot feedback, locate the page and diagnose content, routing, capacity or rendering. Change the structured source and rerender; generated HTML is not the source of truth.
