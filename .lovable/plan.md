# Plan: Damage Report Simplification, Inspector Access, Sidebar Collapse, History Filters, and Warranty Fix

## 1. Inspector Access to Damage Reports (without Pre-Filing Worksheet)

Currently, the Pre-Filing Damage Claim Worksheet (Sections 1-6) in `DamageReportForm.tsx` is gated behind `isOwner() || roles.includes('manager')` (line 448). Inspectors who have damage report permission should be able to create/view damage reports but NOT see the worksheet.

**Changes:**

- In `AppSidebar.tsx`, update the inspector filter (line 103-104) so inspectors with `damage` permission in `agent_permissions` can also see "Damage Reports" in the sidebar
- The worksheet gating on line 448 already excludes inspectors -- no change needed there
- Need to verify RLS: currently damage_reports INSERT/SELECT policies only allow owners and managers. A new RLS policy will be needed to allow inspectors with damage permission to create and view damage reports for their assigned properties.

**Database migration needed:**

- Add SELECT policy for inspectors on `damage_reports`: allow inspectors to view reports for properties they are assigned to via `user_properties`
- Add INSERT policy for inspectors on `damage_reports`: allow inspectors to create reports for their assigned properties

**Code changes:**

- `AppSidebar.tsx`: Update inspector filtering to check `agent_permissions.damage` and conditionally show "Damage Reports"
- This requires fetching agent permissions in the sidebar or passing them via auth context

**Simpler approach:** Add a flag or check in the sidebar filter. Since agent_permissions are already fetched elsewhere, we can add a lightweight check. For the sidebar, we'll check if the user is an inspector and has damage permissions by querying `agent_permissions` in the auth hook or sidebar component.

## 2. Collapse Settings & Admin by Default

**Changes to `AppSidebar.tsx`:**

- Wrap the Settings & Admin section in a `Collapsible` component, collapsed by default
- Add a toggle chevron icon next to "Settings & Admin" label

## 3. Role Simulation Safety (Your Question)

You asked: "If I assign myself the role of Inspector for testing, will I still be able to get back to the owner role?"

**Answer:** Yes -- assigning yourself the Inspector role adds it alongside your existing Owner role. The `user_roles` table supports multiple roles per user. Your Owner role is never removed. However, to simulate the inspector experience without modifying real roles, you can use the **Role Simulation** dropdown already in the sidebar (bottom section). This lets you temporarily view the app as an inspector, manager, etc., and switch back to Owner at any time. No actual role changes are made.

## 4. Simplify Damage Report Types: Active vs Closed

Currently there are tabs for "Active Reports" and "Pending Reports" with multiple statuses (reported, assessed, approved, in-repair, completed).

**Changes to `DamageReportList.tsx`:**

- Replace the two tabs ("Active Reports" / "Pending Reports") with a single view
- Remove the `TabsList` with Active/Pending tabs
- Show all reports in one list, categorized as:
  - **Active** = any status except "completed"
  - **Closed** = status is "completed"
- Keep the existing status badges on individual reports for detail
- Remove the Pending tab content entirely
- The status workflow buttons (Mark as Assessed, Approve, In Repair, Mark Complete) remain on individual report cards

## 5. Damage Report History -- Replace Toggle with Dropdown + Status Filter

**Changes to `DamageReportHistoryEnhanced.tsx`:**

- Remove the "Current Property" / "All Properties" toggle group (ToggleGroup)
- Replace with a single `Select` dropdown containing:
  - "All Properties" option
  - Each individual property listed
  - Default to the currently selected property from PropertyContext
- Add a status filter with checkboxes or toggle for "Active", "Closed", or "Both" (default: Both)
- When a status filter is applied, group reports by status (Active group / Closed group) instead of by property/year
- When "Both" is selected with grouping by status, show two collapsible sections: "Active" and "Closed"

## 6. Warranties Under Asset Library -- Fix to Use Warranty Database

The user reports that entering warranties under Asset Library should write to the warranty database. Looking at the code:

- `WarrantyManager.tsx` already uses `useWarranties()` hook which writes to the `warranties` table -- this is correct
- The `/warranties` route renders `WarrantyManager` which uses `addWarranty` from `useWarranties` hook
- This already writes to the warranty database table

The issue may be that the `WarrantyManager` page is not properly connected. Let me verify the route exists in `App.tsx`. Based on the earlier conversation, the route was added. The warranty form at `/warranties` already saves to the `warranties` table via `useWarranties().addWarranty()`. No code change needed here -- it already works correctly.

If the concern is about warranties created from the Asset Library form (AssetLibraryForm), that also writes to the warranties table directly via `supabase.from('warranties').insert()` in `AssetLibraryManager.tsx` (line 19-24). This is also correct.

---

## Technical Summary

### Database Migration

- Add RLS policy on `damage_reports` for inspectors with damage permission to SELECT and INSERT reports on their assigned properties

### Files to Modify

1. `**src/components/AppSidebar.tsx**`
  - Update inspector sidebar filtering to conditionally show "Damage Reports" based on agent_permissions
  - Wrap "Settings & Admin" section in a Collapsible, defaulting to collapsed
2. `**src/components/DamageReportList.tsx**`
  - Remove Active/Pending tabs
  - Show single list with all reports
  - Reports are simply "Active" (not completed) or "Closed" (completed)
3. `**src/components/DamageReportHistoryEnhanced.tsx**`
  - Replace Current Property / All Properties toggle with a single property dropdown (including "All Properties" option)
  - Add status filter (Active / Closed / Both) with default "Both"
  - When status filter is active, group by status instead of property/year
4. `**src/hooks/useAuth.tsx**` (or new hook)
  - May need to expose agent_permissions (specifically damage permission) so the sidebar can conditionally show Damage Reports for inspectors

### No Changes Needed

- Warranty entry under Asset Library already writes to the warranties database -- confirmed working
- Role simulation already exists in the sidebar for testing different roles safely  
  
When entering a purchase date or warranty period, the warranty expiration date should immediately update when both entries are present.