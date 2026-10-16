# Record checks, evidence and limits

Checked 16 October 2026. This is an operator checklist, not legal certification or a substitute for endpoint security. Sources describe obligations or guidance. The thresholds below are local house rules.

## Asset records

[NZ NCSC asset lifecycle guidance](https://www.ncsc.govt.nz/protect-your-organisation/asset-lifecycle-management/) recommends keeping an asset identity, owner, location and support information through purchase, maintenance and decommissioning. `NCSC_ASSET_RECORD` flags missing serial or support date and unverified records. A device with no published support date needs a documented exception through a reviewed custom rule, not an invented date. This is a partial record check and does not prove the estate is complete.

## Disposal

The same NCSC guidance calls for reviewing retained data and sanitising devices before disposal or reuse. `/dispose` requires retirement, returned custody, recorded removal of installations, an approver, a retention review and evidence. It records a human decision and does not perform sanitisation. `DISPOSAL_EVIDENCE` detects a disposed record without its evidence record. `/checkin` leaves equipment unverified so the operator can check and sanitise it before reuse. Follow the applicable sanitisation standard and organisation policy.

## Privacy

[NZ Privacy Principle 5](https://www.privacy.org.nz/privacy-principles/5/) requires reasonable safeguards for personal information. `MANUAL_SECURITY` always remains manual: an operator must assess access, backups, copied reports and evidence authenticity. Row security alone is not that assessment.

[NZ Privacy Principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to lawful needs. Each person has a recorded purpose and review date. `PRIVACY_RETENTION` flags overdue reviews. No universal retention period is asserted. Deletion, anonymisation and backup retention need an approved plan covering audit and source records; the CLI never deletes them automatically. Australian operators must add the obligations that apply to their entity before deployment.

## Licences

`LICENCE_RECONCILIATION` compares recorded per-device installations with recorded seat counts and expiry dates. It never determines contractual compliance. Review the actual licence agreement. Other licence metrics need a separate tested rule. Actual installations must be recorded even when they exceed purchased seats so a deficit is visible. No licence keys are stored.

## House rules

Stocktake attention starts after 90 days without observation. Renewals include dates up to 60 days ahead plus all overdue dates. These are house settings, not statutory deadlines. Overdue custody follows its entered due date, and departed people with open custody remain in returns. CLEAR means that a specific query found no exception, not that the business is compliant.
