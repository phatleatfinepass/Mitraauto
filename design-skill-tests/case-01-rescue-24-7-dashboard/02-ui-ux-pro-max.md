# Case 1: Rescue 24/7 Dashboard - ui-ux-pro-max

## Skill

`ui-ux-pro-max`

## Diagnosis

The original Rescue 24/7 page had real workflow pieces, but the interface did not prioritize urgent dispatch work. It also exposed a major product/data mismatch: the UI expected `received -> processing -> on_the_way -> picking -> at_garage`, while the live database status enum is `received -> assigned -> resolved -> canceled`.

The most important issue was not styling. It was operational clarity and action safety.

## Design Direction

Use an emergency dispatch board:

- top summary shows active queue, highest priority, and visible case count
- one "next case to watch" panel makes the most urgent case impossible to miss
- status cards double as filters
- queue rows are sorted by urgency, priority, and age
- each row separates identity, contact, location, status, source, and priority
- drawer actions use the live DB status model
- cancellation is separated from normal progression

## Concrete Changes

- Replaced the generic header with an urgent dispatch command header.
- Added an active queue / highest priority / visible cases summary.
- Added a priority case panel that opens the most urgent active case.
- Converted status summary cards into clickable filters.
- Sorted visible requests by urgency score instead of raw created time.
- Added priority badges and clearer row sections.
- Aligned the UI status model to the live DB enum:
  - `received`
  - `assigned`
  - `resolved`
  - `canceled`
- Prevented invalid status transitions that would fail against Supabase.
- Separated `canceled` from the normal status progression.
- Made `assigned_to` read-only because the DB column is a UUID, not a free-text driver name.
- Moved driver/operator names into internal notes until the assignment model is refactored.

## Implementation Notes

Changed:

```txt
src/components/cms/rescue/RescueCMSPage.tsx
```

No schema changes were made.

Seeded mock rescue rows remain in Supabase and are tagged:

```txt
[DESIGN_MOCK_RESCUE_20260518]
```

## Verification

```txt
npm run build: pass
npm run i18n:audit: pass
git diff --check: pass
```

## Risks / Tradeoffs

- This pass improves real workflow safety more than visual novelty.
- The status enum mismatch is now handled in UI, but the business workflow may still need a formal backend decision later.
- Free-text driver assignment is intentionally avoided because `assigned_to` is a UUID field.
- Visual browser scoring still needs a logged-in CMS session.

## Preliminary Score

```text
Skill: ui-ux-pro-max
Case: Rescue 24/7 Dashboard
Score: Pending visual review

Taste: Pending
UX clarity: Strong candidate
Originality: Moderate
Practicality: Strong candidate
Frontend usefulness: Strong candidate
Consistency with project: Pending
Amount of generic AI design: Lower than baseline
Keep / Maybe / Remove: Pending
Notes: Best value so far is catching workflow/data mismatch and making the dispatch screen safer.
```
