import {
  FLAME_DOMAIN,
  extractBuildId,
  findChapterToken,
  mapChapterDetails,
  mapChapters,
  mapDiscoverSectionItems,
  mapDiscoverSectionList,
  mapMangaDetails,
  mapSearchResults,
  type SearchQuery,
  type SourceMangaRef
} from "./flameParser";
import type { PaperbackRequest, PaperbackResponse } from "./paperback";

const BUILD_ID_STATE_KEY = "buildId";

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
  type: string;
};

type ChapterRef = {
  chapterId: string;
  sourceManga: SourceMangaRef;
};

export class FlameComicsExtension {
  private buildId = "";
  private cloudflareCookies: PaperbackResponse["cookies"] = [];

  async initialise() {
    Application.registerInterceptor(
      "flamecomics",
      Application.Selector(this, "interceptRequest"),
      Application.Selector(this, "interceptResponse")
    );
  }

  async interceptRequest(request: PaperbackRequest): Promise<PaperbackRequest> {
    return {
      ...request,
      headers: {
        ...(request.headers ?? {}),
        referer: `${FLAME_DOMAIN}/`,
        origin: `${FLAME_DOMAIN}/`,
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
    const payload = await this.fetchJsonWithBuildId("index.json");
    return mapDiscoverSectionList(payload);
  }

  async getDiscoverSectionItems(section: DiscoverSection, _metadata?: unknown) {
    const payload = await this.fetchJsonWithBuildId("index.json");
    return mapDiscoverSectionItems(section.id, payload);
  }

  async getMangaDetails(mangaId: string) {
    const payload = await this.fetchSeriesPayload(mangaId);
    return mapMangaDetails(mangaId, payload);
  }

  async getChapters(sourceManga: SourceMangaRef) {
    const payload = await this.fetchSeriesPayload(sourceManga.mangaId);
    return mapChapters(sourceManga, payload);
  }

  async getChapterDetails(chapter: ChapterRef) {
    const mangaId = chapter.sourceManga.mangaId;
    const seriesPayload = await this.fetchSeriesPayload(mangaId);
    const token = findChapterToken(chapter.chapterId, seriesPayload);
    const chapterPayload = await this.fetchJsonWithBuildId(
      `series/${mangaId}/${encodeURIComponent(token)}.json?id=${encodeURIComponent(mangaId)}&token=${encodeURIComponent(token)}`
    );

    return mapChapterDetails(mangaId, token, chapterPayload);
  }

  async getSearchResults(query: SearchQuery, _metadata?: unknown) {
    const payload = await this.fetchJsonWithBuildId(
      `browse.json?search=${encodeURIComponent(query.title ?? "")}`
    );
    return mapSearchResults(query, payload);
  }

  async saveCloudflareBypassCookies(cookies: PaperbackResponse["cookies"]) {
    this.cloudflareCookies = (cookies ?? []).filter((cookie) =>
      cookie.name.startsWith("cf") ||
      cookie.name.startsWith("_cf") ||
      cookie.name.startsWith("__cf")
    );
  }

  private async fetchSeriesPayload(mangaId: string) {
    return this.fetchJsonWithBuildId(
      `series/${encodeURIComponent(mangaId)}.json?id=${encodeURIComponent(mangaId)}`
    );
  }

  private async fetchJsonWithBuildId(path: string): Promise<unknown> {
    await this.refreshBuildId(false);
    let response = await this.schedule({
      url: `${FLAME_DOMAIN}/_next/data/${this.buildId}/${path}`,
      method: "GET"
    });

    if (response.status === 404) {
      await this.refreshBuildId(true);
      response = await this.schedule({
        url: `${FLAME_DOMAIN}/_next/data/${this.buildId}/${path}`,
        method: "GET"
      });
    }

    this.assertOk(response);
    return JSON.parse(response.body);
  }

  private async refreshBuildId(force: boolean) {
    if (!force) {
      if (this.buildId) {
        return;
      }

      const cachedBuildId = Application.getState(BUILD_ID_STATE_KEY);
      if (typeof cachedBuildId === "string" && cachedBuildId) {
        this.buildId = cachedBuildId;
        return;
      }
    }

    const response = await this.schedule({
      url: FLAME_DOMAIN,
      method: "GET"
    });
    this.assertOk(response);

    this.buildId = extractBuildId(response.body);
    Application.setState(this.buildId, BUILD_ID_STATE_KEY);
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
      url: FLAME_DOMAIN,
      method: "GET",
      headers: {
        referer: `${FLAME_DOMAIN}/`,
        origin: `${FLAME_DOMAIN}/`,
        "user-agent": await Application.getDefaultUserAgent()
      }
    };
  }
}

export const FlameComics = new FlameComicsExtension();
