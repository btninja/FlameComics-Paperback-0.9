import { describe, expect, it } from "vitest";
import {
  extractBuildId,
  mapChapterDetails,
  mapChapters,
  mapDiscoverSections,
  mapMangaDetails,
  mapSearchResults
} from "../src/flameParser";

const homePayload = {
  pageProps: {
    carousel: [
      { series_id: 2, title: "Omniscient Reader", image: "carousel.webp" }
    ],
    popularEntries: {
      blocks: [
        {
          series: [
            {
              series_id: 154,
              title: "Sword Clan",
              likes: 592,
              status: "Ongoing",
              cover: "thumbnail.webp"
            }
          ]
        }
      ]
    },
    latestEntries: {
      blocks: [
        {
          series: [
            {
              series_id: 160,
              title: "Moonlight",
              status: "Ongoing",
              cover: "thumbnail.webp"
            }
          ]
        }
      ]
    }
  }
};

const seriesPayload = {
  pageProps: {
    series: {
      series_id: 154,
      title: "Sword Clan",
      altTitles: ["<b>Alt Sword</b>"],
      cover: "thumbnail.webp",
      artist: "Artist",
      author: "Author",
      description: "<p>A <strong>clean</strong> synopsis.</p>",
      status: "Ongoing",
      tags: ["Action", "Fantasy"]
    },
    chapters: [
      {
        chapter_id: 10,
        chapter: "2.00",
        title: "Return",
        release_date: 1781623014,
        token: "chapter-token"
      },
      {
        chapter_id: 9,
        chapter: "1.00",
        title: "",
        release_date: 1781016067,
        token: "chapter-token-1"
      }
    ]
  }
};

describe("Flame parser", () => {
  it("extracts the Next.js build id from homepage HTML", () => {
    const html = `<script id="__NEXT_DATA__" type="application/json">{"buildId":"abc123"}</script>`;

    expect(extractBuildId(html)).toBe("abc123");
  });

  it("maps homepage payload into 0.9 discover sections", () => {
    const sections = mapDiscoverSections(homePayload);

    expect(sections).toEqual([
      {
        id: "featured",
        title: "Featured",
        type: 0,
        items: [
          {
            type: "featuredCarouselItem",
            mangaId: "2",
            imageUrl: "https://cdn.flamecomics.xyz/uploads/images/carousel/carousel.webp",
            title: "Omniscient Reader"
          }
        ]
      },
      {
        id: "popular",
        title: "Popular",
        type: 1,
        items: [
          {
            type: "simpleCarouselItem",
            mangaId: "154",
            imageUrl: "https://cdn.flamecomics.xyz/uploads/images/series/154/thumbnail.webp",
            title: "Sword Clan",
            subtitle: "592 likes | Ongoing"
          }
        ]
      },
      {
        id: "latest",
        title: "Latest",
        type: 1,
        items: [
          {
            type: "simpleCarouselItem",
            mangaId: "160",
            imageUrl: "https://cdn.flamecomics.xyz/uploads/images/series/160/thumbnail.webp",
            title: "Moonlight",
            subtitle: "Ongoing"
          }
        ]
      }
    ]);
  });

  it("maps manga details into a 0.9 source manga", () => {
    expect(mapMangaDetails("154", seriesPayload)).toEqual({
      mangaId: "154",
      mangaInfo: {
        shareUrl: "https://flamecomics.xyz/series/154",
        primaryTitle: "Sword Clan",
        secondaryTitles: ["Alt Sword"],
        thumbnailUrl: "https://cdn.flamecomics.xyz/uploads/images/series/154/thumbnail.webp",
        author: "Author",
        artist: "Artist",
        synopsis: "A clean synopsis.",
        contentRating: "SAFE",
        status: "Ongoing",
        tagGroups: [
          {
            id: "genres",
            title: "Genres",
            tags: [
              { id: "action", title: "Action" },
              { id: "fantasy", title: "Fantasy" }
            ]
          }
        ]
      }
    });
  });

  it("maps chapters with stable ids and source manga references", () => {
    expect(mapChapters({ mangaId: "154", title: "Sword Clan" }, seriesPayload)).toEqual([
      {
        chapterId: "10",
        sourceManga: { mangaId: "154", title: "Sword Clan" },
        langCode: "en",
        chapNum: 2,
        title: "Ch. 2 - Return",
        publishDate: new Date(1781623014 * 1000),
        sortingIndex: 2,
        volume: 0
      },
      {
        chapterId: "9",
        sourceManga: { mangaId: "154", title: "Sword Clan" },
        langCode: "en",
        chapNum: 1,
        title: "Ch. 1",
        publishDate: new Date(1781016067 * 1000),
        sortingIndex: 1,
        volume: 0
      }
    ]);
  });

  it("maps chapter page image names to CDN URLs", () => {
    const chapterPayload = {
      pageProps: {
        chapter: {
          chapter_id: 10,
          images: {
            0: { name: "001.webp" },
            1: { name: "002.webp" }
          }
        }
      }
    };

    expect(mapChapterDetails("154", "chapter-token", chapterPayload)).toEqual({
      id: "10",
      mangaId: "154",
      pages: [
        "https://cdn.flamecomics.xyz/uploads/images/series/154/chapter-token/001.webp",
        "https://cdn.flamecomics.xyz/uploads/images/series/154/chapter-token/002.webp"
      ]
    });
  });

  it("maps search results and filters by title", () => {
    const browsePayload = {
      pageProps: {
        series: [
          {
            series_id: 1,
            title: "Solo Leveling",
            status: "Completed",
            cover: "thumbnail.webp",
            categories: ["Action"]
          },
          {
            series_id: 2,
            title: "Other Series",
            status: "Ongoing",
            cover: "thumbnail.png",
            categories: ["Drama"]
          }
        ]
      }
    };

    expect(mapSearchResults({ title: "solo" }, browsePayload)).toEqual({
      items: [
        {
          mangaId: "1",
          imageUrl: "https://cdn.flamecomics.xyz/uploads/images/series/1/thumbnail.webp",
          title: "Solo Leveling",
          subtitle: "Completed",
          contentRating: "SAFE"
        }
      ],
      metadata: undefined
    });
  });
});
