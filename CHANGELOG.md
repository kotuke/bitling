# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-07-31

### Added

- `llms.txt`: a machine-readable API summary, also served from GitHub Pages.
- Subpath exports `@kotuke/bitling/browser` and `@kotuke/bitling/server`.
- Install instructions and an npm badge in the README.

## [1.0.0] — 2026-07-31

First public release.

### Added

- Deterministic SVG and PNG pixel avatars: one shared white robot with a
  personal color sigil, seeded by HMAC-SHA-256 over `AVATAR_VERSION`, the secret
  and the `userId`.
- HTTP endpoint with `ETag`, immutable caching, CORS and an in-memory LRU.
- CLI (`bitling --id … --out …`) and TypeScript declarations.
- Browser entry point (`src/browser.mjs`) that renders byte-identical SVG
  without `node:crypto`, plus a live demo and gallery under `docs/`.
- Zero runtime dependencies; Node.js 20+.

[1.1.0]: https://github.com/kotuke/bitling/releases/tag/v1.1.0
[1.0.0]: https://github.com/kotuke/bitling/releases/tag/v1.0.0
