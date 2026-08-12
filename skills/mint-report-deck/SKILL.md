---
name: mint-report-deck
description: Turn rough Chinese notes, a topic, or supplied Word, PDF, Excel, PowerPoint, HTML and text files into a polished, source-grounded, editable and interactive Mint leadership report in standalone HTML. Use for weekly reports, project updates, operating reviews, decision materials, visual storytelling, chart selection, or repairing Mint report pages with weak Chinese layout, unsupported claims, repetitive cards, or unclear reading order.
---

# Mint Report Deck

Generate content data, never free-form visual code. Use the bundled renderer and its controlled Mint Arc components. The default outcome is a finished standalone `report.html`, not a tutorial or a blank template.

Read these references only when their step applies:

- [content-policy.md](references/content-policy.md) before extracting facts or writing conclusions.
- [generation-contract.md](references/generation-contract.md) before drafting `deck.json`.
- [component-contract.md](references/component-contract.md) before choosing a diagram or chart.
- [text-layout-contract.md](references/text-layout-contract.md) before finalizing Chinese titles and node copy.
- [frontend-slides-foundation.md](references/frontend-slides-foundation.md) when changing runtime behavior, transitions, navigation, export or QA.

## Fast workflow

1. Read the user's notes and attachments. Separate confirmed facts, user statements, hypotheses, conflicts and unknowns. Never search the web unless the user explicitly asks.
2. Infer audience, desired decision and central takeaway. If the request is ordinary and low-risk, proceed with explicit conservative assumptions; do not force a ceremonial approval step. Stop for confirmation when sources conflict or claims affect finance, compliance, legal, credit, pricing or customers.
3. Create a concise narrative of 4–12 pages. Each page must have one proposition and one reading direction. Do not map notes one-to-one to pages.
4. Choose components by relationship and evidence shape, not page number or visual variety. Run `node scripts/select-component.mjs '<page-json>'` when numeric routing is uncertain.
5. Write `deck.json` against [deck-schema.md](references/deck-schema.md). Use semantic title lines rather than letting the browser wrap Chinese at arbitrary characters.
6. Validate and render:

   ```bash
   node scripts/validate-deck.mjs /absolute/path/deck.json
   node scripts/render-deck.mjs /absolute/path/deck.json /absolute/path/report.html
   ```

7. Open the result and inspect every page at 16:9. Check reading order, orphan characters, overflow, small text, chart labels, media crop and source lines. Repair the data or component choice; do not patch generated CSS.
8. Deliver `report.html`. Explain: arrow keys or wheel navigate; hover the right rail for titles; `✎` edits text; `↓` downloads edits; browser print exports PDF.

## Non-negotiable rules

- Do not invent company performance, customer facts, dates or numeric series.
- A quantitative chart requires labels, values, unit, period and source references. Otherwise use a table, process or takeaway and record the missing evidence outside the formal slide.
- Formal slides never show authoring instructions, placeholders, validation warnings or phrases such as “无真实数列，不生成图表”.
- Use 3–6 process steps and 3–5 architecture layers. Split dense content before shrinking text.
- Titles normally have two semantic lines, each 12–22 Chinese characters, separated after punctuation or between premise and conclusion.
- Use a stable unique `id` and increment `version` after structural changes so browser edit caches cannot contaminate another deck.
- Do not create new global CSS, colors, fonts, arbitrary coordinates or unsupported components.
- Do not claim PDF, PPTX, Feishu, WeCom or web deployment was completed unless it was actually produced and verified.

## Component set

Use only: `cover`, `statement`, `process`, `architecture`, `cycle`, `timeline`, `comparison`, `table`, `chart`, `heatmap`, `media`, and `decision`.

`chart` supports interactive bar and line series. `heatmap` is for a complete two-dimensional comparable matrix. Media may use the bundled `phone-card`, `waves`, or `product-flow` visual, or a user-supplied local image that the renderer can inline.

## Output and repair

Keep `deck.json` beside `report.html` so the Agent can repair a page deterministically. For screenshot feedback, identify the page, diagnose whether the fault is content, component selection, capacity or layout, then change `deck.json` and rerender. Never edit the generated HTML as the source of truth.
