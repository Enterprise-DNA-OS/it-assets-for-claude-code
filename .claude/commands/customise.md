---
description: "Add a field or change a rule through a tested forward migration."
---

# Customise

Read CLAUDE.md and inspect the relevant schema and commands. Ask which field, state or rule the operator wants changed. Write a forward SQL migration under supabase/migrations, update the one CLI, seed and meaningful smoke assertions. Run npm test against a disposable database before applying with npm run migrate. Preserve history and imported source rows. Update README and the affected command. Never change a prior applied migration or replace evidence with guesses.
