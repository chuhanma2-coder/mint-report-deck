# Chinese content compiler V0.6

Use this contract before page selection. It adapts the global commitment and critic/judge loop from ArcDeck, staged checkpoints from Paper2Slides, source-indexed outlining and rendered reflection from PPTAgent, ghost-deck/action-title QA from Knowledge Cat, and takeaway-first/orthogonal page fields from banana-slides. It does not copy their templates or code.

## 0. Five checkpoints, never one-shot generation

Write and validate these artifacts in order:

1. `source-pack.json`: immutable original spans and locators.
2. `content-map.json`: clauses, entities, numbers, facts and boundaries.
3. `semantic-graph.json`: evidence-bearing relation nodes and edges compiled from discourse units.
4. `narrativeCommitment`: audience shift, thesis, decision, must-show evidence, must-not-infer boundaries and narrative spine.
5. `ghostDeck`: action titles, page roles, evidence and transitions without layout.
6. `deck-spec.json`: visible copy, visual intent, speaker notes and a controlled component contract.

Do not skip directly from notes to `deck-spec.json`. Store each checkpoint so a later visual revision never forces re-interpretation of the source.

## 1. Compile clauses, not paragraphs

Split Chinese source text at semantic boundaries such as `。` `；` `：` and at relation markers such as `但` `因此` `同时` `其中` `前提是` `下一步`. Preserve the original span and `sourceRef` for every unit.

For each `discourseUnit`, record:

- `text`: the unchanged source clause; `sourceRef` points to its original location.
- `subject`: the explicit entity or topic. Resolve an omitted subject only from the nearest unambiguous unit in the same section.
- `subjectResolution`: `explicit`, `inherited` or `unknown`; inherited subjects require `inheritedFrom`, unknown subjects create an `unknowns` item and cannot support a formal primary judgment.
- `predicate`: the state, change, judgment or action.
- `object`: the affected object when present.
- `polarity`: `affirmative` or `negative`.
- `modality`: `confirmed`, `plan`, `proposal`, `hypothesis` or `unknown`. Words such as “拟、计划、预计、可能、建议、探索” never compile as confirmed facts.
- `role`: `context`, `claim`, `evidence`, `contrast`, `condition`, `cause`, `effect`, `action` or `boundary`.
- `relationToPrevious`: `starts`, `elaborates`, `supports`, `contrasts`, `causes`, `conditions`, `results-in`, `sequences` or `concludes`.
- `entityRefs`, `numericClaimRefs` and `sourceRef`.

Do not infer a subject across section boundaries. Do not merge two legal entities because their names are similar. Keep a number attached to its subject, denominator, period and comparison role. A colon opens a scope; the clauses that follow inherit its subject only until the next explicit subject or section boundary. A numbered list is `parallel` unless the text contains real sequence/dependency markers.

After discourse units are frozen, compile and validate their relations deterministically:

```bash
node scripts/compile-semantic-graph.mjs content-map.json semantic-graph.json content-map-v06.json
node scripts/validate-semantic-graph.mjs semantic-graph.json
```

The compiler may connect only adjacent units in the same section unless the source explicitly supplies a relation hint. It must output `evidenceRefs`, confidence, order basis and connector policy for every edge. When a relation is uncertain, leave the units unconnected or set `needsReview`; never guess an arrow.

### Chinese relation markers

- `但、然而、相比之下` → contrast, not a new page by default.
- `因为、由于` → cause or evidence; `因此、所以` → effect or conclusion.
- `前提是、仅当、需先` → condition/dependency.
- `同时、分别、其中` → parallel/elaboration, not process.
- `随后、完成后、再、最终` → sequence only when actions truly depend on order.
- `下一步、需、应` → action; preserve Owner/time only when supplied.

Distinguish enumeration from progression:

- `第一点、第二点、第三点` and `一是、二是、三是` default to `parallel`.
- `首先、其次、最后` authorize `sequence` only when both clauses describe actions or stages.
- A non-action list using sequence-like words remains parallel and is marked for review.
- `过去/原来/V1` followed by `现在/本轮/V2` becomes `before-after`, not a generic process.
- `因此/所以` may create a causal edge only with the source clauses attached; uncertain modality becomes `hypothesis`.
- An unknown subject or a cross-section subject jump creates no automatic relation.

Preserve negation and scope. “尚未获得批准” must never become “获得批准”; “不超过25%” is an upper bound, not a target.

## 2. Freeze a narrative commitment

Before arranging pages, write one `narrativeCommitment`:

- `audienceShift`: what the audience should understand or do differently.
- `coreThesis`: the one-sentence answer of the whole report.
- `decision`: the decision or action the report should enable.
- `mustShowAtomRefs`: primary information that must be visible.
- `mustNotInfer`: facts or conclusions that the source does not authorize.
- `narrativeSpine`: 2–7 ordered rhetorical beats such as `context → evidence → implication → decision`.
- `deEmphasizeAtomRefs`: valid detail that should not control the main story.
- `pageBudgetPriority`: `exact`, `minimum-needed` or `evidence-first`.

The commitment is the contract used by the planner and critic. A page that does not advance it is removed, merged or moved to an appendix.

## 3. Build the ghost deck before layouts

Create `ghostDeck[]`. Reading only the action titles and transitions must tell a coherent story.

Every page records:

- `pageId`, `actionTitle`, `pageRole`, `managementQuestion`, `answer`;
- `atomRefs`, `evidenceRefs` and `relationshipRefs`;
- `transitionFromPrevious`;
- `pageNecessity.type`: `opening`, `independent-decision`, `capacity`, or `section-intro`;
- `pageNecessity.reason` and `removalTest`.

`removalTest` answers three questions: would removal lose a primary fact, break the decision chain, or exceed verified capacity on another page? After the first page, at least one must be true. Otherwise merge or remove the page.

An action title is not a topic label or a promise to reveal a conclusion. It states `subject + material change/judgment + implication/action`, renders in no more than two lines, and normally contains no more than 36 Chinese-character widths. “投资价值分析” and “测算结果显示何时切换” both fail because neither states the actual answer.

Do not create a page merely because the input has a heading, number, paragraph, country or bullet group. A second page needs an independent management question or a verified capacity reason.

## 4. Run a narrative critic before rendering

Check in order:

1. **Meaning:** Are subjects, predicates, quantities and boundaries preserved?
2. **Commitment:** Does every page advance the audience shift, core thesis or decision?
3. **Coverage:** Is every primary atom assigned exactly once and visibly?
4. **Sequence:** Does each page answer a question raised by the prior page or prepare the decision?
5. **Focus:** Does every page have one answer, one primary relationship and at most two support modules?
6. **Necessity:** Can any page be removed without breaking the decision? If yes, merge or remove it.
7. **Ghost deck:** Read titles only. Do they form a complete beginning–middle–decision argument without body text?

Revise the content plan before changing layout. Run at most two critic rounds. If meaning, coverage or page necessity still fails, block formal delivery.

## 5. Compile pages only after the ghost deck passes

Map the dominant relationship to a controlled component. Keep `ghostDeck.actionTitle`, `managementQuestion`, `answer`, `atomRefs` and `evidenceRefs` unchanged in `deck-spec.json`. Layout may compress wording, but it cannot change the proposition or evidence boundary.

Separate three orthogonal fields:

- `visibleClaims[]`: exact text that must appear on screen, each bound to `atomRefs`.
- `visualBrief`: relationship, focal point and reading direction; never render this text as body copy.
- `speakerNotes[]`: useful spoken detail; never count it as visible evidence.

Do not repeat the same sentence across these fields. Design instructions belong only in `visualBrief`; unknowns and QA notes belong outside the formal slide.

After rendering, compare the actual page with the ghost deck. A valid JSON plan is not enough: empty primary visuals, missing action titles, unrendered `visibleClaims`, unrendered entities or a page with no visible evidence block formal delivery. Inspect the rendered image, not only the source DOM.
