# Priority 2 Track C Guidance Sources

Status: active

Access date: `2026-03-18`

## Current Stack Snapshot

- Local MongoDB driver version: `5.9.2`
- Local webpack version: `5.88.2`
- In-scope warning path: `node_modules/mongodb/lib/utils.js`

## Guidance Sources Consulted

### 1. MongoDB Docs: TanStack Start integration guide

- URL: `https://www.mongodb.com/docs/drivers/node-frameworks/tanstack/`
- Why it matters:
  - This is official MongoDB guidance for a modern bundler integration scenario where the Node.js driver pulls in `mongodb-client-encryption`.
  - The guide explicitly treats `mongodb-client-encryption` as a server-side module that should be excluded from client-oriented optimization and externalized for server-side rendering when bundling would otherwise cause errors.
- Applicability to Track C:
  - This repo is not a TanStack Start or Vite SSR app, so the exact config is not portable.
  - The guidance is still relevant as upstream evidence that excluding or externalizing `mongodb-client-encryption` is a supported strategy when bundlers encounter this optional dependency path.

### 2. MongoDB Docs: Node.js driver upgrade guide

- URL: `https://www.mongodb.com/docs/drivers/node/current/reference/upgrade/`
- Why it matters:
  - The upgrade guide documents major-version breaking changes and version coupling around `mongodb-client-encryption`.
  - It shows that if `mongodb-client-encryption` is installed, its major version must match the driver major version in newer lines, and that driver v6/v7 introduce broader breaking changes.
- Applicability to Track C:
  - This supports the Track C constraint that a MongoDB major-version upgrade is not a low-risk warning-remediation shortcut.
  - It also supports avoiding unnecessary installation of `mongodb-client-encryption` just to remove a warning.

### 3. webpack Docs: IgnorePlugin

- URL: `https://webpack.js.org/plugins/ignore-plugin/`
- Why it matters:
  - webpack documents `IgnorePlugin` as an official way to prevent generation of modules for matching `require` or `import` calls.
  - The docs also explain that matching happens against the request string in source, with either regular-expression or filter-function targeting.
- Applicability to Track C:
  - This is directly applicable to the current webpack-based Netlify function bundling path.
  - It supports evaluating a targeted ignore rule for the literal `require('mongodb-client-encryption')` path in `mongodb/lib/utils.js`.

### 4. webpack Docs: ContextReplacementPlugin

- URL: `https://webpack.js.org/plugins/context-replacement-plugin/`
- Why it matters:
  - webpack documents this plugin as a way to restrict or redirect dynamic context-module resolution.
- Applicability to Track C:
  - This is not the preferred first option.
  - It remains relevant as a narrower plugin-based candidate if the remaining dynamic-require warning turns out to require context scoping rather than simple module ignoring.

### 5. Installed upstream driver source comments

- Source: `node_modules/mongodb/lib/utils.js`
- Why it matters:
  - The installed driver includes upstream comments explaining that the optional encryption `require()` calls are intentionally written in-place because bundlers rewrite them.
- Applicability to Track C:
  - This is not an external doc source, but it is directly relevant upstream implementation context for the warning path we are remediating.
  - It reinforces that Track C should favor bundler-side handling over patching dependency internals.

## Planning Takeaways

1. The strongest current-stack guidance supports handling `mongodb-client-encryption` at the bundler boundary rather than installing it for unused features.
2. A targeted webpack-side exclusion or ignore rule is the lowest-risk first candidate for the `Module not found: Can't resolve 'mongodb-client-encryption'` warning.
3. A MongoDB major-version upgrade remains modernization work, not a Track C warning-remediation tactic.
4. If the dynamic-require warning persists after the optional module path is handled, any further plugin-based suppression must be justified as a bounded webpack tactic, not as silent warning hiding.
