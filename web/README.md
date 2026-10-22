# Archifex SaaS — Next.js + Supabase

Production foundation for Archifex, the document archiving system from **مَدار فَلَك | MadarFalak**.

## What is here

- Next.js 15 App Router + React 19 + TypeScript.
- Supabase Auth with SSR cookie sessions.
- Multi-tenant schema where every tenant-owned row carries `workspace_id`.
- RLS policies for read isolation and write access.
- Automatic 30-day trial on registration.
- Expired-trial behavior: reads stay available, writes return `402` and are rejected by RLS.
- Private Storage bucket policies using `{workspace_id}/{document_id}/{file}`.
- Branded Arabic-first UI with the MadarFalak parent-company header and footer.

## Local setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Fill `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Apply database migrations

Use the Supabase CLI:

```powershell
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or execute these files in order in the Supabase SQL Editor:

1. `supabase/migrations/202610210001_archifex_schema.sql`
2. `supabase/migrations/202610210002_archifex_rls_and_trial.sql`
3. `supabase/migrations/202610210003_archifex_storage.sql`

The first migration installs an `auth.users` trigger that creates a profile, a trial workspace, owner membership, and a default category on signup.

## Trial rules

Writes are allowed when:

```sql
subscription_status = 'active'
OR (
  subscription_status = 'trialing'
  AND now() <= trial_ends_at
)
```

and the member role is `owner`, `admin`, or `editor`. Reads do not depend on the trial. `workspace_can_write(uuid)` is used by RLS, Storage policies, and API route checks.

## Useful checks

```powershell
npm run typecheck
npm run build
```

Manual trial expiry:

```sql
update public.workspaces
set trial_start_date = now() - interval '31 days',
    trial_ends_at = now() - interval '1 day',
    subscription_status = 'trialing'
where slug = 'YOUR_WORKSPACE_SLUG';
```

Activate a subscription (service role / SQL Editor only):

```sql
update public.workspaces
set subscription_status = 'active', plan = 'professional'
where slug = 'YOUR_WORKSPACE_SLUG';
```

## Vercel

Create the project from `Hosn77/archifex` with:

- **Root Directory:** `web`
- **Framework:** Next.js
- Environment variables listed above.

Push to `main` for Production deployments; branches and PRs get Preview deployments.

## Routes

| Route | Purpose |
|---|---|
| `/` | Public Archifex/MadarFalak landing page |
| `/login` | Sign in / create workspace + trial |
| `/dashboard` | Workspace overview, trial state, recent documents |
| `/documents` | Tenant-scoped document registry + create form |
| `/settings` | Workspace, trial, subscription, isolation details |
| `/api/trial/status` | Current trial/write access as JSON |
| `/api/documents` | GET list, POST create (trial guarded) |
| `/api/documents/[id]` | PATCH/DELETE (trial guarded) |

## Branding contract

- Meta title: `Archifex | نظام إدارة الأرشيف والملفات - من شركة مَدار فَلَك`
- Header note: `Archifex | Document Archiving System Powered by MadarFalak`
- Footer: `Developed & Powered by MadarFalak Software Solutions — جميع الحقوق محفوظة لشركة مَدار فَلَك`
- Palette: `#0F172A`, `#1E293B`, `#E2E8F0`, `#E0A96D`
