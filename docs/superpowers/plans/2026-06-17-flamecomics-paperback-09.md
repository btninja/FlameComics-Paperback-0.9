# FlameComics Paperback 0.9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a rebuildable Paperback 0.9 extension repository for FlameComics.

**Architecture:** Parser helpers convert Flame Next.js JSON into Paperback 0.9 objects. The extension class handles network requests and build ID caching. A build script emits the deployable repository files.

**Tech Stack:** TypeScript, esbuild, Vitest, Node.js scripts.

---

### Task 1: Project Skeleton And Red Parser Tests

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `test/flameParser.test.ts`

- [x] **Step 1: Write failing tests**

Add tests for build ID extraction, homepage mapping, manga details, chapters, chapter pages, and search results.

- [x] **Step 2: Run tests to verify failure**

Run: `npm test -- --run`

Expected: FAIL because parser module is missing.

### Task 2: Parser Implementation

**Files:**
- Create: `src/flameParser.ts`

- [x] **Step 1: Implement parser helpers**

Implement pure functions for Flame payload conversion.

- [x] **Step 2: Run parser tests**

Run: `npm test -- --run`

Expected: PASS.

### Task 3: Extension Runtime

**Files:**
- Create: `src/extension.ts`
- Create: `src/index.ts`
- Create: `src/paperback.d.ts`
- Create: `test/extension.test.ts`

- [x] **Step 1: Write runtime tests**

Test stale build ID retry and request URL construction with a fake `Application`.

- [x] **Step 2: Implement runtime**

Implement `FlameComicsExtension` and export a `FlameComics` instance.

- [x] **Step 3: Run tests**

Run: `npm test -- --run`

Expected: PASS.

### Task 4: Repository Build Output

**Files:**
- Create: `scripts/build-repo.mjs`
- Create: `scripts/verify-live.mjs`
- Copy: `assets/icon.png`

- [x] **Step 1: Write build metadata test**

Verify generated `versioning.json` contains FlameComics metadata and capabilities.

- [x] **Step 2: Implement build script**

Bundle with esbuild, copy assets, and write repo metadata.

- [x] **Step 3: Run build and live verification**

Run: `npm run build` and `npm run verify:live`

Expected: PASS.
