# The idea board

Open the **Idea board** from the Stickies portfolio’s File or Window menu, or at `/#stickies` or `/board`. The initial 12 stickies transcribe
only project ideas from the supplied screenshot. They are ideas, not assertions that
projects are underway. Crossed-out ideas start on the back burner. Personal/account
notes and the source screenshot are not included in the site.

## Local use

1. Run `node scripts/board-owner-key.mjs` once. It creates a random `BOARD_ADMIN_TOKEN`
   in ignored `.env.local`, preserving any existing owner key and environment settings.
2. Run `npm run dev` and visit `http://localhost:3000/board`.
3. Choose **Owner access** above the stickies. Paste the `BOARD_ADMIN_TOKEN` value from
   `.env.local` to add/edit/remove notes and remove comments. The browser keeps the key
   only in memory; refresh or **Leave owner mode** clears it.

Development changes persist in ignored `.data/board.json`. Other browsers using this
same development server see the same board. Back up that file if you want to retain
local experiments. It is not automatically migrated to the production database.

Visitors can read notes, search/filter, and post named comments without signing in.
Names are self-reported, not verified identities. Comments are public plain text.
The API limits comments to 1,000 characters, notes to 2,000, and titles to 120.

## Connect the public site

This adds dynamic server routes to the formerly static portfolio. Vercel's standard
Next.js hosting supports them; static-only export hosting does not.

1. Create/use a Supabase project and run `docs/board-database.sql` in its SQL editor.
2. Configure these **server-only** environment variables in the hosting environment:

   ```dotenv
   BOARD_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   BOARD_SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   BOARD_ADMIN_TOKEN=YOUR_LONG_RANDOM_OWNER_KEY
   ```

   Do not prefix them with `NEXT_PUBLIC_`. Generate an owner key with
   `openssl rand -hex 32`; use it only in the owner dialog and server environment.
3. Redeploy using the portfolio's existing deployment process.
4. Open `/board` in two browsers. Add a note or comment in one; check that it appears
   in the other without reloading. Test owner editing and comment removal.

The first database read initializes the seed board once. Removing an idea does not
restore it on the next update. Tables use row-level security with no public policies;
only server routes hold the service-role credential.

When production has no database configuration, the board explicitly shows a **Board
preview** and disables comments; it never silently stores visitor comments on an
instance's temporary disk. Database failures retain the last loaded client snapshot,
show a reconnecting message, and retry.

## Updates and scope

The browser polls the shared API every three seconds while visible and refreshes when
its tab becomes visible. This is near-real-time polling, not a WebSocket subscription.
It works across browsers and server instances backed by the same Supabase database.
The board is edited on the website; automatic sync from the macOS Stickies application
is not implemented. No private Mac data is read.

Anonymous comments have a honeypot and a 15-second per-client cooldown. Supabase mode
enforces the cooldown in the database across server instances; local mode uses an
in-process limiter. Owner moderation is available in each sticky's conversation.
For a larger audience, add host-level bot protection and a reporting/moderation flow.

## Verification

```sh
npm run lint
npx tsc --noEmit
npm run build
```

The store integration test can be compiled and run without adding dependencies:

```sh
npx tsc tests/board-store.test.ts --outDir /tmp/portfolio-board-tests --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck
node /tmp/portfolio-board-tests/tests/board-store.test.js
```

Shared snapshots show the latest 1,000 comments, oldest to newest, and up to the
database API’s default note limit (normally 1,000). Older comments remain in the
database. Add pagination if the board grows beyond this personal-board scale.

The database functions follow [Supabase’s function security guidance](https://supabase.com/docs/guides/database/functions).
