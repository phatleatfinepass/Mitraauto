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
- [x] Remove permission presets and manage module access directly
- [x] Add staff/account search
- [x] Add staff/account role filter
- [x] Add staff/account status filter
- [x] Add hidden-account toggle
- [x] Keep staff account audit events at backend level
- [x] Add secure invite/create-account flow through Edge Function
- [x] Add explicit `Send active link` action after account creation
- [x] Move active-link sending into the selected account access panel
- [x] Add secure staff account delete Edge Function
- [x] Delete staff account from both CMS profile access and Supabase Auth
- [x] Add browser confirmation before staff account delete

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
- [x] Add license plate conflict actions: merge customer, allow shared plate, or move plate ownership/activity to one customer

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
- [x] Add nullable `customer_id` and `customer_vehicle_id` links to bookings/schedule/orders/invoices/rescue records where missing
- [x] Add automatic activity resolver by priority: `customer_id`, email, phone, license plate
- [x] Store activity match source: `manual`, `email`, `phone`, `license_plate`, `auto_license_plate`
- [x] Add suggested-link queue before fully automatic mapping
- [x] Auto-link only high-confidence license plate matches
- [x] Detect duplicate active license plate ownership across customers
- [x] Block auto-link when plate appears under multiple active customers
- [x] Add conflict review UI for duplicate plate ownership
- [x] Add unlink/correct mapping action for staff/super admin UI
- [x] Add audit events for manual-link and unlink
- [x] Add audit events for auto-link
- [x] Add audit events for conflict resolution
- [x] Add GDPR export coverage for license plate and vehicle-link data
- [x] Add GDPR anonymize/delete handling for vehicle and plate mappings

## Phase 6: Customer Account & Benefits Portal

- [x] Add optional `account_id` / auth user link to customer profiles
- [x] Support customer-owned account login for customer benefit page
- [x] Show next appointment day
- [x] Show booked service appointments
- [x] Show scheduled pickup appointments
- [x] Show next possible service date/check-in availability
- [x] Show digital service book
- [x] Add service book entry table foundation for maintenance, service, inspection, estimate, repair, tire, cleaning, and notes
- [x] Add service book links to customer vehicles/license plates
- [x] Add service book source links for CMS jobs, bookings, invoices, and staff notes
- [x] Add customer benefit points
- [x] Add discount tiers based on point thresholds
- [x] Show customer benefit status in CMS Account & Customer
- [x] Show customer benefit status in customer portal
- [x] Add staff controls to adjust points with audit logging
- [x] Add maintenance reminder table foundation per vehicle
- [x] Track mileage/km targets for future maintenance reminders
- [x] Track date-based maintenance reminders
- [x] Schedule email notifications for upcoming maintenance work
- [x] Schedule email notifications for appointment reminders
- [x] Add notification history table foundation per customer
- [x] Add unsubscribe/consent handling for marketing vs service-critical messages
- [x] Let CMS staff see and manage customer account link, portal access, and benefit points
- [x] Add CMS action to create customer portal Auth account from customer profile
- [x] Add CMS action to send customer portal activation/password setup link
- [x] Link created customer Auth account to `customers.account_id` and enable portal access
- [x] Use customer-facing activation email copy that points to customer portal, not CMS
- [x] Add CMS editor for service book entries
- [x] Add CMS editor for maintenance reminders
- [x] Add CMS view for notification history

## Phase 7: Security & Audit

- [x] Avoid browser-side service-role/admin-auth operations
- [x] Add account event logging in SQL
- [x] Add customer event logging in SQL
- [x] Deploy secure account invite Edge Function
- [x] Deploy secure account action Edge Function
- [x] Add CMS password reset/change flow
- [x] Require Supabase TOTP MFA before rendering CMS admin UI
- [x] Remove passkey/WebAuthn rollout because hosted Supabase project exposes TOTP only
- [x] Keep CMS MFA as TOTP-only for now
- [x] Keep customer portal MFA optional / not mandatory
- [x] Add server-side AAL2 checks to high-risk CMS RPCs after staff MFA enrollment is tested
- [x] Add stricter SQL parameter validation where needed
- [x] Restrict customer notification queue RPCs to service-role/postgres execution
- [x] Confirm RLS coverage for all customer/account tables
- [x] Move service book writes behind audited CMS RPCs
- [x] Move maintenance reminder writes behind audited CMS RPCs
- [x] Revoke browser write grants from service book, reminder, and notification history tables
- [x] Add audit log UI for customer changes
- [x] Review Account & Customer `security definer` RPC execute grants
- [x] Revoke `PUBLIC`/`anon` execute from public `cms_%` and `customer_%` RPCs
- [x] Require server-side AAL2 before CMS password-change Edge Function can update passwords
- [x] Harden customer vehicle/note write RPC object checks
- [x] Filter `super_admin` customer notes from normal GDPR export
- [x] Restrict GDPR anonymize/delete RPC to super admin with verified MFA
- [x] Review remaining function bodies for all Account & Customer `security definer` RPCs
- [x] Verify database-side role boundaries for existing super admin and disabled accounts
- [x] Test database-side role matrix with rollback fixtures for super admin, admin, supervisor, staff, customer, and disabled

## Phase 8: PWA / Role Integration

- [x] Fix PWA login for new role model
- [x] Allow super admin into PWA
- [x] Move browser role-boundary QA from Phase 7 into Phase 8 / final QA
- [x] Confirm supervisor PWA behavior at permission/RPC layer
- [x] Confirm staff PWA behavior follows module permissions at permission/RPC layer
- [x] Confirm disabled/deleted accounts cannot access PWA at permission/RPC layer
- [x] Confirm customer-only account cannot access CMS PWA at permission/RPC layer
- [x] Confirm customer-only account should not enter CMS; customer access belongs in the separate customer portal/PWA
- [ ] Browser role-boundary QA with real supervisor, staff, disabled/deleted, and customer-only accounts

## Phase 8 Local Verification State

- [x] `CmsPwaScreen` explicitly rejects non-staff roles before checking PWA module permissions
- [x] Rollback PWA matrix verified super admin and admin can access CMS PWA
- [x] Rollback PWA matrix verified staff with `orders: read` can access CMS PWA
- [x] Rollback PWA matrix verified supervisor remains customer-scope only and cannot access CMS PWA
- [x] Rollback PWA matrix verified customer-only and disabled/deleted accounts cannot access CMS PWA
- [x] Customer-only account handling is documented as customer portal/PWA scope, not CMS scope
- [x] Linked remote rollback QA verified super admin, admin, supervisor, staff, customer, and disabled/deleted role boundaries
- [x] Browser smoke verified unauthenticated CMS PWA route renders login without console errors

## Phase 9: QA

- [ ] Test as `phat.le@finepass.fi`
- [ ] Test as supervisor
- [ ] Test as staff
- [ ] Test as disabled account
- [x] Test customer create/edit/delete at rollback RPC layer
- [ ] Test account create/edit/delete
- [ ] Test mobile layout
- [ ] Test PWA installed app login
- [x] Run production build
- [x] Run Supabase lint
- [x] Apply current SQL migrations
- [x] Verify current remote functions/RPCs
- [x] Browser smoke test `/account`, `/cms#account-customer`, and `/pwa/cms` without console errors

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
- [x] `cms_list_customer_link_suggestions`
- [x] `cms_link_customer_activity`
- [x] `cms_unlink_customer_activity`
- [x] History link metadata for booking/order/invoice/rescue rows
- [x] `cms_auto_link_customer_activities`
- [x] `cms_export_customer_data`
- [x] `cms_anonymize_customer`
- [x] `cms_add_staff_account_by_email`
- [x] `cms_list_account_events`
- [x] Edge Function: `cms_account_invite`
- [x] Edge Function: `cms_account_action`
- [x] Edge Function: `cms_customer_portal_account`

## Phase 6 Local SQL / Function State

- [x] Migration file: `20260505011815_account_customer_phase6_account_benefits_portal.sql`
- [x] `customers.account_id`
- [x] `customers.portal_enabled`
- [x] `customers.portal_invited_at`
- [x] `customer_benefits`
- [x] `customer_benefit_events`
- [x] `customer_service_book_entries`
- [x] `customer_maintenance_reminders`
- [x] `customer_notification_history`
- [x] `customer_benefit_tier_for_points`
- [x] `customer_benefit_tier_for_points` has fixed `search_path`
- [x] `cms_link_customer_account_by_email`
- [x] `cms_set_customer_portal_enabled`
- [x] `cms_adjust_customer_benefit_points`
- [x] `cms_list_customer_overview_v2` includes account and benefit fields
- [x] `cms_get_customer_detail` includes account and benefit fields
- [x] Phase 6 portal migration applied to remote Supabase
- [x] Phase 6 security hardening migration applied to remote Supabase
- [x] `customer_portal_get_account`
- [x] CMS service book editor UI for customer detail
- [x] CMS service book create/edit/delete through `customer_service_book_entries`
- [x] CMS maintenance reminder editor UI for customer detail
- [x] CMS maintenance reminder create/edit/delete through `customer_maintenance_reminders`
- [x] CMS notification history read-only view through `customer_notification_history`
- [x] Customer portal read model includes next appointment day, upcoming appointments, service-date hint, and pickup/order status
- [x] Phase 6 schedule read model migration applied to remote Supabase
- [x] Customer notification queue migration applied to remote Supabase
- [x] `customer_enqueue_due_notifications`
- [x] `customer_notification_claim_email_queue`
- [x] Cron job `customer_notifications_enqueue_due` queues due customer emails every 15 minutes
- [x] Edge Function: `customer_notification_worker`
- [x] Maintenance reminder email sender uses `service_critical` vs marketing consent rules
- [x] Appointment reminder email sender treats appointment reminders as service-critical messages
- [x] Customer account page route `/account` renders sanitized portal RPC data
- [x] Customer account page shows benefits, upcoming appointments, pickup, service book, reminders, and messages
- [x] Customer portal communication preferences RPCs applied to remote Supabase
- [x] Customer account page lets customers withdraw marketing/contact consent while preserving necessary service messages
- [x] Customer portal raw-table self-read policies removed; portal reads use sanitized RPC output
- [x] Permanent super admin logic uses active `profiles.role = 'super_admin'`
- [x] `phat.le@finepass.fi` confirmed as active `super_admin`
- [x] Customer account linking requires matching primary email unless super admin overrides
- [x] Supervisor customer access follows `cms_permissions`
- [x] Password reset/change flow added to CMS UI
- [x] CMS UI requires verified TOTP MFA / AAL2 before rendering admin pages
- [x] Customer portal login must not require TOTP by default
- [x] Customer portal RPC rollback QA verified linked account payload and vehicle data
- [x] Customer portal pickup schedule status cast bug fixed in `customer_portal_get_account`
- [x] Edge Function: `cms_customer_portal_account`
- [x] `cms_customer_portal_account` creates or attaches Auth user with `role = customer`
- [x] `cms_customer_portal_account` links Auth user to `customers.account_id` and enables portal access
- [x] `cms_customer_portal_account` sends customer-facing activation email to the customer portal route, not CMS
- [x] `cms_customer_portal_account` deployed to remote Supabase
- [x] Staff active-link email is explicit and staff-account scoped
- [x] Staff delete now removes Supabase Auth user through service-role Edge Function
- [ ] Run Supabase lint after local database is reachable
- [x] Old duplicate/date-only local-only migration files archived so normal `supabase db push` is clean
- [x] Linked Supabase advisors checked Account & Customer scope; remaining Account & Customer search-path warning fixed

## Phase 7 Local SQL / Function State

- [x] Migration file: `20260505143541_phase7_account_customer_security_hardening.sql`
- [x] Phase 7 security hardening migration applied to remote Supabase
- [x] `cms_has_verified_mfa`
- [x] `cms_require_verified_mfa`
- [x] `cms_has_permission` validates known module/action inputs
- [x] `cms_has_permission` requires verified AAL2/TOTP session for CMS write actions
- [x] `customer_notification_claim_email_queue` rejects non-service-role JWT callers
- [x] `customer_notification_claim_email_queue` execute grant restricted to `service_role` and owner roles
- [x] `customer_enqueue_due_notifications` execute grant restricted to `service_role` and owner roles
- [x] Remote RLS coverage verified for Account & Customer tables: `profiles`, `customers`, `customer_vehicles`, `customer_notes`, `customer_events`, `cms_account_events`, `customer_benefits`, `customer_benefit_events`, `customer_service_book_entries`, `customer_maintenance_reminders`, and `customer_notification_history`
- [x] Migration file: `20260505144826_phase7_customer_audit_rpc_hardening.sql`
- [x] Phase 7 customer audit RPC hardening migration applied to remote Supabase
- [x] `cms_upsert_customer_service_book_entry`
- [x] `cms_delete_customer_service_book_entry`
- [x] `cms_upsert_customer_maintenance_reminder`
- [x] `cms_delete_customer_maintenance_reminder`
- [x] Customer History `Timeline` tab renamed to `Audit log`
- [x] Service book and maintenance reminder create/update/delete events are written to `customer_events`
- [x] Migration file: `20260505145504_phase7_revoke_public_rpc_execute.sql`
- [x] Phase 7 public RPC execute revocation migration applied to remote Supabase
- [x] Remote grant inventory verified no `cms_%` or `customer_%` functions still expose execute through `PUBLIC` or `anon`
- [x] Edge Function `cms_account_password` requires `cms_has_verified_mfa`
- [x] Edge Function `cms_account_password` redeployed to remote Supabase
- [x] Migration file: `20260505150408_phase7_customer_rpc_body_hardening.sql`
- [x] Phase 7 customer RPC body hardening migration applied to remote Supabase
- [x] `cms_upsert_customer_vehicle` rejects deleted/merged customer targets
- [x] `cms_add_customer_note` rejects deleted/merged customer targets
- [x] `cms_export_customer_data` does not expose `super_admin` notes unless the caller is super admin
- [x] `cms_anonymize_customer` requires super admin and verified MFA
- [x] `cms_anonymize_customer` severs customer portal account links, disables portal access, scrubs customer-visible history, cancels reminders, anonymizes plates, and resets benefits
- [x] Final live function inventory verified all Account & Customer `security definer` RPCs have expected grants and authorization gates
- [x] Database-side role-boundary check verified `phat.le@finepass.fi` as active `super_admin` with account/customer access
- [x] Database-side role-boundary check verified deleted disabled account has no account/customer access
- [x] Rollback role matrix verified AAL2 write access and AAL1 write denial for super admin, admin, supervisor, staff read/write, customer, and disabled fixtures
- [x] Rollback CRUD/security QA verified customer save/edit, notes/status, vehicles, bulk plate import, benefits, portal link, service book, reminders, notification history, read-only write denial, suspended CMS/PWA denial, customer portal isolation, RLS coverage, GDPR export, GDPR anonymize, and audit-log secret checks

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

## Master QA Checklist

This checklist is the final acceptance gate for the whole **Account & Customer Development Board**. Run it after all phases are implemented, not only after Phase 6.

### Phase 1: Stable Foundation QA

- [x] `Account` tab appears for eligible CMS users.
- [x] Tab label is `Account` for super admin.
- [x] Tab label/scope is customer-only for non-account supervisors.
- [x] Tab opens without a crash.
- [x] `CmsAccessContext` provides current role and module permissions.
- [x] Tab visibility follows CMS permission rules.
- [x] Customer-only users cannot open staff/account controls.
- [x] Frontend writes use RPC or Edge Function paths only.
- [x] No service-role key is exposed in browser code.
- [x] Basic page layout works on desktop.
- [x] Basic page layout works on mobile.

Phase 1 evidence:
- Browser QA verified `/cms/account-customer` renders for `phat.le@finepass.fi` with `Account`, `Customer`, `Staff`, and account settings visible.
- Browser QA verified Customer/Staff switching has no crash and no console errors.
- Mobile viewport QA verified the Account page renders without horizontal document overflow.
- Code QA verified Account & Customer writes go through `cms_*` RPCs or Edge Functions; raw table access in this module is read-only.
- Remote SQL QA verified `phat.le@finepass.fi` is active, visible `super_admin`, no permanent hardcoded super-admin email remains in public functions, and customer-only profiles have no account/customer CMS permissions.
- Patch applied: `20260506061218_phase1_super_admin_visible.sql` unhid the designated super admin account for account-management QA.

### Phase 2: Staff Account Management QA

- [x] Super admin can load the Staff list.
- [x] Super admin can create a staff account from an existing Auth email at rollback RPC layer.
- [x] Super admin can create a new staff account with `Add account` UI and deployed invite Edge Function.
- [x] Newly created staff account appears in the Staff list after refresh at rollback RPC layer.
- [x] Newly created staff account is selected after creation by `refreshRows(profileId)` flow.
- [x] `Send active link` is visible in the selected account Permissions panel.
- [x] `Send active link` is disabled for deleted accounts.
- [x] `Send active link` sends a password setup email to the selected account email.
- [x] Setup email link opens CMS password setup on the production domain, not localhost, by Edge Function redirect construction.
- [x] `/cms/password-setup` renders the dedicated password setup form instead of the CMS login-required screen.
- [x] Recovery hash changes on `/cms/password-setup` are handled without stale expired-link state.
- [x] New staff account can set password from the active link.
- [x] New staff account can complete TOTP setup before entering CMS.
- [x] New staff account can log in after password setup and TOTP.
- [x] Super admin can edit display name at rollback RPC layer.
- [x] Super admin can edit role at rollback RPC layer.
- [x] Super admin can edit account status at rollback RPC layer.
- [x] Super admin can edit module permissions at rollback RPC layer.
- [x] Permission presets removed; permissions are managed directly in the compact module access table.
- [x] Save staff permissions persists after reload at rollback RPC layer.
- [x] Suspend blocks CMS and PWA access for that account at permission/RPC layer.
- [x] Hidden accounts are hidden when `Show hidden` is off.
- [x] Deleted accounts are hidden when `Show hidden` is off.
- [x] Delete account asks for confirmation.
- [x] Delete account disables profile access and removes Supabase Auth user by deployed `cms_account_action` Edge Function.
- [x] Deleted account cannot log in at permission/RPC layer.
- [x] Deleted account cannot receive password change by admin by Edge Function profile-status check.
- [x] Super admin cannot suspend self.
- [x] Super admin cannot delete self.
- [x] Non-super-admin cannot manage account permissions.
- [x] Account audit events are retained in the backend; visible account audit UI was removed.

Phase 2 evidence:
- Browser QA verified Staff tab loads for super admin, `phat.le@finepass.fi` appears, the Permissions panel renders, `Send active link` is visible, and self `Suspend` / `Delete account` buttons are disabled.
- Browser QA sent an active link to `phat.le@finepass.fi`, showed the success message, refreshed the audit list, and displayed `staff_account_setup_link_sent` with Gmail provider details.
- Browser QA verified `Add account` opens both `Existing user` and `Invite new user` create modes.
- Browser QA verified `Show hidden` off hides hidden/deleted rows in the visible staff list.
- Rollback SQL QA verified existing-auth account add, staff-list visibility, display name/role/status/hidden/permission update persistence, account audit creation, self-demotion block, non-super-admin denial, and MFA-required write denial.
- Static Edge Function QA verified `cms_account_invite` builds setup links with non-localhost production redirect and `cms_account_action` soft-deletes the profile before deleting the Supabase Auth user.
- Patch applied: Staff list now hides any non-active account when `Show hidden` is off, even if `account_hidden` was accidentally false.
- Browser route QA verified `http://127.0.0.1:5173/cms/password-setup` shows `Change password`, `New password`, and `Confirm password`, with no `Login Required` state.
- Browser route QA verified `#type=recovery` on `/cms/password-setup` clears the stale expired-link message while preserving the dedicated password setup form.
- Patch applied: `CmsGuard` now gives password setup/recovery URL state priority during initial auth callbacks and hash/path changes.
- Static QA verified `cms_account_invite`, `cms_account_action`, `cms_account_password`, and `cms_account_recovery` pass `deno check`.
- Remote function smoke QA verified anonymous access is rejected for `cms_account_invite`, `cms_account_action`, and `cms_account_password`; `cms_account_recovery` intentionally returns generic success to avoid account enumeration.
- Code cleanup: removed leftover permission-preset constants/types/helpers after the visible preset UI was removed.
- Phase 2 closeout patch: Staff Account Management now separates Account Access from Super Admin-only Permissions, and database/Edge Function guards prevent non-super-admin role or permission changes.

### Phase 3: Customer Management QA

- [x] Customer list loads without crash.
- [x] Customer search works by name.
- [x] Customer search works by email.
- [x] Customer search works by phone.
- [x] Customer search works by license plate.
- [x] Status filter works.
- [x] Tag filter works.
- [x] Include hidden/deleted toggle works.
- [x] Create personal customer saves.
- [x] Create business customer saves.
- [x] Create fleet customer saves.
- [x] Edit contact details saves.
- [x] Edit business details saves.
- [x] Edit address saves.
- [x] Marketing consent saves.
- [x] Contact consent saves.
- [x] Hide customer hides from normal list.
- [x] Block customer persists.
- [x] Soft-delete customer persists.
- [x] Add customer note saves.
- [x] Customer note visibility is respected.
- [x] Duplicate customer detection appears where expected.
- [x] Customer merge keeps selected primary customer.
- [x] Customer merge audit/history is visible.
- [x] License plate conflict can be marked as intentionally shared.
- [x] License plate conflict can be moved to one selected customer.

Phase 3 evidence:
- Phase 3 restart patch: Customer Management now distinguishes `customers: read` from `customers: read_write`; read-only users can inspect customer records but cannot create, edit, delete, merge, auto-link, adjust benefits, manage portal access, add notes, or edit vehicles.
- User QA confirmed customer search works by name, email, phone, and license plate.
- Patch added explicit license plate conflict handling: keep as shared across multiple customer accounts, or move plate ownership/activity to one selected customer.
- Patch added direct search-result merge action so staff can select the primary customer and merge another visible saved customer into it, even when automatic duplicate detection does not show a conflict card.
- Patch replaced one-click merge with a review step that shows both customers and requires staff to choose which customer is kept before confirming.
- Recovery applied for accidental merge of `box.ryanle@gmail.com` into `phat.le@finepass.fi`; Box customer was restored to active and pre-merge events were moved back.
- Master QA pass verified the Phase 3 frontend paths compile and map to guarded backend operations: customer filters call `cms_list_customer_overview_v2`, customer create/edit saves call the current `cms_upsert_customer` overload with `p_customer_type`, quick status changes call `cms_set_customer_status`, notes call `cms_add_customer_note`, merge review calls `cms_merge_customers_with_choices`, and plate conflict actions call `cms_resolve_license_plate_conflict`.
- Remote SQL QA verified Phase 3 RPC/function inventory exists on linked Supabase with authenticated execute grants and expected read/write permission gates for `cms_list_customer_overview_v2`, `cms_upsert_customer`, `cms_set_customer_status`, `cms_add_customer_note`, `cms_merge_customers_with_choices`, `cms_list_license_plate_conflicts`, and `cms_resolve_license_plate_conflict`.
- Phase 3 build QA passed after the latest CMS routing and Vehicle tab patches.

### Phase 4: Customer History QA

- [x] Customer detail history loads bookings.
- [x] Customer detail history loads orders.
- [x] Customer detail history loads invoices/receipts.
- [x] Customer detail history loads rescue/service events where available.
- [x] Customer event timeline renders newest-first.
- [x] Links from history to booking/order/invoice views work.
- [x] Last activity detail is visible and understandable.
- [x] Empty history state renders clearly.
- [x] History data respects customer visibility/deleted status rules.
- [x] Manual unlink/correct mapping action works where available.

Phase 4 evidence:
- Remote SQL QA verified `cms_get_customer_history` is deployed with authenticated execute grant, `customers: read` gate, bookings/orders/invoices/rescue/events payloads, customer link metadata, and newest-first event ordering.
- Static UI QA verified `CustomerHistoryPanel` renders tab counts, clear empty states, booking/order/receipt/rescue/audit sections, link-source badges, linked timestamps, and manual unlink actions through `cms_unlink_customer_activity`.
- Patch applied: history links now target tabbed CMS routes directly with `/cms#schedule`, `/cms#orders`, `/cms#invoices`, and `/cms#rescue`; `#schedule` is now parsed by the CMS tab resolver.
- Phase 4 build QA passed after the history link patch.

### Phase 5: Vehicles, License Plates, And Mapping QA

- [ ] Add vehicle with license plate saves.
- [ ] Edit vehicle saves.
- [ ] Hide vehicle removes it from normal matching.
- [ ] Bulk plate import works for business/fleet customer.
- [ ] Duplicate active license plate ownership creates conflict.
- [ ] Conflict review list loads.
- [ ] Manual link suggestion can be applied.
- [ ] Manual unlink works.
- [ ] Auto-link process links only high-confidence matches.
- [ ] Auto-link does not link duplicate/ambiguous plates.
- [ ] Booking history maps by `customer_id`.
- [ ] Booking history maps by email.
- [ ] Booking history maps by phone.
- [ ] Booking history maps by license plate.
- [ ] Order history maps correctly.
- [ ] Invoice/receipt history maps correctly.
- [ ] Rescue history maps correctly.
- [ ] Mapping audit events are recorded.

### Phase 6: Customer Account And Benefits Portal QA

- [x] Benefit points display in CMS.
- [x] Benefit point adjustment saves at rollback RPC layer.
- [x] Benefit point adjustment audit is recorded at rollback RPC layer.
- [x] Portal enabled toggle saves at rollback RPC layer.
- [x] Customer account link by email works for matching email at rollback RPC layer.
- [x] Customer account link override is restricted to super admin.
- [ ] CMS can create a customer portal login account from a customer profile.
- [ ] CMS can send a customer portal activation/password setup link.
- [ ] Customer activation link opens customer portal route, not CMS.
- [ ] Created customer Auth profile has `role = customer`, `account_status = active`, and no CMS permissions.
- [ ] Created customer Auth account is linked to `customers.account_id`.
- [ ] Created customer Auth account cannot access `/cms` or `/pwa/cms`.
- [x] Customer portal RPC returns sanitized customer data only.
- [x] Customer portal does not expose raw CMS-only tables.
- [x] Customer portal login does not require TOTP by default.
- [x] CMS service book editor creates entry at rollback RPC layer.
- [x] CMS service book editor edits entry at rollback RPC layer.
- [x] CMS service book editor hides/deletes entry safely at rollback RPC layer.
- [x] Service book entry links to customer vehicle/license plate at rollback RPC layer.
- [ ] Service book entry links to booking/order/invoice/source where applicable.
- [x] CMS maintenance reminder editor creates date-based reminder at rollback RPC layer.
- [ ] CMS maintenance reminder editor creates mileage/km-based reminder.
- [x] CMS maintenance reminder editor edits reminder at rollback RPC layer.
- [x] CMS maintenance reminder editor disables reminder at rollback RPC layer.
- [x] Notification history view loads per customer at rollback RPC layer.
- [ ] Appointment reminder scheduling respects service-critical consent rules.
- [ ] Maintenance reminder scheduling respects service-critical consent rules.
- [ ] Marketing/benefit email scheduling respects marketing consent.
- [x] Customer portal read model includes next appointment day.
- [x] Customer portal read model includes scheduled pickup appointment.
- [x] Customer portal read model includes next possible service date/check-in availability.
- [x] Customer portal read model includes digital service book.
- [x] Customer portal read model includes customer benefits.

### Phase 7: Security, GDPR, And Access Control QA

- [ ] CMS requires password plus TOTP for staff/admin access.
- [x] Customer portal does not require staff/admin TOTP.
- [ ] Super admin can see Customer and Staff views.
- [ ] Supervisor can see Customer view only.
- [x] Staff permissions follow module permission JSON.
- [x] Disabled account cannot access CMS.
- [x] Suspended account cannot access CMS at permission/RPC layer.
- [x] Deleted account cannot access CMS.
- [x] Customer-only account cannot access CMS Staff view.
- [x] Customer-only account cannot read another customer portal account.
- [x] RLS enabled on all public customer/account tables.
- [ ] Direct PostgREST raw table reads are blocked for customer portal data.
- [x] Service-role operations are only in Edge Functions.
- [x] No hardcoded permanent super-admin email bypass remains.
- [x] GDPR export includes customer profile data.
- [x] GDPR export includes vehicle/license plate data.
- [x] GDPR export includes mapping/audit-relevant customer data.
- [x] GDPR anonymize/delete removes or anonymizes vehicle/license plate mappings.
- [x] Audit logs do not expose secrets, tokens, or password reset links.
- [x] Password setup/recovery links are never stored in audit details.

### Phase 8: PWA And Role Integration QA

- [x] CMS PWA login works for super admin at permission/RPC layer.
- [x] CMS PWA login works for admin where expected at permission/RPC layer.
- [x] CMS PWA denies supervisor without permitted PWA modules at permission/RPC layer.
- [x] Disabled account cannot access CMS PWA at permission/RPC layer.
- [x] Suspended account cannot access CMS PWA at permission/RPC layer.
- [x] Deleted account cannot access CMS PWA at permission/RPC layer.
- [x] Customer-only account does not get staff CMS PWA access at permission/RPC layer.
- [ ] PWA installed app session refresh works.
- [ ] PWA push subscription still works for eligible staff.
- [ ] PWA role/permission state updates after account permission changes.

### Phase 9: Final Regression QA

- [x] Account & Customer unauthenticated route opens without crash.
- [ ] Switching Customer/Staff/gear settings does not corrupt page state.
- [ ] Gear account settings panel opens and closes.
- [ ] Account settings password change works.
- [ ] Account settings email reset link works.
- [x] Empty states render clearly in unauthenticated smoke routes.
- [x] Loading states render clearly in build/runtime smoke routes.
- [ ] Error messages show backend reason where available.
- [ ] Mobile layout is usable for Customer view.
- [ ] Mobile layout is usable for Staff view.
- [x] Production build passes.
- [x] Supabase function deploy state is current.
- [x] Remote migration history is documented.

## Recommended Next Step

Continue with real-account browser QA:

- [ ] Create a real customer portal Auth account from CMS
- [ ] Confirm activation email opens the customer portal route
- [ ] Confirm the created customer account cannot access CMS or CMS PWA
- [ ] Browser role-boundary QA for supervisor, staff, disabled/deleted, and customer-only accounts
- [ ] PWA installed-app session refresh and push subscription QA
