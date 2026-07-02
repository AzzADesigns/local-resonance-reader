# DICOM Web Viewer — MVP

A personal DICOM medical image viewer built with Next.js and Cornerstone3D. Load studies from a local folder, navigate slices, adjust window/level, zoom, and pan — all in your browser.

> **Status**: MVP (Minimum Viable Product). Core viewing works; the 3D volume viewport is not functional yet.

---

## Features

- **Axial, Sagittal, Coronal MPR** — Three orthogonal planes rendered from a DICOM volume using Cornerstone3D's `volumeLoader`
- **Window / Level** — Adjust contrast and brightness with left-click drag
- **Zoom & Pan** — Zoom with mouse wheel, pan with right-click drag
- **Stack Scrolling** — Scroll through slices with the mouse wheel on secondary click
- **Cine Playback** — Auto-cycle through slices at a configurable speed (1–10 fps)
- **Dropbox Path Input** — Enter a local folder path containing `.dcm` files to load a study
- **Recent Studies** — Last 3 studies persisted in `localStorage` for quick access
- **Dark Theme** — Full dark UI (`#000` background) optimized for medical reading

### Known Limitations (MVP)

- **3D Volume viewport does not render** — The fourth viewport ("Volumen 3D") in MPR mode is a placeholder; the volume API integration is incomplete
- **Dropbox integration is not implemented** — The path input currently reads from the local filesystem via an API route; Dropbox OAuth/PKCE flow is a future addition
- **Local filesystem only** — The server reads `.dcm` files from the same machine via `fs.readdirSync` / `readFileSync`. Not intended for remote or cloud deployment without modification
- **Single-series only** — One study (one folder of `.dcm` files) at a time; no multi-series or multi-study support
- **No segmentation / annotation** — Tools are registered but only window/level and stack scroll are active by default

---

## Architecture

```
User enters folder path (Dashboard)
        │
        ▼
  /viewer?path=...                Next.js App Router
        │
        ▼
  ViewerLoader                    Client component, ssr: false
        │
        ▼
  ViewerScreen                    Initializes Cornerstone3D
        │
        ├── POST /api/study       API route lists .dcm files
        │       │                 Returns 61 imageIds (wadouri: URIs)
        │       ▼
        ├── volumeLoader          Cornerstone loads volume from imageIds
        │       │                 Fetches each file via GET /api/study?file=...
        │       ▼
        ├── setVolumesForViewports  Assigns volume to MPR viewports
        │
        └── ToolGroup setup       WindowLevel, Zoom, Pan, StackScroll, Crosshairs
```

### Data Flow

1. **Dashboard** (`/`) — User types a local path (e.g. `C:\DICOM\CT_Abdomen`)
2. **Navigation** — Dashboard navigates to `/viewer?path=<encoded-path>`
3. **API Listing** — `POST /api/study` accepts `{ dirPath }`, scans the directory for `.dcm` files, and returns `imageIds` in `wadouri:` format
4. **Image Serving** — Each image ID points to `GET /api/study?file=<absolute-path>`, which reads the file and serves it as `application/dicom`
5. **Cornerstone3D** — Loads each image via the `wadouri:` scheme, decodes it in a web worker, and renders in WebGL viewports

### Frontend Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.10 (App Router) |
| Bundler | **Webpack** (`--webpack` flag) — Turbopack cannot handle codec WASM references |
| Styling | Tailwind CSS v4 — custom dark theme with CSS variables |
| Rendering | Cornerstone3D v5.1.4 (`@cornerstonejs/core`) |
| DICOM Loading | `@cornerstonejs/dicom-image-loader` v5.1.4 with `dicom-parser` |
| Tools | `@cornerstonejs/tools` v5.1.4 — WindowLevel, Zoom, Pan, StackScroll, Crosshairs |
| Codecs | `@cornerstonejs/codec-libjpeg-turbo`, `@cornerstonejs/codec-openjpeg`, `@cornerstonejs/codec-charls`, `@cornerstonejs/codec-openjph` |
| Icons | Custom inline SVG components |

---

## Setup

### Prerequisites

- Node.js 18+ (tested with Node.js 22)
- npm

### Installation

```bash
cd my-mvp
npm install
```

### Development

```bash
npm run dev
# or: next dev --webpack
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## Usage

1. Open the dashboard at `http://localhost:3000`
2. Paste the **absolute path** to a folder containing `.dcm` files (e.g. `C:\Users\...\CT_Study`)
3. Click **"Generar Visor"**
4. Wait for Cornerstone3D to initialize and load the volume
5. Interact with the viewports:
   - **Left-click drag** — Window / Level
   - **Right-click drag** — Stack Scroll (slice through the series)
   - **Mouse wheel** — Zoom
   - **Toolbar** — Toggle cine, switch layout, reset view
6. Use **Cine controls** at the bottom for auto-playback at adjustable speed

### MPR Layout

The default layout shows four quadrants:
- **Top-left**: Axial
- **Top-right**: Sagittal
- **Bottom-left**: Coronal
- **Bottom-right**: 3D (not functional)

Click the layout button in the toolbar to switch to single-viewport (stack) mode.

---

## Project Structure

```
my-mvp/
├── app/
│   ├── api/study/route.ts      API — DICOM file listing & serving
│   ├── viewer/page.tsx         Viewer route (server component)
│   ├── page.tsx                Dashboard (landing page)
│   ├── layout.tsx              Root layout + fonts
│   └── globals.css             Tailwind theme + dark styles
├── components/
│   ├── dashboard/
│   │   ├── PathInput.tsx       Folder path input form
│   │   ├── RecentStudies.tsx   localStorage recent list
│   │   └── LoadingOverlay.tsx  Full-screen loader
│   ├── viewer/
│   │   ├── ViewerScreen.tsx    Main viewer orchestrator
│   │   ├── ViewerLoader.tsx    Dynamic import (ssr: false)
│   │   ├── Toolbar.tsx         Tools toolbar
│   │   ├── CineControls.tsx    Cine playback controls
│   │   ├── StatusBar.tsx       Bottom status bar
│   │   └── (ViewportGrid.tsx, ViewportCanvas.tsx, SeriesPanel.tsx — legacy/unused)
│   └── ui/
│       └── icons.tsx           SVG icon components
├── lib/
│   └── cornerstone/
│       ├── init.ts             Cornerstone3D initialization
│       └── studyLoader.ts      API client for loading studies
└── public/dicom/               Placeholder for local test files
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with webpack |
| `npm run build` | Production build with webpack |
| `npm start` | Production server |
| `npm run lint` | ESLint check |

---

## Configuration Notes

### Why `--webpack`?

Cornerstone3D's codec packages (libjpeg-turbo, openjpeg, charls) contain Emscripten-compiled WASM with `require('fs')` references. Turbopack cannot handle these. The project forces webpack via the `--webpack` flag in all scripts.

### `next.config.ts`

- `serverExternalPackages` — Prevents Cornerstone packages from being bundled server-side (they use `window`, WebGL, etc.)
- Webpack `resolve.fallback` — Sets `fs`, `path`, `crypto` to `false` on the client to prevent bundling errors

### MPR / Volume Loading

The volume is created from image IDs via `volumeLoader.createAndCacheVolume`. This requires:
- All DICOM instances belong to the same series (same StudyUID, SeriesUID, consistent geometry)
- Cornerstone3D's `registerVolumeLoader` has been called (done in `init.ts`)
- Images are loaded via the `wadouri:` scheme (registered by `@cornerstonejs/dicom-image-loader`)

---

## License

Private project — not licensed for redistribution.
