# btninja Paperback 0.9 Extensions

Rebuildable Paperback 0.9 extension repository for:

- `https://flamecomics.xyz`
- `https://qimanga.com`

## Install Page

Open the install page on a device with Paperback installed:

```text
https://btninja.github.io/FlameComics-Paperback-0.9/stable/
```

Paperback repository base URL:

```text
https://btninja.github.io/FlameComics-Paperback-0.9/stable
```

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
dist/0.9/stable/QiManga/index.js
dist/0.9/stable/QiManga/static/icon.png
dist/0.9/stable/versioning.json
dist/0.9/metafile.json
dist/0.9/index.html
```

Host `dist/0.9/stable` as the Paperback 0.9 source repo URL.

## Notes

FlameComics uses current Next.js data routes. QiManga uses the public `https://api.qimanga.com/api/v1` API. `npm run verify:live` checks live discover sections, one manga, chapter pages, and search results for both sources.
