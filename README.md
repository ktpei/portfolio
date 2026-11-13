# kevinpei.dev

A personal portfolio arranged as a macOS Stickies desktop. The portfolio notes live at `/`. The live idea board opens from the desktop edge, the File or Window menu, or directly at `/board`.

## Local development

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The idea board uses a local file in development unless Convex is configured. See the [board guide](docs/board.md) for storage, owner access, and production configuration.

```sh
yarn lint
yarn test
yarn build
```

The tests cover the local board store, including concurrent writes, reactions, and compatibility with older snapshots. The production build also checks TypeScript.

## Editing the site

- Portfolio copy, links, work history, projects, education, and skills live in [`src/content.ts`](src/content.ts).
- The shared desktop and note-window behavior live in [`src/app/stickies`](src/app/stickies). Native macOS is the 1:1 design reference for icons, UI, and behavior. The notes switch to columns or a stack on smaller screens.
- The floating **Wallpapers** folder opens with a double-click, a tap on touch devices, or the keyboard. It supports selecting a background, shuffling, and restoring the default. See [wallpaper context](docs/wallpapers.md) for the collection.
- The idea board UI lives in [`src/app/board`](src/app/board). Server-side board logic lives in [`src/lib/board-store.ts`](src/lib/board-store.ts) and [`convex`](convex).

Portfolio note links include `/#about`, `/#work`, `/#projects`, `/#contact`, `/#education`, and `/#toolkit`. Board share links use `/board?idea=<id>`. Positions, open notes, and wallpaper selections are temporary desktop state.

## Deployment

The site domain is `kevinpei.dev`. Update `site.url` in `src/content.ts` if it changes. Next.js uses it for canonical URLs, robots, the sitemap, and the share image. Configure the [production board environment](docs/board.md#production) before deploying the site to Vercel.
