import { afterEach, describe, expect, it } from "vitest";
import { MangaKExtension } from "../src/mangaKExtension";

const textEncoder = new TextEncoder();

function bytes(value: string): ArrayBuffer {
  return textEncoder.encode(value).buffer as ArrayBuffer;
}

function nextDataHtml(payload: unknown) {
  return `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(payload)}</script>`;
}

function installFakeApplication(routes: Record<string, { status?: number; body: string }>) {
  const calls: string[] = [];

  globalThis.Application = {
    async scheduleRequest(request: { url: string }) {
      calls.push(request.url);
      const response = routes[request.url];
      if (!response) {
        return [{ status: 404, headers: {}, cookies: [] }, bytes("")];
      }

      return [
        { status: response.status ?? 200, headers: {}, cookies: [] },
        bytes(response.body)
      ];
    },
    arrayBufferToUTF8String(buffer: ArrayBuffer) {
      return new TextDecoder().decode(buffer);
    },
    async getDefaultUserAgent() {
      return "Paperback-Test";
    },
    getState() {
      return undefined;
    },
    setState() {},
    registerInterceptor() {},
    Selector(target: unknown, selector: string) {
      return `${String((target as any)?.constructor?.name ?? "target")}.${selector}`;
    }
  } as any;

  return { calls };
}

afterEach(() => {
  delete (globalThis as any).Application;
});

describe("MangaK extension runtime", () => {
  it("fetches MangaK HTML pages for details, chapter lists, reader pages, and search", async () => {
    const routes = {
      "https://mangak.io/the-immortal-genius-spearman": {
        body: nextDataHtml({
          props: {
            pageProps: {
              initialManga: {
                id: "EDVMnVwY",
                slug: "the-immortal-genius-spearman",
                name: "The Immortal Genius Spearman",
                cover: "https://rx.resmk.org/covers/spearman.webp",
                chapters: [
                  {
                    slug: "chapter-1",
                    name: "Chapter 1",
                    chapterNumber: 1,
                    updatedAt: "2026-06-16T16:01:49.000Z"
                  }
                ]
              }
            }
          }
        })
      },
      "https://mangak.io/the-immortal-genius-spearman/chapter-1": {
        body: nextDataHtml({
          props: {
            pageProps: {
              initialChapter: {
                images: ["https://rx.qvzri.org/r/p/path/001.webp"]
              },
              initialManga: {
                slug: "the-immortal-genius-spearman"
              }
            }
          }
        })
      },
      "https://mangak.io/search?keyword=spear&page=2": {
        body: nextDataHtml({
          props: {
            pageProps: {
              ssrItems: [],
              ssrPagination: { page: 2, has_next: false }
            }
          }
        })
      }
    };
    const { calls } = installFakeApplication(routes);
    const extension = new MangaKExtension();

    const details = await extension.getMangaDetails("the-immortal-genius-spearman");
    const chapters = await extension.getChapters({
      mangaId: "the-immortal-genius-spearman",
      title: "The Immortal Genius Spearman"
    });
    const chapterDetails = await extension.getChapterDetails({
      chapterId: "chapter-1",
      sourceManga: { mangaId: "the-immortal-genius-spearman" }
    });
    const search = await extension.getSearchResults({ title: "spear" }, { page: 2 });

    expect(details.mangaInfo.primaryTitle).toBe("The Immortal Genius Spearman");
    expect(chapters).toHaveLength(1);
    expect(chapterDetails.pages).toEqual(["https://rx.qvzri.org/r/p/path/001.webp"]);
    expect(search).toEqual({ items: [], metadata: undefined });
    expect(calls).toEqual([
      "https://mangak.io/the-immortal-genius-spearman",
      "https://mangak.io/the-immortal-genius-spearman",
      "https://mangak.io/the-immortal-genius-spearman/chapter-1",
      "https://mangak.io/search?keyword=spear&page=2"
    ]);
  });

  it("throws a Cloudflare bypass error when a challenge response is detected", async () => {
    installFakeApplication({});
    const extension = new MangaKExtension();

    await expect(
      extension.interceptResponse(
        { url: "https://mangak.io/home", method: "GET" },
        { status: 403, headers: { "cf-mitigated": "challenge" } },
        bytes("")
      )
    ).rejects.toMatchObject({
      type: "cloudflareError",
      resolutionRequest: {
        url: "https://mangak.io/home",
        method: "GET"
      }
    });
  });
});
