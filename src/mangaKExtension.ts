import {
  MANGAK_DOMAIN,
  extractMangaKNextData,
  mangaKSlugFromSourceManga,
  mapMangaKChapterDetails,
  mapMangaKChapters,
  mapMangaKDiscoverSectionItems,
  mapMangaKDiscoverSections,
  mapMangaKMangaDetails,
  mapMangaKSearchResults,
  type MangaKSearchQuery,
  type MangaKSourceMangaRef
} from "./mangaKParser";
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
  sourceManga: MangaKSourceMangaRef;
};

export class MangaKExtension {
  private cloudflareCookies: PaperbackResponse["cookies"] = [];

  async initialise() {
    Application.registerInterceptor(
      "mangak",
      Application.Selector(this, "interceptRequest"),
      Application.Selector(this, "interceptResponse")
    );
  }

  async interceptRequest(request: PaperbackRequest): Promise<PaperbackRequest> {
    return {
      ...request,
      headers: {
        ...(request.headers ?? {}),
        referer: `${MANGAK_DOMAIN}/home`,
        origin: MANGAK_DOMAIN,
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
    return mapMangaKDiscoverSections();
  }

  async getDiscoverSectionItems(section: DiscoverSection, _metadata?: unknown) {
    const payload = await this.fetchPage("/home");
    return mapMangaKDiscoverSectionItems(section.id, payload);
  }

  async getMangaDetails(mangaId: string) {
    const payload = await this.fetchSeriesPayload(mangaId);
    return mapMangaKMangaDetails(mangaId, payload);
  }

  async getChapters(sourceManga: MangaKSourceMangaRef) {
    const payload = await this.fetchSeriesPayload(mangaKSlugFromSourceManga(sourceManga));
    return mapMangaKChapters(sourceManga, payload);
  }

  async getChapterDetails(chapter: ChapterRef) {
    const slug = mangaKSlugFromSourceManga(chapter.sourceManga);
    const payload = await this.fetchPage(
      `/${encodeURIComponent(slug)}/${encodeURIComponent(chapter.chapterId)}`
    );
    return mapMangaKChapterDetails(chapter, payload);
  }

  async getSearchResults(query: MangaKSearchQuery, metadata?: { page?: number }) {
    const page = metadata?.page ?? 1;
    const title = (query.title ?? "").trim();
    const params = new URLSearchParams();
    if (title) {
      params.set("keyword", title);
    }
    params.set("page", String(page));

    const payload = await this.fetchPage(`/search?${params.toString()}`);
    return mapMangaKSearchResults(payload);
  }

  async saveCloudflareBypassCookies(cookies: PaperbackResponse["cookies"]) {
    this.cloudflareCookies = (cookies ?? []).filter((cookie) =>
      cookie.name.startsWith("cf") ||
      cookie.name.startsWith("_cf") ||
      cookie.name.startsWith("__cf")
    );
  }

  private async fetchSeriesPayload(mangaId: string) {
    return this.fetchPage(`/${encodeURIComponent(mangaId)}`);
  }

  private async fetchPage(path: string): Promise<unknown> {
    const response = await this.schedule({
      url: `${MANGAK_DOMAIN}${path}`,
      method: "GET"
    });

    this.assertOk(response);
    return extractMangaKNextData(response.body);
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

  private async homepageRequest(): Promise<PaperbackRequest> {
    return {
      url: `${MANGAK_DOMAIN}/home`,
      method: "GET",
      headers: {
        referer: `${MANGAK_DOMAIN}/home`,
        origin: MANGAK_DOMAIN,
        "user-agent": await Application.getDefaultUserAgent()
      }
    };
  }
}

export const MangaK = new MangaKExtension();
