# Archifex SaaS — Next.js + Supabase

Production foundation for Archifex, the document archiving system from **مَدار فَلَك | MadarFalak**.

## What is here

- Next.js 15 App Router + React 19 + TypeScript.
- Supabase Auth with SSR cookie sessions.
- Multi-tenant schema where every tenant-owned row carries `workspace_id`.
- RLS policies for read isolation and write access.
- Automatic 30-day trial on registration.
- Expired-trial behavior: reads stay available, writes return `402` and are rejected by RLS.
- Provider console at `/admin` for monitoring every workspace and renewing subscriptions.
- Subscription periods stored separately from trials (`subscription_started_at`, `subscription_ends_at`).
- Private Storage bucket policies using `{workspace_id}/{document_id}/{file}`.
- Branded Arabic-first UI with the MadarFalak parent-company header and footer.

## Local setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Fill `.env.local` (use the project URL only, without `/rest/v1` or `/auth/v1`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
PLATFORM_ADMIN_EMAILS=owner@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`PLATFORM_ADMIN_EMAILS` is an optional comma-separated fallback. The provider
account is normally bootstrapped by migration `202610230004` into
`public.platform_admins`.

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
4. `supabase/migrations/202610230004_platform_admin_and_subscriptions.sql`

The first migration installs an `auth.users` trigger that creates a profile, a trial workspace, owner membership, and a default category on signup.

The fourth migration adds subscription periods, the provider allowlist
(`public.platform_admins`), and provider audit logs. It also inserts
`hosn.77h@gmail.com` into `platform_admins` if that auth account already exists.
If the account is created later, re-run its final `insert ... select` statement.

## Trial rules

Writes are allowed when:

```sql
(
  subscription_status = 'active'
  AND (subscription_ends_at IS NULL OR now() <= subscription_ends_at)
)
OR (
  subscription_status = 'trialing'
  AND now() <= trial_ends_at
)
```

and the member role is `owner`, `admin`, or `editor`. Reads do not depend on the trial or subscription period. `workspace_can_write(uuid)` is used by RLS, Storage policies, and API route checks.

A `NULL` `subscription_ends_at` means an active subscription without a fixed
end date. Renewing an active subscription extends from its current end date;
renewing an expired or trial workspace starts from the current time.

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

Activate or renew a subscription (service role / SQL Editor only):

```sql
update public.workspaces
set subscription_status = 'active',
    plan = 'professional',
    subscription_started_at = now(),
    subscription_ends_at = now() + interval '365 days',
    last_renewed_at = now()
where slug = 'YOUR_WORKSPACE_SLUG';
```

The same operation is available from the provider console at `/admin`.

### Stale local build

If `/login` shows **“Application error: a client-side exception has occurred”**
and the browser console reports `400` for `/_next/static/chunks/...`, a running
`next start` process is serving chunk names from an older build. Stop the
process, rebuild, and restart:

```powershell
npm run build
npm start
```

During development use `npm run dev` and restart it after large dependency or
build changes.

## Provider console (`/admin`)

The provider account can monitor all tenant workspaces and manage their access
without opening cross-tenant RLS policies to normal clients.

Setup:

1. Apply migration `202610230004_platform_admin_and_subscriptions.sql`.
2. Confirm the provider email address (`hosn.77h@gmail.com` in the bootstrap).
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in the server environment.
4. Sign in and open `/admin`; the sidebar shows **إدارة الاشتراكات** only to
   platform administrators.

What the console shows and changes:

- Owner email and name, plan, subscription status, trial end, subscription end,
  last renewal, member count, and document count.
- **Renew subscription:** chooses Starter/Professional/Enterprise and a
  30/90/180/365-day period. An active subscription is extended from its current
  end date; an expired or trial workspace starts from now.
- **Extend trial:** grants a fresh 14/30/60/90-day trial.
- Every change writes to `public.platform_audit_logs` with the acting admin,
  workspace, action, and metadata.

Security model:

- `platform_admins` is self-readable only (`user_id = auth.uid()`); normal
  clients cannot list administrators or read other tenants.
- `/api/admin/*` first verifies the caller's session and provider allowlist,
  then uses the service-role client server-side. The key never reaches the
  browser.
- `SUPABASE_SERVICE_ROLE_KEY` must not use a `NEXT_PUBLIC_` prefix.
- If the service-role key is missing, the console returns `503` and shows setup
  instructions instead of exposing data.

Fallback allowlist: set `PLATFORM_ADMIN_EMAILS=owner@example.com` (comma-separated)
to grant provider access before the `platform_admins` row exists. Remove the
fallback once the database allowlist is in place.

## Vercel

Create the project from `Hosn77/archifex` with:

- **Root Directory:** `web`
- **Framework:** Next.js
- Environment variables listed above, including `SUPABASE_SERVICE_ROLE_KEY` (server-only) and optionally `PLATFORM_ADMIN_EMAILS`.

Push to `main` for Production deployments; branches and PRs get Preview deployments.

## Routes

| Route | Purpose |
|---|---|
| `/` | Public Archifex/MadarFalak landing page |
| `/login` | Sign in / create workspace + trial |
| `/dashboard` | Workspace overview, trial state, recent documents |
| `/documents` | Tenant-scoped document registry + create form |
| `/settings` | Workspace, trial, subscription, isolation details |
| `/admin` | Provider console: all workspaces, renewals, trial extensions |
| `/api/trial/status` | Current trial/write access as JSON |
| `/api/documents` | GET list, POST create (trial/subscription guarded) |
| `/api/documents/[id]` | PATCH/DELETE (trial/subscription guarded) |
| `/api/admin/workspaces` | Provider-only list of all tenant workspaces |
| `/api/admin/workspaces/[id]` | Provider-only renewal, trial extension, status change |

## Branding contract

- Meta title: `Archifex | نظام إدارة الأرشيف والملفات - من شركة مَدار فَلَك`
- Header note: `Archifex | Document Archiving System Powered by MadarFalak`
- Footer: `Developed & Powered by MadarFalak Software Solutions — جميع الحقوق محفوظة لشركة مَدار فَلَك`
- Palette: `#0F172A`, `#1E293B`, `#E2E8F0`, `#E0A96D`
