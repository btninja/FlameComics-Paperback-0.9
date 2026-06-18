import { describe, expect, it } from "vitest";
import {
  builtWithMetadata,
  repositoryMetadata,
  sourceMetadataList
} from "../scripts/repository-metadata.mjs";

describe("0.9 repository metadata", () => {
  it("declares a repository object required by Paperback 0.9 repos", () => {
    expect(repositoryMetadata).toEqual({
      name: "btninja Paperback 0.9",
      description: "Paperback 0.9 extensions for FlameComics and QiManga."
    });
  });

  it("declares 0.9-compatible toolchain metadata", () => {
    expect(builtWithMetadata).toEqual({
      toolchain: "1.0.0-alpha.92",
      types: "1.0.0-alpha.92"
    });
  });

  it("declares both source entries for the repository", () => {
    expect(sourceMetadataList.map((source) => source.id)).toEqual([
      "FlameComics",
      "QiManga"
    ]);
    expect(sourceMetadataList.find((source) => source.id === "QiManga")).toMatchObject({
      name: "QiManga",
      icon: "icon.png",
      contentRating: "SAFE",
      capabilities: [1, 4, 16, 64]
    });
  });
});
