**Short verdict:** No single official guide; here are current-stack best practices.

## What MongoDB says for driver 5.x

For the MongoDB Node.js driver **5.9.2**, `mongodb-client-encryption` is **not a regular required dependency**. In the driver’s own package manifest, it is listed under `peerDependencies` with the range `>=2.3.0 <3`, and marked optional in `peerDependenciesMeta`. The same manifest also treats other feature packages like `kerberos`, `snappy`, and `@mongodb-js/zstd` as optional peers. That means driver 5.x is designed to work without `mongodb-client-encryption` unless you are actually using encryption features. ([GitHub][1])

MongoDB’s driver docs also describe `mongodb-client-encryption` as one of several **optional driver extensions**, specifically for “field level and queryable encryption.” Their docs do not present it as something every driver user should install by default. ([GitHub][2])

MongoDB’s encryption docs make the intent even clearer: in-use encryption is for applications that need to encrypt specific document fields before sending them to MongoDB, using features like CSFLE or Queryable Encryption. In other words, the encryption package exists to enable those features, not to satisfy normal CRUD usage. ([MongoDB][3])

MongoDB’s current upgrade docs add a newer-stack rule that is **not directly current-stack guidance** for you: in driver 6.x, if you add `mongodb-client-encryption`, its major version must match the driver’s major version, and automatic-encryption APIs moved into the main driver package. That is useful for modernization planning, but it is not a reason by itself to change a 5.9.x stack just to quiet warnings. ([MongoDB][4])

### Short MongoDB quotes

* Driver 5.9.2: `mongodb-client-encryption` is an optional peer dependency. ([GitHub][1])
* Driver extensions: “field level and queryable encryption.” ([GitHub][2])
* Encryption docs: use the driver to “encrypt specific document fields.” ([MongoDB][3])

## What webpack 5 says

Webpack’s docs explicitly say that when `require()` cannot be statically analyzed, it emits a **critical dependency warning**. Their example includes `require(variable)`. That directly matches the warning shape `Critical dependency: the request of a dependency is an expression`. ([webpack][5])

Webpack also explains why this happens: dynamic expressions in `require()` or `import()` create a **context**, because the exact module is not known at compile time. That is webpack behavior, not necessarily evidence that your app will fail at runtime. ([webpack][6])

Webpack officially supports several ways to deal with this class of issue:

* `IgnorePlugin`, which “prevents the generation of modules” for matching imports or requires. ([webpack][7])
* `externals`, which exclude dependencies from the bundle and expect them to be present at runtime. ([webpack][8])
* `ContextReplacementPlugin`, which can narrow or replace the inferred context for dynamic requires when you need a more targeted correction. ([webpack][9])

Webpack also documents parser options around dynamic dependencies, but those are lower-level controls. They are real tools, but they are not the first thing I would reach for for MongoDB 5.x optional-driver-extension warnings in a server bundle. ([webpack][10])

### Short webpack quotes

* “critical dependencies warning is emitted” for unanalyzable `require`. ([webpack][5])
* `IgnorePlugin` “prevents the generation of modules.” ([webpack][7])
* `externals` exclude dependencies from output bundles. ([webpack][8])

## What Netlify says, if relevant

Netlify says you can use a **custom build** to bundle functions with tools like webpack, and if you want to bypass Netlify’s own preparation entirely, your build must produce deployable artifacts that Netlify will ship “without modification.” ([Netlify Docs][11])

Netlify also documents that, when using **Netlify’s own esbuild-based function bundling**, `external_node_modules` is for packages that should remain external, especially dependencies “that can’t be inlined, such as modules with native add-ons.” That is relevant if you let Netlify bundle functions, but it is **not** the main lever for a webpack-built backend bundle unless Netlify is still doing a second bundling/preparation pass over your function source. ([Netlify Docs][12])

So Netlify materially affects the recommendation in one way: if your deployment pipeline is **bring-your-own webpack bundle**, prefer solving MongoDB warning noise in the webpack layer first. If instead Netlify is still bundling raw function sources, then Netlify’s `external_node_modules` and related settings become relevant. ([Netlify Docs][11])

### Short Netlify quotes

* Custom build can “Bundle your functions with tools” like webpack. ([Netlify Docs][11])
* `external_node_modules` helps with modules “that can’t be inlined.” ([Netlify Docs][12])

## What this implies for the current stack

For **MongoDB driver 5.9.x + webpack 5 + Node backend bundle**, the `Can't resolve 'mongodb-client-encryption'` warning is usually telling you that webpack walked into an **optional MongoDB feature path** and tried to resolve it as if it were mandatory. Based on MongoDB’s own dependency metadata, that package is optional on 5.9.x unless you actually use field-level or queryable encryption. ([GitHub][1])

So, for the current stack:

**Supported and high-confidence**

* Treat `mongodb-client-encryption` as **unnecessary unless you use CSFLE / Queryable Encryption**. ([MongoDB][3])
* Use **webpack-side handling** to stop bundling noise for an optional feature you do not use, usually via targeted `IgnorePlugin`, or by externalizing only if runtime packaging guarantees the dependency story you want. ([webpack][7])
* Accept that the critical dependency warning comes from webpack’s static-analysis limits around dynamic `require()`. ([webpack][5])

**Supported but conditional**

* Install `mongodb-client-encryption` **only if** your backend actually uses MongoDB in-use encryption features. For driver 5.x, the compatible/stable line is the 2.x series, with the component matrix showing `mongodb@5.x` paired with `mongodb-client-encryption ^2.3.0`. ([GitHub][2])
* Use webpack `externals` **only if** you intentionally want the module left unresolved in the bundle and available at runtime from deployed `node_modules` or equivalent packaging. ([webpack][8])

**Discouraged for this goal**

* Installing `mongodb-client-encryption` **just to silence warnings** on a non-encryption backend. MongoDB’s own docs treat it as optional and feature-specific, and it may introduce native-addon installation complexity for no runtime benefit. ([GitHub][1])
* Treating a MongoDB major upgrade as ordinary warning remediation. MongoDB 6.x+ changes are real, but they belong in modernization work, not in a narrow “clean up webpack warnings” task. ([MongoDB][4])

**Unclear / incomplete in official docs**

* MongoDB does not appear to publish a dedicated official guide specifically for **webpack bundling warnings caused by optional driver extensions** on driver 5.x. The official docs tell you what the dependency is for and how webpack warnings work, but not a MongoDB-authored bundler recipe for this exact warning pair. That is why the best answer here is an assembled best-practices guide rather than “follow MongoDB’s official webpack warning guide.” This is an interpretation based on the absence of such a guide in the official material found. ([GitHub][2])

## Current-stack remediation playbook

### 1. First choice: explicitly ignore the optional encryption package in webpack if you do not use encryption

This is the cleanest current-stack move for a webpack-bundled Node backend that does not use CSFLE or Queryable Encryption. Webpack officially supports `IgnorePlugin` for preventing module generation for matching `require()` calls. MongoDB officially marks the package optional for driver 5.9.x. ([webpack][7])

Why this is strong:

* It matches MongoDB’s dependency model.
* It is bundler-side only.
* It does not drag in a native dependency you do not need. ([GitHub][1])

Practical interpretation:

* If your app never enables in-use encryption, a targeted ignore for `mongodb-client-encryption` is a defensible disposition of `Module not found: Can't resolve 'mongodb-client-encryption'`.
* It may or may not fully eliminate the separate **critical dependency** warning, depending on exactly where webpack encounters the dynamic require. ([webpack][7])

### 2. Second choice: externalize MongoDB-related optional packages when you want runtime resolution instead of bundle resolution

Webpack `externals` is appropriate when you want the bundle to leave a dependency alone and rely on runtime availability. This is more appropriate for backend/server bundles than for browser bundles. ([webpack][8])

Why this is conditional:

* It only works if your deployed function artifact still has access to the needed runtime package.
* In Netlify, that depends on whether you are doing a custom bundle and exactly what artifact gets deployed. Netlify says custom-built artifacts can be deployed without modification, but then you are responsible for the runtime packaging story. ([Netlify Docs][11])

For your stated goal, externalizing `mongodb-client-encryption` is sensible **only** if one of these is true:

* you actually use encryption and will provide the module at runtime, or
* you are externalizing MongoDB and related driver paths as part of a broader server-bundle policy. ([webpack][8])

### 3. Install `mongodb-client-encryption` only if the app really uses encryption

This is not a warning-suppression step. It is a feature-enablement step. MongoDB’s docs tie the package to in-use encryption, and the component support matrix for `mongodb@5.x` points to the 2.x encryption package line. ([MongoDB][3])

For the current stack, this means:

* appropriate: you use CSFLE or Queryable Encryption on driver 5.x
* unnecessary: ordinary MongoDB CRUD/query workloads with no client-side encryption ([MongoDB][3])

### 4. Tolerate the critical-dependency warning if it is known-benign and documented

Webpack’s own docs explain that critical dependency warnings come from static analysis limits around dynamic `require()`. That warning shape alone does **not** prove runtime failure. ([webpack][5])

So if you have:

* confirmed no encryption features are used,
* confirmed runtime behavior is correct in production-like execution,
* and disposed of the missing-module warning with a targeted ignore or equivalent,

then tolerating the remaining critical-dependency warning can be acceptable, provided it is documented as a known third-party-driver bundling artifact. This is interpretation, but it is grounded in webpack’s description of what the warning means and MongoDB’s declaration that the package is optional. ([webpack][5])

### 5. Only then consider narrower context surgery

`ContextReplacementPlugin` and parser-level context controls are official webpack tools, but for MongoDB optional-driver-extension noise they are more specialized and lower-confidence than a targeted ignore or a deliberate externalization policy. ([webpack][9])

Use these only if:

* you need to keep other dynamic-require behavior intact,
* and simpler ignore/external strategies did not produce clean enough builds. ([webpack][9])

### 6. Treat MongoDB major upgrade as modernization, not warning remediation

MongoDB 6.x+ changes around encryption APIs and version matching are real, but they belong to planned dependency modernization. They are not the right first answer to “how do I handle MongoDB optional-dependency bundler warnings on 5.9.x”. ([MongoDB][4])

## Decision guidance

Fix the warning **now on this stack** when:

* the warning reflects a package you actually need at runtime, or
* the build artifact fails in test/deploy because the optional path is actually used, or
* the warning volume is high enough that it hides real build regressions. ([webpack][8])

Tolerate it with documentation when:

* it is the webpack critical-dependency warning from MongoDB’s dynamic optional loading,
* your app does not use in-use encryption,
* and runtime tests confirm the bundled backend works correctly. ([webpack][5])

Defer as modernization when:

* the cleanest long-term fix would require moving to newer MongoDB major-version conventions,
* but your present goal is only to reduce warning noise without changing the driver major. ([MongoDB][4])

## Checklist

* Confirm whether the backend uses **CSFLE / Queryable Encryption** at all. If not, treat `mongodb-client-encryption` as optional and normally unnecessary. ([MongoDB][3])
* For driver **5.9.x**, remember the compatible encryption package line is **2.x**, not 6.x or 7.x. ([GitHub][2])
* In webpack, classify the two warnings separately:

  * `Can't resolve 'mongodb-client-encryption'` = optional feature path being resolved
  * `Critical dependency: the request of a dependency is an expression` = webpack static-analysis limitation around dynamic require ([GitHub][1])
* Prefer **targeted IgnorePlugin** when encryption is unused. ([webpack][7])
* Use **externals** only when runtime packaging is deliberate and verified. ([webpack][8])
* Do **not** install `mongodb-client-encryption` just to make warnings disappear unless you truly use encryption. ([GitHub][2])
* In Netlify, distinguish:

  * your own webpack build artifact
  * Netlify’s own bundling settings like `external_node_modules`, which mainly matter when Netlify is doing the bundling/prep step. ([Netlify Docs][11])
* Treat any driver-major upgrade as separate modernization work. ([MongoDB][4])

## Sources

**Official MongoDB**

* MongoDB Node.js driver repo README / component support matrix and driver extensions. ([GitHub][2])
* MongoDB driver 5.9.2 package manifest. ([GitHub][1])
* MongoDB in-use encryption docs. ([MongoDB][3])
* MongoDB upgrade docs for newer-major guidance. ([MongoDB][4])
* MongoDB-maintained `mongodb-client-encryption` repo README / compatibility table. ([GitHub][13])

**Official webpack**

* Module methods: critical dependency warning for unanalyzable `require`. ([webpack][5])
* Dependency management: dynamic expressions and context modules. ([webpack][6])
* IgnorePlugin docs. ([webpack][7])
* Externals docs. ([webpack][8])
* ContextReplacementPlugin docs. ([webpack][9])

**Official Netlify**

* Deploy functions / custom build behavior. ([Netlify Docs][11])
* Functions optional configuration, including `external_node_modules`. ([Netlify Docs][12])
* Frameworks API bundling notes and external module handling. ([Netlify Docs][14])

My bottom-line recommendation for your exact target stack is: **do not treat `mongodb-client-encryption` as mandatory on MongoDB driver 5.9.x; prefer targeted webpack-side disposition for unused encryption paths, and keep major-version upgrade work separate from warning cleanup.** ([GitHub][1])

[1]: https://raw.githubusercontent.com/mongodb/node-mongodb-native/v5.9.2/package.json "raw.githubusercontent.com"
[2]: https://github.com/mongodb/node-mongodb-native "GitHub - mongodb/node-mongodb-native: The official MongoDB Node.js driver · GitHub"
[3]: https://www.mongodb.com/docs/drivers/node/current/security/encrypt-fields/ "In-Use Encryption - Node.js Driver - MongoDB Docs"
[4]: https://www.mongodb.com/docs/drivers/node/current/reference/upgrade/ "Upgrade Driver Versions - Node.js Driver - MongoDB Docs"
[5]: https://webpack.js.org/api/module-methods/ "Module Methods | webpack"
[6]: https://webpack.js.org/guides/dependency-management/ "Dependency Management | webpack"
[7]: https://webpack.js.org/plugins/ignore-plugin/ "IgnorePlugin | webpack"
[8]: https://webpack.js.org/configuration/externals/ "Externals | webpack"
[9]: https://webpack.js.org/plugins/context-replacement-plugin/?utm_source=chatgpt.com "ContextReplacementPlugin"
[10]: https://webpack.js.org/configuration/module/ "Module | webpack"
[11]: https://docs.netlify.com/build/functions/deploy/ "Deploy functions | Netlify Docs"
[12]: https://docs.netlify.com/build/configure-builds/file-based-configuration/?utm_source=chatgpt.com "File-based configuration"
[13]: https://github.com/mongodb-js/mongodb-client-encryption "GitHub - mongodb-js/mongodb-client-encryption: The Node.js libmongocrypt native bindings · GitHub"
[14]: https://docs.netlify.com/build/frameworks/frameworks-api/?utm_source=chatgpt.com "Frameworks API"
