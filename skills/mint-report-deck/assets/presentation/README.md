# Mint Report Component Library

`Mint_Report_Component_Library.pptx` is the editable native PowerPoint source for Mint Skill V0.4.

- 1 Mint master
- 25 named layouts and specimen slides, including capability chain, risk spotlight, capital decision, hero metrics, actual-target, threshold, allocation, formula-gap bridge, quantitative comparison and scenario forecast
- editable text and shapes; chart specimens define approved visual placement
- 16:9 Chinese management-report sizing

Generation agents choose a controlled page family, duplicate its closest specimen and replace all specimen content. The specimen defines geometry and allowed modules, not fixed content. Do not leave component-library instructions or placeholder text in a formal report.

For quantitative pages, Presentations must preserve formulas, thresholds, allocation totals, units, periods and conclusions from `deck-spec.json`. Use native editable charts only for complete statistical series. Formula, threshold, allocation and gap pages use editable text and shapes, and must pass numeric-integrity plus salience validation before delivery.

Rebuild with the Codex Presentations runtime:

```bash
npm run build:presentation-library
```

The build script also writes ignored render evidence under `assets/presentation/qa/` for visual inspection.
