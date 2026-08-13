---
name: mint-report-deck
description: Create source-grounded Mint management reports from rough Chinese notes or Word, PDF, Excel, PowerPoint, HTML and text. Compile facts and relationships into the minimum necessary pages, route to the right diagram or chart, render editable interactive HTML, and orchestrate the Codex Presentations skill for editable PPTX when available. Use for project updates, operating reviews, decision materials, one-page briefs, chart selection, or repairing unsupported claims, entity drift, repetitive cards and unclear reading order.
---

# Mint Report Deck V0.3

Mint decides **what the material means and how it should be shown**. The bundled HTML renderer and Codex Presentations are output engines; neither may invent the content model.

Read, in order:

1. [input-templates.md](references/input-templates.md) to normalize rough notes.
2. [content-policy.md](references/content-policy.md) before writing any conclusion.
3. [content-map-contract.md](references/content-map-contract.md) to compile `content-map.json`.
4. [component-contract.md](references/component-contract.md) and [text-layout-contract.md](references/text-layout-contract.md) before routing pages.
5. [deck-planning.md](references/deck-planning.md) when the input contains multiple topics, sections or more than three pages.
6. [deck-schema.md](references/deck-schema.md) before writing `deck-spec.json`.
7. [presentations-integration.md](references/presentations-integration.md) when PPTX is requested or part of the default output.

## Default workflow

1. Preserve the original notes verbatim. Normalize them into the quick input template; automatically use the full template for finance, regulation, legal, credit, pricing, customer-policy or conflicting-source material.
2. Freeze facts, exact entity names, numbers, relative dates and source locations. Put missing or conflicting information in `unknowns` / `conflicts`, never on a formal page.
3. Compile `content-map.json`: audience and intended decision, one management takeaway, facts, entities, relationships, numbers, actions, unknowns, conflicts and page budget.
4. For a full report, first create a deck-level narrative and section plan. Give every section the same `section-intro` family and typography; vary content pages by relationship while preserving the deck system.
5. Start capacity planning at **one page per independent proposition**, not one page per note heading. Add a page only when another proposition or verified capacity failure requires it.
6. Choose the page family from communication role, relationship, density and importance. Use `node scripts/select-component.mjs '<page-json>'` for deterministic routing.
7. Write shared `deck-spec.json`, then validate:

   ```bash
   node scripts/validate-content-map.mjs /absolute/path/content-map.json
   node scripts/validate-deck.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json
   ```

8. Render standalone HTML:

   ```bash
   node scripts/render-deck.mjs /absolute/path/deck-spec.json /absolute/path/report.html
   ```

9. If PPTX is requested, first check whether the `Presentations` skill is available. If available, load it and follow [presentations-integration.md](references/presentations-integration.md), using the bundled `assets/presentation/Mint_Report_Component_Library.pptx`. If unavailable, deliver HTML plus the validated content artifacts and explicitly say PPTX was not produced. Never hand-roll a substitute PPTX.
10. Inspect every HTML and PPTX page at 16:9. Fix text, data or component choice before reducing font size. Verify entity names, facts, numbers, page count and reading order agree across outputs.

## Non-negotiable rules

- Use only facts supplied by the user or traceable to supplied sources. Do not browse unless explicitly asked.
- Preserve exact entities: Vodafone must not become Vodacom; do not add Sinova, Twende, BaaS or any other entity absent from the source.
- Do not turn relative dates such as “周四” into calendar dates without a dated anchor.
- Numbered notes are not automatically a process. Route by the semantic relationship.
- No chart without aligned values, labels, unit, period and source reference. Missing evidence goes to QA, not the formal page.
- Do not manufacture “职责、产出、价值、结果” to fill a layout.
- Default to the fewest pages that communicate the material. Short material is normally one page.
- One page has one proposition and one obvious reading path. Do not default to card grids, wide bordered tables or dashboard panels.
- Give important entities and key nouns at least 1.5× the visual weight of their explanatory copy. Do not render every text fragment at the same level.
- Use `capital-callout`, `risk-alert` and `decision-callout` for material items. Do not bury capital, regulatory gates or high-impact risk inside body paragraphs.
- Use tables only when exact lookup or cell-by-cell comparison is the audience task. Use a capability chain for business roles, handoffs and value creation.
- Titles state the conclusion. Formal pages contain no prompts, production notes, placeholders or QA warnings.
- Split or change the layout before shrinking Chinese type. Keep stable `id` and increment `version` after structural changes.

## Controlled page recipes

Use only: `cover`, `section-intro`, `statement`, `capability-chain`, `architecture-brief`, `process`, `timeline`, `dual-track-roadmap`, `swimlane`, `comparison`, `matrix`, `table`, `chart`, `heatmap`, `media`, `risk-spotlight`, and `decision`.

- `capability-chain`: 3–5 linked capability stages with dominant entity names and concise explanations; default for front–middle–back, input–capability–service, or ecosystem handoff.
- `architecture-brief`: use only when the audience must inspect strict layer membership rather than follow a business chain.
- `dual-track-roadmap`: two parallel paths plus optional bottom action banner.
- `process`: only a real ordered input–processing–output or stage-gate sequence.
- `chart`: editable quantitative chart in PPTX and interactive chart in HTML.
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
