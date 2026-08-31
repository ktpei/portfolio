# kevinpei.dev

Personal site. Next.js 16 (App Router) · Tailwind v4 · fully static.

## Editing content

**All copy lives in [`src/content.ts`](src/content.ts).** Nothing else needs touching for
routine updates — the page reads from it. Sections: `site`, `intro`, `links`, `work`,
`projects`, `education`, `skills`.

Set `site.url` once the domain is registered — it drives the canonical tag, sitemap,
`robots.txt`, and the OG image footer.

The résumé PDF is served from `public/Kevin_Pei_Resume.pdf`. Replace the file in place
to update it; the URL stays the same.

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
- Light/dark via `prefers-color-scheme`, tokens in `src/app/globals.css`

## Known refinements for later

- The OG image falls back to a system sans; loading Instrument Serif into
  `ImageResponse` would match the site's display face.
- `site.status` ("Open to Summer 2027 internships") is an assumption — reword or
  delete it in `src/content.ts`.
- Projects have no `href`. Add repo or demo links and the cards become clickable
  automatically.
