# V0.5 content compilation transaction

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
3. Compile clauses with explicit/inherited subject, predicate, polarity, modality and rhetorical relation; then compile atoms, numeric roles, claim graph, materiality and display requirements.
4. Freeze one narrative commitment and build a title-only ghost deck. Run critic and judge checks before selecting layouts.
5. Normalize the page-count contract first. Exact one-page requests cannot be relaxed; recompose or block. Otherwise begin with a one-page budget and add pages only for independent propositions or verified capacity failure confirmed by the removal test.
6. Give every page a question, answer, exact visible claims, one visual brief, one primary visual, no more than two support modules and explicit atom coverage.
7. Route from relationship, numeric role, audience task and materiality; never from note numbering or page position.
8. Generate one page or batches of at most three. Apply syntax-only JSON repair once if parsing fails.
9. Run the strict pre-render QA gate for Chinese compilation, narrative commitment, ghost-deck flow, evidence, atom coverage, numeric integrity, component field contracts, entity preservation, date anchoring, page budget, relationship compatibility, language, visual salience and capacity.
10. Auto-repair only failed pages, at most twice. If primary information remains invisible or invalid, block formal output.
11. Merge valid pages by `order`, then render HTML and, when available, native PPTX from the same spec.
12. Run rendered-contract QA: compare actual visible claims, primary visual population, facts, entities, numbers, formulas, page count and reading order. Then inspect screenshots at required viewports.

The browser never assembles unvalidated model fragments. The deterministic merge step owns ordering, duplicate IDs and serialization.
