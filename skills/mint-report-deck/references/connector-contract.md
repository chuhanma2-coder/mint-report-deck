# Connector contract V0.6

Every visible connector in a V0.6 slide must point to one semantic edge. A connector is information, not decoration.

Each slide declares `connectors[]`:

```json
{
  "id": "C1",
  "relationRef": "SGE-001",
  "connectorType": "arrow",
  "direction": "forward",
  "fromElementId": "step-1",
  "toElementId": "step-2"
}
```

The same slide declares `elementIds[]`. Every visible connector endpoint must be registered there. This prevents a renderer from drawing a line to an inferred or nonexistent object.

## Allowed connector types

- `arrow`: ordered sequence, time, dependency, flow, before-after, or supported causal direction.
- `axis`: an ordered temporal or quantitative axis.
- `branch`: non-directional peers around a shared parent or theme.
- `line`: non-directional membership, comparison, or evidence link.
- `bracket`: groups peers without implying order.
- `none`: records that the relation is intentionally expressed by position only.

## Hard rules

- `parallel` never uses `arrow` and always has `direction=none`.
- `comparison` does not use an arrow unless the semantic edge is explicitly `before-after`.
- `sequence`, `temporal`, `flow`, `before-after` and `dependency` require a directed semantic edge before an arrow is rendered.
- A causal arrow preserves `assertionStatus`. Hypotheses may be labelled as assumptions; they may not look like confirmed facts.
- Every `relationRef`, source element and target element must exist.
- `connectorType` must match the semantic edge's `connectorPolicy`; `connectorPolicy=none` forbids any visible connector.
- A slide with no visible connector still declares `connectors: []`.
- Renderer code may render only declared connectors. It may not add arrows from component type or item order.

Run:

```bash
node scripts/validate-connector-contract.mjs deck-spec.json content-map.json
```
