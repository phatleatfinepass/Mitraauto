# Case 1: Rescue 24/7 Dashboard - Browser Review

## Test Context

Local route:

```txt
http://127.0.0.1:3000/cms#rescue
```

Browser state:

```txt
Logged in CMS session
Desktop viewport during final review
Seeded mock rows available in Supabase
```

Seed marker:

```txt
[DESIGN_MOCK_RESCUE_20260518]
```

## Passed Checks

- Rescue CMS page renders after login.
- Header renders:
  - `Rescue 24/7`
  - `Live dispatch`
  - `Last refreshed`
  - active queue / highest priority / visible cases metrics
- Emergency queue renders.
- Seeded mock rows render:
  - `Mika Virtanen`
  - `Nora Hakala`
  - `TST-123`
- Search works:
  - searching `TST-123` isolates Mika Virtanen
  - unrelated rows are hidden
- Status card filtering works:
  - selected status card shows pressed/selected state
  - dropdown status value updates
- Priority case drawer opens.
- Seeded Mika case drawer opens.
- Drawer shows core operator actions:
  - call customer
  - open map
  - move to assigned
  - save case
- Drawer shows useful detail sections:
  - progress
  - pickup details
  - internal notes
  - timeline

## Visual / UX Findings

### Finding 1: Old Rows Pollute The Design Test

The queue includes old rescue rows with priority `100` and very old ages, for example `44204 min`. These rows dominate:

- `Highest priority`
- `Next case to watch`
- top of the queue

This makes the design-skill comparison noisy because the clean seeded rows are not the primary visible cases.

Recommended test fix:

```txt
For design testing, either filter by the mock marker/search terms or add a temporary design-test-only toggle/query that limits Rescue CMS to seeded rows.
```

Recommended product fix:

```txt
Clamp or validate priority to the intended business range, likely 0-5, and audit old rows with priority > 5.
```

### Finding 2: Header Metrics Ignore Search Filter

After searching `TST-123`, the queue correctly shows one visible row, but these still reflect the full dataset:

- `Active queue`
- `Highest priority`
- `Next case to watch`
- status summary cards

This is confusing because the page simultaneously says:

```txt
1 visible
```

while the priority panel still points to a hidden unrelated old row.

Decision needed:

```txt
Option A: Header metrics always show global queue health.
Option B: Header metrics follow active filters/search.
Option C: Show both global and filtered labels explicitly.
```

Best recommendation:

```txt
Keep status summary global, but make "Visible cases" and "Next case to watch" follow the current filtered queue.
```

### Finding 3: Drawer Is Stronger Than The Queue

The seeded Mika drawer is clear and operator-ready:

- customer identity is visible
- plate and phone are easy to scan
- map/call/status actions are near the top
- progress is understandable
- internal notes are visible

The main queue still feels less controlled because old extreme-priority rows dominate the first view.

### Finding 4: Mock Marker Appears In Notes

The seeded marker appears inside internal notes:

```txt
[DESIGN_MOCK_RESCUE_20260518]
```

That is useful for cleanup, but it is visual noise for design comparison.

Recommended test fix:

```txt
Keep the marker in DB for cleanup, but hide the marker prefix in the UI when rendering notes.
```

## Skill Comparison Notes

`ui-ux-pro-max` gave the biggest product improvement:

```txt
It found the status enum mismatch and reshaped the page into a real dispatch workflow.
```

`taste-design` improved the screen atmosphere:

```txt
Better dispatch header, hierarchy, and loading skeleton.
```

`emil-design-eng` improved product feel:

```txt
Refresh timestamp, press feedback, status dots, exact transitions, and better canceled-case handling.
```

Current best pipeline for this screen:

```txt
ui-ux-pro-max
-> taste-design
-> emil-design-eng
-> browser review
```

## Open Follow-Up

- Decide whether Rescue design tests should isolate seeded rows.
- Decide whether filtered search should update `Next case to watch`.
- Clean or clamp old priority values.
- Hide design mock marker prefix from notes rendering.
