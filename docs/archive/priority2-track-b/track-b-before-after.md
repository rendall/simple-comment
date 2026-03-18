# Priority 2 Track B Before/After Evidence

Status: archived

Sources:
- `build-backend-baseline.clean.log`
- `build-backend-after.clean.log`

## Per-function size comparison

| Artifact | Baseline | After |
| --- | --- | --- |
| `auth.js` | `2.94 MiB` | `1010 KiB` |
| `comment.js` | `2.94 MiB` | `1010 KiB` |
| `gauth.js` | `2.94 MiB` | `1010 KiB` |
| `topic.js` | `2.94 MiB` | `1010 KiB` |
| `user.js` | `2.94 MiB` | `1010 KiB` |
| `verify.js` | `2.94 MiB` | `1010 KiB` |

## Warning signature snapshot (after)

- WARNING in ./node_modules/mongodb/lib/utils.js 953:38-93
- WARNING in ./node_modules/mongodb/lib/utils.js 964:38-74
- webpack 5.88.2 compiled with 2 warnings in 32095 ms
