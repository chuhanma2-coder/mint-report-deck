# Chinese writing and layout contract

This contract applies before component selection and again before rendering. A slide that fails it is `needs-review`; visual rendering must not hide or repair the content problem.

## 1. Each page has one reading proposition

- The title states the page conclusion or the single question being answered. Do not use an isolated field value such as “空值”, “日期”, “客户”, or “渠道” as a page title.
- A content page has one primary reading direction: top-to-bottom, left-to-right, centre-outward, or chronological. The layout must make that direction visible.
- Every label belongs to an explicit role: stage, action, evidence, result, owner, risk, or annotation. Unlabelled noun fragments are prohibited.
- If a relationship graphic cannot be explained in one sentence, first rewrite the page answer and identify the dominant relationship. Under an exact one-page contract, recompose or block; split only when the page contract permits it.

## 2. Chinese title rules

- Every page, including cover and section pages, uses one idea and no more than two rendered title lines. This is a hard delivery gate, not a preference.
- Prefer a semantic line break after `，` `；` `：` or between premise and conclusion. Never allow the browser to produce a one-character orphan line.
- The first line establishes subject or premise; the second line states action, implication, or conclusion.
- Hard title capacity: no more than 22 Chinese-character widths per semantic line and no more than 36 in total. Latin letters and digits count by visual width. If it is longer, rewrite the proposition first; never shrink the title merely to pass.
- Use `word-break: keep-all`, explicit `<br>` at the approved semantic boundary, and balanced line wrapping. Font-size reduction is the last resort.
- Apply the detailed static and rendered requirements in `cjk-typography-contract.md`. Percentages, amounts, numbers with units, acronyms and mixed Latin product names are indivisible reading tokens.

## 3. Node and body capacity

- Diagram node title: normally 2-8 Chinese characters.
- Diagram node explanation: one sentence, normally 12-28 Chinese characters.
- Do not place more than two semantic levels inside one node.
- Process pages: 3-6 steps. More than six steps require grouping or a continuation page.
- Architecture pages: 3-5 layers. Every layer must use the same fields and column order.
- Comparison pages: 2-5 comparison objects; use a table when exact wording or values matter.
- Bullets: 1-3 for speaker-led pages; 4-8 only for reading-first pages with adequate space.

## 4. Architecture and relationship pages

- State the reading direction in the structure, not as scattered text.
- Architecture rows use the same contract: `layer -> responsibility -> processing -> output`.
- Process nodes use the same contract: `step -> action -> result`.
- Cause diagrams distinguish evidence, hypothesis, cause, effect, and validation method.
- Roles diagrams place actors on one axis and responsibilities or stages on the other.
- Do not mix architecture, process, KPI, and decision semantics inside one graphic.

## 5. Text integrity and editing

- Every deck declares a stable `mint-deck-id` and a versioned `mint-deck-version`.
- Browser edits are stored under that deck-and-version namespace. Never reuse a global edit key across templates or versions.
- A template structure change must increment the deck version so positional edit IDs cannot overwrite unrelated content.
- Visible chart text and underlying chart data must remain consistent; data edits require structured fields, not DOM-only changes.
- Formal pages never show authoring instructions, component names, template diagnostics, or validation warnings.

## 6. Required QA

- Inspect every page as an image, not only with DOM `scrollHeight` checks.
- Verify 1920x1080 and 1280x720 rendering plus one phone viewport using uniform stage scaling.
- Measure the rendered title in a real browser at every required viewport. More than two visible lines blocks delivery even when `titleLines` contains only one or two strings.
- Check semantic title breaks, orphan characters, overflow, empty primary visuals, panel overlap, font fallback, repeated layouts, and minimum readable body size.
- Seed the legacy localStorage key during automated tests and confirm that it cannot alter the current deck.
