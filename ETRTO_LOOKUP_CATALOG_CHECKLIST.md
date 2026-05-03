# ETRTO Passenger Tyre Lookup Catalog Checklist

This tracks the app-ready ETRTO passenger-car tyre/rim lookup dataset used by the fitment recommender.

Status meanings:

- `Done`: extracted, normalized, visually audited, merged into app data, and build-verified.
- `Partial`: some curated/common rows are merged, but the full series is not complete.
- `Todo`: not yet extracted or not trusted for app recommendations.
- `Blocked`: needs source clarification or manual review before merge.

## App Data Files

- `src/data/etrto/passengerTyreSizes.json`
- `src/data/etrto/passengerApprovedRims.csv`
- `src/data/etrto/loadIndex.csv`
- `src/data/etrto/speedRating.csv`
- `src/data/etrto/auditStatus.csv`

## Series Progress

| Status | Series | Tyre table page | Rim table page | Current coverage | Next action |
|---|---:|---|---|---|---|
| Done | 65 | P.26 | P.27 | Full series: 50 tyre rows, 233 rim rows | Keep locked unless correction found |
| Done | 70 | P.24 | P.25 | Full series: 51 tyre rows, 246 rim rows | Keep locked unless correction found |
| Done | 60 | P.28 | P.29 | Full series: 72 tyre rows, 337 rim rows | Keep locked unless correction found |
| Done | 55 | P.30 | P.31 | Full series: 59 tyre rows, 267 rim rows | Keep locked unless correction found |
| Done | 50 | P.32 | P.33 | Full series: 70 tyre rows, 321 rim rows | Keep locked unless correction found |
| Done | 45 | P.34 | P.35 | Full series: 75 tyre rows, 295 rim rows | Keep locked unless correction found |
| Done | 40 | P.36 | P.37 | Full series: 81 tyre rows, 330 rim rows | Keep locked unless correction found |
| Done | 80/75 | P.22 | P.23 | Full series: 48 tyre rows, 218 rim rows | Keep locked unless correction found |
| Done | 35 | P.38/P.39 | P.39 | Full series: 79 tyre rows, 343 rim rows | Keep locked unless correction found |
| Done | 30 | P.40/P.41 | P.41 | Full series: 75 tyre rows, 211 rim rows | Keep locked unless correction found |
| Done | 25 | P.42 | P.42 | Full series: 36 tyre rows, 92 rim rows | Keep locked unless correction found |
| Done | 20 | P.43 | P.43 | Full series: 1 tyre row, 3 rim rows | Keep locked unless correction found |
| Done | HL | P.44/P.46 | P.47/P.48 | Full HL module: 133 tyre rows, 201 rim rows | Source P.48 prints HL 295/25 R25 while tyre table P.46 has R22; lookup maps that rim row to HL_295_25_R22 and records warning |
| Done | Temporary spare | P.49/P.50 | P.51 | Full T-type spare module: 89 tyre rows, 283 rim rows | Stored separately from normal recommendations |

## Priority Size Tracking

These are high-value sizes for common factory and plus-size recommendations. Mark each `Done` only after tyre data and approved rim rows are both merged.

| Status | Size | Series | Why it matters | Notes |
|---|---|---:|---|---|
| Done | 195/65 R15 | 65 | Hyundai i30 factory example | Full 65-series verified |
| Done | 205/65 R15 | 65 | Common 15 inch alternative/inventory size | Full 65-series verified |
| Done | 205/60 R15 | 60 | Common near-factory alternative for 195/65 R15 | Full 60-series verified |
| Done | 195/60 R15 | 60 | Common compact-car size | Full 60-series verified |
| Done | 205/55 R16 | 55 | Very common plus-size alternative from 195/65 R15 | Full 55-series verified |
| Done | 205/50 R17 | 50 | Common 17 inch alternative | Full 50-series verified |
| Done | 225/45 R17 | 45 | Very common sport plus-size alternative | Full 45-series verified |
| Done | 225/40 R18 | 40 | Common 18 inch plus-size alternative, often XL needed | Full 40-series verified |
| Done | 185/70 R14 | 70 | Older/smaller passenger-car fitments | Full 70-series verified |
| Done | 175/65 R14 | 65 | Common small-car size | Full 65-series verified |
| Done | 185/65 R15 | 65 | Common compact-car factory size | Full 65-series verified |
| Done | 215/55 R16 | 55 | Common medium-car size | Full 55-series verified |
| Done | 225/50 R17 | 50 | Common medium-car size | Full 50-series verified |
| Done | 235/45 R17 | 45 | Common larger sport size | Full 45-series verified |
| Done | 235/40 R18 | 40 | Common 18 inch size | Full 40-series verified |
| Done | 235/35 R19 | 35 | Common 19 inch performance size | Full 35-series verified |
| Done | 255/35 R19 | 35 | Common rear/performance fitment | Full 35-series verified |
| Done | 255/30 R20 | 30 | Common 20 inch performance fitment | Full 30-series verified |

## Per-Series Audit Steps

Use this checklist for each series before changing status to `Done`.

- [ ] Extract every tyre-size row from the ETRTO tyre table page.
- [ ] Extract every approved rim contour row from the matching rim page.
- [ ] Normalize `size_key` values, for example `205/55 R16` -> `205_55_R16`.
- [ ] Normalize rim widths, for example `5 1/2J` -> `5.5,J`.
- [ ] Split approved rim lists into one row per approved rim width.
- [ ] Preserve ETRTO table values exactly; do not recalculate table-provided dimensions.
- [ ] Convert blank or `-` values to `null`.
- [ ] Mark asterisked LI rows with pressure-exponent metadata.
- [ ] Visually audit every row against the rendered PDF page.
- [ ] Add or update the series row in `src/data/etrto/auditStatus.csv`.
- [ ] Run the validation script/checks.
- [ ] Run `npm run build`.
- [ ] Update this checklist.

## Data Validation Checks

Run these checks after every merge:

- [ ] JSON parses successfully.
- [ ] CSV parses successfully.
- [ ] Every `size_key` in `passengerApprovedRims.csv` exists in `passengerTyreSizes.json`.
- [ ] Every completed-series tyre row has at least one approved rim mapping.
- [ ] No duplicate `sizeKey` values unless intentionally modeled as `HL_...` or another special load version.
- [ ] No unnormalized rim strings remain, such as `5 1/2J`.
- [ ] No numeric field contains a comma-split value like `6.0,J`.
- [ ] Every completed row has `sourcePage`.
- [ ] Every completed row has `audited: true`.
- [ ] `auditStatus.csv` row counts match the actual merged data.
- [ ] `extractionWarnings.csv` is reviewed for any source-level discrepancies before production use.

## NotebookLM Prompt Template

Use one series at a time.

```text
Extract the complete ETRTO 2025 Passenger Car Tyres [SERIES] series.

Use tyre table page [P.xx] and rim table page [P.yy].

Return two CSV blocks:

1. tyre_sizes
Columns:
size_key,width_mm,aspect_ratio,construction,rim_diameter_in,standard_load_index,reinforced_load_index,measuring_rim_width_in,design_section_width_mm,design_overall_diameter_mm,max_service_width_mm,max_service_diameter_mm,standard_load_capacity_kg,reinforced_load_capacity_kg,standard_pressure_kpa,reinforced_pressure_kpa,series,source_page,pressure_exponent_value,load_version,audited

2. approved_rims
Columns:
size_key,width_mm,aspect_ratio,rim_diameter_in,approved_rim_width_in,rim_contour,series,source_page,audited

Rules:
- Extract every visible row.
- Do not infer missing values.
- Use null for blank or "-".
- Convert 5 1/2J to 5.5,J.
- Split approved rim lists into one row per rim width.
- Preserve exact ETRTO values.
- Add source page to every row.
- Return only CSV blocks, no prose.
```

## Completion Definition

The full lookup catalog is complete when:

- all normal passenger-car metric series from `80/75` through `20` are `Done`;
- every completed series has full tyre rows and full approved-rim rows;
- all rows are visually audited;
- app validation passes;
- the recommender enables all completed series without a curated-only caveat.
