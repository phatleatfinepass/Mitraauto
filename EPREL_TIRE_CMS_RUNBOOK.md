# EPREL Tire CMS Runbook

## Scope

This runbook covers the EPREL-backed tire enrichment flow used by the CMS.

Current v1 behavior:
- one tire at a time
- input is EAN / GTIN
- EPREL is used as the primary source for regulated EU label data
- all proposed values require human review before final save

## Environments

Acceptance:
- `https://public-energy-label-acceptance.ec.europa.eu/api`
- use for safe connection, response-shape, and UI-flow testing
- data is not real

Production:
- `https://eprel.ec.europa.eu/api`
- use for real catalog enrichment and pilot rollout

## Required secrets

Set these as Supabase function secrets for `audit_tire_by_ean`:

- `EPREL_API_BASE_URL`
- `EPREL_API_KEY`

Notes:
- `EPREL_API_KEY` may be empty while using only open endpoints
- restricted search/export endpoints will require the key

## Current endpoint usage

The CMS flow currently uses:

- `GET /product/gtin/{gtin}`
- `GET /products/tyres/{registrationNumber}`
- `GET /products/tyres/{registrationNumber}/fiches?noRedirect=true&language=EN`

## Source-of-truth rules

EPREL is authoritative for:
- EPREL registration number
- fuel efficiency class
- wet grip class
- external rolling noise class
- external rolling noise value
- severe snow tyre
- ice tyre
- fiche/source provenance

EPREL is only advisory for:
- brand
- model
- size string
- non-regulated merchandising badges

Do not allow weaker sources to overwrite approved EPREL label fields silently.

## Persisted tables

Raw EPREL lookups:
- `public.cms_tire_eprel_matches`

Field-level review decisions:
- `public.cms_tire_eprel_field_reviews`

Live catalog writeback still goes through:
- `public.product_cms`

## Review flow

1. User clicks `Fetch from EPREL`.
2. CMS stores the latest raw EPREL match row.
3. CMS stores field-level review rows as `pending`.
4. Reviewer marks each field:
- `accepted`
- `rejected`
- `kept_current`
5. `Apply EPREL values` only applies unresolved or accepted values.
6. `Save` writes approved draft values into `product_cms`.
7. Accepted review rows are marked `applied_to_product = true`.

## Match statuses used by the CMS

- `matched`
- `no_match`
- `multiple_matches`
- `wrong_product_group`
- `blocked`
- `unverified`
- `error`

Operational meaning:
- `matched`: usable EPREL result
- `no_match`: GTIN did not resolve to a usable EPREL tire model
- `multiple_matches`: ambiguous GTIN result
- `wrong_product_group`: EPREL found a model, but not a tire
- `blocked`: EPREL model exists but is blocked by EPREL
- `unverified`: supplier/trademark not verified
- `error`: transient or unexpected failure

## Known limitation

The weak point is the GTIN lookup endpoint:

- `GET /product/gtin/{gtin}` can return `404`
- it can also return `200` with an empty object and no registration number

The system now treats those empty `200` responses as `no_match`.

The registration-number endpoints are materially more reliable than the GTIN lookup endpoint.

## Phase 9 hardening already shipped

- retries for transient EPREL failures (`429`, `5xx`)
- no retry for clear `404`
- blocked-model responses normalized to `blocked`
- empty GTIN `200` payloads normalized to `no_match`

## Pilot checklist

Run a small production pilot before broad rollout:

1. Pick 10 to 20 real tire EANs.
2. Run `Fetch from EPREL`.
3. Record:
- matched
- no match
- multiple matches
- blocked
4. Review and save a few examples.
5. Confirm:
- draft changes are correct
- review statuses persist
- list-level EPREL badges update

## Production recommendations

- use Acceptance for safe UI and connection testing
- use Production for real enrichment only
- store provenance for every accepted field
- do not auto-publish EPREL suggestions
- monitor GTIN match rate before scaling

## Public/legal note

If EPREL-backed values are displayed publicly, add a short source note such as:

`Certain tyre specification fields are sourced from the European Product Registry for Energy Labelling (EPREL) and may be updated or corrected over time.`
