<img src="app/icon.svg" alt="Metabasis logo" width="64" align="right" />

# Metabasis

*Metabasis* (Greek): a shift from one state to another. Every post moves through stages, from idea to posted.

A visual planner for Instagram posts: track each post's edit status, plan its date and time, keep the inspo (screenshot + link), and show the final thumbnail. Built for the bakery account, with an account switcher for others later.

- **Views:** Month calendar (drag to reschedule), Board by status (drag to change status), Upcoming list
- **Statuses:** Idea → To edit → Editing → Ready → Posted
- **Access:** your passcode opens every account; share links open one account each
- **Stack:** Next.js + Tailwind, Supabase (Postgres + Storage), hosted on Vercel

## Run locally

```bash
npm install
npm run dev
```

With no `.env.local` the app uses a local JSON file (`.data/db.json`) and saves images to `public/uploads`, and the passcode gate is off. Copy `.env.example` to `.env.local` to change that.

## Deploy (free)

1. **Supabase**: create a project at supabase.com. Open *SQL Editor*, paste `supabase/schema.sql`, run it. In *Project Settings → API* copy the **Project URL** and the **service_role** key.
2. **Vercel**: import this GitHub repo at vercel.com. Add these environment variables:
   - `SUPABASE_URL` – the Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` – the service_role key (keep it secret, never commit it)
   - `APP_PASSCODE` – your passcode (opens every account; keep it to yourself)
   - `COOKIE_SECRET` – any long random string
3. Deploy, open the link and enter the passcode. To give someone one account, open the account menu → **Share this account** and send them that link.

## Sharing an account

- A share link (`/s/<token>`) lets whoever opens it plan and edit posts in that one account. They can't see, switch to, add or rename other accounts.
- **Reset link** in the share dialog makes a new link; the old one stops working straight away.
- Database created before share links existed? Run this once in the Supabase SQL Editor:
  `alter table accounts add column if not exists share_token text unique;`

## Notes

- Raw footage is never uploaded; only inspo screenshots and final thumbnails are. Images are compressed in the browser first.
- Uploaded images live in a public bucket under random file names, so anyone holding an exact image URL can view it. The planner itself sits behind the passcode.
