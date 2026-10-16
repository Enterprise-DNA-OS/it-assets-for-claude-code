---
description: "Retire an available device after all custody has been returned."
---

# retire

Retire an available device after all custody has been returned.

Read README.md and docs/compliance.md first. Run npm run assets -- help for exact syntax.

```bash
npm run assets -- retire --asset="<asset>" --evidence="<evidence>" --actor="<operator>" [--dry-run] --json
```

Read the affected records first. Obtain actual dates and evidence from the operator, preview with --dry-run, then apply the authorised change. Do not invent evidence or bypass a conflict.



