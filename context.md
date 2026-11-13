# Portfolio decisions and handoff

## Product direction

The portfolio started as a conventional content-driven page. In September 2026, Kevin explored a more interactive desktop and a 3D apartment concept, then chose a single low-key Stickies theme. He wanted a portfolio with its own personality and a quick path to the work, projects, and contact notes. The two desktops became the portfolio notes on the left and the public Ideas Board on the right. The edge arrows are unboxed and the board also has a direct route.

The September WIP release was pushed to `main` at `59ed879` for Vercel. Kevin asked to remove the résumé for that release. On November 13 he supplied a replacement and explicitly asked for it to go in **Files**. The intro and résumé changes landed on the local portfolio branch in `d9a209c` and `2a0f9d9`.

## macOS and the desktop

- Kevin specified **1:1 native macOS** as the reference for icons, interface, and behavior. Use the matching native surface and his screenshots for visual details. Use Apple's guidance for the platform's interaction patterns. [Apple's Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)
- Wallpapers was initially a menu item, then a left-side row. Kevin clarified that it should be a floating desktop folder that leaves the stickies in place. He requested drag, additional folders, the exact supplied sprite, a vertical arrangement, larger icons, and persistence after refresh. Wallpapers, Files, and Archive belong to the portfolio desktop. The wallpaper itself is shared across both desktops.
- The folder column starts with 64 px icons and 100 px vertical spacing on the wide layout. After Kevin reported a position jump on refresh, the launchers were hidden until their saved positions were restored. See the [folder and wallpaper guide](docs/wallpapers.md).
- Kevin supplied a Finder screenshot for Files, then asked to revert the resulting dark Finder window. `a667c64` restored the original window with a résumé link. The broader macOS fidelity standard still applies.
- The later desktop update fixed the portfolio surface. Scroll and swipe navigation between desktops was tried and removed. Edge shortcuts and menu commands switch desktops. The board notes scroll in their own area, and portfolio notes offer a title-bar reading view for longer text. The menu, WIP banner, and desktop shortcut stay in view. The portfolio footer stays at the bottom.

## Portfolio copy

- The intro title is “hey, I’m Kevin.” The note shows **Software Engineer**, **New York, NY**, and Kevin's waterfront portrait with the New York City skyline described in the alt text. Kevin supplied the two bio paragraphs about building agentic systems and small projects for the people around him, studying computer science at NYU, and leading server development at NYU's High Speed Research Lab.
- Kevin asked for a compact work note and linked **ProvenanceXL** first as **Software Engineer (Contract)**, September 2026 to present. The current work note shows organization, role, and dates, with highlights available in disclosures where data exists. The project note keeps links, awards, and short blurbs. The build notes and project Details dropdowns were removed at Kevin's request.
- The school sticky includes NYU and **Shanghai High School International Division**, with **9 APs · 1570 SAT**. [`src/content.ts`](src/content.ts) is the source for the portfolio copy.

## Ideas Board decisions

- The board shows current project ideas in real time so visitors can read them and leave comments. The user chose Convex after discussing alternatives to Supabase. The current UI keeps the **Idea board** heading and “Feel free to leave comments.” Kevin clarified that removing the top bar meant removing search and filters. Earlier versions also had decorative numbering, catch-all rabbit-hole copy, a Copy link button, and up/down voting. The current controls are a small heart and speech bubble in the sticky title bar.
- The board uses the same sticky windows as the portfolio. A separate comment sheet shows the public thread above the composer. Names are optional and display as **Anonymous** when blank. Kevin asked to remove the visible “Comments on…” heading. Clicking outside or pressing Escape closes floating dialogs. Owner access enables creating, editing, and deleting ideas and moderating comments.
- Regular Helvetica with underlined titles was tried during the typography review. Kevin asked to restore the previous typography. The shared window treatment and current board typography are the starting point for future changes.
- Kevin wanted to review ideas one by one and preserve the sentiment of his wording. Leave the body blank for title-only submissions. Draft a description only on request, as with **Digital poker chips**. The **Tutorial → executable** description uses his final wording about recording a task once and sharing it as a computer use workflow someone else can run to repeat the same steps.
- The Visor idea links to its repository, demo, and Clicky comparison. **AI music transcription** means transcribing a piece of music. **Pair prompting** mentions multiplayer AI and links Conductor. **Virtual collection platform** uses “Virtual ripping.” The ASL, Morse notification, Gartic Phone prompt guessing, and streamer redaction ideas remain title-only. **Already done** links TwoSeat for movie syncing and Glass for desktop Spotify lyrics. The exact seed text and links live in [`src/lib/board.ts`](src/lib/board.ts). Preserve live owner edits when updating seed copy.

## Verification and open work

- On November 13, 2026, the live `GET /api/board` reported `connected` with 11 ideas. The earlier Convex rollout chat reported that comments, sticky edits, and moderation appeared across two browser sessions without reload. The live write check was not rerun during this documentation pass. [Live Ideas Board](https://kevinpei.dev/board)
- At the start of the November 13 release, GitHub `main` pointed to the September WIP commit. The release pull request combines the desktop and board work with the updated intro and résumé. Check the live version independently of GitHub branch history when validating a release. [Portfolio PR #1](https://github.com/ktpei/portfolio/pull/1)
- The committed PDF link was checked in code. Earlier browser checks were mixed across changes, so verify the combined desktop and board flows after integration using [the project checklist](project.md#macos-review).
