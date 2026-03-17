# Priority 2 PR A Warning Register

Source logs:
- `docs/archive/priority2-pr-a/artifacts/build-backend.log`
- `docs/archive/priority2-pr-a/artifacts/build-frontend.log`

## Unique Warning Signatures (Structured)

| ID | Tool / Stage | Warning Signature | Source Module / Path | Frequency Pattern | Risk Category | Disposition | Rationale | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W001 | Webpack / backend bundle | `Critical dependency: the request of a dependency is an expression` | `node_modules/mongodb/lib/utils.js` | Once per backend build | Deploy risk / signal noise | `MITIGATE` | Investigate bundler-compatible handling of dynamic optional dependency resolution to reduce ambiguous warnings without behavior change. | backend-data-access-system |
| W002 | Webpack / backend bundle | `Module not found: Error: Can't resolve 'mongodb-client-encryption'` | `node_modules/mongodb/lib/utils.js` | Once per backend build | Deploy risk / dependency behavior | `MITIGATE` | Determine whether optional encryption dependency can be externalized or explicitly configured to avoid non-actionable warning noise. | backend-data-access-system |
| W003 | Vite / frontend build setup | `The CJS build of Vite's Node API is deprecated.` | Vite Node API bootstrap | Once per frontend build | Ecosystem deprecation | `DEFER-UPSTREAM` | Upstream ecosystem migration path likely tied to tooling/runtime format expectations; track and revisit during planned dependency modernization work. | frontend-build-system |
| W004 | vite-plugin-svelte / frontend transform | `[vite-plugin-svelte] WARNING: ... no exports condition for svelte` | `carbon-icons-svelte` package metadata | Once per frontend build | Ecosystem/dependency warning | `TOLERATE` | Warning currently reflects third-party package export metadata; acceptable short-term while monitoring upstream package changes. | frontend-build-system |
| W005 | Vite / frontend asset resolution | `/css/simple-comment-style.css doesn't exist at build time, it will remain unchanged to be resolved at runtime` | CSS runtime path resolution | Once per frontend build | Build output clarity | `MITIGATE` | Evaluate whether asset path can be made build-time explicit or documented as intentional runtime resolution behavior. | frontend-build-system |
