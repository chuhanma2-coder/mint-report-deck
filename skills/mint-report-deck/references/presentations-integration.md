# Presentations integration

## Preflight

1. Check that a skill named `Presentations` is available in the current Codex environment.
2. When available, read and obey that skill in the same task. Mint owns facts, page budget, narrative, component routing and `deck-spec`; Presentations owns native PPTX editing, rendering and visual QA.
3. When unavailable, do not use another PPTX library. Deliver `content-map.json`, `deck-spec.json` and HTML, and state that PPTX remains pending.

## Shared inputs

Create `presentation-content.json` from the validated deck spec:

```json
{
  "schemaVersion": "0.2",
  "template": "assets/presentation/Mint_Report_Component_Library.pptx",
  "deckId": "project-slug",
  "slides": [{"order":1,"recipe":"architecture-brief","titleLines":[],"content":{},"sourceRefs":[]}]
}
```

## Native PPTX rules

- Use `Mint_Report_Component_Library.pptx` as the source deck and duplicate the matching recipe slide.
- Replace inherited placeholder text and data; preserve the Mint master/layout/slide relationship.
- Keep text boxes, simple diagrams, tables and charts editable.
- For a quantitative page, verify the exported PPTX package contains a native chart part (`ppt/charts/`) or otherwise prove that its data table opens and can be edited. A vector chart specimen is only a layout guide; it does not satisfy data editability. If the runtime cannot preserve native chart data, do not claim that requirement passed and deliver the interactive HTML chart instead.
- Never draw a page from scratch when a matching component slide exists.
- Run full-size rendering and slide tests. Fix overlap, clipping, arbitrary Chinese wrapping, font fallback and empty placeholders.
- Compare PPTX and HTML facts, entities, numbers, page count and reading sequence. Pixel equality is not required.

The bundled library is a design and component source, not a content deck. Its specimen copy must never survive into a generated report.
