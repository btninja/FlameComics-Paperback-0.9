import { build } from "esbuild";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  builtWithMetadata,
  repositoryMetadata,
  sourceMetadata
} from "./repository-metadata.mjs";
import { renderRepositoryPage } from "./repository-page.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(root, "dist", "0.9");
const stableRoot = path.join(distRoot, "stable");
const extensionRoot = path.join(stableRoot, "FlameComics");

await rm(path.join(root, "dist"), { recursive: true, force: true });
await mkdir(path.join(extensionRoot, "static"), { recursive: true });

await build({
  entryPoints: [path.join(root, "src", "index.ts")],
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "source",
  target: "es2022",
  outfile: path.join(extensionRoot, "index.js"),
  banner: {
    js: "/* FlameComics Paperback 0.9 extension */"
  }
});

await copyFile(
  path.join(root, "assets", "icon.png"),
  path.join(extensionRoot, "static", "icon.png")
);

const versioning = {
  buildTime: new Date().toISOString(),
  repository: repositoryMetadata,
  sources: [sourceMetadata],
  builtWith: builtWithMetadata
};

const metafile = {
  name: "FlameComics Paperback 0.9 Extensions",
  author: "Local",
  version: "1.0.0",
  language: "en",
  sources: [sourceMetadata.id]
};
const repositoryPage = renderRepositoryPage({
  title: repositoryMetadata.name,
  description: "A Paperback extensions repository",
  repositoryDescription: repositoryMetadata.description,
  baseUrl: "https://btninja.github.io/FlameComics-Paperback-0.9/stable",
  sources: [sourceMetadata]
});

await writeFile(
  path.join(stableRoot, "versioning.json"),
  `${JSON.stringify(versioning, null, 2)}\n`
);
await writeFile(
  path.join(stableRoot, "index.html"),
  repositoryPage
);
await writeFile(
  path.join(distRoot, "metafile.json"),
  `${JSON.stringify(metafile, null, 2)}\n`
);
await writeFile(
  path.join(distRoot, "index.html"),
  repositoryPage
);

console.log(`Built ${path.relative(root, extensionRoot)}`);
