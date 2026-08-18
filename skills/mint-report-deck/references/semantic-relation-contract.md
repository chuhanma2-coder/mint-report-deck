# Semantic relation contract V0.6

Use `semantic-graph.json` as the evidence-bearing relationship layer between `content-map.json` and page planning. Do not route a page directly from numbered headings or a legacy relationship label.

## Required files

- Keep the graph embedded at `contentMap.semanticGraph`.
- Write the same object as standalone `semantic-graph.json` when the generation pipeline requests a graph artifact.
- Validate either form with `node scripts/validate-semantic-graph.mjs <file>`.

## Nodes

Every node has a stable `id`, a semantic `kind`, a readable `label` and at least one `sourceRef`. Entity nodes may use the source references of the facts that introduced the entity. Do not create a node only to make a layout look complete.

## Edges

Every edge must name its endpoints, relation, direction, evidence, confidence, ordering basis and connector policy.

- `parallel`: peers with no inherent order. It is never a directed edge and never authorizes an arrow.
- `sequence`: an explicit ordered series. Require an order marker, dependency or handoff.
- `temporal`: earlier/later relation supported by time evidence.
- `flow`: the output of one node feeds the next node.
- `causal`: one condition is asserted to affect another. Label unsupported reasoning as `hypothesis`; do not present it as a confirmed causal fact.
- `comparison`: objects examined on shared dimensions; comparison does not imply direction.
- `before-after`: an explicit change from a prior state to a later state.
- `hierarchy` / `composition`: parent-child or whole-part membership, not a process.
- `evidence`: a fact or numeric claim supports a judgment.
- `dependency`: a prerequisite blocks or enables another item.
- `problem-cause-solution`: a diagnostic chain whose three roles are present in the source.

## Ordering evidence

Use one of:

- `explicit-marker`: source says “首先/随后/最后” or equivalent and the clauses describe actual stages.
- `timestamp`: timestamps or dated milestones establish order.
- `dependency`: the next item cannot start until the previous item completes.
- `input-output-handoff`: one node's output is the next node's input.
- `none`: only for relations without inherent order.

Ordinal enumeration such as “第一点、第二点、第三点” is insufficient by itself. It may only establish source order, not a process edge.

## Migration boundary

Legacy `relationships[]` remain unchanged for compatibility. Migration creates graph nodes from frozen atoms, numeric claims, entities and actions, but leaves `edges` empty unless the source already contains a complete V0.6 graph. Put every unresolved legacy relation in `migrationWarnings`. P0-02 recompiles those relations from the original Chinese evidence.

## Failure policy

- Missing endpoint, evidence or ordering basis blocks the graph.
- A parallel relation with `direction=directed` or `connectorPolicy=arrow` blocks the graph.
- An arrow on any non-directed edge blocks the graph.
- A confirmed causal edge without evidence blocks the graph.
- Never fall back from an invalid relation to a process, table or card grid.
