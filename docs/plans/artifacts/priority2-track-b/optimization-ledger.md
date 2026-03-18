# Priority 2 Track B Optimization Ledger

| Iteration | Candidate | Change Surface | Before | After | Warning Diff | Parity | Decision | Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I01 | B-CFG-01 | `webpack.netlify.functions.js` mode default + hints cleanup | ~2.94 MiB/function | ~1010 KiB/function | MongoDB warning signatures unchanged | build succeeded | ACCEPT | Material size reduction with no observed build breakage. |
| I02 | B-DEP-01 | `src/lib/env.ts` dotenv gated in production | ~1010 KiB/function | ~1010 KiB/function | unchanged | build succeeded | ACCEPT | Low-risk dependency footprint alignment; no regression observed. |
| I03 | B-PKG-01 | `webpack.netlify.functions.js` terser comment extraction disabled | ~1010 KiB/function + license assets | ~1010 KiB/function and reduced extra emitted comment artifacts | unchanged | build succeeded | ACCEPT | Packaging/output hygiene improved with no behavior drift signal. |
| I04 | B-STR-01 | structural split candidate | n/a | n/a | n/a | n/a | REVERT/DEFER | Deferred by good-enough gate; risk class high with insufficient incremental benefit evidence. |
