# V0.2 content compilation transaction

## Stable artifacts

- `source-pack.json`: original blocks, hashes, locators, tables, images, warnings and conflicts.
- `content-map.json`: frozen facts/entities plus semantic relationships and page budget.
- `slide-specs/slide-XX.json`: independently valid page specifications.
- `deck-spec.json`: deterministic ordered merge used by HTML and PPTX.
- `presentation-content.json`: native-PPT fill contract, only when Presentations is available.
- `qa-report.json`: content and visual validation outside formal slides.

## Transaction

1. Copy original notes into the source pack without rewriting.
2. Freeze facts, canonical entity names, numeric contracts and relative date strings.
3. Compile one management takeaway and the dominant relationships.
4. Begin with a one-page budget. Add pages only for independent propositions or verified capacity failure.
5. Route relationships to page recipes; never route from note numbering or page position.
6. Generate one page or batches of at most three. Apply syntax-only JSON repair once if parsing fails.
7. Validate evidence, entity preservation, date anchoring, page budget, relationship/component compatibility, chart data, language and capacity.
8. Retry only the failed page, at most twice. Expose `needs-review` outside the deck rather than substituting fabricated content.
9. Merge valid pages by `order`, then render HTML and, when available, native PPTX from the same spec.
10. Compare outputs for facts, entities, numbers, page count and reading order.

The browser never assembles unvalidated model fragments. The deterministic merge step owns ordering, duplicate IDs and serialization.
