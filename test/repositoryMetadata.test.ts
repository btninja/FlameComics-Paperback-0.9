import { describe, expect, it } from "vitest";
import {
  builtWithMetadata,
  repositoryMetadata
} from "../scripts/repository-metadata.mjs";

describe("0.9 repository metadata", () => {
  it("declares a repository object required by Paperback 0.9 repos", () => {
    expect(repositoryMetadata).toEqual({
      name: "FlameComics Paperback 0.9",
      description: "FlameComics extension for Paperback 0.9."
    });
  });

  it("declares 0.9-compatible toolchain metadata", () => {
    expect(builtWithMetadata).toEqual({
      toolchain: "1.0.0-alpha.92",
      types: "1.0.0-alpha.92"
    });
  });
});
