import {
  extractBuildId,
  findChapterToken,
  mapChapterDetails,
  mapChapters,
  mapDiscoverSections,
  mapMangaDetails,
  mapSearchResults
} from "../src/flameParser.ts";

const FLAME_DOMAIN = "https://flamecomics.xyz";

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Paperback-FlameComics-Verification/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }
  return response.json();
}

async function main() {
  const homepage = await fetch(FLAME_DOMAIN, {
    headers: {
      "user-agent": "Paperback-FlameComics-Verification/1.0"
    }
  }).then((response) => response.text());
  const buildId = extractBuildId(homepage);

  const indexPayload = await fetchJson(
    `${FLAME_DOMAIN}/_next/data/${buildId}/index.json`
  );
  const sections = mapDiscoverSections(indexPayload);
  if (sections.length !== 3 || sections.some((section) => section.items.length === 0)) {
    throw new Error("Live homepage sections did not produce populated items");
  }

  const firstManga = sections.find((section) => section.items.length > 0).items[0];
  const seriesPayload = await fetchJson(
    `${FLAME_DOMAIN}/_next/data/${buildId}/series/${firstManga.mangaId}.json?id=${firstManga.mangaId}`
  );
  const mangaDetails = mapMangaDetails(firstManga.mangaId, seriesPayload);
  const chapters = mapChapters({ mangaId: firstManga.mangaId }, seriesPayload);
  if (!mangaDetails.mangaInfo.primaryTitle || chapters.length === 0) {
    throw new Error("Live series details did not produce title and chapters");
  }

  const chapter = chapters[0];
  const token = findChapterToken(chapter.chapterId, seriesPayload);
  const chapterPayload = await fetchJson(
    `${FLAME_DOMAIN}/_next/data/${buildId}/series/${firstManga.mangaId}/${token}.json?id=${firstManga.mangaId}&token=${token}`
  );
  const chapterDetails = mapChapterDetails(firstManga.mangaId, token, chapterPayload);
  if (chapterDetails.pages.length === 0) {
    throw new Error("Live chapter details did not produce page URLs");
  }

  const searchPayload = await fetchJson(
    `${FLAME_DOMAIN}/_next/data/${buildId}/browse.json?search=solo`
  );
  const searchResults = mapSearchResults({ title: "solo" }, searchPayload);
  if (searchResults.items.length === 0) {
    throw new Error("Live search did not produce results");
  }

  console.log(
    JSON.stringify(
      {
        buildId,
        sectionCount: sections.length,
        sampledManga: mangaDetails.mangaInfo.primaryTitle,
        sampledChapters: chapters.length,
        sampledPages: chapterDetails.pages.length,
        searchResults: searchResults.items.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
