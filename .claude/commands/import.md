---
description: "Import a prepared AssetExplorer asset CSV. Preserve source history separately from current custody."
---

# import

Import a prepared AssetExplorer asset CSV. Preserve source history separately from current custody.

Read README.md and docs/compliance.md first. Run npm run assets -- help for exact syntax.

```bash
npm run assets -- import assetexplorer --file="<file>" --map="<map>" --namespace="<namespace>" --owner="<owner>" --actor="<operator>" [--dry-run] --json
```

Read the affected records first. Obtain actual dates and evidence from the operator, preview with --dry-run, then apply the authorised change. Do not invent evidence or bypass a conflict.


Use a stable namespace and an explicit map. Reconcile counts and inspect imported-assets after applying. Imported people and asset state are source claims, not verified custody.
