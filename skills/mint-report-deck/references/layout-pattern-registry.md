# Layout Pattern Registry V0.6

A Pattern is a semantic layout grammar, not a finished template page. Eligibility is determined before visual scoring.

Every entry in `assets/layout-patterns.json` declares:

- supported page roles and semantic relation types;
- minimum and maximum node count;
- accepted data shapes and density profiles;
- reading axes and required/optional zones;
- allowed connector policies;
- HTML and editable PPTX renderer keys.

## Non-negotiable rules

- No generic fallback page exists. If no Pattern is compatible, return `needs-layout-review`.
- Parallel content never selects a Pattern that requires arrows.
- `card-matrix` is limited to 2–4 genuinely independent parallel items. It is not the default page.
- A Pattern example is not tied to a page number. Whole-deck planning and the page contract are upstream.
- The renderer may vary spacing and module proportions within the Pattern constraints; it may not change the semantic relation or reading axis.

Run:

```bash
node scripts/validate-pattern-registry.mjs assets/layout-patterns.json
```
