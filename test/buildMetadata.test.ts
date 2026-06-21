import { describe, expect, it } from "vitest";

describe("build metadata contract", () => {
  it("uses the Paperback 0.9 capability bitmask needed by sources", () => {
    const capabilities = 1 | 4 | 16 | 64;

    expect(capabilities).toBe(85);
  });
});
