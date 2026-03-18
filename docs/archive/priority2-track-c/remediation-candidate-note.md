# Priority 2 Track C Remediation Candidate Note

Status: archived

Sources:
- `docs/archive/priority2-track-c/backend-warning-baseline.md`
- `docs/archive/priority2-track-c/guidance-sources.md`
- `docs/archive/priority2-track-c/mongodb-warning-guide.md`
- `webpack.netlify.functions.js`

## Current Situation

- Current stack: MongoDB driver `5.9.2`, webpack `5.88.2`, Node backend bundle, Netlify Functions deployment context
- In-scope warnings:
  1. `Critical dependency: the request of a dependency is an expression`
  2. `Module not found: Error: Can't resolve 'mongodb-client-encryption'`
- Current repo signal: no non-archive references to CSFLE, Queryable Encryption, `ClientEncryption`, or `autoEncryption` were found under `src/`
- Current bundler signal: `webpack.netlify.functions.js` already uses `IgnorePlugin` for other MongoDB optional peers such as `@mongodb-js/zstd`, `kerberos`, and `snappy`

## Ranking Criteria

Candidates are ranked by:

1. alignment with upstream guidance
2. runtime-behavior safety
3. reversibility
4. warning-reduction impact
5. modernization spillover risk

## Ranked Candidates

### 1. C-CFG-01: Add targeted `IgnorePlugin` handling for `mongodb-client-encryption`

- Rank: `1`
- Expected outcome:
  - likely removes `W002`
  - may leave `W001` unchanged
- Upstream-guidance alignment: `HIGH`
- Runtime-behavior safety: `HIGH`, assuming encryption is not used
- Reversibility: `HIGH`
- Warning-reduction impact: `MEDIUM`
- Modernization spillover risk: `LOW`
- Why it ranks first:
  - Matches MongoDB guidance that `mongodb-client-encryption` is optional on driver `5.9.x`
  - Matches webpack guidance that `IgnorePlugin` is an official way to stop generation for matching `require()` calls
  - Matches existing repo pattern because the current webpack config already ignores other optional MongoDB peers
- Selected for first attempt: `YES`

### 2. C-CFG-02: Externalize `mongodb-client-encryption` for runtime resolution

- Rank: `2`
- Expected outcome:
  - could remove `W002`
  - would require explicit runtime packaging guarantees
- Upstream-guidance alignment: `MEDIUM`
- Runtime-behavior safety: `MEDIUM`
- Reversibility: `MEDIUM`
- Warning-reduction impact: `MEDIUM`
- Modernization spillover risk: `LOW/MEDIUM`
- Why it ranks second:
  - Officially supported by webpack, but only safe when runtime packaging is deliberate
  - Less attractive than IgnorePlugin for a package the repo does not appear to use
- Selected for first attempt: `NO`

### 3. C-CFG-03: Use `ContextReplacementPlugin` or parser-level context controls for MongoDB dynamic require handling

- Rank: `3`
- Expected outcome:
  - could potentially narrow `W001`
  - more likely to be configuration surgery than a clear current-stack fix
- Upstream-guidance alignment: `MEDIUM`
- Runtime-behavior safety: `MEDIUM/LOW`
- Reversibility: `MEDIUM`
- Warning-reduction impact: `LOW/MEDIUM`
- Modernization spillover risk: `LOW`
- Why it ranks third:
  - Official webpack tool, but lower-confidence and more specialized than a targeted ignore for the optional package path
  - Better treated as a later candidate only if simpler handling does not yield a good-enough outcome
- Selected for first attempt: `NO`

### 4. C-DEP-01: Install `mongodb-client-encryption`

- Rank: `4`
- Expected outcome:
  - may remove `W002`
  - adds an optional native-feature package the repo does not appear to use
- Upstream-guidance alignment: `LOW` for this repo state
- Runtime-behavior safety: `MEDIUM`
- Reversibility: `MEDIUM`
- Warning-reduction impact: `MEDIUM`
- Modernization spillover risk: `MEDIUM`
- Why it ranks fourth:
  - MongoDB documents the package as optional and encryption-specific
  - Installing it purely to silence the warning would add dependency weight and possible native-install complexity without evidence of runtime need
- Selected for first attempt: `NO`

### 5. C-MOD-01: MongoDB major-version upgrade

- Rank: `5`
- Expected outcome:
  - not suitable as a Track C warning-remediation slice
- Upstream-guidance alignment: `LOW` for Track C scope
- Runtime-behavior safety: `LOW`
- Reversibility: `LOW`
- Warning-reduction impact: `UNCERTAIN`
- Modernization spillover risk: `HIGH`
- Why it ranks fifth:
  - Directly conflicts with Track C scope and constraints
  - Belongs to later modernization planning, not current-stack warning remediation
- Selected for first attempt: `NO`

## First-Attempt Decision

Proceed with `C-CFG-01`: add a targeted `IgnorePlugin` rule for the literal `mongodb-client-encryption` request under the MongoDB driver path in `webpack.netlify.functions.js`.

Expected first-attempt decision target:

- best case: `ACCEPT` if `W002` is removed and no runtime/parity drift appears
- possible outcome: `REVISE` or `DEFER` if `W002` changes shape but `W001` remains and the net result is not yet good enough
- revert trigger:
  - new runtime import failures
  - unexpected build breakage
  - warning shape becomes less clear or broader than baseline
