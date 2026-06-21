# Handoff: Paperback 0.9 Extensions

## Current State

This folder contains a rebuildable Paperback 0.9 extension repository for three sources:

- FlameComics: `https://flamecomics.xyz`
- QiManga: `https://qimanga.com`
- MangaK: `https://mangak.io`

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
- `src/mangaKExtension.ts`: MangaK runtime extension
- `src/mangaKParser.ts`: MangaK parser helpers
- `src/FlameComics/main.ts`, `src/FlameComics/pbconfig.ts`: native Paperback 0.9 build wrapper
- `src/QiManga/main.ts`, `src/QiManga/pbconfig.ts`: native Paperback 0.9 build wrapper
- `src/MangaK/main.ts`, `src/MangaK/pbconfig.ts`: native Paperback 0.9 build wrapper
- `scripts/build-repo.mjs`: runs `paperback-cli bundle` and copies `bundles` into `dist/0.9/stable`
- `scripts/repository-metadata.mjs`: repository and source metadata
- `scripts/repository-page.mjs`: install page renderer
- `scripts/verify-live.mjs`: live source smoke verifier
- `assets/icon.png`: FlameComics icon
- `assets/qimanga-icon.png`: QiManga icon converted from `https://qimanga.com/qiscans.ico`
- `assets/mangak-icon.png`: MangaK icon from `https://mangak.io/static/sites/mangak/icons/android-chrome-512x512.png`
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

## MangaK Notes

MangaK is a Next.js app backed by server-rendered page data. The extension fetches public HTML pages and parses the `__NEXT_DATA__` payloads:

```text
GET /home
GET /{slug}
GET /{slug}/{chapterSlug}
GET /search?keyword={query}&page={page}
```

The live payloads include homepage sections, series details, chapter lists, reader image URLs, and search pagination. MangaK metadata is marked `ADULT` because the public catalog includes adult entries.

## Verification

Last full verification command:

```bash
npm run check
```

Last observed result:

```text
10 test files passed
32 tests passed
Built stable/FlameComics, stable/QiManga, stable/MangaK
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
    sampledManga: Unraveling Memories: The Trauma Cleaner
    sampledChapters: 18
    sampledPages: 11
    searchResults: 9
  mangaK:
    sectionCount: 5
    sampledManga: I, The Invincible Villain Master With My Apprentices (Colored)
    sampledChapters: 50
    sampledPages: 62
    searchResults: 24
```

Additional local checks confirmed:

- `dist/0.9/stable/versioning.json` lists `FlameComics`, `QiManga`, and `MangaK`
- `dist/0.9/stable/QiManga/index.js` is emitted
- `dist/0.9/stable/QiManga/info.json` is emitted
- `dist/0.9/stable/MangaK/index.js` is emitted
- `dist/0.9/stable/MangaK/info.json` is emitted
- `dist/0.9/stable/MangaK/index.js` starts with the native 0.9 wrapper shape `var source=(function(`
- The local install page lists all sources
- Live QiManga API details, chapter list, chapter pages, and search respond as expected
- Live MangaK details, chapter list, chapter pages, and search respond as expected

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
