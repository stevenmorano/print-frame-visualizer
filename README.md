# Steve's Tools: Print & Frame Visualizer

A private, browser-based framing planner for comparing real print dimensions with standard or custom frames and mats before spending money on framing.

Built for odd-size prints, the visualizer keeps artwork proportional while showing exactly how a mat covers it. It is a local-first personal tool: projects and uploaded images stay in the browser.

## What it does

- Enter exact print dimensions, including fractional inches.
- Choose from a broad range of common frame cavity sizes or enter a custom size.
- Save custom frame sizes for reuse.
- Adjust visible frame-face width, plus paired left/right and top/bottom mat dimensions.
- Explore every dimension through precise inputs and real-time sliders.
- Upload a photo of a print and position it with zoom, horizontal/vertical movement, and fine rotation.
- See a true-proportion layered preview with mat overlap, visible-art dimensions, and fit warnings.
- Save, reopen, duplicate, and delete projects locally in the browser.
- Export a high-resolution annotated PNG with framing specifications for shopping or comparison.

## Measurement convention

Retail frame listings such as `28 x 40 in` normally refer to the frame's glazing or art cavity, not its full outside dimensions. This app follows that convention:

```text
listed frame cavity + visible frame face = overall outside size
```

The mat sits inside the listed cavity and overlays the artwork. The preview reports the resulting mat opening and visible artwork area.

## Privacy and storage

There is no account, server, analytics, or cloud upload in this version. Projects, saved frame presets, and uploaded image data are kept in IndexedDB in the current browser. Clearing browser site data also removes them.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local address printed by Vite. Create a production build with:

```bash
npm run build
```

The output is written to `dist`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Technology

- React 19 + TypeScript
- Vite
- Native IndexedDB for local persistence
- Canvas for PNG snapshot export
- Vitest for geometry tests

## Project documentation

- [Product and technical design](docs/design.md)
- [Completed implementation plan](docs/implementation-plan.md)

## Current limitations

- Crop preparation provides zoom, position, and rotation. Four-corner perspective correction is not included yet, so source photos should be taken as square to the print as practical.
- Browser-local projects do not sync across devices and can be removed when browser site data is cleared.
