# Mint Report Component Library

`Mint_Report_Component_Library.pptx` is the editable native PowerPoint source for Mint Skill V0.2.

- 1 Mint master
- 15 named layouts and specimen slides
- editable text, shapes, tables and charts
- 16:9 Chinese management-report sizing

Generation agents must duplicate the matching recipe slide and replace all specimen content. Do not leave component-library instructions or placeholder text in a formal report.

Rebuild with the Codex Presentations runtime:

```bash
npm run build:presentation-library
```

The build script also writes ignored render evidence under `assets/presentation/qa/` for visual inspection.
