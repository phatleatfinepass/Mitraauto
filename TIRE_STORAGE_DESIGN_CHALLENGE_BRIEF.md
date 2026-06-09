# Tire Storage Design Challenge Brief

Use this brief in a new design-focused chat. The goal is to explore and compare UI design approaches for the Tire Storage / Tire Hotel CMS page before implementation.

## Product Purpose

Tire Storage is a CMS module for managing customer-owned tire sets physically stored by the garage.

It is not product catalog inventory. It is customer inventory tied to:

- customer
- vehicle / license plate
- physical storage location
- tire set condition
- check-in / check-out lifecycle
- seasonal tire change bookings
- payment / renewal status

## Target Users

- Front desk staff
- Mechanic / storage worker
- Admin / manager

Secondary future user:

- Customer viewing stored tires in account portal

## Main UI Problem

The current real workflow lives in an Excel file. Staff need a fast operational screen that replaces spreadsheet search and manual notes.

The UI must make these tasks easy:

- find tire set by license plate, phone, name, or storage location
- see if the set is currently stored, removed, damaged, or reserved
- check in a tire set
- check out a tire set
- assign physical location
- review imported Excel rows
- link storage to customer, vehicle, booking, and order

## Current Data Reality

Legacy Excel columns:

- `SN`
- `Päivämärä`
- `Nimi`
- `K`
- `Puhelin numero`
- `Rekkari`
- `Renkaiden merkit`
- `Vantet`
- `Koko`
- `Määrä`
- `Aika`
- `Hinta`
- `Lisätiedot`

Known meanings:

- `K` likely means shelf/location number, not enough by itself for exact position.
- Physical location should support container + position inside container + shelf/rack/row.
- `Määrä` means number of tires.
- `Hinta` values `60 / 90` mean storage-only vs storage plus service.

Important: imported rows may have mixed notes in quantity/status fields. The UI needs a review queue.

## Current Backend Foundation

Backend migration exists:

```txt
supabase/migrations/20260517215333_tire_storage_backend_v1.sql
```

Tables:

```txt
tire_storage_locations
tire_storage_import_rows
tire_storage_sets
tire_storage_events
tire_storage_photos
```

RPCs:

```txt
tire_storage_normalize_plate(text)
cms_tire_storage_list(search, status, limit, offset)
cms_tire_storage_get(storage_set_id)
cms_tire_storage_upsert_set(storage_set_id, payload)
cms_tire_storage_check_out(storage_set_id, reason, booking_id, order_id, notes)
cms_tire_storage_return_to_storage(storage_set_id, location_id, notes)
cms_tire_storage_assign_location(storage_set_id, location_id, notes)
cms_tire_storage_approve_import_row(import_row_id, payload)
```

## Design Skill Map

### Taste / Creative Direction

Use these to define visual point of view before touching code.

- `taste-skill`: General taste improvement, visual direction, stronger UI judgment.
- `gpt-tasteskill`: Taste critique and alternate direction comparison.
- `taste-design`: Existing taste/design direction skill.
- `brandkit`: Brand identity, tone, palette, typography, visual system.
- `brand`: Brand strategy and identity direction.

### UX / Product Design

Use these when the screen needs better structure, hierarchy, or workflows.

- `ui-ux-pro-max`: Main design challenge driver.
- `design`: General product and interface design.
- `design-system`: Components, spacing, typography scale, tokens, consistency.
- `ui-styling`: Final styling pass for polish and consistency.

### Style-Specific Skills

Use one only when a clear aesthetic is desired.

- `minimalist-skill`: Clean, restrained, simple interfaces.
- `brutalist-skill`: Bold, raw, high-contrast, opinionated interfaces.
- `soft-skill`: Softer, friendly, approachable visual design.
- `banner-design`: Hero/banner or promotional surfaces.

### Redesign / Critique

Use these after inspecting an existing screen.

- `redesign-skill`: Improve existing UI while preserving functionality.
- `emil-design-eng`: Design-engineering critique and polish.
- `uncodixfy`: Removes generic AI-looking frontend patterns.

### Image / Frontend Generation

Use when images, mockups, or visual references are involved.

- `image-to-code-skill`
- `imagegen-frontend-web`
- `imagegen-frontend-mobile`
- `stitch-skill`
- `figma-implement-design`

### Output / Presentation

Use when the result needs to be organized or documented.

- `output-skill`
- `slides`
- `stitch-design`

## Recommended Skill Order

Default:

```txt
taste-skill
-> ui-ux-pro-max
-> design-system
-> ui-styling
-> redesign-skill
-> frontend implementation
-> browser verification
```

If the project already has good UX but weak visuals:

```txt
redesign-skill
-> emil-design-eng
-> ui-styling
-> uncodixfy
```

If the project has weak product structure:

```txt
ui-ux-pro-max
-> design-system
-> taste-skill
-> implementation
```

If the project needs stronger brand identity:

```txt
brandkit
-> taste-skill
-> design-system
-> ui-styling
```

## Screens To Design

### 1. Main Tire Storage List

Must include:

- search
- status filters
- storage location filters
- quick stats
- table/list of stored tire sets
- fast actions: check in, check out, assign location, edit

### 2. Tire Storage Detail Drawer

Must include:

- customer and vehicle summary
- tire/rim details
- storage location
- status
- condition notes
- tread depth
- photos
- linked booking/order
- event timeline

### 3. Check-In Flow

Must include:

- customer lookup
- vehicle/license plate lookup
- tire/rim details
- quantity
- location assignment
- price/package
- photos/notes

### 4. Import Review Queue

Must include:

- raw Excel row
- parsed result
- warning badges
- approve/reject/edit
- duplicate detection

## Success Criteria

The design is successful if:

- staff can find a tire set in under 10 seconds
- storage location is always visible and scannable
- check-in/check-out actions are obvious
- imported rows can be reviewed without opening Excel
- bad/damaged tires are visually hard to miss
- customer/vehicle/booking links are visible without clutter
- the UI feels operational, not like a marketing page
- it works well with large data volume
- it fits the existing CMS design system

## Prompt For New Chat

```text
I want to run a design challenge for the Tire Storage / Tire Hotel CMS page in this existing Mitra Auto project.

First inspect the codebase and current CMS UI. Then choose the best design skills from my installed skill set.

Use this file as context:
TIRE_STORAGE_DESIGN_CHALLENGE_BRIEF.md

Create a project-specific design challenge brief with:
- product purpose
- target user
- current UI weaknesses
- best skill execution order
- visual direction
- screens to improve
- success criteria

Then design the first challenge for the Tire Storage main CMS screen. Do not implement backend. If implementing UI, keep it frontend-only and verify in browser.
```

## Implementation Boundary

This design challenge should not modify the Tire Storage backend schema unless explicitly requested.

The backend implementation plan lives in:

```txt
TIRE_STORAGE_BACKEND_DEVELOPMENT_PLAN.md
```
