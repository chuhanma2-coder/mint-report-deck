# Presentations integration

## Preflight

1. Check that a skill named `Presentations` is available in the current Codex environment.
2. When available, read and obey that skill in the same task. Mint owns facts, page budget, narrative, component routing and `deck-spec`; Presentations owns native PPTX editing, rendering and visual QA.
3. When unavailable, do not use another PPTX library. Deliver `content-map.json`, `deck-spec.json` and HTML, and state that PPTX remains pending.

## Shared inputs

Create `presentation-content.json` from the validated deck spec:

```json
{
  "schemaVersion": "0.3",
  "template": "assets/presentation/Mint_Report_Component_Library.pptx",
  "deckId": "project-slug",
  "slides": [{"order":1,"recipe":"architecture-brief","titleLines":[],"content":{},"sourceRefs":[]}]
}
```

## Native PPTX rules

- Use `Mint_Report_Component_Library.pptx` as the source deck. Choose a **page family** from the validated deck plan, then duplicate the closest specimen in that family and populate only its controlled modules.
- A specimen is not a fixed content template. It defines geometry, hierarchy, typography and allowed modules; the actual module count and content are driven by `deck-spec.json`.
- If no exact specimen exists, compose from the same family's title, visual, callout and evidence modules. Do not fall back to a wide table merely because it can contain the text.
- Reserve at least 55% of the usable canvas for the main relationship or quantitative visual. Under an exact one-page contract, shorten supporting copy, attach labels to the visual, and move only non-primary detail to notes/drawers; if primary information still cannot fit, block. Split into linked pages only under a flexible contract.
- For a multi-section deck, duplicate one `section-intro` family for every top-level section. Preserve its geometry, type scale and reading order so introductions never drift into unrelated styles.
- Replace inherited placeholder text and data; preserve the Mint master/layout/slide relationship.
- Keep text boxes, simple diagrams, tables and charts editable.
- For a quantitative page, verify the exported PPTX package contains a native chart XML part and an Office chart relationship. Standard PowerPoint commonly uses `ppt/charts/`; the fixed Artifact Tool runtime currently uses `ppt/slides/charts/`. Either path passes only when the slide relationship type is `relationships/chart`. A vector chart specimen is only a layout guide; it does not satisfy data editability. If the runtime cannot preserve native chart data, do not claim that requirement passed and deliver the interactive HTML chart instead.
- Never draw a page from scratch when a compatible family exists. If no controlled family can express the relationship, stop with `needs-layout-review` rather than improvising a new visual language.
- Run full-size rendering and slide tests. Fix overlap, clipping, arbitrary Chinese wrapping, font fallback and empty placeholders.
- Compare PPTX and HTML facts, entities, numbers, page count and reading sequence. Pixel equality is not required.

The bundled library is a design and component source, not a content deck. Its specimen copy must never survive into a generated report.

## Deterministic P1-08 adapter

`scripts/render-pptx.mjs` is the only supported native PPTX adapter. It consumes the same validated `deck-spec.json` as HTML, builds a per-run `template-frame-map.json`, duplicates the mapped specimen slide, deletes the 25 source specimens, and edits inherited named objects. It never starts from a blank slide.

Run it with the fixed Presentations runtime:

```bash
NODE_PATH="$RUNTIME_NODE_MODULES" "$RUNTIME_NODE" \
  skills/mint-report-deck/scripts/render-pptx.mjs \
  /absolute/path/deck-spec.json \
  /absolute/path/report.pptx
```

The adapter blocks with `needs-layout-review` when a page has no controlled source family or exceeds a recipe capacity. It does not silently substitute a table, screenshot, or unrelated pattern.

Every output directory contains `.pptx-work/template-frame-map.json`, inherited-object layouts, rendered PNG previews, a montage, and an inspect snapshot. `scripts/qa-pptx-editability.mjs` then checks slide XML, editable text/shape counts, specimen-copy leakage, image substitution and native chart parts.

For chart pages, `--expect-native-chart` is mandatory. A visual chart that exports only as shapes does not pass the editable-chart requirement.
