---
description: "Record the repair check and return equipment to available stock."
---

# return-repair

Record the repair check and return equipment to available stock.

Read README.md and docs/compliance.md first. Run npm run assets -- help for exact syntax.

```bash
npm run assets -- return-repair --asset="<asset>" --on="<on>" --site="<site>" --evidence="<evidence>" --actor="<operator>" [--dry-run] --json
```

Read the affected records first. Obtain actual dates and evidence from the operator, preview with --dry-run, then apply the authorised change. Do not invent evidence or bypass a conflict.



