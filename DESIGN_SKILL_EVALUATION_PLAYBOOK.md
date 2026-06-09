# Design Skill Evaluation Playbook

Use this playbook to compare design skills against the same frozen test cases. The goal is not to find the most impressive single answer. The goal is to find which skills consistently improve real Mitra Auto screens without making the product less usable.

## Progress

```text
Overall: 15%
[######----------------------------------] 15%
```

- [x] Define testing method
- [x] Create Case 1 fixed brief
- [x] Add full design skill inventory
- [x] Run Case 1 skill tests v1: `ui-ux-pro-max`, `taste-design`, `emil-design-eng`
- [x] Score Case 1 outputs v1
- [ ] Create Case 2 fixed brief
- [ ] Run Case 2 skill tests
- [ ] Score Case 2 outputs
- [ ] Create Case 3 fixed brief
- [ ] Run Case 3 skill tests
- [ ] Score Case 3 outputs
- [ ] Create Case 4 fixed brief
- [ ] Run Case 4 skill tests
- [ ] Score Case 4 outputs
- [ ] Decide core / situational / ignore skill buckets

## Rules

- Use the same frozen input brief for every skill in the same case.
- Test one skill at a time before testing skill combinations.
- Save every output separately.
- Score the output before moving to the next skill.
- Do not let a skill invent unrelated features.
- Do not accept a prettier design if it makes staff workflow slower.
- Keep existing stack, CMS structure, and backend constraints unless the test explicitly allows a concept-only direction.
- For implementation tests, use browser verification after code changes.

## Full Skill Inventory To Test

This inventory keeps the evaluation complete. Do not run every skill for every case. Pick the relevant group for the case, then compare only the skills that should realistically help that screen.

### Taste / Creative Direction

Use these to define visual point of view before implementation.

- [ ] `taste-skill`
- [ ] `gpt-tasteskill`
- [ ] `taste-design`
- [ ] `brandkit`
- [ ] `brand`

### UX / Product Design

Use these when hierarchy, workflow, density, or product structure is the main issue.

- [ ] `ui-ux-pro-max`
- [ ] `design`
- [ ] `design-system`
- [ ] `ui-styling`

### Style-Specific Skills

Use these only when testing a specific aesthetic direction.

- [ ] `minimalist-skill`
- [ ] `brutalist-skill`
- [ ] `soft-skill`
- [ ] `banner-design`

### Redesign / Critique

Use these after inspecting an existing screen.

- [ ] `redesign-skill`
- [ ] `emil-design-eng`
- [ ] `uncodixfy`

### Image / Frontend Generation

Use these when visual references, mockups, image generation, or image-to-code comparison is useful.

- [ ] `image-to-code-skill`
- [ ] `imagegen-frontend-web`
- [ ] `imagegen-frontend-mobile`
- [ ] `stitch-skill`
- [ ] `stitch-design`
- [ ] `figma-implement-design`

### Output / Presentation

Use these when the result needs to be packaged, explained, or presented.

- [ ] `output-skill`
- [ ] `slides`

## Skill Group Test Matrix

Use this matrix to avoid running irrelevant skills on the wrong case.

| Case | Primary skills | Optional skills |
| --- | --- | --- |
| Dashboard / CMS operations | `ui-ux-pro-max`, `design-system`, `redesign-skill`, `emil-design-eng`, `uncodixfy` | `taste-skill`, `ui-styling`, `minimalist-skill` |
| Landing / hero | `brandkit`, `brand`, `taste-skill`, `banner-design`, `ui-styling` | `gpt-tasteskill`, `imagegen-frontend-web`, `soft-skill` |
| Settings / form | `ui-ux-pro-max`, `design-system`, `ui-styling`, `uncodixfy` | `minimalist-skill`, `emil-design-eng` |
| Existing weak screen | `redesign-skill`, `emil-design-eng`, `uncodixfy`, `gpt-tasteskill` | `taste-design`, `ui-styling` |
| Mobile screen | `ui-ux-pro-max`, `design-system`, `imagegen-frontend-mobile` | `minimalist-skill`, `soft-skill` |
| Figma/reference implementation | `figma-implement-design`, `image-to-code-skill`, `redesign-skill` | `ui-styling`, `uncodixfy` |

## Output Folder Convention

Save each result under:

```txt
design-skill-tests/
  case-01-rescue-24-7-dashboard/
    01-taste-skill.md
    02-ui-ux-pro-max.md
    03-design-system.md
    04-redesign-skill.md
    05-emil-design-eng.md
    scorecard.md
  case-02-tire-storage-dashboard/
  case-03-landing-hero/
  case-04-settings-form/
  case-05-redesign-existing-screen/
```

If a run includes code changes, add:

```txt
implementation-notes.md
browser-verification.md
```

## Standard Test Prompt

Use this prompt structure for every skill test.

```text
Project:
Mitra Auto

Screen:
[fixed case screen]

Current problem:
[fixed case problem]

Goal:
Improve this screen while preserving functionality.

Audience:
[fixed target user]

Constraints:
Use existing stack and components where possible.
Do not invent unrelated features.
Prioritize hierarchy, spacing, typography, color, interaction states, and polish.
Respect existing backend and data model.
Keep operational workflows fast.

Skill being tested:
[skill name]

Output required:
1. Diagnosis of current UI
2. Proposed design direction
3. Concrete changes
4. Implementation plan
5. Final UI/code changes if applicable
6. Risks or tradeoffs
```

## Scorecard

Score each skill from 1 to 5.

```text
Skill:
Case:
Score:

Taste:
UX clarity:
Originality:
Practicality:
Frontend usefulness:
Consistency with project:
Amount of generic AI design:
Keep / Maybe / Remove:
Notes:
```

Scoring guidance:

- `1`: Worse than default prompting or actively harmful.
- `2`: Some useful points, but too generic or impractical.
- `3`: Useful, but needs heavy human correction.
- `4`: Strong and practical; likely worth keeping.
- `5`: Consistently improves the product and gives implementation-ready direction.

## Case 1: Rescue 24/7 CMS Dashboard

### Purpose

Tests urgent operational layout, incident hierarchy, status clarity, action safety, drawer workflows, and whether a skill can improve a real finished-but-weak screen without damaging functionality.

### Seeded Test Data

The Rescue 24/7 database now contains fixed design-test rows tagged with:

```txt
[DESIGN_MOCK_RESCUE_20260518]
```

Seeded rows:

- `TST-123` Mika Virtanen, urgent Pasila engine cutout
- `EVL-804` Aino Laakso, Tesla low-voltage support
- `MBG-620` Jari Korhonen, Mercedes tire damage
- `VAN-447` Sofia Niemi, van pickup in Vantaa
- `BMW-318` Oskari Salmi, arrived at garage / diagnostics handoff
- Nora Hakala, missing plate manual-location case

Cleanup SQL when testing is finished:

```sql
delete from public.emergency_request_events e
using public.emergency_requests r
where r.id = e.request_id
  and r.internal_notes like '[DESIGN_MOCK_RESCUE_20260518]%';

delete from public.emergency_requests
where internal_notes like '[DESIGN_MOCK_RESCUE_20260518]%';
```

Important schema note:

```txt
The current DB enum allows received / assigned / resolved / canceled.
The current Rescue UI is written for received / processing / on_the_way / picking / at_garage.
This mismatch is part of the useful test evidence.
```

### Frozen Brief

```text
Project:
Mitra Auto

Screen:
CMS Rescue 24/7 dispatch board

Current problem:
The Rescue 24/7 screen is feature-complete enough for real workflow testing, but the UI is in poor shape. It needs better hierarchy, urgency signaling, queue scanning, drawer structure, action clarity, and visual polish without changing the real workflow.

Goal:
Improve the Rescue 24/7 CMS screen while preserving functionality. Staff must quickly understand active emergency cases, identify urgent requests, open a case, call the customer, open the map, progress status, assign a driver/operator, and read the timeline.

Audience:
Front desk staff, night dispatch, tow/roadside operators, and admin managers.

Constraints:
Use the existing React/Vite/Tailwind/shadcn/lucide stack.
Use existing CMS visual language where possible.
Do not change backend schema.
Do not write additional mock data unless explicitly requested.
Do not invent unrelated features.
Use the seeded DB rows tagged [DESIGN_MOCK_RESCUE_20260518].

Existing data source:
- emergency_requests
- emergency_request_events

Important data:
- emergency request id
- customer name
- license plate
- phone
- pickup location
- GPS/manual source
- status
- priority
- assigned operator/driver notes
- created/updated time
- internal notes
- event timeline

Design requirements:
- Staff can identify the most urgent case in under 5 seconds.
- Status and next action must be obvious.
- Customer call and map actions must be prominent.
- Location and license plate must be easy to scan.
- The drawer must support dispatch work without clutter.
- Status progression must feel safe and deliberate.
- Timeline should explain what happened without opening another page.
- The screen must feel operational, not like a marketing dashboard.

Skill being tested:
[skill name]

Output required:
1. Diagnosis of current UI
2. Proposed design direction
3. Concrete changes
4. Implementation plan
5. Final UI/code changes if applicable
6. Risks or tradeoffs
```

### Skills To Test

Run one at a time first:

- [ ] `taste-skill`
- [x] `ui-ux-pro-max`
- [ ] `design-system`
- [ ] `redesign-skill`
- [x] `emil-design-eng`
- [ ] `uncodixfy`
- [x] `taste-design`

Then test combinations:

- [ ] `ui-ux-pro-max -> design-system`
- [ ] `redesign-skill -> emil-design-eng -> uncodixfy`
- [ ] `taste-skill -> ui-ux-pro-max -> ui-styling`

### Case 1 Success Criteria

- [x] Clear operational hierarchy
- [x] Urgent/high-priority cases are visually hard to miss
- [x] Fast search and status filtering workflow
- [x] Scannable location, license plate, customer, and phone
- [x] Useful dispatch drawer
- [x] Safe status progression
- [x] Timeline is readable
- [x] Not generic AI dashboard design
- [x] Consistent with Mitra Auto CMS

Case 1 v1 scorecard:

```txt
design-skill-tests/case-01-rescue-24-7-dashboard/scorecard.md
```

Best v1 pipeline:

```txt
ui-ux-pro-max -> taste-design -> emil-design-eng -> browser review
```

## Case 2: Tire Storage Dashboard

Use this after Rescue 24/7 to test a newer operational screen with storage-specific workflow and large-data table needs.

Candidate screen:

```txt
/cms/tire-storage
```

## Case 3: Landing / Hero

Use this to test brand, first impression, visual impact, and conversion clarity.

Recommended skills:

- [ ] `brandkit`
- [ ] `brand`
- [ ] `taste-skill`
- [ ] `banner-design`
- [ ] `ui-styling`

Candidate screen:

```txt
Mitra Auto home page or Tire Hotel public service page
```

## Case 4: Settings / Form

Use this to test practical UX, input hierarchy, validation states, and low-glamour product UI.

Recommended skills:

- [ ] `ui-ux-pro-max`
- [ ] `design-system`
- [ ] `ui-styling`
- [ ] `uncodixfy`

Candidate screen:

```txt
Tire Storage check-in flow or CMS customer editor
```

## Case 5: Existing Weak Screen Redesign

Use this to test critique quality and improvement without breaking functionality.

Recommended skills:

- [ ] `redesign-skill`
- [ ] `emil-design-eng`
- [ ] `uncodixfy`
- [ ] `gpt-tasteskill`

Candidate screen:

```txt
Older CMS invoice/customer/order subpanel with dense controls
```

## Decision Buckets

After 3-5 cases, classify each skill.

### Core Skills

Use often. Must improve both design thinking and implementation direction.

Predicted candidates:

- `taste-skill`
- `ui-ux-pro-max`
- `design-system`
- `ui-styling`
- `redesign-skill`
- `emil-design-eng`
- `uncodixfy`
- `brandkit`

### Situational Skills

Use only for specific visual styles, content, or format needs.

Examples:

- `minimalist-skill`
- `brutalist-skill`
- `soft-skill`
- `banner-design`
- `imagegen-frontend-web`
- `imagegen-frontend-mobile`
- `stitch-skill`

### Ignore / Remove From Normal Workflow

Ignore skills that repeatedly:

- give generic advice
- overlap with a stronger skill
- make screens prettier but slower
- push one style too hard
- do not help implementation

## Final Ranking Template

```text
Skill:
Cases tested:
Average score:
Best use:
Weakness:
Bucket: Core / Situational / Ignore
Decision:
```
