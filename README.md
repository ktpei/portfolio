# kevinpei.dev

Personal site. Next.js 16 (App Router) · Tailwind v4 · Mac Stickies portfolio + live idea board.

## Editing content

**Portfolio content lives in [`src/content.ts`](src/content.ts).** Nothing else needs touching for
routine updates — the page reads from it. Sections: `site`, `intro`, `highlights`, `navigation`, `links`, `work`,
`projects`, `education`, `skills`.

Set `site.url` once the domain is registered — it drives the canonical tag, sitemap,
`robots.txt`, and the OG image footer.

The portfolio currently displays a WIP banner. The résumé download is temporarily
removed from the site and its public assets.

## Develop

```bash
npm run dev
```

## Deploy

Requires `vercel login` first (interactive — must be run by hand).

```bash
npx vercel@latest --prod
```

Then add the domain:

```bash
npx vercel@latest domains add kevinpei.dev
```

Vercel prints the nameservers or A/CNAME records to set at the registrar.

## What's wired up

- `src/app/opengraph-image.tsx` — 1200×630 link-preview card, generated at build
- `src/app/icon.svg` — favicon (K monogram)
- `src/app/robots.ts`, `src/app/sitemap.ts` — crawler basics
- JSON-LD `Person` schema in `src/app/page.tsx` — helps search engines tie the name
  to this site rather than to the other Kevin Pei who holds `kevinpei.com`
- Six Mac Stickies-style portfolio notes: About, Work, Projects, Contact, Education, and Toolkit
- Draggable and resizable notes with native-style title bars, close/collapse controls, and six paper colors
- Stickies, File, Color, Window, and Help menus; Window reopens closed notes and Arrange All restores the layout
- Direct `#work`, `#projects`, `#contact`, `#education`, and `#toolkit` links; `/#stickies` forwards to the live idea board
- Keyboard-operable menus, skip link, visible focus states, and scrollable note content
- The Wallpapers folder floats above the upper-left desktop and lets visitors pick or shuffle backgrounds from `public/wallpapers`. See [wallpaper context](docs/wallpapers.md) for the collection and placement decisions.
- Responsive layout: desktop notes float freely; tablet notes form two columns; mobile notes stack in reading order
- Homepage and board shell in `src/app/stickies/`; content remains in `src/content.ts`
- Layout and color adjustments are temporary browser-session state; the portfolio’s source content is not editable by visitors

## Known refinements for later

- The OG image falls back to a system sans; loading Instrument Serif into
  `ImageResponse` would match the site's display face.
- `site.status` ("Open to Summer 2027 internships") is an assumption — reword or
  delete it in `src/content.ts`.
- Compco has no `href`. Add a repo link to make its card clickable, like PersonaLab
  and AgentOS.

## Idea board

`/#stickies` and `/board` open the idea board with project ideas, comments, and owner editing, styled to match the Stickies portfolio.
See [the board setup guide](docs/board.md) for local use and shared database configuration.
