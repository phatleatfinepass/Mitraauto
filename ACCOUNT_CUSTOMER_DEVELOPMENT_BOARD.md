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

- [ ] Show related bookings
- [ ] Show related orders
- [ ] Show related invoices/receipts
- [ ] Add customer event timeline
- [ ] Link from customer to booking/order/invoice pages
- [ ] Add last-activity detail view

## Phase 5: Security & Audit

- [x] Avoid browser-side service-role/admin-auth operations
- [x] Add account event logging in SQL
- [x] Add customer event logging in SQL
- [x] Deploy secure account invite Edge Function
- [ ] Review all `security definer` RPCs
- [ ] Add stricter SQL parameter validation where needed
- [ ] Add audit log UI for customer changes
- [ ] Confirm RLS coverage for all customer/account tables
- [ ] Test role boundaries with real accounts

## Phase 6: PWA / Role Integration

- [x] Fix PWA login for new role model
- [x] Allow super admin into PWA
- [ ] Confirm supervisor PWA behavior
- [ ] Confirm disabled/deleted accounts cannot access PWA
- [ ] Confirm customer-only account sees only Customer tab

## Phase 7: QA

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
- [x] `cms_add_staff_account_by_email`
- [x] `cms_list_account_events`
- [x] Edge Function: `cms_account_invite`

## Recommended Next Step

Continue with **Phase 4: Customer History**, starting with:

- [ ] Show related bookings
- [ ] Show related orders
- [ ] Show related invoices/receipts
- [ ] Add customer event timeline
