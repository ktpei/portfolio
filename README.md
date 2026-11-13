# kevinpei.dev

Kevin Pei's personal portfolio and public Ideas Board, arranged as two macOS Stickies desktops. Start at `/` for the portfolio notes. Open the board from the right edge, the File or Window menu, or directly at `/board`.

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
- The shared desktop and note-window behavior live in [`src/app/stickies`](src/app/stickies). Match native Stickies and Finder using the [macOS review checklist](project.md#macos-review). The notes switch to columns or a stack on smaller screens.
- The portfolio desktop has three draggable folders. **Wallpapers** lets visitors pick, shuffle, or reset the background. **Files** links to Kevin's résumé PDF. **Archive** is empty. See the [folder and wallpaper guide](docs/wallpapers.md).
- The idea board UI lives in [`src/app/board`](src/app/board). Server-side board logic lives in [`src/lib/board-store.ts`](src/lib/board-store.ts) and [`convex`](convex).

Portfolio note links include `/#about`, `/#work`, `/#projects`, `/#contact`, `/#education`, and `/#toolkit`. Board deep links use `/board?idea=<id>`. Wallpaper, folder positions, and sticky-window layout are saved in the current browser. Arrange All restores the default layout for the relevant desktop.

See [project.md](project.md) for the architecture and verification checklist, [context.md](context.md) for the owner's decisions and handoff, and [AGENTS.md](AGENTS.md) for repository conventions.

## Deployment

The site domain is `kevinpei.dev`. Update `site.url` in `src/content.ts` if it changes. Next.js uses it for canonical URLs, robots, the sitemap, and the share image. Configure the [production board environment](docs/board.md#production) before deploying the site to Vercel.
