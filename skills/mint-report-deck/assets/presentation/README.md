# Mint Report Component Library

`Mint_Report_Component_Library.pptx` is the editable native PowerPoint source for Mint Skill V0.2.

- 1 Mint master
- 15 named layouts and specimen slides
- editable text and shapes; chart specimens define approved visual placement
- 16:9 Chinese management-report sizing

Generation agents must duplicate the matching recipe slide and replace all specimen content. Do not leave component-library instructions or placeholder text in a formal report.

For quantitative pages, Presentations must create and verify a native editable chart in the generated report. The specimen chart in this component library is not evidence that the exported PowerPoint data table is editable.

Rebuild with the Codex Presentations runtime:

```bash
npm run build:presentation-library
```

The build script also writes ignored render evidence under `assets/presentation/qa/` for visual inspection.
