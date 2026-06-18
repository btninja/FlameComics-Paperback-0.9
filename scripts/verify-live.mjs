import {
  extractBuildId,
  findChapterToken,
  mapChapterDetails,
  mapChapters,
  mapDiscoverSections,
  mapMangaDetails,
  mapSearchResults
} from "../src/flameParser.ts";
import {
  QIMANGA_API_DOMAIN,
  mapQiChapterDetails,
  mapQiChapters,
  mapQiDiscoverSectionItems,
  mapQiDiscoverSections,
  mapQiMangaDetails,
  mapQiSearchResults
} from "../src/qiMangaParser.ts";

const FLAME_DOMAIN = "https://flamecomics.xyz";
const QIMANGA_DOMAIN = "https://qimanga.com";

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "origin": QIMANGA_DOMAIN,
      "referer": `${QIMANGA_DOMAIN}/`,
      "user-agent": "Paperback-Repository-Verification/1.0"
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
      "user-agent": "Paperback-Repository-Verification/1.0"
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

  const qiHomePayload = await fetchJson(`${QIMANGA_API_DOMAIN}/v1/home`);
  const qiSections = mapQiDiscoverSections();
  const qiNewItems = mapQiDiscoverSectionItems("new", qiHomePayload);
  if (qiSections.length !== 5 || qiNewItems.items.length === 0) {
    throw new Error("Live QiManga homepage did not produce populated items");
  }

  const qiFirstManga = qiNewItems.items[0];
  const qiSeriesPayload = await fetchJson(
    `${QIMANGA_API_DOMAIN}/v1/series/${qiFirstManga.mangaId}`
  );
  const qiMangaDetails = mapQiMangaDetails(qiFirstManga.mangaId, qiSeriesPayload);
  const qiChaptersPayload = await fetchJson(
    `${QIMANGA_API_DOMAIN}/v1/series/${qiFirstManga.mangaId}/chapters?page=1&perPage=30&sort=desc`
  );
  const qiChapters = mapQiChapters({ mangaId: qiFirstManga.mangaId }, qiChaptersPayload);
  if (!qiMangaDetails.mangaInfo.primaryTitle || qiChapters.length === 0) {
    throw new Error("Live QiManga series details did not produce title and chapters");
  }

  const qiChapterPayload = await fetchJson(
    `${QIMANGA_API_DOMAIN}/v1/series/${qiFirstManga.mangaId}/chapters/${qiFirstManga.chapterId}`
  );
  const qiChapterDetails = mapQiChapterDetails(
    {
      chapterId: qiFirstManga.chapterId,
      sourceManga: { mangaId: qiFirstManga.mangaId }
    },
    qiChapterPayload
  );
  if (qiChapterDetails.pages.length === 0) {
    throw new Error("Live QiManga chapter details did not produce page URLs");
  }

  const qiSearchPayload = await fetchJson(
    `${QIMANGA_API_DOMAIN}/v1/series/search?q=immortal&page=1&perPage=20`
  );
  const qiSearchResults = mapQiSearchResults(qiSearchPayload);
  if (qiSearchResults.items.length === 0) {
    throw new Error("Live QiManga search did not produce results");
  }

  console.log(
    JSON.stringify(
      {
        flameComics: {
          buildId,
          sectionCount: sections.length,
          sampledManga: mangaDetails.mangaInfo.primaryTitle,
          sampledChapters: chapters.length,
          sampledPages: chapterDetails.pages.length,
          searchResults: searchResults.items.length
        },
        qiManga: {
          sectionCount: qiSections.length,
          sampledManga: qiMangaDetails.mangaInfo.primaryTitle,
          sampledChapters: qiChapters.length,
          sampledPages: qiChapterDetails.pages.length,
          searchResults: qiSearchResults.items.length
        }
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
