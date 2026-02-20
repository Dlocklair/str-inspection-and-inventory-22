# STR Inspection & Inventory Manager

A full-stack **short-term rental (STR) property management** application for tracking inspections, inventory, damage reports, and warranties across multiple properties.

## What It Does

Helps STR owners and property managers stay organized by providing a single dashboard to schedule inspections, monitor supply levels, document damage with photo evidence, and track warranty expirations — all with role-based access for owners, managers, and inspectors.

## Key Features

- **Multi-Property Management** — Add properties, assign team members, and switch between properties with a persistent selector.
- **Inspection Scheduling** — Create custom inspection templates with recurring schedules and automated reminders.
- **Inventory Tracking** — Monitor stock levels with low-stock alerts, reorder thresholds, and email notifications.
- **Damage Reports** — Document damage with before/after photos, file platform claims (Airbnb/VRBO), and generate PDF claim reports.
- **Warranty Tracking** — Log warranties with expiration alerts and renewal management.
- **Role-Based Access** — Owner, Manager, and Inspector roles with granular permissions.
- **Offline Support** — React Query persistence for field use on mobile devices.
- **PWA** — Installable as a Progressive Web App.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Lucide icons |
| State | TanStack React Query (with persistence) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| PDF | jsPDF + jspdf-autotable |
| PWA | vite-plugin-pwa |

## Local Development

```sh
# Clone the repo
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Set up environment variables
# Create .env with:
#   VITE_SUPABASE_URL=<your-supabase-url>
#   VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

# Start dev server
npm run dev
```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` against your database.
3. Enable Email auth in Authentication > Providers.
4. Create a `damage-report-photos` storage bucket (public).
5. Add your Supabase URL and anon key to `.env`.

## Project Structure

```
src/
├── components/       # UI components (DamageReport, InspectionReport, etc.)
├── hooks/            # React Query hooks (useDamageReports, useInventory, etc.)
├── contexts/         # PropertyContext for property selection state
├── pages/            # Route pages (Index, Auth, Settings, etc.)
├── integrations/     # Supabase client and auto-generated types
├── lib/              # Utilities (PDF generation, CSV export, etc.)
supabase/
├── functions/        # Edge functions (invitations, email notifications)
├── migrations/       # Database schema migrations
```

## Deployment

Open the [Lovable project](https://lovable.dev/projects/e08fb12e-4635-4033-9074-1b7312238f00) and click **Share → Publish**.

For custom domains, go to **Project → Settings → Domains → Connect Domain**. See [custom domain docs](https://docs.lovable.dev/tips-tricks/custom-domain).
