import { build } from "esbuild";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(root, "dist", "0.9");
const stableRoot = path.join(distRoot, "stable");
const extensionRoot = path.join(stableRoot, "FlameComics");

const sourceMetadata = {
  id: "FlameComics",
  name: "FlameComics",
  description: "Extension that pulls manga, manhwa, and manhua from FlameComics.",
  version: "1.0.0",
  icon: "icon.png",
  language: "en",
  contentRating: "SAFE",
  badges: [{ text: "English", type: "info" }],
  capabilities: [1, 4, 16, 64],
  developers: [
    {
      name: "IvanMatthew",
      website: "http://github.com/Ivanmatthew",
      github: "https://github.com/Ivanmatthew"
    },
    {
      name: "Local 0.9 migration",
      website: "https://flamecomics.xyz"
    }
  ]
};

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
  sources: [sourceMetadata],
  builtWith: {
    toolchain: "custom-esbuild",
    types: "1.0.0-alpha.92-compatible"
  }
};

const metafile = {
  name: "FlameComics Paperback 0.9 Extensions",
  author: "Local",
  version: "1.0.0",
  language: "en",
  sources: [sourceMetadata.id]
};

await writeFile(
  path.join(stableRoot, "versioning.json"),
  `${JSON.stringify(versioning, null, 2)}\n`
);
await writeFile(
  path.join(stableRoot, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FlameComics Paperback 0.9 Stable Repo</title>
</head>
<body>
  <h1>FlameComics Paperback 0.9 Stable Repo</h1>
  <p>Paperback should use this page's URL as the repository base.</p>
  <p><a href="./versioning.json">versioning.json</a></p>
</body>
</html>
`
);
await writeFile(
  path.join(distRoot, "metafile.json"),
  `${JSON.stringify(metafile, null, 2)}\n`
);
await writeFile(
  path.join(distRoot, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FlameComics Paperback 0.9 Extensions</title>
</head>
<body>
  <h1>FlameComics Paperback 0.9 Extensions</h1>
  <p>Base URL: <code>./stable</code></p>
  <p>Available Sources:</p>
  <ul><li>FlameComics</li></ul>
</body>
</html>
`
);

console.log(`Built ${path.relative(root, extensionRoot)}`);
