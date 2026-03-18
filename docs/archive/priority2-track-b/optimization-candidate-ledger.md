# Priority 2 Track B Optimization Candidate Ledger

Status: archived

| Candidate | Hypothesis | Risk | Expected Size Impact | Parity Validation Mapping | Revert Trigger |
| --- | --- | --- | --- | --- | --- |
| B-CFG-01 Force production bundling defaults | Default `development` mode is inflating bundle size due non-minified output; forcing production should materially shrink each function artifact. | LOW | High (>=50% shrink expected from minification/tree-shaking) | `yarn run build:netlify` + backend/frontend smoke checks from plan validation set | Any build/runtime failure or API behavior drift post-change |
| B-DEP-01 Narrow optional dependency resolution noise | Reduce packaging/graph overhead by tightening optional dependency handling around MongoDB warning path where safe. | MEDIUM | Low/Medium | `yarn run build:netlify` warning signature diff + smoke checks | New runtime import failures or behavior drift |
| B-PKG-01 Tighten packaging/perf hint outputs | Reduce non-actionable output noise and packaging ambiguity so size-change evidence is clearer. | LOW | Low | Build log diff + no behavior drift in smoke checks | Loss of required bundle diagnostics |
| B-STR-01 Targeted handler scope split | If still materially oversized, split one high-cost handler path for smaller per-entry artifact. | HIGH | Medium | Build parity + function behavior smoke checks | Any contract/behavior change or irreversible complexity increase |
