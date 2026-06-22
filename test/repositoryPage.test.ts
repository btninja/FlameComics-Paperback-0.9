import { describe, expect, it } from "vitest";
import { renderRepositoryPage } from "../scripts/repository-page.mjs";

describe("repository page", () => {
  it("renders a Paperback install page with addRepo link and source list", () => {
    const html = renderRepositoryPage({
      title: "FlameComics Paperback 0.9",
      description: "A Paperback extensions repository",
      repositoryDescription: "FlameComics extension for Paperback 0.9.",
      baseUrl: "https://btninja.github.io/FlameComics-Paperback-0.9/stable",
      sources: [
        {
          name: "FlameComics",
          badges: []
        }
      ]
    });

    expect(html).toContain("paperback://addRepo?");
    expect(html).toContain("displayName=FlameComics%20Paperback%200.9");
    expect(html).toContain(
      "url=https%3A%2F%2Fbtninja.github.io%2FFlameComics-Paperback-0.9%2Fstable"
    );
    expect(html).toContain("Base URL:");
    expect(html).toContain("FlameComics");
  });
});
