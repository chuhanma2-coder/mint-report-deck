# Content and evidence policy

## Evidence states

- `confirmed`: supported by a supplied source or explicit user confirmation.
- `conflict`: supplied sources disagree; exclude from formal copy until resolved.
- `hypothesis`: interpretation or investigation direction; never present as fact.
- `unknown`: missing definition, denominator, date, owner, or evidence.

Every formal claim and numeric element must have at least one `sourceRef` or an explicit `user-confirmed` reference. Preserve file, page/slide/sheet/cell or paragraph locator, number, unit, currency, time window, denominator, and statistical object.

## Approval modes

- `quick-default`: user accepts the complete proposed outline with `按默认页纲生成`.
- `explicit`: user approves or edits individual outline cards.

Quick approval does not bypass conflict resolution or human approval for finance, compliance, legal, credit, pricing, and customer-impact decisions.

## Language governance

Apply [language-policy.json](language-policy.json). Governed terms are not an absolute blacklist: retain a term when it is in the source or concretely defined. Otherwise replace it with actor, action/change, evidence, implication, and owner or validation method.

Reject unsupported claims, invented metrics, causal certainty from correlation, and language that hides the responsible actor or measurable result.
