# Case 1 Scorecard: Rescue 24/7 CMS Dashboard

## Scope

This scorecard covers the first complete Case 1 run against the Rescue 24/7 CMS screen.

Skills actually tested in code and browser:

- `ui-ux-pro-max`
- `taste-design`
- `emil-design-eng`

Skills still open for future Case 1 comparison:

- `taste-skill`
- `design-system`
- `redesign-skill`
- `uncodixfy`

## Test Evidence

Inputs:

- fixed Rescue 24/7 brief in `DESIGN_SKILL_EVALUATION_PLAYBOOK.md`
- seeded Supabase rows tagged `[DESIGN_MOCK_RESCUE_20260518]`
- local browser review at `http://127.0.0.1:3000/cms#rescue`

Verification:

```txt
npm run build: pass
npm run i18n:audit: pass
git diff --check: pass
browser review: pass with UX findings
```

## Scores

Scores use 1-5 scale.

| Skill | Taste | UX clarity | Originality | Practicality | Frontend usefulness | Project consistency | Generic AI risk | Overall | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `ui-ux-pro-max` | 3 | 5 | 4 | 5 | 5 | 4 | 2 | 5 | Core candidate |
| `taste-design` | 5 | 3 | 4 | 4 | 4 | 4 | 2 | 4 | Situational/core visual pass |
| `emil-design-eng` | 4 | 4 | 3 | 5 | 5 | 5 | 1 | 4 | Core polish pass |

Generic AI risk score:

```txt
1 = low risk
5 = high risk
```

## Ranking

### 1. `ui-ux-pro-max`

Best use:

```txt
First pass on complex operational screens where workflow, hierarchy, action safety, and data model fit matter.
```

Why it won this case:

- found the real status enum mismatch
- changed the page from a generic CMS view into a dispatch board
- improved queue sorting, priority handling, and action flow
- avoided invalid Supabase status updates

Weakness:

```txt
Visual finish was solid but not enough by itself. It needed a second design pass.
```

Decision:

```txt
Keep as core skill for dashboard/operations work.
```

### 2. `emil-design-eng`

Best use:

```txt
Final product-quality pass after the main UX structure is already correct.
```

Why it scored high:

- added exact press feedback and transitions
- added last-refresh confidence signal
- added status dots for faster scanning
- fixed canceled-case messaging
- improved details without disrupting workflow

Weakness:

```txt
It is not the best first-pass redesign skill. It shines after structure exists.
```

Decision:

```txt
Keep as core polish skill.
```

### 3. `taste-design`

Best use:

```txt
Visual hierarchy and screen atmosphere pass after the product workflow is established.
```

Why it helped:

- improved first impression
- made the dispatch header feel more urgent
- improved metric rhythm
- added queue-shaped skeleton loading
- reduced generic dashboard feeling

Weakness:

```txt
It did not discover the deeper workflow/data mismatch. It should not be used alone for operational CMS screens.
```

Decision:

```txt
Keep as situational/core visual direction skill, especially between UX structure and final polish.
```

## Best Pipeline From Case 1

Recommended order:

```txt
ui-ux-pro-max
-> taste-design
-> emil-design-eng
-> browser review
```

Reason:

```txt
ui-ux-pro-max fixes product structure.
taste-design improves visual hierarchy.
emil-design-eng improves product feel and small interaction details.
browser review catches real data and layout issues.
```

## Product Findings From Browser Review

These findings are not skill failures. They are product/data issues exposed by the test.

### 1. Old Rows Pollute The Test

Old rescue rows with `priority 100` dominate:

- `Highest priority`
- `Next case to watch`
- first queue rows

Recommended patch:

```txt
Clamp/validate rescue priority to 0-5 and audit old priority > 5 rows.
```

### 2. Filtered Queue And Header Metrics Disagree

After searching `TST-123`, the queue shows one visible case, but the priority panel still points to a hidden old case.

Recommended patch:

```txt
Make "Visible cases" and "Next case to watch" follow the current filtered queue.
Keep status summary global unless explicitly labeled as filtered.
```

### 3. Mock Marker Shows In Notes

The DB cleanup marker appears in internal notes:

```txt
[DESIGN_MOCK_RESCUE_20260518]
```

Recommended patch:

```txt
Hide the marker prefix in rendered notes while keeping it in DB for cleanup.
```

## Case 1 Decision

Case 1 v1 is complete for the first three skills.

Keep testing additional skills only if we need more evidence. For practical production work, the best current pipeline is already clear:

```txt
ui-ux-pro-max -> taste-design -> emil-design-eng
```
