# Post Planner

A visual planner for Instagram posts: track each post's edit status, plan its date and time, keep the inspo (screenshot + link) and show the final thumbnail. Built for one bakery account, with an account switcher for others. See [README.md](README.md) for setup, deployment and sharing.

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

> The paragraph above is the same text `next dev` keeps in [AGENTS.md](AGENTS.md). Leave AGENTS.md alone; it is regenerated automatically.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4 (tokens in `app/globals.css`, no `tailwind.config`)
- `@dnd-kit/core` for drag and drop, `date-fns` for dates, `lucide-react` for icons
- Supabase (Postgres + Storage) in production; a local JSON file (`.data/db.json`) and `public/uploads` when no env vars are set

## Commands

```bash
npm install
npm run dev     # local dev server; no .env.local needed (passcode gate is off)
npm run build   # production build, also type-checks
npm run lint    # eslint
```

There is no test suite. Check changes with `npm run lint`, `npm run build` and by running the app.

## Project layout

- `app/` — routes
  - `[account]/[view]` — calendar, board and upcoming views for one account (`layout.tsx`, `template.tsx` handle the shell and view transitions)
  - `s/[token]` — share-link entry; `unlock/` and `api/unlock` — passcode gate; `api/upload` — image upload
  - `actions.ts` — server actions
  - `globals.css` — the design system (see below)
- `components/` — `CalendarView`, `BoardView`, `UpcomingView`, `PostDrawer`, `PostThumb`, `TopBar`, `DateTimePicker`, `ImageField`, `TypeIcon`, `PlannerProvider`
- `lib/` — `store.ts` (data store interface, Supabase and JSON-file implementations), `types.ts` (statuses, post types, `Account`, `Post`), `dates.ts`, `image.ts`, `auth.ts`, `access.ts`, `motion.ts`, `useExit.ts`
- `proxy.ts` — coarse auth gate (this Next.js version uses `proxy.ts`, not `middleware.ts`)
- `supabase/schema.sql` — database schema

## Domain rules

- Statuses, in order: Idea → To edit → Editing → Ready → Posted. Post types: reel, photo, carousel, story. Both live in `lib/types.ts`; add to them there rather than hardcoding labels or colours elsewhere.
- **Post times are stored as wall-clock time**: the UTC fields of the ISO string hold the time the user picked, with no timezone conversion. Always go through `lib/dates.ts` to read, write or display them. Display is 12-hour.
- **Access**: the passcode makes someone an owner (sees every account). A share link (`/s/<token>`) makes them a guest for exactly one account. `proxy.ts` is only a coarse gate; the real per-account check is `canAccess` in `lib/access.ts` and must run server-side for any data read or write.
- `share_token` is server-only and must never reach the browser (it is stripped from `Account` before being sent to the client).
- `lib/store.ts` and other `server-only` modules must not be imported from client components. Add new data operations to the `Store` interface and implement them in both the Supabase and JSON-file stores.
- Raw footage is never uploaded; only inspo screenshots and final thumbnails, compressed in the browser first (`lib/image.ts`).
- Never commit `.env.local`, `.data/` or the Supabase service-role key.

## Design system: reuse, don't rewrite

All shared styling and motion live in [app/globals.css](app/globals.css) (the "Ephemeris" design system), with JS mirrors in [lib/motion.ts](lib/motion.ts) and [lib/useExit.ts](lib/useExit.ts). Before writing any UI, read `app/globals.css` and use what is there. Do not re-implement something it already provides.

- **Colours, radius, shadows, timing**: use the CSS variables (`--bg`, `--card`, `--line`, `--text`, `--muted`, `--accent`, `--hl`, `--radius`, `--dur-*`, `--ease-*`) or their Tailwind aliases (`bg-card`, `text-muted`, `border-line`, `text-ink`, `bg-accent`, ...). Never hardcode hex values, durations or easing curves.
- **Controls**: `.btn` with `.btn-primary` / `.btn-ghost` / `.btn-quiet`, `.copy-btn`, `.field` (inputs and selects), `.label`.
- **Press feedback**: `.tap` for clickable controls, `.tap` + `.tap-surface` for rows and cards. Don't write custom `:active` / hover scale styles.
- **Floating layers**: `.menu` (stays mounted, toggle `data-open`), `.reveal` / `.reveal-up` (mount on demand), `.scrim`, `.panel`. Exit by setting `data-closing="true"` via `useExit`. Don't add fade or pop animations.
- **Content motion**: `.slide-x` with `--dir`; `t-move` for transition timing on indicators and chevrons.
- **Icons and shared components**: check `components/` (e.g. `TypeIcon`, `DateTimePicker`, `ImageField`) before building a new one.
- Respect small screens: inputs stay at 16px (stops iOS zoom), layers become bottom sheets on phones, and `prefers-reduced-motion` is already handled globally.

If something genuinely new is needed, add it to `app/globals.css` (tokens in `:root`, classes in `@layer components`) and, if JS needs the values, mirror them in `lib/motion.ts`. Then use it. Don't inline one-off copies in a component. If a pattern appears in two or more places, extract it into the design system instead of duplicating it.

## Git: atomic commits

Never bundle unrelated work into one big commit. Each commit is one logical change that builds and makes sense on its own.

- Split by concern: a design-system addition, the components that use it, a bug fix, a refactor, and docs are separate commits.
- Commit in dependency order (e.g. new CSS class or helper first, then the code that uses it).
- Stage deliberately with `git add <paths>` (or `git add -p` to split a file). Never `git add -A` / `git add .` without checking `git status` and `git diff --staged` first.
- Use the existing message style: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` followed by a short lowercase summary.
- Commit as you finish each piece rather than at the end of the session. Only commit when the user has asked for it.
