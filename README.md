# Campfire — Operator Console

The web dashboard camp operators use to run the year-round engagement loop:
schedule challenges, review camper submissions, and award badges. Pairs with the
native iOS camper app (`~/CampConnect-iOS`) and shares the same Supabase backend.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Supabase (`@supabase/ssr`). Builds clean and deploys to Vercel.

> ⚠️ This is **Next.js 16**, which has breaking changes from older versions
> (see `AGENTS.md`). Notably: the middleware convention is now **`proxy.ts`**
> (we use `src/proxy.ts`), and `cookies()`/`headers()`/`params` are
> **async-only**. Check `node_modules/next/dist/docs/` before changing framework
> wiring.

## What it does

| Page | Purpose |
|------|---------|
| **Overview** (`/`) | At-a-glance counts: active challenges, pending reviews, campers, badges awarded |
| **Challenges** (`/challenges`) | Add challenges from the template library, sequence them, release/close each |
| **Review queue** (`/review`) | Approve/reject submissions with photo/video/text previews; approving credits points |
| **Badges** (`/badges`) | Manually award badges to campers |
| **Campers** (`/campers`) | Roster with points; COPPA reminder on the consent flow |

Access is gated two ways: `src/proxy.ts` redirects unauthenticated users to
`/login`, and the dashboard layout requires `profiles.role = 'operator'`.
Everything is enforced server-side by Supabase Row-Level Security too.

## Setup

1. **Backend** — already provisioned by the iOS project's SQL
   (`~/CampConnect-iOS/supabase/{schema,storage,seed}.sql`). Same Supabase project.
2. **Env** —
   ```sh
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Supabase → Settings → API).
3. **Make yourself an operator** — sign up once (in this app or the iOS app), then
   in the Supabase SQL editor:
   ```sql
   update profiles
     set role = 'operator', camp_id = '00000000-0000-0000-0000-000000000001'
     where id = (select id from auth.users where email = 'you@example.com');
   ```
4. **Run** —
   ```sh
   npm run dev      # http://localhost:3000
   npm run build    # production build (verified passing)
   ```

## Architecture

```
src/
├── proxy.ts                 # Next 16 middleware → session refresh + auth gate
│                            #   (the old `middleware.ts` name is deprecated in 16)
├── lib/
│   ├── supabase/{client,server,middleware}.ts   # @supabase/ssr clients
│   ├── auth.ts              # getOperatorContext() — role + camp lookup
│   ├── data.ts              # operator-scoped reads (RLS-enforced)
│   └── types.ts             # TS mirrors of the Postgres schema
├── components/sidebar.tsx
└── app/
    ├── login/               # email/password sign-in
    └── (dashboard)/         # route group: layout guard + the 5 pages + actions.ts
```

Mutations are **server actions** (`src/app/(dashboard)/actions.ts`) — approve/
reject, add/release/close challenges, award badges — each re-checks operator
role server-side.

## Done

- **Counselor video upload** — per-challenge upload to Storage or external URL.
- **Auto-badge engine** — a DB trigger (`supabase/auto_badges.sql`) credits points
  and awards rule-based badges (`badges.criteria`) on approval. The Badges page
  shows each badge's auto-rule; manual award is still available.

## Roadmap

1. **Parental consent + camper invites** — the COPPA flow referenced on the
   Campers page. **Required before piloting with real kids.**
2. **Operator-defined badges** — a UI to create badges + pick a `criteria` rule
   (the engine is already data-driven; just needs a form).
3. **Multi-camp** — operator switching if one operator manages several camps.
