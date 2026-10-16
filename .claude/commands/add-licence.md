---
description: "Record purchased per-device seats, expiry and agreement evidence."
---

# add-licence

Record purchased per-device seats, expiry and agreement evidence.

Read README.md and docs/compliance.md first. Run npm run assets -- help for exact syntax.

```bash
npm run assets -- add-licence --name="<name>" --seats="<seats>" --expires="<expires>" --evidence="<evidence>" --actor="<operator>" [--dry-run] --json
```

Read the affected records first. Obtain actual dates and evidence from the operator, preview with --dry-run, then apply the authorised change. Do not invent evidence or bypass a conflict.



