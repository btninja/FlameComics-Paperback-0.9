# Handoff: Paperback 0.9 Extensions

## Current State

This folder contains a rebuildable Paperback 0.9 extension repository for two sources:

- FlameComics: `https://flamecomics.xyz`
- QiManga: `https://qimanga.com`

Local path:

```text
/Users/bryan/Documents/FlameComics-Paperback-0.9
```

Remote:

```text
git@github.com:btninja/FlameComics-Paperback-0.9.git
```

Install page and Paperback repository base URL:

```text
https://btninja.github.io/FlameComics-Paperback-0.9/stable/
https://btninja.github.io/FlameComics-Paperback-0.9/stable
```

## Project Layout

- `src/extension.ts`: FlameComics runtime extension
- `src/flameParser.ts`: FlameComics parser helpers
- `src/qiMangaExtension.ts`: QiManga runtime extension
- `src/qiMangaParser.ts`: QiManga parser helpers
- `src/flameIndex.ts`: FlameComics build entry
- `src/qiMangaIndex.ts`: QiManga build entry
- `scripts/build-repo.mjs`: builds both source folders into `dist/0.9/stable`
- `scripts/repository-metadata.mjs`: repository and source metadata
- `scripts/repository-page.mjs`: install page renderer
- `scripts/verify-live.mjs`: live FlameComics smoke verifier
- `assets/icon.png`: FlameComics icon
- `assets/qimanga-icon.png`: QiManga icon converted from `https://qimanga.com/qiscans.ico`
- `test/`: parser, runtime, metadata, and page tests

## QiManga API Notes

QiManga is an Angular/SSR app backed by:

```text
https://api.qimanga.com/api/v1
```

Useful endpoints:

```text
GET /home
GET /series/{slug}
GET /series/{slug}/chapters?page=1&perPage=30&sort=desc
GET /series/{slug}/chapters/{chapterSlug}
GET /series/search?q={query}&page=1&perPage=20
GET /series?page=1&perPage=20&sort=latest
GET /series/genres
```

The extension filters out paid or purchase-required chapters because those are not readable as normal public chapters. Chapter pagination is fetched fully and sorted after all pages are collected.

## Verification

Last full verification command:

```bash
npm run check
```

Last observed result:

```text
7 test files passed
22 tests passed
Built stable/FlameComics, stable/QiManga
Live verifier:
  flameComics:
    buildId: daQGrsf8dVsqbTg0CzROB
    sectionCount: 3
    sampledManga: Omniscient Reader's Viewpoint
    sampledChapters: 312
    sampledPages: 17
    searchResults: 3
  qiManga:
    sectionCount: 5
    sampledManga: Shibuya Noir
    sampledChapters: 13
    sampledPages: 10
    searchResults: 9
```

Additional local checks confirmed:

- `dist/0.9/stable/versioning.json` lists `FlameComics` and `QiManga`
- `dist/0.9/stable/QiManga/index.js` is emitted
- `dist/0.9/stable/QiManga/static/icon.png` is emitted
- The local install page lists both sources
- Live QiManga API details, chapter list, chapter pages, and search respond as expected

## Useful Commands

```bash
npm install
npm test -- --run
npm run build
npm run verify:live
npm run check
git status -sb
git log --oneline --decorate -5
```
