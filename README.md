# DICOM Web Viewer — MVP

A personal DICOM medical image viewer built with Next.js and Cornerstone3D. Load studies via file upload or local folder, navigate slices, adjust window/level, zoom, pan, and view MPR reconstructions — all in your browser.

> **Status**: MVP (Minimum Viable Product). Core viewing works; the 3D volume viewport is not functional yet.

---

## Features

- **Axial, Sagittal, Coronal MPR** — Three orthogonal planes rendered from a DICOM volume using Cornerstone3D's `volumeLoader`
- **File Upload** — Select `.dcm` files directly from your PC. Works on Vercel (100% client-side, no backend needed)
- **Local Filesystem** — Enter a folder path to load files from the same machine (development only)
- **Window / Level** — Adjust contrast and brightness with left-click drag, or use the floating slider panel
- **Zoom & Pan** — Zoom with mouse wheel, pan with right-click drag, or use the floating zoom slider
- **Floating Sliders** — Each toolbar button toggles a floating control panel:
  - **W/L**: two sliders for window width and level
  - **Zoom**: one slider for zoom level
  - **Crosshair**: one slider for slice position (stack) / crosshair center (MPR)
- **Stack Scrolling** — Scroll through slices with right-click drag
- **Slice Navigation** — Crosshair slider lets you jump to any slice instantly
- **Cine Playback** — Auto-cycle through slices at a configurable speed (1–10 fps)
- **Recent Studies** — Last 3 studies persisted in `localStorage` for quick access
- **Dark Theme** — Full dark UI (`#000` background) optimized for medical reading
- **Deployable on Vercel** — Upload DICOM files via the browser; no server-side filesystem required

### Known Limitations (MVP)

- **3D Volume viewport does not render** — The fourth viewport ("Volumen 3D") in MPR mode is a placeholder; the volume API integration is incomplete
- **Dropbox integration is not implemented** — The path input currently reads from the local filesystem via an API route; Dropbox OAuth/PKCE flow is a future addition
- **Local filesystem mode only works in development** — `C:\...` paths cannot be read from a deployed Vercel app. Use the file upload feature instead
- **Single-series only** — One study (one folder or set of `.dcm` files) at a time; no multi-series or multi-study support
- **No segmentation / annotation** — Tools are registered but only window/level and zoom are active by default
- **Large studies may be slow** — All files are loaded into browser memory as Blob URLs; very large studies (>500 MB) may cause memory pressure

---

## Architecture

### Mode 1: File Upload (Vercel / Production)

```
User selects .dcm files (Dashboard)
        │
        ▼
  studyStore (module-level Map)    Files read as ArrayBuffer → Blob URLs
        │
        ▼
  /viewer?upload=true               Next.js App Router
        │
        ▼
  Cornerstone3D                    Loads via wadouri:blob:... URLs
        │                           100% client-side, no API calls
        ├── setStack (stack mode)
        └── volumeLoader + setVolumesForViewports (MPR mode)
```

### Mode 2: Local Filesystem (Development)

```
User enters folder path (Dashboard)
        │
        ▼
  /viewer?path=...                 Next.js App Router
        │
        ▼
  POST /api/study                  API route lists .dcm files
        │                           Returns imageIds (wadouri: URIs)
        ▼
  GET /api/study?file=...          Serves .dcm binary
        │
        ▼
  Cornerstone3D                    Loads via wadouri: scheme
```

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

### Deploy to Vercel

```bash
npx vercel --prod
```

The upload feature works on Vercel. The local path input will show an error (no server-side filesystem).

---

## Usage

1. Open the dashboard at `http://localhost:3000`
2. Choose how to load your study:
   - **Upload**: click the dashed area and select `.dcm` files from your PC (works everywhere)
   - **Path**: paste an absolute folder path like `C:\Users\...\CT_Study` (local only)
3. Wait for Cornerstone3D to initialize and load the volume
4. Interact with the viewports:
   - **Left-click drag** — Window / Level
   - **Right-click drag** — Stack Scroll (slice through the series)
   - **Mouse wheel** — Zoom
5. Use the **toolbar buttons** to toggle floating slider panels:
   - **W/L** — two sliders for window width and level (brightness/contrast)
   - **Zoom** — one slider for zoom level
   - **Crosshair** — one slider for slice position
6. Use **Cine controls** at the bottom for auto-playback at adjustable speed

### MPR Layout

Click the layout button in the toolbar to switch to 2×2 MPR mode:
- **Top-left**: Axial
- **Top-right**: Sagittal
- **Bottom-left**: Coronal
- **Bottom-right**: (placeholder)

Click again to return to single-viewport (stack) mode.

---

## Project Structure

```
my-mvp/
├── app/
│   ├── api/study/route.ts      API — DICOM file listing & serving (local mode)
│   ├── viewer/page.tsx         Viewer route (server component)
│   ├── page.tsx                Dashboard (landing page + file upload)
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
│   │   ├── FloatingSlider.tsx  Reusable floating slider panel
│   │   ├── CineControls.tsx    Cine playback controls
│   │   ├── StatusBar.tsx       Bottom status bar
│   │   └── (legacy unused files)
│   └── ui/
│       └── icons.tsx           SVG icon components
├── lib/
│   └── cornerstone/
│       ├── init.ts             Cornerstone3D initialization
│       ├── studyLoader.ts      API client for loading studies (local mode)
│       └── studyStore.ts       Global store for uploaded study data
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
