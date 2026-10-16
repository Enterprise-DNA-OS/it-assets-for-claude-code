# Move the asset register from ManageEngine AssetExplorer

## Export the report

ManageEngine documents [custom report exports](https://help.assetexplorer.com/portal/en/kb/articles/custom-reports-reports) in CSV, alongside other formats. In your AssetExplorer version, make a tabular asset report with a stable Asset ID, asset name, asset tag, serial number, product type and site. Include warranty and support dates when available. Export CSV and preserve the untouched original. Report names and column labels vary by version and configuration. This importer targets that prepared asset report, not a complete vendor database backup.

## Map and import

Copy `fixtures/report-map.json` into your private `imports/` directory and map each canonical field to the exact header in your report. `key`, `name`, `tag`, `category` and `site` are required. `serial`, `warranty` and `support` are optional mappings. Dates must be YYYY-MM-DD. Normalise a working copy if the report uses a different date format. Do not guess absent tags or support dates. Reconcile missing required fields before importing.

```bash
npm run assets -- import assetexplorer --file=imports/assets.csv --map=imports/report-map.json --namespace=production-estate --owner="IT manager" --actor="Your name" --dry-run --json
npm run assets -- import assetexplorer --file=imports/assets.csv --map=imports/report-map.json --namespace=production-estate --owner="IT manager" --actor="Your name" --json
```

After report preparation, the second line is the one-command import. Counts cover imported plus skipped rows. A namespace identifies one source estate and must stay stable on repeats. Imports are atomic. Identical source rows are skipped. A changed row, duplicate source identity, conflicting asset tag or serial, or bad date rolls back the entire file. Changed exports require explicit reconciliation, never an overwrite of local custody history.

## What maps

Asset identity, tag, name, serial, category, site, warranty and support dates map into the register. Every original column and mapped value is also preserved in immutable source rows, including source asset state and custodian when present. All imported assets start unverified. A source custodian is reported history, not a new local checkout.

The included CSV is a **synthetic fixture**, not a captured vendor export. The fixture proves parser and mapping behaviour. It does not prove compatibility with your account until you test its report.

## Reconcile before cutover

Compare export row counts and unique identities with the import result. Review `/imported-assets`, verify actual assets with `/log-stocktake`, add people and record current custody. Review support dates, licences and exceptions. Render the stocktake pack and keep the original report. Switch the register only after the operator signs off the counts and exceptions.

Software entitlements, installation history, purchases, contracts, attachment binaries, approvals, CMDB relationships, permissions, discovery agents, remote access and notifications do not migrate through this asset CSV. Keep the vendor archive for those records. Enterprise DNA can map additional exports and connect the tools you need as scoped work.

## Source and price

[Vendor pricing](https://www.manageengine.com/products/asset-explorer/pricing.html), checked 16 October 2026, lists the on-premises annual subscription at US$11,995 for 10,000 IT assets. Cloud plans are a separate price grid. This is a published plan, not an observed customer invoice or a promise of savings. The base replaces the manual asset register and review process; keep discovery and security tools until their replacement is agreed and tested.
