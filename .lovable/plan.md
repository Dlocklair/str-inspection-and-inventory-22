
# Plan: Open Damage Reports View + Pre-Filing Damage Claim Worksheet

This plan covers two main features: (1) making the "Open Damage Reports" dashboard card navigate to a dedicated view showing unresolved reports grouped by property, with edit buttons that open the full form; and (2) adding a "Pre-Filing Damage Claim Worksheet" section to the damage report form.

---

## Part 1: Open Damage Reports -- Grouped by Property View

### Changes to `src/pages/Index.tsx`
- Update the "Open Damage Reports" stats card `onClick` to navigate to `/damage?view=open` instead of `/damage`.

### Changes to `src/components/DamageReport.tsx`
- Handle the new `view=open` URL parameter:
  - Set `showAddForm=false`, `showHistory=false`, `selectedHistoryReport=null`
  - Set a new state like `showOpenReports=true`
- When `showOpenReports` is true, render a new `<OpenDamageReportsView>` component.

### New Component: `src/components/OpenDamageReportsView.tsx`
- Fetches all damage reports (no property filter) via `useDamageReports()`.
- Filters to only non-completed/non-resolved reports.
- Groups reports by `property_id`, displaying each property as a Card with the property name as a heading (using `usePropertyContext` to resolve names).
- Each report shows a summary row (title, severity badge, status badge, date, estimated cost).
- Each row has an **Edit** button that navigates to `/damage?view=new&edit={reportId}` (or triggers a callback to open the full form pre-populated with that report's data).

### Changes to `src/components/DamageReport.tsx` (edit mode)
- Support a `view=new&edit={id}` URL param combination:
  - When detected, open `DamageReportForm` pre-populated with the existing report data.
  - The form's save action calls `updateReport` instead of `addReport`.

### Changes to `src/components/DamageReportForm.tsx`
- Accept an optional `existingReport` prop of type `DamageReportType`.
- If provided, pre-populate all fields from the existing report.
- Change the save button to call `updateReport(existingReport.id, ...)` when editing, and `addReport(...)` when creating new.
- Update the card title to "Edit Damage Report" vs "Create Damage Report" accordingly.

---

## Part 2: Pre-Filing Damage Claim Worksheet

### Changes to `src/components/DamageReportForm.tsx`
Replace the current "Booking & Claim Details (Optional)" section with a clearly labeled and boxed **"Pre-Filing Damage Claim Worksheet"**. This will be structured into 6 sections matching the user's specification:

**Section 1 -- Booking Information**
- Platform (Airbnb / VRBO) -- already exists as `bookingPlatform`
- Guest Full Name -- already exists as `guestName`
- Reservation / Booking ID -- already exists as `reservationId`
- Check-In Date -- already exists as `checkInDate`
- Check-Out Date -- already exists as `checkOutDate`
- Property Address -- auto-filled from selected property
- Date Damage Discovered -- already exists as `dateDamageDiscovered`
- Who Discovered It -- new field (`discoveredBy`)

**Section 2 -- Damage Description**
- A repeatable table/rows: Item/Area Damaged, Description of Damage, Pre-Existing (Y/N), Repair or Replace?
- New state array `damageItems` with add/remove row capability.
- This supplements the main damage description; stored in `notes` or a new JSON structure within `claim_timeline_notes` (or just displayed in the PDF).

**Section 3 -- Cost Documentation**
- A repeatable table: Item, Repair/Replacement Cost, Source
- With a calculated total row.
- New state array `costItems`.

**Section 4 -- Evidence Checklist**
- A list of checkboxes for each evidence type (before-stay photos, after-stay photos, video walkthrough, cleaning staff statement, repair estimates, receipts, replacement item links, police report, guest message screenshots).
- New state object `evidenceChecklist`.

**Section 5 -- Guest Communication Log**
- Date contacted guest -- new field
- Method (platform messaging) -- new field
- Guest response -- new field (agreed/declined/no response)
- Date of response -- new field

**Section 6 -- Income Loss**
- Bookings canceled due to damage (Y/N) -- new field
- Canceled reservation dates -- new field
- Lost income amount -- new field
- Screenshot of canceled reservation -- file upload

All new worksheet fields will be stored by serializing them into the existing `claim_timeline_notes` text field as a structured JSON string, keeping the database schema unchanged. This data can be parsed back when editing.

### Visual Design
- The entire worksheet is wrapped in a bordered Card with a distinct header: "Pre-Filing Damage Claim Worksheet"
- Subtitle: "Use this to gather everything before you log on. Both platforms will ask for this information."
- Each section has a numbered heading with a separator line
- Repeatable rows (Sections 2 and 3) have "Add Row" / remove buttons
- The checklist (Section 4) uses Checkbox components

---

## Technical Details

### Files to Create
1. `src/components/OpenDamageReportsView.tsx` -- grouped-by-property open reports view

### Files to Modify
1. `src/pages/Index.tsx` -- change Open Damage Reports click to `/damage?view=open`
2. `src/components/DamageReport.tsx` -- handle `view=open` and `view=new&edit={id}` URL params
3. `src/components/DamageReportForm.tsx` -- accept `existingReport` prop for edit mode; replace claim section with the 6-section Pre-Filing Damage Claim Worksheet
4. `src/hooks/useDamageReports.ts` -- no schema changes needed; worksheet data serialized into `claim_timeline_notes`

### No Database Changes Required
All new worksheet data is serialized into the existing `claim_timeline_notes` text column as JSON.
