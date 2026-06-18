export const QIMANGA_DOMAIN = "https://qimanga.com";
export const QIMANGA_API_DOMAIN = "https://api.qimanga.com/api";

export const QiDiscoverSectionType = {
  featured: 0,
  simpleCarousel: 1,
  prominentCarousel: 2,
  chapterUpdates: 3
} as const;

export type QiSourceMangaRef = {
  mangaId: string;
  title?: string;
  mangaInfo?: {
    additionalInfo?: {
      slug?: string;
    };
  };
};

export type QiSearchQuery = {
  title?: string;
  metadata?: Array<{ id?: string; value?: string }>;
};

type QiSeriesPreview = {
  id?: number | string;
  slug?: string;
  title?: string;
  cover?: string;
  type?: string;
  status?: string;
  redirectUrl?: string | null;
  chapters?: QiChapterPreview[];
};

type QiChapterPreview = {
  slug?: string;
  number?: number;
  title?: string | null;
  price?: number;
  requiresPurchase?: boolean;
  publishStatus?: string;
  createdAt?: string;
};

type QiGenre = {
  id?: number | string;
  name?: string;
  slug?: string;
};

export function mapQiDiscoverSections() {
  return [
    { id: "featured", title: "Featured", type: QiDiscoverSectionType.prominentCarousel },
    { id: "popular", title: "Popular Today", type: QiDiscoverSectionType.chapterUpdates },
    { id: "pinned", title: "Pinned", type: QiDiscoverSectionType.chapterUpdates },
    { id: "new", title: "New Series", type: QiDiscoverSectionType.chapterUpdates },
    { id: "editors-pick", title: "Editor's Pick", type: QiDiscoverSectionType.simpleCarousel }
  ];
}

export function mapQiDiscoverSectionItems(sectionId: string, payload: unknown) {
  const home = asRecord(payload);
  let items: unknown[];

  switch (sectionId) {
    case "featured":
      items = mapProminentItems(asArray<QiSeriesPreview>(home.banners));
      break;
    case "popular":
      items = mapChapterUpdateItems(asArray<QiSeriesPreview>(home.popular));
      break;
    case "pinned":
      items = mapChapterUpdateItems(asArray<QiSeriesPreview>(home.pinned));
      break;
    case "new":
      items = mapChapterUpdateItems(asArray<QiSeriesPreview>(home.newSeries));
      break;
    case "editors-pick":
      items = mapSimpleItems(asArray<QiSeriesPreview>(home.editorsPick));
      break;
    default:
      items = [];
      break;
  }

  return { items, metadata: undefined };
}

export function mapQiMangaDetails(mangaId: string, payload: unknown) {
  const series = asRecord(payload);
  const slug = cleanText(series.slug) || mangaId;
  const title = cleanText(series.title);
  const author = cleanText(series.author);
  const artist = cleanText(series.artist);
  const genres = asArray<QiGenre>(series.genres);

  return {
    mangaId,
    mangaInfo: {
      shareUrl: `${QIMANGA_DOMAIN}/series/${slug}`,
      primaryTitle: title,
      secondaryTitles: splitAlternativeTitles(series.alternativeTitles),
      thumbnailUrl: cleanText(series.cover),
      ...(author ? { author } : {}),
      ...(artist ? { artist } : {}),
      synopsis: cleanText(series.description),
      contentRating: "SAFE",
      status: cleanText(series.status) || "UNKNOWN",
      tagGroups: genres.length > 0
        ? [
            {
              id: "genres",
              title: "Genres",
              tags: genres
                .map((genre) => ({
                  id: cleanText(genre.id),
                  title: cleanText(genre.name)
                }))
                .filter((genre) => genre.id && genre.title)
            }
          ]
        : [],
      additionalInfo: {
        seriesId: cleanText(series.id),
        slug
      }
    }
  };
}

export function mapQiChapters(sourceManga: QiSourceMangaRef, payload: unknown) {
  const chapters = asArray<QiChapterPreview>(asRecord(payload).data);

  return chapters
    .filter(isReadableChapter)
    .sort((left, right) => (left.number ?? 0) - (right.number ?? 0))
    .map((chapter, index) => ({
      chapterId: cleanText(chapter.slug),
      sourceManga,
      title: cleanText(chapter.title),
      chapNum: chapter.number ?? 0,
      volume: 0,
      volumetitle: "",
      langCode: "en",
      sortingIndex: index,
      publishDate: new Date(chapter.createdAt ?? 0)
    }));
}

export function mapQiChapterDetails(
  chapter: { chapterId: string; sourceManga: QiSourceMangaRef },
  payload: unknown
) {
  const pages = asArray<{ url?: string; order?: number }>(asRecord(payload).images)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .map((image) => cleanText(image.url))
    .filter(Boolean);

  if (pages.length === 0) {
    throw new Error("No chapter page data could be parsed from QiManga for this chapter.");
  }

  return {
    id: chapter.chapterId,
    mangaId: chapter.sourceManga.mangaId,
    pages
  };
}

export function mapQiSearchResults(payload: unknown, pageSize = 20) {
  const result = asRecord(payload);
  const data = asArray<QiSeriesPreview>(result.data);
  const items = mapSearchItems(data);
  const hasNextPage = data.length >= pageSize && result.next;

  return {
    items,
    metadata: hasNextPage ? { page: Number(result.next) } : undefined
  };
}

export function qiSlugFromSourceManga(sourceManga: QiSourceMangaRef) {
  return sourceManga.mangaInfo?.additionalInfo?.slug || sourceManga.mangaId;
}

function mapProminentItems(series: QiSeriesPreview[]) {
  return series.filter(isReadableSeries).map((entry) => ({
    type: "prominentCarouselItem",
    mangaId: cleanText(entry.slug),
    title: cleanText(entry.title),
    imageUrl: cleanText(entry.cover),
    subtitle: metadataSubtitle(entry.type, entry.status),
    contentRating: "SAFE"
  }));
}

function mapSimpleItems(series: QiSeriesPreview[]) {
  return series.filter(isReadableSeries).map((entry) => ({
    type: "simpleCarouselItem",
    mangaId: cleanText(entry.slug),
    title: cleanText(entry.title),
    imageUrl: cleanText(entry.cover),
    subtitle: metadataSubtitle(entry.type, entry.status),
    contentRating: "SAFE"
  }));
}

function mapChapterUpdateItems(series: QiSeriesPreview[]) {
  return series.filter(isReadableSeries).flatMap((entry) => {
    const chapter = asArray<QiChapterPreview>(entry.chapters).find(isFreeChapter);
    if (!chapter?.slug) {
      return [];
    }

    return [{
      type: "chapterUpdatesCarouselItem",
      mangaId: cleanText(entry.slug),
      chapterId: cleanText(chapter.slug),
      title: cleanText(entry.title),
      imageUrl: cleanText(entry.cover),
      subtitle: `Ch. ${chapter.number ?? 0}`,
      publishDate: new Date(chapter.createdAt ?? 0),
      contentRating: "SAFE"
    }];
  });
}

function mapSearchItems(series: QiSeriesPreview[]) {
  return series.filter(isReadableSeries).map((entry) => ({
    mangaId: cleanText(entry.slug),
    title: cleanText(entry.title),
    imageUrl: cleanText(entry.cover),
    subtitle: metadataSubtitle(entry.type, entry.status),
    contentRating: "SAFE"
  }));
}

function isReadableSeries(series: QiSeriesPreview) {
  const title = cleanText(series.title);
  return Boolean(
    title &&
    series.slug &&
    !title.startsWith("http://") &&
    !title.startsWith("https://") &&
    series.type !== "NOVEL" &&
    !cleanText(series.redirectUrl)
  );
}

function isReadableChapter(chapter: QiChapterPreview) {
  return Boolean(
    chapter.slug &&
    chapter.publishStatus === "PUBLIC" &&
    isFreeChapter(chapter)
  );
}

function isFreeChapter(chapter: QiChapterPreview) {
  return chapter.requiresPurchase !== true && Number(chapter.price ?? 0) === 0;
}

function splitAlternativeTitles(value: unknown) {
  return cleanText(value)
    .split(/, ?/)
    .map((title) => title.trim())
    .filter(Boolean);
}

function metadataSubtitle(type: unknown, status: unknown) {
  return [type, status]
    .map((value) => cleanText(value).toLowerCase().replace(/_/g, " "))
    .filter(Boolean)
    .map((value) => value.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(" • ");
}

function asRecord(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as Record<string, any>;
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
    .replace(/\s+([.,!?;:])/g, "$1")
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
