export const repositoryMetadata = {
  name: "btninja Paperback 0.9",
  description: "Paperback 0.9 extensions for FlameComics and QiManga."
};

export const builtWithMetadata = {
  toolchain: "1.0.0-alpha.92",
  types: "1.0.0-alpha.92"
};

export const sourceMetadata = {
  id: "FlameComics",
  name: "FlameComics",
  description: "Extension that pulls manga, manhwa, and manhua from FlameComics.",
  version: "1.0.1",
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

export const qiMangaSourceMetadata = {
  id: "QiManga",
  name: "QiManga",
  description: "Extension that pulls manga, manhwa, and manhua from QiManga.",
  version: "1.0.0",
  icon: "icon.png",
  language: "en",
  contentRating: "SAFE",
  badges: [{ text: "English", type: "info" }],
  capabilities: [1, 4, 16, 64],
  developers: [
    {
      name: "btninja",
      website: "https://github.com/btninja",
      github: "https://github.com/btninja"
    },
    {
      name: "Local 0.9 extension",
      website: "https://qimanga.com"
    }
  ]
};

export const sourceMetadataList = [sourceMetadata, qiMangaSourceMetadata];
