# Account & Customer Development Board

This board tracks the CMS **Account & Customer** tab development step by step.

## Phase 1: Stable Foundation

- [x] Add `Account & Customer` CMS tab
- [x] Add role model: `super_admin`, `admin`, `supervisor`, `staff`, `customer`, `user`, `disabled`
- [x] Promote `phat.le@finepass.fi` to `super_admin`
- [x] Demote other CMS accounts to supervisor/admin level
- [x] Add `CmsAccessContext`
- [x] Connect tab visibility to CMS permissions
- [x] Fix Account & Customer tab crash
- [x] Keep tab modular and safe
- [x] Use RPC-only writes from the frontend

## Phase 2: Staff Account Management

- [x] Show staff/account list
- [x] Edit role
- [x] Edit account status
- [x] Edit display name
- [x] Edit module permissions
- [x] Hide account from normal lists
- [x] Add account by existing auth email
- [x] Suspend account
- [x] Soft-delete account
- [x] Prevent super admin from deleting/suspending self
- [x] Add permission presets
- [x] Add staff/account search
- [x] Add staff/account role filter
- [x] Add staff/account status filter
- [x] Add hidden-account toggle
- [x] Add staff account audit log UI
- [x] Add secure invite/create-account flow through Edge Function

## Phase 3: Customer Management

- [x] Show customer overview
- [x] Search customer by name/email/phone/plate
- [x] Create saved customer profile
- [x] Edit customer contact info
- [x] Edit customer business info
- [x] Edit customer address
- [x] Hide customer
- [x] Block customer
- [x] Soft-delete customer
- [x] Add/edit customer vehicle
- [x] Add customer notes
- [x] Improve customer detail layout
- [x] Add customer status filters
- [x] Add tag filters
- [x] Add hidden/deleted customer toggle for super admin
- [x] Add customer duplicate detection
- [x] Add customer merge flow

## Phase 4: Customer History

- [x] Show related bookings
- [x] Show related orders
- [x] Show related invoices/receipts
- [x] Add customer event timeline
- [x] Link from customer to booking/order/invoice pages
- [x] Add last-activity detail view

## Phase 5: License Plate Mapping & Fleet Grouping

- [x] Store customer vehicles/license plates under customer profiles
- [x] Allow license plate search in customer overview
- [x] Show related activity by saved customer license plates
- [x] Add `customer_type`: `personal`, `business`, `fleet`
- [x] Add bulk license plate import for business/fleet customers
- [ ] Add nullable `customer_id` and `customer_vehicle_id` links to bookings/schedule/orders/invoices/rescue records where missing
- [ ] Add automatic activity resolver by priority: `customer_id`, email, phone, license plate
- [ ] Store activity match source: `manual`, `email`, `phone`, `license_plate`, `auto_license_plate`
- [ ] Add suggested-link queue before fully automatic mapping
- [ ] Auto-link only high-confidence license plate matches
- [x] Detect duplicate active license plate ownership across customers
- [x] Block auto-link when plate appears under multiple active customers
- [x] Add conflict review UI for duplicate plate ownership
- [ ] Add unlink/correct mapping action for staff/super admin
- [ ] Add audit events for auto-link, manual-link, unlink, and conflict resolution
- [ ] Add GDPR export coverage for license plate and vehicle-link data
- [ ] Add GDPR anonymize/delete handling for vehicle and plate mappings

## Phase 6: Customer Account & Benefits Portal

- [ ] Add optional `account_id` / auth user link to customer profiles
- [ ] Support customer-owned account login for customer benefit page
- [ ] Show next appointment day
- [ ] Show booked service appointments
- [ ] Show scheduled pickup appointments
- [ ] Show next possible service date/check-in availability
- [ ] Show digital service book
- [ ] Track maintenance work history: fixes, parts changed, inspections, estimates
- [ ] Track service work history: cleaning, tire changes, seasonal services, routine checks
- [ ] Link service book entries to customer vehicles/license plates
- [ ] Link service book entries to CMS jobs, bookings, invoices, and staff notes
- [ ] Add customer benefit points
- [ ] Add discount tiers based on point thresholds
- [ ] Show customer benefit status in CMS Account & Customer
- [ ] Show customer benefit status in customer portal
- [ ] Add staff controls to adjust points with audit logging
- [ ] Add scheduled maintenance reminder rules per vehicle
- [ ] Track mileage/km targets for future maintenance reminders
- [ ] Track date-based maintenance reminders
- [ ] Schedule email notifications for upcoming maintenance work
- [ ] Schedule email notifications for appointment reminders
- [ ] Add notification history per customer
- [ ] Add unsubscribe/consent handling for marketing vs service-critical messages
- [ ] Let CMS staff see and manage all customer portal data

## Phase 7: Security & Audit

- [x] Avoid browser-side service-role/admin-auth operations
- [x] Add account event logging in SQL
- [x] Add customer event logging in SQL
- [x] Deploy secure account invite Edge Function
- [ ] Review all `security definer` RPCs
- [ ] Add stricter SQL parameter validation where needed
- [ ] Add audit log UI for customer changes
- [ ] Confirm RLS coverage for all customer/account tables
- [ ] Test role boundaries with real accounts

## Phase 8: PWA / Role Integration

- [x] Fix PWA login for new role model
- [x] Allow super admin into PWA
- [ ] Confirm supervisor PWA behavior
- [ ] Confirm disabled/deleted accounts cannot access PWA
- [ ] Confirm customer-only account sees only Customer tab

## Phase 9: QA

- [ ] Test as `phat.le@finepass.fi`
- [ ] Test as supervisor
- [ ] Test as staff
- [ ] Test as disabled account
- [ ] Test customer create/edit/delete
- [ ] Test account create/edit/delete
- [ ] Test mobile layout
- [ ] Test PWA installed app login
- [x] Run production build
- [x] Run Supabase lint
- [x] Apply current SQL migrations
- [x] Verify current remote functions/RPCs

## Current Remote SQL / Function State

- [x] `cms_get_customer_detail`
- [x] `cms_upsert_customer`
- [x] `cms_set_customer_status`
- [x] `cms_upsert_customer_vehicle`
- [x] `cms_add_customer_note`
- [x] `cms_list_customer_overview_v2`
- [x] `cms_merge_customers`
- [x] `cms_get_customer_history`
- [x] `cms_bulk_import_customer_plates`
- [x] `cms_list_license_plate_conflicts`
- [x] `cms_add_staff_account_by_email`
- [x] `cms_list_account_events`
- [x] Edge Function: `cms_account_invite`

## License Plate Mapping Rules

- License plate is treated as customer personal data under GDPR when linked to a person, business contact, or customer account.
- License plate can map activity into a customer account, but it should be treated as a matching signal, not the only identity.
- Matching priority:
  1. Existing `customer_id`
  2. Email
  3. Phone
  4. License plate
- Fleet/business model:
  - One customer profile can own many vehicles/license plates.
  - Adding a list of plates to a fleet customer should group matching activity under that customer.
  - If a plate exists under more than one active customer, automatic mapping must stop and create a review conflict.
- Every automatic or manual mapping change must be auditable.
- Staff must be able to unlink or correct wrong mappings.

## Customer Account / Benefit Portal Rules

- A customer profile can later be linked to an auth account.
- Customer account access must be separated from CMS staff access.
- Customer portal data should be read-only by default, except customer-controlled profile preferences.
- Service-critical emails, appointment reminders, and marketing/benefit emails must respect different consent rules.
- Digital service book entries must be tied to a vehicle where possible.
- Maintenance reminders should support both date-based and mileage/km-based triggers.
- Point and discount changes must be auditable.
- CMS Account & Customer must remain the staff control center for all customer portal data.

## Recommended Next Step

Continue with **Phase 5: License Plate Mapping & Fleet Grouping**, starting with:

- [ ] Add suggested-link queue for license plate matches
- [ ] Add nullable `customer_id` and `customer_vehicle_id` links to bookings/schedule/orders/invoices/rescue records where missing
- [ ] Add automatic activity resolver by priority: `customer_id`, email, phone, license plate
- [ ] Add unlink/correct mapping action for staff/super admin
