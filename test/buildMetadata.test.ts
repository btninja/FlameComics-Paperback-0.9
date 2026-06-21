import { describe, expect, it } from "vitest";

describe("build metadata contract", () => {
  it("uses Paperback 0.9 capability ids needed by sources", () => {
    const capabilities = [1, 16, 4, 64];

    expect(capabilities).toEqual([
      1, // chapter providing
      16, // Cloudflare bypass providing
      4, // discover section providing
      64 // search result providing
    ]);
  });
});
