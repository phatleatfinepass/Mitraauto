# Case 1: Rescue 24/7 Dashboard - taste-design

## Skill

`taste-design`

## Diagnosis

The `ui-ux-pro-max` pass made the Rescue page operationally safer. The remaining issue was visual sharpness: the page still read like a normal admin queue instead of an urgent dispatch surface. The hierarchy worked, but it needed a stronger first-read, less generic loading behavior, and more deliberate density.

## Design Direction

Keep the emergency dispatch model, but make the page feel more like a controlled command surface:

- one red dispatch accent, used sparingly
- stronger page header with an alert strip
- asymmetric metric widths instead of equal generic cards
- priority language that can be scanned faster than numbers alone
- skeleton loading that matches the queue structure
- tighter queue action width so the row feels more deliberate

## Concrete Changes

- Added a thin red alert strip to the dispatch header.
- Tightened the "Live dispatch" label into a small command badge.
- Increased Rescue 24/7 headline weight and scale slightly.
- Changed top metrics to an asymmetric grid.
- Restyled the priority case panel with better containment.
- Added waiting-time context to the priority case.
- Added priority labels:
  - `Critical`
  - `High`
  - `Watch`
  - `Routine`
- Replaced the loading spinner with queue-shaped skeleton rows.
- Reduced queue action column width and changed `Open case` to `Open`.
- Fixed the old status summary initializer so it only uses the live DB enum:
  - `received`
  - `assigned`
  - `resolved`
  - `canceled`

## Implementation Notes

Changed:

```txt
src/components/cms/rescue/RescueCMSPage.tsx
```

No Supabase schema changes were made in this pass.

## Verification

```txt
npm run build: pass
npm run i18n:audit: pass
git diff --check: pass
local browser review: blocked by CMS login session
```

Remaining check to run after visual review:

```txt
browser review in logged-in CMS
```

## Risks / Tradeoffs

- This pass is intentionally visual and hierarchy-focused. It should be compared against `ui-ux-pro-max`, not treated as a replacement for workflow design.
- Copy is still English-only inside this Rescue module. That existed before this pass and should be handled later as a dedicated i18n cleanup.
- Browser scoring is still needed because density, row rhythm, and drawer balance are visual judgments.

## Preliminary Score

```text
Skill: taste-design
Case: Rescue 24/7 Dashboard
Score: Pending visual review

Taste: Stronger candidate than baseline
UX clarity: Moderate improvement over ui-ux-pro-max
Originality: Moderate
Practicality: Strong candidate
Frontend usefulness: Moderate
Consistency with project: Pending
Amount of generic AI design: Lower than baseline
Keep / Maybe / Remove: Pending
Notes: Best value is visual hierarchy and screen atmosphere. It did not discover the deeper workflow/data issue; ui-ux-pro-max did that better.
```
