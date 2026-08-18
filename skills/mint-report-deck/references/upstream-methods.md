# Upstream methods adopted in V0.5

This file records the reusable mechanisms adopted from public projects. It is maintenance evidence, not a runtime prompt and not permission to copy their visual style.

## ArcDeck

Source: <https://github.com/RehgLab/ArcDeck>

Adopted:

- Freeze a deck-level commitment before page design: audience shift, thesis, must-show evidence, forbidden inference, narrative spine and page budget.
- Parse source paragraphs into explicit discourse roles and relations before summarization.
- Judge the narrative separately from layout, then revise at most twice before blocking.

Mint adaptation:

- `narrativeCommitment` is the global contract.
- `discourseUnits` preserve Chinese subject, predicate, polarity, modality, relation and source location.
- `ghostDeck` must form an evidence-to-decision chain before component selection.

## Paper2Slides

Source: <https://github.com/HKUDS/Paper2Slides>

Adopted:

- Separate analysis, planning and creation into explicit checkpoints.
- Preserve exact numbers, formulas, tables and source assets during planning.

Not adopted:

- Academic slide-density defaults. Mint uses management-reading capacity and the minimum necessary page count instead.

## PPTAgent

Source: <https://github.com/icip-cas/PPTAgent>

Adopted:

- Use a typed, source-indexed outline rather than free-form page prose.
- Select layouts from actual content-element count, text length and asset fit.
- Inspect rendered slides, not only the source structure, and repair content/layout drift.

Mint adaptation:

- `visibleClaims` binds important atoms to text that must actually appear after rendering.
- `visualBrief` records relationship, focal point and reading direction without leaking design instructions into visible copy.
- Renderer and browser QA are separate gates.

## Knowledge Cat PPT Skill

Source: <https://github.com/gnipbao/knowledge-cat-ppt-skill>

Adopted:

- Action titles should communicate the complete story when read alone.
- Page roles, evidence mapping and post-render QA are first-class contracts.

Mint adaptation:

- The Ghost Deck test checks title sequence before page production.
- Each page retains `pageQuestion`, `pageAnswer`, `atomRefs`, `evidenceRefs` and a removal test.

## banana-slides

Source: <https://github.com/Anionex/banana-slides>

Adopted:

- The first outline point is a takeaway, not a topic label.
- Keep visible page text, asset instructions, layout emphasis and speaker notes as separate fields.
- Test missing/empty description fields so a planning omission cannot silently create a blank page.

Mint adaptation:

- `visibleClaims[]`, `visualBrief` and `speakerNotes[]` are orthogonal page fields.
- Controlled component contracts reject unknown aliases and incomplete primary visuals.

## Resulting Mint pipeline

```text
source-pack
  -> Chinese discourse compilation
  -> narrative commitment
  -> ghost deck
  -> typed page contract
  -> controlled component composition
  -> structured QA
  -> HTML/PPTX rendering
  -> rendered-content and visual QA
```

The critical design choice is that every checkpoint produces a testable artifact. A polished page cannot compensate for a bad content model, and a valid JSON file cannot compensate for missing visible content.
