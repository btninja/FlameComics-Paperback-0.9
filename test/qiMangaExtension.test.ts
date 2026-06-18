import { afterEach, describe, expect, it } from "vitest";
import { QiMangaExtension } from "../src/qiMangaExtension";

const textEncoder = new TextEncoder();

function bytes(value: string): ArrayBuffer {
  return textEncoder.encode(value).buffer as ArrayBuffer;
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

describe("QiManga extension runtime", () => {
  it("fetches all chapter pages before sorting readable chapters", async () => {
    const routes = {
      "https://api.qimanga.com/api/v1/series/sample/chapters?page=1&perPage=30&sort=desc": {
        body: JSON.stringify({
          next: 2,
          data: [
            {
              slug: "chapter-2",
              number: 2,
              title: null,
              price: 0,
              requiresPurchase: false,
              publishStatus: "PUBLIC",
              createdAt: "2026-06-02T00:00:00.000Z"
            }
          ]
        })
      },
      "https://api.qimanga.com/api/v1/series/sample/chapters?page=2&perPage=30&sort=desc": {
        body: JSON.stringify({
          next: null,
          data: [
            {
              slug: "chapter-1",
              number: 1,
              title: null,
              price: 0,
              requiresPurchase: false,
              publishStatus: "PUBLIC",
              createdAt: "2026-06-01T00:00:00.000Z"
            }
          ]
        })
      }
    };
    const { calls } = installFakeApplication(routes);

    const result = await new QiMangaExtension().getChapters({ mangaId: "sample" });

    expect(result.map((chapter) => chapter.chapterId)).toEqual([
      "chapter-1",
      "chapter-2"
    ]);
    expect(calls).toEqual([
      "https://api.qimanga.com/api/v1/series/sample/chapters?page=1&perPage=30&sort=desc",
      "https://api.qimanga.com/api/v1/series/sample/chapters?page=2&perPage=30&sort=desc"
    ]);
  });

  it("builds search URLs with pagination metadata", async () => {
    const routes = {
      "https://api.qimanga.com/api/v1/series/search?q=immortal&page=3&perPage=20": {
        body: JSON.stringify({
          data: [
            {
              slug: "forged-immortal",
              title: "Forged Immortal",
              cover: "https://media.qimanga.com/forged.webp",
              type: "MANHUA",
              status: "DROPPED",
              redirectUrl: ""
            }
          ]
        })
      }
    };
    const { calls } = installFakeApplication(routes);

    const result = await new QiMangaExtension().getSearchResults(
      { title: "immortal" },
      { page: 3 }
    );

    expect(result.items[0]?.mangaId).toBe("forged-immortal");
    expect(calls).toEqual([
      "https://api.qimanga.com/api/v1/series/search?q=immortal&page=3&perPage=20"
    ]);
  });
});
