# IT Assets for Claude Code

Read README.md, docs/compliance.md and the matching .claude/commands recipe before work. One business, trusted operators. Every answer starts with the CLI. Demo data is fictional.

## Routing

| Job | Command |
|---|---|
| help | /help |
| assets | /assets |
| asset | /asset |
| people | /people |
| custody | /custody |
| Review overdue equipment and departed staff with open custody. | /returns |
| Review physical observations and identify devices to check. | /stocktake |
| Review warranty, support and licence dates due within 60 days, including overdue dates. | /renewals |
| Compare recorded per-device installations with seat evidence. Do not declare legal compliance. | /licences |
| Review retired devices and remaining installations. | /disposal-queue |
| Run record checks and distinguish house rules from sourced guidance. | /compliance |
| attention | /attention |
| Write the Monday review from custody, attention and compliance. | /weekly-review |
| history | /history |
| imported assets | /imported-assets |
| add person | /add-person |
| depart person | /depart-person |
| review person | /review-person |
| add asset | /add-asset |
| log stocktake | /log-stocktake |
| checkout | /checkout |
| checkin | /checkin |
| set support | /set-support |
| send repair | /send-repair |
| return repair | /return-repair |
| retire | /retire |
| dispose | /dispose |
| add licence | /add-licence |
| renew licence | /renew-licence |
| record install | /record-install |
| remove install | /remove-install |
| Import a prepared AssetExplorer asset CSV. Preserve source history separately from current custody. | /import |
| export | /export |
| Write an internal return brief. Never send it. | /draft-return |
| Change a field or rule with a tested migration | /customise |
| Add a read-only report | /new-view |

## Rules

Read before writing. Every mutation requires the operator name and supports a dry run. Never invent custody, a physical observation, licence rights, sanitisation evidence or an approver. Imports preserve reported source history and do not verify it. Distinguish observation dates from report generation dates. Counts do not prove legal compliance.

Never send, publish, delete records or connect a live system without the operator's specific instruction. Drafts stay local. Keep owner database connections out of browsers. Review access roles and backup retention before shared use. Audit, source, observation and disposal records are append-only.

## Files

scripts/assets.mjs is the one domain CLI. supabase/migrations holds forward SQL migrations. views.json and documents.json define read-only output. brand.json controls branding. Every runtime uses .claude/commands.

Omni by Enterprise DNA installs and operates your version: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=assetexplorer
