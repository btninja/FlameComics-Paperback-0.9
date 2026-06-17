# FlameComics Paperback 0.9 Design

## Goal

Create a rebuildable Paperback 0.9 extension repository for FlameComics at `https://flamecomics.xyz`.

## Approach

The project keeps the extension source in TypeScript and builds a deployable 0.9 repository into `dist/0.9/stable/FlameComics`. The runtime uses Paperback 0.9's native `Application.scheduleRequest` API and returns plain 0.9 data objects.

## Source Behavior

The extension preserves the old FlameComics 0.8 behavior:

- Discover sections for featured, popular, and latest series.
- Manga details from Flame's Next.js JSON route.
- Chapter lists from series JSON.
- Page image URLs from chapter JSON.
- Title search against the browse JSON route.
- Cloudflare bypass capability through a homepage request and saved Cloudflare cookies.

## Data Flow

The extension first fetches the homepage and extracts `buildId` from `script#__NEXT_DATA__`. It then requests routes such as `/_next/data/<buildId>/index.json`, `series/<id>.json?id=<id>`, and `browse.json?search=<title>`.

Pure parser helpers translate Flame API payloads into Paperback objects. The extension class owns network calls, caching, retry after stale build IDs, and app integration.

## Packaging

The build script writes:

- `dist/0.9/stable/FlameComics/index.js`
- `dist/0.9/stable/FlameComics/static/icon.png`
- `dist/0.9/stable/versioning.json`
- `dist/0.9/metafile.json`
- `dist/0.9/index.html`

## Testing

Unit tests cover build ID parsing, homepage sections, manga details, chapters, chapter pages, search results, and versioning metadata. A live verification script checks Flame's current JSON routes without requiring Paperback.
