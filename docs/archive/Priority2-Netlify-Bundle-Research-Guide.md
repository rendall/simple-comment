# Priority 2 — Netlify Bundle Size Research Guide (External)

Status: active reference for Priority 2 execution support

Archival note: This document is intended for Priority 2 implementation support and should be moved under `docs/archive/` with other Priority 2 artifacts once Priority 2 is complete.

## Verdict

No single official guide; here are best practices.

Netlify appears to document the pieces, not a single “reduce function bundle size” guide. The closest official material is spread across Functions configuration, deployment docs, framework-specific troubleshooting, and runtime limits.

Netlify docs explicitly indicate:

- esbuild can produce “smaller artifacts”
- `included_files` / `external_node_modules` are available controls
- each function has a 250 MB unzipped bundle limit
- build logs can list largest files when a function is too large

## What Netlify says

1. **Bundle size can matter because there is a hard deploy limit.**  
   Netlify documents that each unzipped function bundle is limited to 250 MB in size during deployment. The same troubleshooting guidance says the cause is often large dependencies or many pre-rendered pages, and that largest-file build logs help identify causes.

2. **esbuild is the preferred bundler when size matters.**  
   Netlify `netlify.toml` docs state `node_bundler = "esbuild"` results in shorter bundling times and smaller artifacts. TypeScript functions use esbuild.

3. **Only include extra files intentionally.**  
   Netlify documents `included_files` for non-statically referenced assets, and warns against including unnecessary large files (images/videos/etc.) because handler bundle size can grow quickly.

4. **You can exclude files with negated globs.**  
   Netlify configuration docs support `!`-prefixed `included_files` entries for exclusion, with framework troubleshooting examples.

5. **`external_node_modules` is a compatibility escape hatch, not general slimming.**  
   Netlify describes it as copying modules into artifacts without inlining, mainly for dependencies that cannot be inlined (for example, native add-ons).

6. **If default bundling is insufficient, you can take over build packaging.**  
   Netlify deploy docs permit custom bundling (Webpack/Rollup/etc.) and deployment of prebuilt ZIPs without modification.

7. **Runtime limits are mostly separate from bundle size, but still operationally relevant.**  
   Functions runtime limits (memory/execution/request-response bounds) are distinct from package-size limits but influence dependency choices.

8. **Framework adapters expose size-related controls.**  
   Examples include SvelteKit split-functions behavior and Gatsby datastore bundling controls with explicit performance tradeoffs.

## Bundle reduction playbook

(Assembled from Netlify docs plus clearly labeled interpretation.)

### Highest impact, lowest risk

1. Start with build logs and largest-file diagnostics.
2. Use esbuild for JS functions unless a compatibility reason prevents it.
3. Remove or replace oversized dependencies.
4. Narrow `included_files` to only runtime-required content.
5. Use negated glob exclusions for dead weight.

### Medium impact, moderate risk

6. Split large multi-purpose functions into smaller functions where feasible.
7. Avoid bundling local repository content unless strictly required.
8. Apply framework-specific size controls before broader rewrites.

### Higher effort / specialized

9. Use `external_node_modules` only for compatibility constraints.
10. Replace Netlify default packaging with custom bundling or prebuilt ZIPs when necessary.

## When optimization is worth it vs not worth it

### Worth it

- You are hitting or approaching the 250 MB unzipped per-function deploy limit.
- Build logs show one or two large dependencies dominate size.
- Framework-generated functions are failing deploy packaging.
- You can switch JS functions to esbuild for smaller/faster bundles.

### Usually not worth obsessive effort

- Functions deploy comfortably below limits.
- Optimizations mainly add complexity with little operational gain.
- Bottleneck is runtime behavior/latency rather than package size.

Interpretation: reducing bundle size is most important when it prevents deploy failures, reduces packaging overhead, or keeps framework output manageable. It is less important as a vanity metric once bundles are comfortably within limits and operationally healthy.

## Project-agnostic checklist

1. Confirm there is an actual size problem via build logs.
2. Ensure JS functions use `node_bundler = "esbuild"` unless compatibility blocks it.
3. Audit largest dependencies first.
4. Replace broad `included_files` globs with minimal patterns.
5. Add `!` exclusions for accidentally bundled large paths.
6. Move large local assets/data out of function bundles when feasible.
7. Split oversized functions where supported.
8. Check framework-specific adapter controls first.
9. Use `external_node_modules` for compatibility-only cases.
10. If necessary, use a custom bundling pipeline or prebuilt ZIP deploys.

## Sources

### Official Netlify

- Functions overview (runtime defaults and limits)
- File-based configuration (`node_bundler`, `external_node_modules`, `included_files`)
- Deploy functions (custom bundling and prebuilt ZIP deployment)
- Next.js troubleshooting on Netlify (250 MB limit, largest-files logs, dependency guidance)
- SvelteKit on Netlify (split functions)
- Gatsby on Netlify (datastore bundling opt-out and tradeoff)
- Lambda compatibility / underlying function bundling behavior

### Secondary / supporting

- `netlify/zip-it-and-ship-it` repository for deeper bundler mechanics
