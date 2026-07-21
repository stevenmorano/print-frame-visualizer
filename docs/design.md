# Steve's Tools: Print & Frame Visualizer - Product and Technical Design

**Status:** Implemented  
**Last updated:** 2026-07-21

## Purpose

Steve's Tools: Print & Frame Visualizer is a private framing-planning tool for testing how a real print will fit inside common or custom frames and mats. It is particularly useful for non-standard print sizes where custom framing is expensive.

## Product behavior

- The user creates a browser-local project and enters print, frame, visible frame-face, and mat dimensions in inches.
- Frame presets represent the retail listed cavity size. The visible frame face is added to calculate the overall outside size.
- The print remains proportional at all times. The preview never stretches the uploaded artwork.
- The complete uploaded photo is fitted inside the print boundary at 1x magnification. Zooming above 1x intentionally crops edges.
- A mat is layered over the print. Left/right mat widths are linked, as are top/bottom widths.
- Mat configuration supports both per-axis border widths and retail-style opening dimensions such as 12 x 18 within a 14 x 20 frame.
- Portrait/landscape controls swap frame dimensions and present built-in or custom presets in the active orientation.
- Presets can be searched by either dimension order. Custom sizes are normalized to prevent duplicate saved entries in opposite orientations.
- The app reports the mat opening, visible artwork, overall outside dimensions, and potentially problematic configurations.
- Users can upload an artwork photo, then zoom, position, and rotate it inside the print boundary.
- Projects and custom frame presets persist in IndexedDB in the current browser.
- The export renderer produces a high-resolution PNG with the visualization and a dimension summary.

## Architecture

```text
React workbench
  |-- Project state
  |-- Pure geometry calculation
  |     |-- live frame/mat/print preview
  |     `-- PNG export renderer
  `-- IndexedDB persistence
        |-- saved projects
        `-- custom frame presets
```

### Data model

Each `Project` stores a name, timestamps, print and frame dimensions, frame-face width, paired mat widths, colors, and local artwork preparation settings. The artwork settings hold a data URL, filename, zoom, offset, and rotation.

`calculateGeometry` is the source of truth for derived values:

- Overall outside frame dimensions
- Mat opening dimensions
- Per-side artwork coverage by the mat
- Visible artwork dimensions
- Scale requirement and configuration warnings

Both the React preview and `exportSnapshot` consume this same geometry model, keeping the saved PNG aligned with the onscreen calculation.

## Interface

The app uses a responsive editorial-workshop layout:

- **Project bar:** rename, open, create, duplicate, delete, and local-save status.
- **Live preview:** proportional frame, mat, and print layers with outer-dimension measurement rails.
- **Dimensions panel:** exact number inputs, linked sliders, searchable orientation-aware presets, mat opening/border controls, colors, and fit information.
- **Artwork panel:** image selection, proportional crop positioning, magnification, and fine rotation.
- **Snapshot export:** downloads an annotated PNG without editing controls.

On desktop, the controls are beside the preview. On smaller screens, they stack below it with touch-sized controls. The preview width is constrained from its physical aspect ratio, so viewport height limits cannot distort the frame or produce uneven moulding widths.

## Decisions

| Decision | Reason |
| --- | --- |
| React + TypeScript + Vite | A focused, fast client-side workspace with strong typing for geometric calculations. |
| IndexedDB persistence | Keeps image-bearing projects private and local without an account or backend. |
| Retail cavity dimensions | Matches how common frame sizes are advertised when shopping. |
| Paired-axis mat controls | Matches the intended framing workflow while keeping controls understandable. |
| Dual mat input model | Supports both framer-style border widths and retailer-style "with mat" opening dimensions. |
| Orientation-normalized presets | Makes portrait/landscape switching predictable and prevents rotated duplicate custom sizes. |
| Aspect-ratio constrained preview | Keeps the frame face physically uniform at every responsive viewport size. |
| Contain-first artwork fitting | Makes 1x magnification show the entire source image; cropping is always intentional. |
| Canvas PNG export | Creates a clean, portable comparison image with matching dimensions. |
| Local font packages | Avoids a runtime Google Fonts request and supports offline use. |

## Boundaries and follow-up opportunities

- No cloud sync, collaboration, vendor catalog, ordering flow, wall mockups, or room visualization.
- No physical depth or joinery calculation for frame moulding.
- Perspective correction is not part of the current crop workflow. A future version could add a four-corner correction surface for photos taken at an angle.
- Browser-local data can be lost when the user clears site data.

## Validation

- Unit tests cover outside-size, mat-overlap, and impossible-opening geometry cases.
- ESLint, TypeScript type checking, Vitest, and a Vite production build pass.
- Browser QA verified desktop and mobile layouts, project persistence behavior, custom frame presets, image upload, and PNG export without console errors or mobile horizontal overflow.
- Image-fit QA used a real uploaded map and verified `contain` behavior in both the live preview and PNG export.
- Responsive geometry QA verified uniform frame-face thickness at 1580, 1180, and 820 pixel viewport widths; the largest measured side-to-side variance was 0.03125 pixels.
- Workflow QA verified a 12 x 18 opening calculates 1-inch borders inside a 14 x 20 frame, portrait/landscape dimension swapping, and orientation-aware `14x20` preset search.
