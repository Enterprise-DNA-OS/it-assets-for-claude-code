---
description: "Record the actual return and leave the device unverified until checked."
---

# checkin

Record the actual return and leave the device unverified until checked.

Read README.md and docs/compliance.md first. Run npm run assets -- help for exact syntax.

```bash
npm run assets -- checkin --asset="<asset>" --on="<on>" --evidence="<evidence>" --actor="<operator>" [--dry-run] --json
```

Read the affected records first. Obtain actual dates and evidence from the operator, preview with --dry-run, then apply the authorised change. Do not invent evidence or bypass a conflict.



