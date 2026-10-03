# ISHA OMR Link Preview Generator

A React and Vite application for managing event links and programs. Supabase provides the database, image storage, and Google sign-in. Vercel hosts the frontend and the serverless endpoint that returns social preview metadata.

## Architecture

- React + Vite: public home page, link redirects, and admin interface.
- Supabase Database: `links`, `programs`, and `admin_users` tables.
- Supabase Storage: public `preview-images` bucket for link preview images.
- Supabase Auth: Google OAuth for administrator sign-in.
- Vercel: static frontend hosting and the `/api/preview/[slug]` serverless function.
- `/p/:slug`: rewritten to the Vercel function, which returns Open Graph and Twitter metadata in the initial HTML before redirecting visitors to the destination. This lets WhatsApp and other crawlers read the preview without running React.

## Prerequisites

- [Bun](https://bun.sh/)
- A Supabase project
- A Vercel account and project

## Supabase setup

1. In the Supabase SQL Editor, run [`supabase/queries/all_queries.sql`](supabase/queries/all_queries.sql) once on a new project. It creates the `links`, `programs`, and `admin_users` tables, enables row-level security, and adds database and Storage policies. The `programs.id` column is a UUID.
2. In **Storage → Buckets**, create a bucket named `preview-images` and mark it **Public**. The SQL script adds the policies for public image reads and administrator-only uploads, updates, and deletes; it does not create the bucket itself.
3. In **Authentication → Providers**, enable Google and configure its OAuth credentials. Add the local and deployed app URLs to the allowed redirect URLs. The app returns Google sign-ins to `/admin`.
4. Sign in once with the Google account that should be an administrator. Copy that user's UUID from **Authentication → Users**, replace the placeholder value in [`supabase/queries/make_admin.sql`](supabase/queries/make_admin.sql), then run the updated query in the SQL Editor. Only users listed in `public.admin_users` can manage links and programs.

## Environment variables

Set these variables in the Vercel project settings for each environment:

```text
VITE_SUPABASE_PROJECT_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
```

For local frontend development, put the same values in `.env/.env.local` (Vite is configured to load environment files from `.env/`). Do not put a Supabase service-role key in the frontend or expose it as a `VITE_` variable. The Vercel preview function uses the publishable key and relies on the database's public-read policies.

## Run locally

```sh
bun install
bun run dev
```

To run the Vercel serverless function and rewrites locally as well, install/use the Vercel CLI and run `vercel dev` with the environment variables configured. Plain `vite` development serves the React app but does not execute `api/preview/[slug].js`.

Create a production build with:

```sh
bun run build
```

## Deploy

Import the repository into Vercel, set the environment variables above, and deploy. Vercel detects Vite for the frontend and deploys `api/preview/[slug].js` as a serverless function. The `vercel.json` rewrite sends `/p/:slug` requests to that function; keep this rewrite in place for social previews to work.

## Security notes

- The Supabase publishable key is intended for browser use; row-level security and Storage policies must enforce access.
- Never add the Supabase service-role key to the client application or commit it to the repository.
- The initial link availability check is client-side. The `links.slug` primary key prevents duplicate slugs at the database level, but concurrent create attempts may still produce a database error that the UI should handle.
