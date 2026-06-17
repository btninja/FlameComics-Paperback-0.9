export const FLAME_DOMAIN = "https://flamecomics.xyz";
export const FLAME_CDN_DOMAIN = "https://cdn.flamecomics.xyz";
export const IMAGE_SERIES_PATH = "uploads/images/series";
export const IMAGE_CAROUSEL_PATH = "uploads/images/carousel";
export const DiscoverSectionType = {
  featured: 0,
  simpleCarousel: 1
} as const;

export type SourceMangaRef = {
  mangaId: string;
  title?: string;
};

export type SearchQuery = {
  title?: string;
  includedTags?: Array<{ title?: string; label?: string }>;
  excludedTags?: Array<{ title?: string; label?: string }>;
};

type FlameSeriesPreview = {
  series_id: number | string;
  title: string;
  likes?: number;
  status?: string;
  cover?: string;
  image?: string;
  categories?: string[];
};

type FlameChapterPreview = {
  chapter_id: number | string;
  chapter: string;
  title?: string | null;
  release_date?: number | string;
  token?: string;
};

export function extractBuildId(html: string): string {
  const scriptMatch = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/
  );
  if (!scriptMatch?.[1]) {
    throw new Error("Unable to find __NEXT_DATA__ script");
  }

  const nextData = JSON.parse(decodeHtmlEntities(scriptMatch[1]));
  if (!nextData.buildId || typeof nextData.buildId !== "string") {
    throw new Error("Unable to find buildId in __NEXT_DATA__");
  }

  return nextData.buildId;
}

export function mapDiscoverSectionList(payload: unknown) {
  return mapDiscoverSections(payload).map(({ id, title, type }) => ({
    id,
    title,
    type
  }));
}

export function mapDiscoverSections(payload: unknown) {
  const pageProps = getPageProps(payload);
  const carousel = asArray<FlameSeriesPreview>(pageProps.carousel);
  const popular = asArray<FlameSeriesPreview>(
    pageProps.popularEntries?.blocks?.[0]?.series
  );
  const latest = asArray<FlameSeriesPreview>(
    pageProps.latestEntries?.blocks?.[0]?.series
  );

  return [
    {
      id: "featured",
      title: "Featured",
      type: DiscoverSectionType.featured,
      items: carousel
        .filter((comic) => comic.series_id != null && comic.image)
        .map((comic) => ({
          type: "featuredCarouselItem",
          mangaId: String(comic.series_id),
          imageUrl: carouselImageUrl(String(comic.image)),
          title: comic.title
        }))
    },
    {
      id: "popular",
      title: "Popular",
      type: DiscoverSectionType.simpleCarousel,
      items: popular
        .filter((comic) => comic.series_id != null && comic.cover)
        .map((comic) => ({
          type: "simpleCarouselItem",
          mangaId: String(comic.series_id),
          imageUrl: seriesImageUrl(String(comic.series_id), String(comic.cover)),
          title: comic.title,
          subtitle: `${comic.likes ?? 0} likes | ${comic.status ?? ""}`.trim()
        }))
    },
    {
      id: "latest",
      title: "Latest",
      type: DiscoverSectionType.simpleCarousel,
      items: latest
        .filter((comic) => comic.series_id != null && comic.cover)
        .map((comic) => ({
          type: "simpleCarouselItem",
          mangaId: String(comic.series_id),
          imageUrl: seriesImageUrl(String(comic.series_id), String(comic.cover)),
          title: comic.title,
          subtitle: comic.status ?? ""
        }))
    }
  ];
}

export function mapDiscoverSectionItems(sectionId: string, payload: unknown) {
  const section = mapDiscoverSections(payload).find(({ id }) => id === sectionId);
  if (!section) {
    return { items: [], metadata: undefined };
  }

  return { items: section.items, metadata: undefined };
}

export function mapMangaDetails(mangaId: string, payload: unknown) {
  const pageProps = getPageProps(payload);
  const series = pageProps.series;
  if (!series) {
    throw new Error(`Unable to parse FlameComics series ${mangaId}`);
  }

  const title = cleanText(series.title);
  const cover = String(series.cover ?? "");

  return {
    mangaId,
    mangaInfo: {
      shareUrl: `${FLAME_DOMAIN}/series/${mangaId}`,
      primaryTitle: title,
      secondaryTitles: asArray<string>(series.altTitles)
        .map((secondaryTitle) => cleanText(secondaryTitle))
        .filter(Boolean),
      thumbnailUrl: cover ? seriesImageUrl(mangaId, cover) : "",
      author: cleanText(series.author),
      artist: cleanText(series.artist),
      synopsis: cleanText(series.description),
      contentRating: "SAFE",
      status: cleanText(series.status) || "Ongoing",
      tagGroups: [
        {
          id: "genres",
          title: "Genres",
          tags: asArray<string>(series.tags).map((tag) => ({
            id: slugify(tag),
            title: cleanText(tag)
          }))
        }
      ]
    }
  };
}

export function mapChapters(sourceManga: SourceMangaRef, payload: unknown) {
  const chapters = asArray<FlameChapterPreview>(getPageProps(payload).chapters);

  return chapters.map((chapter) => {
    const chapterNumber = Number.parseFloat(String(chapter.chapter));
    const safeChapterNumber = Number.isFinite(chapterNumber) ? chapterNumber : 0;
    const chapterTitle = cleanText(chapter.title ?? "");

    return {
      chapterId: String(chapter.chapter_id),
      sourceManga,
      langCode: "en",
      chapNum: safeChapterNumber,
      title: chapterTitle
        ? `Ch. ${formatChapterNumber(safeChapterNumber)} - ${chapterTitle}`
        : `Ch. ${formatChapterNumber(safeChapterNumber)}`,
      publishDate: new Date(Number(chapter.release_date ?? 0) * 1000),
      sortingIndex: safeChapterNumber,
      volume: 0
    };
  });
}

export function findChapterToken(chapterId: string, payload: unknown): string {
  const chapters = asArray<FlameChapterPreview>(getPageProps(payload).chapters);
  const chapter = chapters.find(
    (chapter) => String(chapter.chapter_id) === chapterId
  );
  if (!chapter?.token) {
    throw new Error(`Unable to find token for chapter ${chapterId}`);
  }

  return chapter.token;
}

export function mapChapterDetails(
  mangaId: string,
  token: string,
  payload: unknown
) {
  const chapter = getPageProps(payload).chapter;
  if (!chapter) {
    throw new Error(`Unable to parse chapter ${token}`);
  }

  const images = Object.values(chapter.images ?? {}) as Array<{ name?: string }>;

  return {
    id: String(chapter.chapter_id),
    mangaId,
    pages: images
      .map((image) => image.name)
      .filter((name): name is string => Boolean(name))
      .map((name) => seriesChapterImageUrl(mangaId, token, name))
  };
}

export function mapSearchResults(query: SearchQuery, payload: unknown) {
  const titleQuery = (query.title ?? "").trim().toLowerCase();
  const includedTags = tagLabels(query.includedTags);
  const excludedTags = tagLabels(query.excludedTags);

  const items = asArray<FlameSeriesPreview>(getPageProps(payload).series)
    .filter((comic) => {
      if (!titleQuery) {
        return true;
      }
      return comic.title?.toLowerCase().includes(titleQuery);
    })
    .filter((comic) => {
      if (includedTags.length === 0) {
        return true;
      }
      const comicTags = (comic.categories ?? []).map((tag) => tag.toLowerCase());
      return includedTags.some((tag) => comicTags.includes(tag));
    })
    .filter((comic) => {
      if (excludedTags.length === 0) {
        return true;
      }
      const comicTags = (comic.categories ?? []).map((tag) => tag.toLowerCase());
      return !excludedTags.some((tag) => comicTags.includes(tag));
    })
    .filter((comic) => comic.series_id != null && comic.cover)
    .map((comic) => ({
      mangaId: String(comic.series_id),
      imageUrl: seriesImageUrl(String(comic.series_id), String(comic.cover)),
      title: comic.title,
      subtitle: comic.status ?? "",
      contentRating: "SAFE"
    }));

  return {
    items,
    metadata: undefined
  };
}

export function seriesImageUrl(seriesId: string, imageName: string): string {
  return `${FLAME_CDN_DOMAIN}/${IMAGE_SERIES_PATH}/${seriesId}/${imageName}`;
}

export function seriesChapterImageUrl(
  seriesId: string,
  token: string,
  imageName: string
): string {
  return `${FLAME_CDN_DOMAIN}/${IMAGE_SERIES_PATH}/${seriesId}/${token}/${imageName}`;
}

export function carouselImageUrl(imageName: string): string {
  return `${FLAME_CDN_DOMAIN}/${IMAGE_CAROUSEL_PATH}/${imageName}`;
}

function getPageProps(payload: unknown): Record<string, any> {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid FlameComics payload");
  }

  const maybePageProps = (payload as { pageProps?: unknown }).pageProps;
  if (!maybePageProps || typeof maybePageProps !== "object") {
    throw new Error("FlameComics payload is missing pageProps");
  }

  return maybePageProps as Record<string, any>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cleanText(value: unknown): string {
  if (value == null) {
    return "";
  }

  return decodeHtmlEntities(String(value).replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\"",
    "#39": "'"
  };

  return value.replace(/&([a-zA-Z0-9#]+);/g, (match, entity) => {
    if (entity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return entities[entity] ?? match;
  });
}

function slugify(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatChapterNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(value).replace(/0+$/, "").replace(/\.$/, "");
}

function tagLabels(tags: SearchQuery["includedTags"]): string[] {
  return (tags ?? [])
    .map((tag) => cleanText(tag.title ?? tag.label ?? ""))
    .filter(Boolean)
    .map((tag) => tag.toLowerCase());
}
