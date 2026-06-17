# Handoff: FlameComics Paperback 0.9 Extension

## Current State

This folder contains a rebuildable Paperback 0.9 extension project for FlameComics.

Local path:

```text
/Users/bryan/Documents/FlameComics-Paperback-0.9
```

The project has:

- TypeScript source in `src/`
- Unit tests in `test/`
- Build script in `scripts/build-repo.mjs`
- Live FlameComics verifier in `scripts/verify-live.mjs`
- GitHub Pages workflow in `.github/workflows/pages.yml`
- Original FlameComics icon in `assets/icon.png`
- Design/implementation notes in `docs/superpowers/`

## Verification

Last full verification command:

```bash
npm run check
```

Last observed result:

```text
3 test files passed
10 tests passed
Built dist/0.9/stable/FlameComics
Live verifier:
  buildId: daQGrsf8dVsqbTg0CzROB
  sectionCount: 3
  sampledManga: Omniscient Reader's Viewpoint
  sampledChapters: 312
  sampledPages: 17
  searchResults: 3
```

## Git State

Local Git repo was initialized on branch `main`.

Initial commit:

```text
b83bc46 Add FlameComics Paperback 0.9 extension
```

Remote is configured:

```text
origin git@github.com:btninja/FlameComics-Paperback-0.9.git
```

SSH authentication to GitHub was verified successfully.

## Last Interaction / Current Blocker

The user asked to put the project on GitHub under username `btninja`.

The shell does not have GitHub CLI installed:

```text
gh: command not found
```

No `GITHUB_TOKEN` or `GH_TOKEN` is available in the environment.

The GitHub connector available in this Codex session exposes file/commit operations for existing repositories, but did not expose repository creation.

Attempted push:

```bash
git push -u origin main
```

Result:

```text
ERROR: Repository not found.
fatal: Could not read from remote repository.
```

This means `btninja/FlameComics-Paperback-0.9` does not exist yet, or the authenticated GitHub account cannot see it.

## Next Step

Create an empty GitHub repository named:

```text
FlameComics-Paperback-0.9
```

under:

```text
btninja
```

Then run:

```bash
cd /Users/bryan/Documents/FlameComics-Paperback-0.9
git push -u origin main
```

After the push, GitHub Actions should build and deploy the extension repo through GitHub Pages. The Paperback repo URL should be:

```text
https://btninja.github.io/FlameComics-Paperback-0.9/stable
```

## Useful Commands

```bash
npm install
npm run check
npm run build
npm run verify:live
git status -sb
git log --oneline --decorate -5
```
