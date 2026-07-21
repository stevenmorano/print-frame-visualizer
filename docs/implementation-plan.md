# Implementation Record

**Status:** Complete  
**Updated:** 2026-07-21

## Delivered scope

- [x] Scaffolded a React, TypeScript, and Vite application with ESLint and Vitest.
- [x] Defined typed project, artwork, preset, and geometry models.
- [x] Implemented and tested physical frame, mat, and print calculations.
- [x] Built a responsive desktop/mobile workbench with a proportional layered preview.
- [x] Added broad common frame presets, exact dimension inputs, real-time sliders, and saved custom frame sizes.
- [x] Added searchable, orientation-aware frame presets with portrait/landscape dimension swapping and duplicate custom-size prevention.
- [x] Added dual mat controls for border widths and retailer-style opening dimensions.
- [x] Added local image upload with proportional crop positioning, magnification, and fine rotation.
- [x] Made 1x magnification fit the complete source photo consistently in the live preview and PNG export.
- [x] Corrected responsive preview constraints so the frame aspect ratio and face thickness remain uniform at every viewport size.
- [x] Added IndexedDB project persistence, autosave feedback, duplication, and guarded deletion.
- [x] Added high-resolution annotated PNG snapshot downloads.
- [x] Bundled local display/body fonts so the app has no runtime font dependency.
- [x] Verified linting, types, unit tests, production build, security audit, and browser behavior at desktop and mobile sizes.

## Validation summary

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | Passed: 3 geometry tests |
| `npm run build` | Passed |
| `npm audit --audit-level=high` | No high-severity vulnerabilities |
| Browser QA | Passed: full-image upload/export, searchable presets, orientation swap, 12 x 18 mat opening, snapshot export, and desktop/mobile layout |
| Responsive geometry | Passed at 1580, 1180, and 820 px widths; maximum frame-face variance 0.03125 px |

## Deferred work

- Four-corner perspective correction for photos taken at an angle.
- Cloud sync or account-based project storage.
- Saved mat presets and vendor-specific mat catalogs.
- Room/wall mockups and purchase integrations.
