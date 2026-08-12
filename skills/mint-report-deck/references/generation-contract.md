# V1.1 generation contract

## Stable artifacts

- `source-pack.json`: extracted source blocks, file hashes, locators, tables, images, warnings, and conflicts.
- `deck-brief.json`: audience, decision, central takeaway, evidence states, outline cards, and approval.
- `slide-specs/slide-XX.json`: one independently valid page specification.
- `deck-spec.json`: deterministic ordered merge of approved slides.
- `studio-project.json`: deck plus editor state and source index.

## Generation transaction

1. Freeze the approved outline.
2. Generate one slide or a batch of at most three.
3. Parse JSON; if parsing fails, apply syntax-only repair once.
4. Validate schema, evidence status, relationship/component compatibility, chart data, language policy, and capacity.
5. Retry only the failed slide, with the validation errors and original outline card.
6. Stop after two failed retries and expose the page as `needs-review`; do not silently substitute content.
7. Merge only valid confirmed slides by `order`.
8. Run whole-deck consistency and visual QA.

Never let browser JavaScript assemble unvalidated model fragments. The deterministic merge step owns ordering, duplicate IDs, and final serialization.
