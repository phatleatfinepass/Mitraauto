# ETRTO Source And Runtime

`etrto_source` contains the audited extraction artifacts from the ETRTO passenger-car work:

- `passengerTyreSizes.json`
- `passengerApprovedRims.csv`
- `loadIndex.csv`
- `speedRating.csv`
- `auditStatus.csv`
- `extractionWarnings.csv`
- `temporarySpareTyreSizes.json`
- `temporarySpareApprovedRims.csv`

The frontend must not import these files.

Runtime files are generated into `../etrto_runtime` and split by tyre rim diameter. The Edge Function calculator lazy-loads only the needed tyre shards, for example `tyres_r15.ts`.

Regenerate after updating source files:

```bash
npm run fitment:generate
npm run fitment:check
```

Primary Edge Function for app use:

```text
fitment_recommendations
```

It computes tyre recommendations once and derives rim recommendations from the same tyre result.
