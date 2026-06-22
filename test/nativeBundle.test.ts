import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

describe("native 0.9 bundle contract", () => {
  it("emits toolchain bundles at the repository root layout Paperback expects", () => {
    execFileSync("node", ["scripts/build-repo.mjs"], {
      cwd: root,
      stdio: "pipe"
    });

    const legacyMetafilePath = path.join(root, "dist", "0.9", "metafile.json");
    const versioningPath = path.join(root, "dist", "0.9", "versioning.json");
    const stableVersioningPath = path.join(root, "dist", "0.9", "stable", "versioning.json");
    const mangaKBundlePath = path.join(root, "dist", "0.9", "MangaK", "index.js");
    const stableMangaKBundlePath = path.join(root, "dist", "0.9", "stable", "MangaK", "index.js");

    expect(existsSync(legacyMetafilePath)).toBe(false);
    expect(existsSync(versioningPath)).toBe(true);
    expect(existsSync(stableVersioningPath)).toBe(true);
    expect(existsSync(mangaKBundlePath)).toBe(true);
    expect(existsSync(stableMangaKBundlePath)).toBe(true);

    const versioning = JSON.parse(readFileSync(versioningPath, "utf8"));
    expect(versioning.sources.map((source: { id: string }) => source.id)).toContain("MangaK");
    expect(versioning.sources.every((source: { capabilities: unknown }) =>
      Array.isArray(source.capabilities)
    )).toBe(true);

    const bundle = readFileSync(mangaKBundlePath, "utf8");
    expect(bundle.startsWith("var source=(function(")).toBe(true);
  });
});
