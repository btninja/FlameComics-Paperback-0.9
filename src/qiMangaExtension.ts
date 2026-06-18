import {
  QIMANGA_API_DOMAIN,
  QIMANGA_DOMAIN,
  mapQiChapterDetails,
  mapQiChapters,
  mapQiDiscoverSectionItems,
  mapQiDiscoverSections,
  mapQiMangaDetails,
  mapQiSearchResults,
  qiSlugFromSourceManga,
  type QiSearchQuery,
  type QiSourceMangaRef
} from "./qiMangaParser";
import type { PaperbackRequest, PaperbackResponse } from "./paperback";

class CloudflareBypassError extends Error {
  type = "cloudflareError";
  resolutionRequest: PaperbackRequest;

  constructor(resolutionRequest: PaperbackRequest) {
    super("Cloudflare detected, bypass it to continue");
    this.resolutionRequest = resolutionRequest;
  }
}

type DiscoverSection = {
  id: string;
  title: string;
  type: number;
};

type ChapterRef = {
  chapterId: string;
  sourceManga: QiSourceMangaRef;
};

export class QiMangaExtension {
  private cloudflareCookies: PaperbackResponse["cookies"] = [];

  async initialise() {
    Application.registerInterceptor(
      "qimanga",
      Application.Selector(this, "interceptRequest"),
      Application.Selector(this, "interceptResponse")
    );
  }

  async interceptRequest(request: PaperbackRequest): Promise<PaperbackRequest> {
    return {
      ...request,
      headers: {
        ...(request.headers ?? {}),
        referer: `${QIMANGA_DOMAIN}/`,
        origin: QIMANGA_DOMAIN,
        "user-agent": await Application.getDefaultUserAgent()
      }
    };
  }

  async interceptResponse(
    _request: PaperbackRequest,
    response: PaperbackResponse,
    data: ArrayBuffer
  ): Promise<ArrayBuffer> {
    if (response.headers?.["cf-mitigated"] === "challenge") {
      throw new CloudflareBypassError(await this.homepageRequest());
    }

    return data;
  }

  async getDiscoverSections() {
    return mapQiDiscoverSections();
  }

  async getDiscoverSectionItems(section: DiscoverSection, _metadata?: unknown) {
    const payload = await this.fetchJson("v1/home");
    return mapQiDiscoverSectionItems(section.id, payload);
  }

  async getMangaDetails(mangaId: string) {
    const payload = await this.fetchJson(`v1/series/${encodeURIComponent(mangaId)}`);
    return mapQiMangaDetails(mangaId, payload);
  }

  async getChapters(sourceManga: QiSourceMangaRef) {
    const slug = encodeURIComponent(qiSlugFromSourceManga(sourceManga));
    const chapters: unknown[] = [];
    let page = 1;

    for (;;) {
      const payload = await this.fetchJson(
        `v1/series/${slug}/chapters?page=${page}&perPage=30&sort=desc`
      );
      chapters.push(...this.payloadData(payload));

      const nextPage = this.nextPage(payload);
      if (!nextPage) {
        break;
      }
      page = nextPage;
    }

    return mapQiChapters(sourceManga, { data: chapters });
  }

  async getChapterDetails(chapter: ChapterRef) {
    const slug = encodeURIComponent(qiSlugFromSourceManga(chapter.sourceManga));
    const payload = await this.fetchJson(
      `v1/series/${slug}/chapters/${encodeURIComponent(chapter.chapterId)}`
    );
    return mapQiChapterDetails(chapter, payload);
  }

  async getSearchResults(query: QiSearchQuery, metadata?: { page?: number }) {
    const page = metadata?.page ?? 1;
    const title = (query.title ?? "").trim();
    const path = title
      ? `v1/series/search?q=${encodeURIComponent(title)}&page=${page}&perPage=20`
      : `v1/series?page=${page}&perPage=20&sort=latest`;
    const payload = await this.fetchJson(path);

    return mapQiSearchResults(payload);
  }

  async saveCloudflareBypassCookies(cookies: PaperbackResponse["cookies"]) {
    this.cloudflareCookies = (cookies ?? []).filter((cookie) =>
      cookie.name.startsWith("cf") ||
      cookie.name.startsWith("_cf") ||
      cookie.name.startsWith("__cf")
    );
  }

  private async fetchJson(path: string): Promise<unknown> {
    const response = await this.schedule({
      url: `${QIMANGA_API_DOMAIN}/${path}`,
      method: "GET"
    });

    this.assertOk(response);
    return JSON.parse(response.body);
  }

  private async schedule(request: PaperbackRequest) {
    const requestWithHeaders = await this.interceptRequest(request);
    if (this.cloudflareCookies.length > 0) {
      requestWithHeaders.cookies = {
        ...(requestWithHeaders.cookies ?? {}),
        ...Object.fromEntries(
          this.cloudflareCookies.map((cookie) => [cookie.name, cookie.value])
        )
      };
    }

    const [response, buffer] = await Application.scheduleRequest(requestWithHeaders);
    await this.interceptResponse(requestWithHeaders, response, buffer);
    return {
      request: requestWithHeaders,
      status: response.status,
      headers: response.headers ?? {},
      body: Application.arrayBufferToUTF8String(buffer)
    };
  }

  private assertOk(response: { request: PaperbackRequest; status: number }) {
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch ${response.request.url}; status code ${response.status}`
      );
    }
  }

  private nextPage(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      return 0;
    }

    const next = (payload as { next?: unknown }).next;
    return typeof next === "number" ? next : 0;
  }

  private payloadData(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      return [];
    }

    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? data : [];
  }

  private async homepageRequest(): Promise<PaperbackRequest> {
    return {
      url: QIMANGA_DOMAIN,
      method: "GET",
      headers: {
        referer: `${QIMANGA_DOMAIN}/`,
        origin: QIMANGA_DOMAIN,
        "user-agent": await Application.getDefaultUserAgent()
      }
    };
  }
}

export const QiManga = new QiMangaExtension();
