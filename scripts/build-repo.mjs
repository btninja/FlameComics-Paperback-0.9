import { execFile } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  sourceMetadataList
} from "./repository-metadata.mjs";

const execFileAsync = promisify(execFile);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundlesRoot = path.join(root, "bundles");
const distRoot = path.join(root, "dist", "0.9");
const stableRoot = path.join(distRoot, "stable");

await rm(path.join(root, "dist"), { recursive: true, force: true });
await rm(bundlesRoot, { recursive: true, force: true });

await execFileAsync(path.join(root, "node_modules", ".bin", "paperback-cli"), ["bundle"], {
  cwd: root
});

await mkdir(distRoot, { recursive: true });
await cp(bundlesRoot, distRoot, { recursive: true });
await cp(bundlesRoot, stableRoot, { recursive: true });

console.log(`Built ${sourceMetadataList.map((source) => source.id).join(", ")} at / and /stable`);
