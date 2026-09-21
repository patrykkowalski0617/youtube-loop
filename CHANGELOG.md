# Changelog

## 2.0.0 — 2026-09-21

- Project restructured into modules under `src/` (core, storage, youtube,
  player, ui, i18n, styles) and converted to TypeScript. Behaviour unchanged.
- Build with Vite + CRXJS; `npm run build` produces `dist/` and a release zip.
- ESLint, Prettier, Vitest and a GitHub Actions workflow.
- `npm run dev:playground`: a standalone page with a mock YouTube player for
  live layout work.
- All colours moved to CSS custom properties in `src/styles/tokens.css`.

## 1.8.0 and earlier

See the git history.
