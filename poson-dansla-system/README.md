# PosonDansla System (Next.js + Tailwind + shadcn + Supabase)

This is a production-ready project structure migrated from your current UI prototype.

## Stack
- Next.js App Router (TypeScript)
- TailwindCSS
- shadcn-compatible component structure
- Supabase client/server setup (`@supabase/ssr`)

## Project Structure
- `app/` routes and global styles
- `components/` app UI + reusable `ui/` primitives
- `lib/supabase/` browser/server Supabase clients
- `database/schema.sql` initial PostgreSQL schema

## Run
1. `cd poson-dansla-system`
2. `cp .env.example .env.local`
3. Set Supabase keys in `.env.local`
4. `npm install`
5. `npm run dev`

## Notes
- Current `DashboardApp` is client-side state to match your existing behavior exactly.
- Next step for production: replace local state with Supabase tables, RLS policies, and realtime subscriptions.
