# IT Assets for Claude Code

Know who holds each device, what is overdue, which support dates are approaching and what evidence must exist before disposal.

## Three ways to own it

- **Do it yourself:** free MIT code with Claude Code, Codex, OpenCode or Cursor. Hosting, agent subscriptions and your time remain your costs.
- **We customise it:** Enterprise DNA maps your AssetExplorer records, adds your fields and rules, and builds the screens and connections you need. Choose a different stack if it suits your business.
- **We run it for you:** Omni by Enterprise DNA installs, connects and operates your version. One setup fee, then a monthly retainer.

[Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=assetexplorer).

## Try the fictional estate

Node 20 or newer. No database account required.

```bash
npm install
npm run demo
npm run assets -- returns
npm run assets -- stocktake
npm run assets -- licences
npm run assets -- weekly-review --json
npm run view
npm run docs
npm test
```

PGlite stores records in `.data/db`. Set `DATA_DIR` for a different embedded database or `DATABASE_URL` for PostgreSQL 15 or newer. Use an empty database and `npm run migrate` for real work. Never seed a business database. Protect exported files and rendered documents like the original database.

## The working week

Run `/returns` for overdue custody and departed staff, `/stocktake` for the physical register, `/renewals` for the next 60 days including overdue dates, `/licences` for recorded entitlements against installations, and `/disposal-queue` for retired equipment. `/weekly-review` brings these together with record checks.

All new assets start **unverified**. `/log-stocktake` records an actual observation and moves an unverified asset into stock. `/checkout` requires stock and an active person. `/checkin` ends custody and returns the device to unverified until it is checked again. Repairs and retirement require custody to be returned first. Disposal requires retirement, no active installations, an approver, retention review and sanitisation evidence. The software records evidence. It does not wipe a device or authenticate a certificate.

Every mutation requires `--actor` and accepts `--dry-run`. Dry runs roll back records and audit events. Actor names are attribution, not authentication. Names match case-insensitively, tags match exactly, and id prefixes work. Ambiguity prints candidates and exits 1. Every command accepts `--json`. Use `npm run assets -- help` for all flags.

Licence arithmetic is intentionally limited to one installation per device against a recorded seat count. It reports deficits even when observed installations exceed entitlement. It does not interpret vendor contracts, cores, CALs, concurrent use, bundles or downgrade rights. An expired record is a review prompt, not a legal conclusion. Procurement, network discovery, patching, remote control and device enforcement are separate systems.

## Ten questions answered from your records

These are supported cross-record questions, not a claim that AssetExplorer cannot be configured to answer them.

1. Which departed staff still hold equipment, and is its return overdue? (`returns`)
2. Which devices have never been physically verified? (`stocktake`)
3. Which assets were last seen more than 90 days ago? (`attention`)
4. Which warranty and support dates fall within 60 days, including overdue ones? (`renewals`)
5. Which licence has more recorded installations than seats? (`licences`)
6. What installation must be removed before a retired asset can be disposed of? (`disposal-queue`)
7. What did the old system report about a custodian before local verification? (`imported-assets`)
8. Whose custody records have passed their retention review date? (`compliance`)
9. Who changed custody and what evidence did they record? (`history`, `asset`)
10. What sanitisation and retention evidence accompanies a disposal? (`asset`)

## Your first hour: ten things to ask for

1. Put our name, logo and colours in `brand.json`.
2. Show the overdue return and the recorded custodian.
3. Find devices with no physical observation.
4. Show support dates approaching this quarter.
5. Explain the demo licence deficit.
6. Map the columns in our AssetExplorer asset report.
7. Run the import as a dry run and reconcile the counts.
8. Verify one imported asset and record its actual custody.
9. Add a custom department field through `/customise`.
10. Add a read-only branch stocktake report through `/new-view`.

## Moving your records

[The replacement guide](docs/replace-assetexplorer.md) explains the CSV report, explicit field map and one-command import. The fixture is synthetic. Test your own report before cutover. Raw source rows are preserved. Source state and custodian names do not create verified custody. Identical imports are skipped; changed source rows and identity collisions stop the whole import for reconciliation.

`npm run docs` renders custody handover records, stocktake packs and disposal records as branded HTML. `npm run view` renders three read-only dashboards. `/draft-return` writes an internal brief under `drafts/` and sends nothing. Export archives every domain record and audit event in JSON. Restore is an operator-reviewed migration, not an automatic import.

## Deployment boundary

One business and trusted operators. This base has no per-person permissions. Row security denies public access, views use caller privileges, and the CLI uses an owner connection. Never expose that connection to a browser. Network discovery, endpoint security and access control need separate deployment work. Read [the screen boundary](docs/why-no-front-end.md) and [record checks](docs/compliance.md) before real use.

## Verification and licence

`npm test` migrates and seeds a temporary database twice, exercises every CLI command and checks state transitions, dry-run rollback, ambiguous names, atomic imports, repeated imports, evidence gates, audit immutability, exports and HTML escaping. CI runs on Ubuntu, Windows and PostgreSQL. Only report a platform as passed after its job completes. `TEST_DATABASE_URL` must be an empty disposable database.

MIT. Copyright 2026 Enterprise DNA. Independent of ManageEngine, Zoho and Anthropic.
