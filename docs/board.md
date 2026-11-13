# Idea board

Open the board at `/board`, `/#stickies`, or through the portfolio's desktop navigation. On a wide screen, drag a sticky by its title bar and resize it from the bottom-right corner. Double-click the title bar to collapse or expand it. The browser remembers the layout across refreshes. **Arrange all notes** reopens notes and restores their default layout.

In each sticky’s title bar, the heart toggles a reaction for this browser and the speech bubble opens the public discussion. Both controls remain available on collapsed notes. Posted comments appear above the composer. Leave the name blank to post as **Anonymous**. **Owner access** unlocks creating, editing, and deleting stickies and moderating comments until sign-out or page reload.

Click outside an open board dialog or press Escape to dismiss it. `/board?idea=<id>` reopens a locally closed sticky and brings it into view.

## Idea copy

Use the owner's title, description, and links. Leave the description blank when the owner supplies only a title. Titles and descriptions support simple Markdown links with `https://` or `http://` URLs. The starter copy lives in [`src/lib/board.ts`](../src/lib/board.ts). Updates to starter copy can appear on untouched seed notes while preserving owner edits, deletions, and reactions. See [Ideas Board decisions](../context.md#ideas-board-decisions) for the copy and interaction history.

## Local development

Run `npm ci` and `npm run dev`, then open `/board`. Without a Convex URL, the app reads and writes `.data/board.json` in development and polls the local API while the board is open. Keep the file if you want to preserve local data. Production without a Convex URL serves a read-only seed preview.

To enable owner access locally, run `node scripts/board-owner-key.mjs` and restart the app. The script stores `BOARD_ADMIN_TOKEN` in the ignored `.env.local` file.

To work against a Convex development deployment, run `npx convex dev`. The CLI writes the public deployment URL to `.env.local`. Set `BOARD_CONVEX_SITE_URL` in `.env.local` to that deployment's HTTP actions URL. Generate a secret with `openssl rand -hex 32` and set `BOARD_CONVEX_WRITE_SECRET` in both `.env.local` and the Convex deployment environment. Use a different secret for each deployment.

## Production

Deploy the Convex functions with `npx convex deploy`. Configure these variables for the Next.js deployment before building.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL for live reads |
| `BOARD_CONVEX_SITE_URL` | HTTP actions URL for the same deployment |
| `BOARD_CONVEX_WRITE_SECRET` | Server-only secret shared with the Convex deployment |
| `BOARD_ADMIN_TOKEN` | Server-only owner key |

After deployment, open the board in two browser sessions and check that a reaction or comment appears in the other session without reloading. Verify owner access and confirm the site is using the intended Convex deployment.

## Data and verification

With Convex configured, the board subscribes to a public snapshot while open. Writes pass through the same-origin Next.js API and a Convex HTTP action authenticated by a shared secret. Comment cooldowns are enforced in the Convex transaction. The API also checks input lengths and a hidden anti-spam field. Convex seeds the board on the first write, and an initialized empty board stays empty. Snapshots include up to 1,000 ideas and the latest 1,000 comments.

`GET /api/board` reports `connected` for Convex, `local` for the development file, or `preview` for the read-only production seed. To verify live reactions, compare the idea's `score` in the snapshots. The title-bar heart reflects the current browser's reaction. Comments are visible in the open discussion sheet.

`yarn test` checks the local store without a Convex deployment, including concurrent writes, anonymous comments, reaction retries, and legacy snapshots. `yarn build` checks Next.js and TypeScript. Run `npx convex dev --once` against the intended development deployment to check and sync the Convex functions.
