# Portfolio project

Kevin Pei's portfolio is a low-key recreation of macOS Stickies. Visitors can scan short notes about Kevin, open a separate Ideas Board, and leave feedback on ideas. The six portfolio notes provide a personal introduction and selected work. The résumé has its own place in the Files folder.

## Site and code map

| Surface | Current behavior | Source |
| --- | --- | --- |
| Portfolio desktop | `/` opens the intro, work, projects, contact, school, and toolkit stickies. Hash links bring a specific note forward. | [`src/app/page.tsx`](src/app/page.tsx), [`src/content.ts`](src/content.ts) |
| Ideas desktop | `/#stickies` opens the second desktop within the portfolio. `/board` opens it directly. `/board?idea=<id>` focuses a specific idea. | [`src/app/board/page.tsx`](src/app/board/page.tsx), [`src/app/board/bulletin-board.tsx`](src/app/board/bulletin-board.tsx) |
| Desktop shell | Edge arrows and menu commands switch desktops. The inactive desktop is inert. The menu bar, WIP notice, and desktop shortcuts stay visible as board notes scroll. | [`src/app/stickies/stickies.tsx`](src/app/stickies/stickies.tsx) |
| Sticky windows | Both desktops share the title bar, focus and layering, drag, resize, collapse, and close behavior. Notes fall into columns or stack at narrow widths. Portfolio note bodies scroll when text overflows, and the Color menu changes the active note. | [`src/app/stickies/sticky-window.tsx`](src/app/stickies/sticky-window.tsx), [`src/app/stickies/stickies.module.css`](src/app/stickies/stickies.module.css) |
| Folders | Wallpapers, Files, and Archive float over the portfolio desktop. The selected wallpaper applies to both desktops. | [`src/app/stickies/desktop-folder.tsx`](src/app/stickies/desktop-folder.tsx), [folder and wallpaper guide](docs/wallpapers.md) |
| Board content | Public ideas and comments come from Convex when configured. The store has local and preview modes for unconfigured environments. | [`src/lib/board.ts`](src/lib/board.ts), [`src/lib/board-store.ts`](src/lib/board-store.ts), [`convex`](convex), [board guide](docs/board.md) |
| Site metadata | `site.url` sets the canonical domain used by the layout, robots, sitemap, and share image. | [`src/content.ts`](src/content.ts), [`src/app/layout.tsx`](src/app/layout.tsx) |

## Persistence and ownership

- The browser saves wallpaper, folder positions, and each desktop's sticky-window geometry, stacking, and closed or collapsed state. Portfolio colors and the active portfolio note are also browser-local. The folder launchers wait for saved positions to load before they appear.
- Arrange All resets window geometry, stacking, and closed or collapsed state on the relevant desktop. The portfolio keeps the chosen note colors, folder positions, and wallpaper. The wallpaper picker has a separate background reset.
- Board content, comments, and reaction totals belong to the backing store. A browser-local ID is used to toggle its own heart reaction on each note. Closing a board sticky is local, while deleting it via the owner editor removes it from the board for everyone.
- The board loads when first opened and subscribes to Convex while active. Comments and reactions are public writes. Note management and comment moderation require the owner key for the current page session.

## macOS review

Use the native app and the owner's screenshot for the exact surface under review. Use Apple's platform guidance for desktop density, menu commands, movable windows, focus transitions, keyboard access, and touch alternatives. [Apple's Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)

| Surface | Acceptance checks |
| --- | --- |
| Desktop and menus | Compare spacing and stacking to native macOS. Check arrow navigation, stationary desktops during scroll gestures, menu keyboard traversal, Escape dismissal, focus after switching, and browser Back and Forward. The arrows stay plain on hover and retain keyboard focus indication. |
| Stickies | Check drag, resize, activation and layering, double-click to collapse, close, reopen, and Arrange All on both desktops. With the title bar focused, use arrows to move and Shift plus arrows to resize. Compare the chrome and behavior to native Stickies. [Apple's Stickies guide](https://support.apple.com/guide/stickies/welcome/mac) |
| Folder and Files windows | Check click to select, double-click to open, keyboard and touch access, drag, and position on refresh. Confirm the folders stay on the portfolio desktop and the Files link opens the résumé in a new tab. |
| Board dialogs | Open the comment sheet from the title-bar bubble, confirm comments appear above the composer, and check optional names, keyboard focus, and dismissal by Escape or outside click. Floating dialogs dismiss independently of desktop stickies. [Apple's guidance on sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) |
| Small screens | Confirm the notes remain readable, controls remain usable by touch, and both desktops and the Files and board dialogs are reachable. |

## Release checks

Run `yarn lint`, `yarn test`, and `yarn build`. For board changes, also follow the [Convex and browser checks](docs/board.md#data-and-verification). Review the [chat decisions and handoff](context.md) before changing copy, typography, or a macOS interaction that has already been revised.
