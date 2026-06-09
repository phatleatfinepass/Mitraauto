# Tire Storage Backend Development Plan

Progress: `21%`

`[███████████---------------------------------------] 21%`

Last updated: 2026-05-18

## Goal

Build Tire Storage / Tire Hotel as customer-owned physical inventory. This is separate from the product catalog. Catalog items are products for sale; Tire Storage records are tires already owned by customers and stored by the garage.

Target lifecycle:

```txt
Legacy Excel / manual check-in
-> Tire Storage staging or direct storage set
-> CMS Tire Storage operations
-> booking/order linkage
-> customer account visibility
-> notifications, renewal, billing
```

## Current Backend Readiness

- [x] Existing Excel file inspected: `Talvikauden hotelli - 10.2025-4.2026.xlsx`
- [x] Main source sheet identified as `Sheet1`
- [x] Current columns mapped: date, customer, phone, license plate, tire text, rim text, size, quantity/status notes, term, price, notes
- [x] Confirmed data is a human ledger and needs staging/review before becoming clean records
- [x] Confirmed `K` is likely a shelf/location number, not enough by itself for exact physical position
- [x] Backend foundation migration created and applied: `20260517215333_tire_storage_backend_v1.sql`
- [x] Live backend smoke test passed inside rollback transaction

## Phase 0 - Data Understanding And Import Rules

Progress: `100%`

`[██████████████████████████████████████████████████] 100%`

- [x] Inspect workbook sheets
- [x] Identify useful sheet and ignore unrelated `Sheet2`
- [x] Count rows and missing critical fields
- [x] Identify messy fields that need parsing
- [x] Detect removed/checked-out rows from text like `poistettu`, `poistu`, `hakenut`
- [x] Detect no-contract rows from text like `ei ole sopimus`
- [x] Detect damaged-condition rows from text like `huono`, `rikki`, `naula`
- [x] Detect new-storage rows from text like `Uusi hotelli`
- [x] Confirm with client what `K` means exactly enough for v1: likely shelf/location number
- [x] Confirm storage location format: container position + shelf/rack/row
- [x] Confirm `Hinta = 60 / 90` means storage-only vs storage plus service
- [x] Confirm `Määrä` means number of tires

Phase 0 notes:

- `K` should be treated as a legacy location hint, probably shelf/location number.
- New backend location model should support: container, position inside container, shelf, rack, row, and slot.
- `60 / 90` prices should be mapped as service package difference:
  - `60`: storage-only or reduced storage package
  - `90`: storage plus service package
- `Määrä` means number of tires. Import parser should extract numeric tire count when possible. If the cell contains text mixed with quantity/status notes, keep the raw text in notes, extract the confident tire count, and mark unclear rows for review.

## Phase 1 - Backend Foundation

Progress: `100%`

`[██████████████████████████████████████████████████] 100%`

- [x] Add CMS permission module: `tire_storage`
- [x] Add helper: `tire_storage_normalize_plate(text)`
- [x] Create `tire_storage_locations`
- [x] Create `tire_storage_import_rows`
- [x] Create `tire_storage_sets`
- [x] Create `tire_storage_events`
- [x] Create `tire_storage_photos`
- [x] Add indexes for status, plate, customer, vehicle, location, and text search
- [x] Enable RLS on all Tire Storage tables
- [x] Add CMS read/write RLS policies
- [x] Grant Data API access to `authenticated` and `service_role`
- [x] Add updated-at triggers
- [x] Add table comments
- [x] Apply migration to Supabase
- [x] Verify live read/write with current super admin

## Phase 2 - Admin RPC Layer

Progress: `85%`

`[██████████████████████████████████████████--------] 85%`

- [x] Add `cms_tire_storage_list`
- [x] Add `cms_tire_storage_get`
- [x] Add `cms_tire_storage_upsert_set`
- [x] Add `cms_tire_storage_check_out`
- [x] Add `cms_tire_storage_return_to_storage`
- [x] Add `cms_tire_storage_assign_location`
- [x] Add `cms_tire_storage_approve_import_row`
- [x] Verify list/get/create/check-out/return in rollback transaction
- [x] Verify legacy import approval in rollback transaction
- [ ] Add `cms_tire_storage_add_photo`
- [ ] Add `cms_tire_storage_update_condition`
- [ ] Add `cms_tire_storage_mark_reserved_for_service`
- [ ] Add `cms_tire_storage_link_customer_vehicle`
- [ ] Add `cms_tire_storage_link_booking_order`

## Phase 3 - Excel Import Backend

Progress: `15%`

`[████████------------------------------------------] 15%`

- [x] Add staging table for import rows
- [x] Add approval function from staging row to real storage set
- [ ] Create local import script for the current Excel workbook
- [ ] Parse Finnish status text into structured fields
- [ ] Parse price into cents
- [ ] Normalize license plates
- [ ] Normalize phone numbers
- [ ] Parse `Määrä` into numeric tire quantity
- [ ] Preserve non-quantity `Määrä` text as notes/status flags
- [ ] Identify likely active, removed, no-contract, and needs-review rows
- [ ] Insert all Excel rows into `tire_storage_import_rows`
- [ ] Produce import summary counts
- [ ] Add import dry-run mode
- [ ] Add duplicate detection by license plate + customer + size

## Phase 4 - CMS Tire Storage UI

Progress: `0%`

`[--------------------------------------------------] 0%`

- [ ] Add CMS tab/module entry for Tire Storage
- [ ] Add Tire Storage list page
- [ ] Search by license plate, name, phone, tire size, tire brand, storage location
- [ ] Filter by status: stored, reserved, checked out, disposed, damaged, needs review
- [ ] Add storage detail drawer
- [ ] Add create/edit form
- [ ] Add check-in action
- [ ] Add check-out action
- [ ] Add return-to-storage action
- [ ] Add assign location action
- [ ] Add condition/tread-depth editor
- [ ] Add photo upload UI
- [ ] Add event history timeline
- [ ] Add import review queue UI

## Phase 5 - Customer And Vehicle Linking

Progress: `0%`

`[--------------------------------------------------] 0%`

- [ ] Search existing customers by phone/name/email during storage creation
- [ ] Search existing vehicles by license plate
- [ ] Link storage set to `customers.id`
- [ ] Link storage set to `customer_vehicles.id`
- [ ] Create customer from storage row if needed
- [ ] Create vehicle from storage row if needed
- [ ] Show Tire Storage records in customer detail
- [ ] Show Tire Storage records in vehicle detail
- [ ] Add customer event when storage set is created/updated/checked out

## Phase 6 - Booking And Order Integration

Progress: `0%`

`[--------------------------------------------------] 0%`

- [ ] Booking flow can detect stored tires by license plate
- [ ] Customer can choose "use stored tires"
- [ ] Booking links to tire storage set
- [ ] CMS order/schedule shows storage location
- [ ] Mechanic can mark set picked from storage
- [ ] Mechanic can mark old set returned to storage
- [ ] Order completion can update storage status
- [ ] Bad-condition warning appears in booking/order

## Phase 7 - Customer Account

Progress: `0%`

`[--------------------------------------------------] 0%`

- [ ] Customer account shows stored tire sets
- [ ] Show tire/rim details
- [ ] Show photos
- [ ] Show condition notes and tread depths
- [ ] Show next recommended seasonal change
- [ ] Let customer request tire change using stored tires
- [ ] Let customer request disposal/removal

## Phase 8 - Billing And Renewal

Progress: `0%`

`[--------------------------------------------------] 0%`

- [ ] Store payment status
- [ ] Store seasonal/yearly price
- [ ] Add renewal due date
- [ ] Add unpaid storage list
- [ ] Link storage fee to order/invoice
- [ ] Add renewal reminder queue
- [ ] Add disposal/removal fee handling if needed

## Phase 9 - Notifications

Progress: `0%`

`[--------------------------------------------------] 0%`

- [ ] Storage check-in confirmation template
- [ ] Storage check-out confirmation template
- [ ] Seasonal change reminder template
- [ ] Renewal reminder template
- [ ] Bad-condition warning template
- [ ] Customer requested disposal/removal notification
- [ ] Admin notification for unresolved import rows

## Phase 10 - QA And Production Readiness

Progress: `0%`

`[--------------------------------------------------] 0%`

- [ ] Backend RPC permission tests
- [ ] RLS read/write tests
- [ ] Import dry-run test using real Excel
- [ ] Import approval test
- [ ] CMS create/edit/check-in/check-out test
- [ ] Booking integration test
- [ ] Order integration test
- [ ] Customer account visibility test
- [ ] Notification preview test
- [ ] Full rollback and recovery checklist

## Key Open Questions

- [x] Does `K` always mean `kontti`, or can it also mean another storage area?
- [ ] What does `K = s` mean in the Excel file?
- [x] Should storage location be only container number or detailed slot?
- [x] Should `Hinta` be invoiced immediately, later, or only recorded manually?
- [ ] Should customers see Tire Storage before they have a portal account?
- [ ] Should removed rows remain as archive records or only import history?

## Backend Tables

```txt
tire_storage_locations
tire_storage_import_rows
tire_storage_sets
tire_storage_events
tire_storage_photos
```

## Backend RPCs

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

## Suggested Next Step

Start Phase 3: build the Excel import script in dry-run mode, import the legacy rows into staging, and create a CMS review queue before approving records into real Tire Storage sets.
