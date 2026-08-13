# V0.4 content compilation transaction

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
3. Compile atoms, numeric roles, claim graph, materiality and display requirements before writing any page.
4. Compile one management takeaway and the dominant relationships.
5. Normalize the page-count contract first. Exact one-page requests cannot be relaxed; recompose or block. Otherwise begin with a one-page budget and add pages only for independent propositions or verified capacity failure.
6. Give every page a question, answer, one primary visual, no more than two support modules and explicit atom coverage.
7. Route from relationship, numeric role, audience task and materiality; never from note numbering or page position.
8. Generate one page or batches of at most three. Apply syntax-only JSON repair once if parsing fails.
9. Run the strict QA gate for evidence, atom coverage, numeric integrity, entity preservation, date anchoring, page budget, relationship/component compatibility, language, visual salience and capacity.
10. Auto-repair only failed pages, at most twice. If primary information remains invisible or invalid, block formal output.
11. Merge valid pages by `order`, then render HTML and, when available, native PPTX from the same spec.
12. Compare outputs for facts, entities, numbers, formulas, page count and reading order.

The browser never assembles unvalidated model fragments. The deterministic merge step owns ordering, duplicate IDs and serialization.
