# Supabase setup

One-time setup to get the shop running locally and in production.

## 1. Create the Supabase project

1. Create a new project at <https://supabase.com/dashboard>.
2. Copy the following values from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## 2. Configure the admin allowlist

The SQL migration reads admin emails from a Postgres setting called `app.admin_emails`.
Open the SQL editor and run (replace with your email addresses):

```sql
alter database postgres set "app.admin_emails" = 'you@example.com,partner@example.com';
```

Every user whose Supabase Auth email matches one of these can log into `/admin`.

## 3. Run the migration

Copy the contents of [`0001_init.sql`](./0001_init.sql) into the Supabase SQL editor and run it.
This creates tables, RLS policies, the `create_reservation` RPC, and the `product-images`
storage bucket.

## 4. Create your admin user

In the Supabase dashboard: **Authentication → Users → Add user**. Use an email that
matches the allowlist above. Set a password; you'll use it at `/admin/login`.

## 5. Regenerating TypeScript types (optional but recommended)

Whenever the schema changes, regenerate the typed client bindings:

```bash
pnpm dlx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/database.types.ts
```

(The `<your-project-ref>` is the subdomain from your `NEXT_PUBLIC_SUPABASE_URL` — e.g.
`https://abcdefgh.supabase.co` → `abcdefgh`.)

The committed `database.types.ts` is hand-written to match this migration; regenerating
will overwrite it with the authoritative version.
