# FlameComics Paperback 0.9 Extension

Rebuildable Paperback 0.9 extension repository for `https://flamecomics.xyz`.

## Commands

```bash
npm install
npm test -- --run
npm run build
npm run verify:live
npm run check
```

## Output

`npm run build` writes the deployable repository to:

```text
dist/0.9/stable/FlameComics/index.js
dist/0.9/stable/FlameComics/static/icon.png
dist/0.9/stable/versioning.json
dist/0.9/metafile.json
dist/0.9/index.html
```

Host `dist/0.9/stable` as the Paperback 0.9 source repo URL.

## Notes

The extension uses FlameComics' current Next.js data routes. `npm run verify:live` checks the live homepage build ID, discover sections, one manga, chapter pages, and search results.
