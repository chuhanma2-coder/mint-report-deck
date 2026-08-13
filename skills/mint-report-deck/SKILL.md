---
name: mint-report-deck
description: Create source-grounded Mint management reports from rough Chinese notes or Word, PDF, Excel, PowerPoint, HTML and text. Compile facts and relationships into the minimum necessary pages, route to the right diagram or chart, render editable interactive HTML, and orchestrate the Codex Presentations skill for editable PPTX when available. Use for project updates, operating reviews, decision materials, one-page briefs, chart selection, or repairing unsupported claims, entity drift, repetitive cards and unclear reading order.
---

# Mint Report Deck V0.2

Mint decides **what the material means and how it should be shown**. The bundled HTML renderer and Codex Presentations are output engines; neither may invent the content model.

Read, in order:

1. [input-templates.md](references/input-templates.md) to normalize rough notes.
2. [content-policy.md](references/content-policy.md) before writing any conclusion.
3. [content-map-contract.md](references/content-map-contract.md) to compile `content-map.json`.
4. [component-contract.md](references/component-contract.md) and [text-layout-contract.md](references/text-layout-contract.md) before routing pages.
5. [deck-schema.md](references/deck-schema.md) before writing `deck-spec.json`.
6. [presentations-integration.md](references/presentations-integration.md) when PPTX is requested or part of the default output.

## Default workflow

1. Preserve the original notes verbatim. Normalize them into the quick input template; automatically use the full template for finance, regulation, legal, credit, pricing, customer-policy or conflicting-source material.
2. Freeze facts, exact entity names, numbers, relative dates and source locations. Put missing or conflicting information in `unknowns` / `conflicts`, never on a formal page.
3. Compile `content-map.json`: audience and intended decision, one management takeaway, facts, entities, relationships, numbers, actions, unknowns, conflicts and page budget.
4. Start capacity planning at **one page**. Add a page only when the material contains another independent proposition or cannot remain legible at the minimum Chinese font sizes. Do not map note headings or numbering one-to-one to pages.
5. Choose the page recipe from the dominant relationship. Use `node scripts/select-component.mjs '<page-json>'` for deterministic routing.
6. Write shared `deck-spec.json`, then validate:

   ```bash
   node scripts/validate-content-map.mjs /absolute/path/content-map.json
   node scripts/validate-deck.mjs /absolute/path/deck-spec.json /absolute/path/content-map.json
   ```

7. Render standalone HTML:

   ```bash
   node scripts/render-deck.mjs /absolute/path/deck-spec.json /absolute/path/report.html
   ```

8. If PPTX is requested, first check whether the `Presentations` skill is available. If available, load it and follow [presentations-integration.md](references/presentations-integration.md), using the bundled `assets/presentation/Mint_Report_Component_Library.pptx`. If unavailable, deliver HTML plus the validated content artifacts and explicitly say PPTX was not produced. Never hand-roll a substitute PPTX.
9. Inspect every HTML and PPTX page at 16:9. Fix text, data or component choice before reducing font size. Verify entity names, facts, numbers, page count and reading order agree across outputs.

## Non-negotiable rules

- Use only facts supplied by the user or traceable to supplied sources. Do not browse unless explicitly asked.
- Preserve exact entities: Vodafone must not become Vodacom; do not add Sinova, Twende, BaaS or any other entity absent from the source.
- Do not turn relative dates such as “周四” into calendar dates without a dated anchor.
- Numbered notes are not automatically a process. Route by the semantic relationship.
- No chart without aligned values, labels, unit, period and source reference. Missing evidence goes to QA, not the formal page.
- Do not manufacture “职责、产出、价值、结果” to fill a layout.
- Default to the fewest pages that communicate the material. Short material is normally one page.
- One page has one proposition and one obvious reading path. Do not default to card grids or dashboard panels.
- Titles state the conclusion. Formal pages contain no prompts, production notes, placeholders or QA warnings.
- Split or change the layout before shrinking Chinese type. Keep stable `id` and increment `version` after structural changes.

## Controlled page recipes

Use only: `cover`, `statement`, `architecture-brief`, `process`, `timeline`, `dual-track-roadmap`, `swimlane`, `comparison`, `matrix`, `table`, `chart`, `heatmap`, `media`, and `decision`.

- `architecture-brief`: context strip plus 3–5 layers; use for front–middle–back or ecosystem architecture.
- `dual-track-roadmap`: two parallel paths plus optional bottom action banner.
- `process`: only a real ordered input–processing–output or stage-gate sequence.
- `chart`: editable quantitative chart in PPTX and interactive chart in HTML.
- `decision`: one conclusion plus prominent actions, owners and timing.

## Output artifacts

Keep these beside the report for deterministic repair:

- `content-map.json`
- `deck-spec.json`
- `presentation-content.json` when PPTX is requested
- `report.html`
- `report.pptx` only when Presentations actually generated and visually verified it
- `qa-report.json`

For screenshot feedback, locate the page and diagnose content, routing, capacity or rendering. Change the structured source and rerender; generated HTML is not the source of truth.
