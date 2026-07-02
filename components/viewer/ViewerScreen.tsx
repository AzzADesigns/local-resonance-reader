"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  RenderingEngine,
  Enums,
  getRenderingEngine,
  volumeLoader,
  setVolumesForViewports,
  cache,
} from "@cornerstonejs/core";
import {
  ToolGroupManager,
  addTool,
  WindowLevelTool,
  ZoomTool,
  PanTool,
  StackScrollTool,
  CrosshairsTool,
} from "@cornerstonejs/tools";
import { Enums as ToolEnums } from "@cornerstonejs/tools";
import { initCornerstone } from "@/lib/cornerstone/init";
import { loadStudyFromPath } from "@/lib/cornerstone/studyLoader";
import { getStudyData } from "@/lib/cornerstone/studyStore";
import Toolbar from "@/components/viewer/Toolbar";
import CineControls from "@/components/viewer/CineControls";
import StatusBar from "@/components/viewer/StatusBar";
import FloatingSlider from "@/components/viewer/FloatingSlider";

const ENGINE_ID = "main-engine";
const TOOL_GROUP_STACK = "tg-stack";
const TOOL_GROUP_MPR = "tg-mpr";
const VIEWPORT_STACK = "vp-stack";
const VIEWPORT_AXIAL = "vp-axial";
const VIEWPORT_SAGITTAL = "vp-sagittal";
const VIEWPORT_CORONAL = "vp-coronal";
const VOLUME_ID = "dicom-volume";

type ViewMode = "stack" | "mpr";

function safeAddTool(tool: any) {
  try { addTool(tool); } catch (_) {}
}

function fullCleanup(volumeId?: string) {
  try {
    const e = getRenderingEngine(ENGINE_ID);
    if (e) e.destroy();
  } catch (_) {}
  try { ToolGroupManager.destroyToolGroup(TOOL_GROUP_STACK); } catch (_) {}
  try { ToolGroupManager.destroyToolGroup(TOOL_GROUP_MPR); } catch (_) {}
  if (volumeId) {
    try { cache.removeVolumeLoadObject(volumeId); } catch (_) {}
  }
}

export default function ViewerScreen() {
  const searchParams = useSearchParams();
  const path = searchParams.get("path") || "";

  const [viewMode, setViewMode] = useState<ViewMode>("stack");
  const [activeTool, setActiveTool] = useState<string>("windowing");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [currentSlice, setCurrentSlice] = useState(1);
  const [totalSlices, setTotalSlices] = useState(0);
  const [statusInfo, setStatusInfo] = useState({ patient: "", study: "", modality: "", images: 0 });
  const [loading, setLoading] = useState(true);
  const [mprLoading, setMprLoading] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [showWL, setShowWL] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [wlWidth, setWlWidth] = useState(400);
  const [wlLevel, setWlLevel] = useState(40);
  const [zoomValue, setZoomValue] = useState(1);
  const [crossSlice, setCrossSlice] = useState(0);

  // Viewport refs
  const stackRef = useRef<HTMLDivElement>(null);
  const axialRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);

  const cancelRef = useRef(false);
  const engineRef = useRef<RenderingEngine | null>(null);
  const tgStackRef = useRef<any>(null);
  const tgMprRef = useRef<any>(null);
  const imageIdsRef = useRef<string[]>([]);
  const cineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const volumeLoadedRef = useRef(false);

  const addLog = useCallback((msg: string, isError = false) => {
    const prefix = isError ? "❌" : "✓";
    const entry = `${prefix} ${new Date().toLocaleTimeString()}: ${msg}`;
    console.log("[DICOM]", msg);
    setLogs((prev) => [...prev.slice(-39), entry]);
  }, []);

  // Intercept global errors
  useEffect(() => {
    const origError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.map((a) =>
        typeof a === "object" ? (a instanceof Error ? a.message : JSON.stringify(a)) : String(a)
      ).join(" ");
      addLog(`[ERR] ${msg}`, true);
      origError.apply(console, args);
    };
    const handleRejection = (ev: PromiseRejectionEvent) =>
      addLog(`[REJECTION] ${ev.reason?.message || String(ev.reason)}`, true);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      console.error = origError;
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [addLog]);

  // ────────────────────────────────────────────
  // STACK mode initialization
  // ────────────────────────────────────────────
  useEffect(() => {
    const dirPath = searchParams.get("path") || "";
    const isUpload = searchParams.get("upload") === "true";
    if (!dirPath && !isUpload) return;

    cancelRef.current = false;
    setLoading(true);
    setError("");
    setLogs([]);
    volumeLoadedRef.current = false;

    (async () => {
      try {
        fullCleanup(VOLUME_ID);

        addLog("Inicializando Cornerstone...");
        await initCornerstone();
        if (cancelRef.current) return;

        safeAddTool(WindowLevelTool);
        safeAddTool(ZoomTool);
        safeAddTool(PanTool);
        safeAddTool(StackScrollTool);
        safeAddTool(CrosshairsTool);

        addLog("Creando RenderingEngine...");
        const engine = new RenderingEngine(ENGINE_ID);
        engineRef.current = engine;

        if (!stackRef.current) throw new Error("Elemento stack no montado");

        engine.setViewports([{
          viewportId: VIEWPORT_STACK,
          type: Enums.ViewportType.STACK,
          element: stackRef.current,
          defaultOptions: { background: [0, 0, 0] as [number, number, number] },
        }]);

        let imageIds: string[];
        if (isUpload) {
          addLog("Cargando estudio desde upload...");
          const study = getStudyData();
          if (!study || study.imageIds.length === 0) throw new Error("No hay datos de estudio cargados");
          imageIds = study.imageIds;
          setTotalSlices(study.numImages);
          setStatusInfo({
            patient: study.patientName,
            study: study.studyDescription,
            modality: "DCM",
            images: study.numImages,
          });
        } else {
          addLog("Listando archivos DICOM...");
          const result = await loadStudyFromPath(dirPath);
          if (cancelRef.current) { engine.destroy(); return; }
          if (result.count === 0) throw new Error("No se encontraron archivos .dcm");
          imageIds = result.imageIds;
          setTotalSlices(imageIds.length);
          setStatusInfo({
            patient: dirPath.split(/[/\\]/).pop() || "Estudio",
            study: dirPath.split(/[/\\]/).pop() || "",
            modality: "DCM",
            images: imageIds.length,
          });
        }

        imageIdsRef.current = imageIds;
        addLog(`${imageIds.length} archivos encontrados`);

        // Tool group para stack
        try { ToolGroupManager.destroyToolGroup(TOOL_GROUP_STACK); } catch (_) {}
        const tgStack = ToolGroupManager.createToolGroup(TOOL_GROUP_STACK)!;
        tgStackRef.current = tgStack;
        tgStack.addTool(WindowLevelTool.toolName);
        tgStack.addTool(ZoomTool.toolName);
        tgStack.addTool(PanTool.toolName);
        tgStack.addTool(StackScrollTool.toolName);
        tgStack.setToolActive(WindowLevelTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }] });
        tgStack.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }] });
        tgStack.setToolActive(StackScrollTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }] });
        tgStack.addViewport(VIEWPORT_STACK, ENGINE_ID);

        const viewport = engine.getViewport(VIEWPORT_STACK) as any;
        addLog("Cargando imágenes en viewport...");
        await viewport.setStack(imageIds, 0);
        if (cancelRef.current) { engine.destroy(); return; }

        viewport.resetCamera();
        viewport.render();
        setLoading(false);
        addLog(`✅ Stack listo — ${imageIds.length} imágenes`);
      } catch (err: any) {
        if (!cancelRef.current) {
          addLog(`Error: ${err?.message || String(err)}`, true);
          setError(err?.message || String(err));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelRef.current = true;
      if (cineTimerRef.current) clearInterval(cineTimerRef.current);
      fullCleanup(VOLUME_ID);
    };
  }, [searchParams, addLog]);

  // ────────────────────────────────────────────
  // MPR mode — switch when user clicks MPR
  // ────────────────────────────────────────────
  const activateMPR = useCallback(async () => {
    if (mprLoading) return;
    const engine = engineRef.current;
    if (!engine) return;
    const imageIds = imageIdsRef.current;
    if (imageIds.length === 0) return;

    if (!axialRef.current || !sagittalRef.current || !coronalRef.current) {
      addLog("⚠ Elementos MPR no disponibles aún", true);
      return;
    }

    setMprLoading(true);
    addLog("Activando MPR — cargando volumen...");

    try {
      // Clean up old MPR tool group
      try { ToolGroupManager.destroyToolGroup(TOOL_GROUP_MPR); } catch (_) {}

      // Remove old volume if any
      try { cache.removeVolumeLoadObject(VOLUME_ID); } catch (_) {}

      // Register MPR viewports
      engine.setViewports([
        {
          viewportId: VIEWPORT_AXIAL,
          type: Enums.ViewportType.ORTHOGRAPHIC,
          element: axialRef.current!,
          defaultOptions: { orientation: Enums.OrientationAxis.AXIAL, background: [0, 0, 0] as [number, number, number] },
        },
        {
          viewportId: VIEWPORT_SAGITTAL,
          type: Enums.ViewportType.ORTHOGRAPHIC,
          element: sagittalRef.current!,
          defaultOptions: { orientation: Enums.OrientationAxis.SAGITTAL, background: [0, 0, 0] as [number, number, number] },
        },
        {
          viewportId: VIEWPORT_CORONAL,
          type: Enums.ViewportType.ORTHOGRAPHIC,
          element: coronalRef.current!,
          defaultOptions: { orientation: Enums.OrientationAxis.CORONAL, background: [0, 0, 0] as [number, number, number] },
        },
      ]);
      addLog("Viewports MPR registrados");

      // Create MPR tool group
      const tgMpr = ToolGroupManager.createToolGroup(TOOL_GROUP_MPR)!;
      tgMprRef.current = tgMpr;
      tgMpr.addTool(WindowLevelTool.toolName);
      tgMpr.addTool(ZoomTool.toolName);
      tgMpr.addTool(PanTool.toolName);
      tgMpr.addTool(CrosshairsTool.toolName);
      tgMpr.setToolActive(WindowLevelTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }] });
      tgMpr.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }] });
      tgMpr.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }] });
      tgMpr.addViewport(VIEWPORT_AXIAL, ENGINE_ID);
      tgMpr.addViewport(VIEWPORT_SAGITTAL, ENGINE_ID);
      tgMpr.addViewport(VIEWPORT_CORONAL, ENGINE_ID);

      addLog("Construyendo volumen 3D...");
      const volume = await volumeLoader.createAndCacheVolume(VOLUME_ID, { imageIds });
      volume.load();

      addLog("Asignando volumen a viewports MPR...");
      await setVolumesForViewports(
        engine,
        [{ volumeId: VOLUME_ID }],
        [VIEWPORT_AXIAL, VIEWPORT_SAGITTAL, VIEWPORT_CORONAL]
      );

      [VIEWPORT_AXIAL, VIEWPORT_SAGITTAL, VIEWPORT_CORONAL].forEach((id) => {
        const vp = engine.getViewport(id) as any;
        vp?.resetCamera();
        vp?.render();
      });
      volumeLoadedRef.current = true;
      addLog("✅ MPR activo — Axial / Sagital / Coronal");
    } catch (err: any) {
      addLog(`Error MPR: ${err?.message || String(err)}`, true);
    } finally {
      setMprLoading(false);
    }
  }, [mprLoading, addLog]);

  // Switch back to stack
  const activateStack = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !stackRef.current) return;

    try { ToolGroupManager.destroyToolGroup(TOOL_GROUP_MPR); } catch (_) {}

    engine.setViewports([{
      viewportId: VIEWPORT_STACK,
      type: Enums.ViewportType.STACK,
      element: stackRef.current,
      defaultOptions: { background: [0, 0, 0] as [number, number, number] },
    }]);

    const imageIds = imageIdsRef.current;
    if (imageIds.length > 0) {
      const viewport = engine.getViewport(VIEWPORT_STACK) as any;
      viewport.setStack(imageIds, 0).then(() => {
        // Recreate stack tool group
        try { ToolGroupManager.destroyToolGroup(TOOL_GROUP_STACK); } catch (_) {}
        const tgStack = ToolGroupManager.createToolGroup(TOOL_GROUP_STACK)!;
        tgStackRef.current = tgStack;
        tgStack.addTool(WindowLevelTool.toolName);
        tgStack.addTool(ZoomTool.toolName);
        tgStack.addTool(PanTool.toolName);
        tgStack.addTool(StackScrollTool.toolName);
        tgStack.setToolActive(WindowLevelTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }] });
        tgStack.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }] });
        tgStack.setToolActive(StackScrollTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }] });
        tgStack.addViewport(VIEWPORT_STACK, ENGINE_ID);
        viewport.render();
      });
    }
    addLog("Stack restaurado");
  }, [addLog]);

  const handleToggleLayout = useCallback(() => {
    setActiveTool("windowing");
    setViewMode((prev) => {
      const next = prev === "stack" ? "mpr" : "stack";
      if (next === "mpr") {
        setTimeout(() => activateMPR(), 50);
      } else {
        activateStack();
      }
      return next;
    });
  }, [activateMPR, activateStack]);

  // Cine playback (stack mode only)
  useEffect(() => {
    if (cineTimerRef.current) clearInterval(cineTimerRef.current);
    if (!playing || viewMode !== "stack") return;
    const engine = engineRef.current;
    if (!engine) return;

    cineTimerRef.current = setInterval(() => {
      const vp = engine.getViewport(VIEWPORT_STACK) as any;
      if (!vp) return;
      const idx = vp.getCurrentImageIdIndex?.() ?? 0;
      const total = vp.getImageIds?.()?.length ?? 0;
      if (total === 0) return;
      const next = (idx + 1) % total;
      vp.setImageIdIndex(next);
      setCurrentSlice(next + 1);
    }, 1000 / speed);

    return () => { if (cineTimerRef.current) clearInterval(cineTimerRef.current); };
  }, [playing, speed, viewMode]);

  const handleWindowing = useCallback(() => {
    setShowWL((v) => !v);
    setShowZoom(false);
    setShowCrosshair(false);
    setActiveTool("windowing");
  }, []);

  const handleZoom = useCallback(() => {
    setShowZoom((v) => !v);
    setShowWL(false);
    setShowCrosshair(false);
    setActiveTool("zoom");
  }, []);

  const handleReset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (viewMode === "stack") {
      const vp = engine.getViewport(VIEWPORT_STACK) as any;
      vp?.resetCamera(); vp?.render();
    } else {
      [VIEWPORT_AXIAL, VIEWPORT_SAGITTAL, VIEWPORT_CORONAL].forEach((id) => {
        const vp = engine.getViewport(id) as any;
        vp?.resetCamera(); vp?.render();
      });
    }
  }, [viewMode]);

  const handleSliceChange = useCallback((slice: number) => {
    const engine = engineRef.current;
    if (!engine || viewMode !== "stack") return;
    const vp = engine.getViewport(VIEWPORT_STACK) as any;
    vp?.setImageIdIndex(slice - 1);
    setCurrentSlice(slice);
  }, [viewMode]);

  const handleToggleCrossairs = useCallback(() => {
    setShowCrosshair((v) => !v);
    setShowWL(false);
    setShowZoom(false);
    setActiveTool("crosshairs");
  }, []);

  // Sync W/L slider from viewport
  useEffect(() => {
    if (!showWL) return;
    const engine = engineRef.current;
    if (!engine) return;
    const vpId = viewMode === "mpr" ? VIEWPORT_AXIAL : VIEWPORT_STACK;
    const vp = engine.getViewport(vpId) as any;
    if (!vp) return;
    const props = vp.getProperties();
    if (props?.voiRange) {
      const { upper, lower } = props.voiRange;
      setWlWidth(Math.round(upper - lower));
      setWlLevel(Math.round((upper + lower) / 2));
    }
  }, [showWL, viewMode]);

  // Sync zoom slider from viewport
  useEffect(() => {
    if (!showZoom) return;
    const engine = engineRef.current;
    if (!engine) return;
    const vpId = viewMode === "mpr" ? VIEWPORT_AXIAL : VIEWPORT_STACK;
    const vp = engine.getViewport(vpId) as any;
    if (!vp) return;
    const cam = vp.getCamera();
    if (cam?.parallelScale) {
      setZoomValue(Math.round(cam.parallelScale * 10) / 10);
    }
  }, [showZoom, viewMode]);

  // Sync crosshair slice from viewport
  useEffect(() => {
    if (!showCrosshair || viewMode !== "mpr") return;
    const engine = engineRef.current;
    if (!engine) return;
    const vp = engine.getViewport(VIEWPORT_AXIAL) as any;
    if (!vp) return;
    const idx = vp.getSliceIndex?.();
    if (idx !== undefined) setCrossSlice(idx);
  }, [showCrosshair, viewMode]);

  // Apply W/L to viewport
  const applyWL = useCallback((width: number, level: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const vpId = viewMode === "mpr" ? VIEWPORT_AXIAL : VIEWPORT_STACK;
    const vp = engine.getViewport(vpId) as any;
    if (!vp) return;
    const half = width / 2;
    vp.setProperties({ voiRange: { upper: level + half, lower: level - half } });
    vp.render();
  }, [viewMode]);

  // Apply zoom to viewport
  const applyZoom = useCallback((val: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const vpId = viewMode === "mpr" ? VIEWPORT_AXIAL : VIEWPORT_STACK;
    const vp = engine.getViewport(vpId) as any;
    if (!vp) return;
    vp.setCamera({ parallelScale: val });
    vp.render();
  }, [viewMode]);

  // Apply slice from crosshair slider
  const applyCrossSlice = useCallback((idx: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (viewMode === "mpr") {
      const vp = engine.getViewport(VIEWPORT_AXIAL) as any;
      if (!vp) return;
      vp.setSliceIndex?.(idx);
    } else {
      const vp = engine.getViewport(VIEWPORT_STACK) as any;
      if (!vp) return;
      vp.setImageIdIndex(idx);
    }
  }, [viewMode]);

  // ────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Loading overlay */}
      <div className={`absolute inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300 ${loading || error ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none invisible"}`}>
        {error ? (
          <div className="text-center max-w-md px-6">
            <p className="text-red-400 text-lg mb-2 font-semibold">Error al cargar</p>
            <p className="text-muted text-sm mb-4">{error}</p>
            <button onClick={() => window.history.back()} className="text-xs text-accent underline">← Volver</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm px-6">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted">Cargando estudio DICOM...</p>
            <p className="text-xs text-muted-2 truncate max-w-full">{path}</p>
            {logs.length > 0 && (
              <div className="mt-2 text-left w-full space-y-0.5 max-h-48 overflow-y-auto">
                {logs.slice(-10).map((msg, i, arr) => (
                  <p key={i} className={`text-[11px] ${i === arr.length - 1 ? "text-accent" : "text-muted-2"} ${msg.startsWith("❌") ? "!text-red-400" : ""}`}>{msg}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MPR loading overlay */}
      {mprLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-300 text-sm font-medium">Construyendo volumen MPR...</p>
            <p className="text-muted text-xs">Esto puede tomar unos segundos</p>
          </div>
        </div>
      )}

      <Toolbar
        activeTool={activeTool}
        cineActive={playing}
        layout={viewMode === "mpr" ? "mpr" : "single"}
        onToggleCine={() => setPlaying((p) => !p)}
        onToggleLayout={handleToggleLayout}
        onWindowing={handleWindowing}
        onZoom={handleZoom}
        onCrosshair={handleToggleCrossairs}
        onReset={handleReset}
      />

      {/* Floating sliders */}
      <div className="absolute top-14 left-56 z-40 space-y-2">
        {showWL && (
          <>
            <FloatingSlider label="W/L Width" value={wlWidth} min={1} max={4000} step={1}
              formatValue={(v) => `${v}`}
              onChange={(v) => { setWlWidth(v); applyWL(v, wlLevel); }}
              onClose={() => setShowWL(false)}
            />
            <FloatingSlider label="W/L Level" value={wlLevel} min={-1000} max={2000} step={1}
              formatValue={(v) => `${v}`}
              onChange={(v) => { setWlLevel(v); applyWL(wlWidth, v); }}
              onClose={() => setShowWL(false)}
            />
          </>
        )}
        {showZoom && (
          <FloatingSlider label="Zoom" value={zoomValue} min={0.1} max={10} step={0.1}
            formatValue={(v) => `${v.toFixed(1)}x`}
            onChange={(v) => { setZoomValue(v); applyZoom(v); }}
            onClose={() => setShowZoom(false)}
          />
        )}
        {showCrosshair && (
          <FloatingSlider label="Corte" value={crossSlice} min={0} max={Math.max(totalSlices - 1, 1)} step={1}
            formatValue={(v) => `#${v + 1}`}
            onChange={(v) => { setCrossSlice(v); applyCrossSlice(v); }}
            onClose={() => setShowCrosshair(false)}
          />
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Series panel */}
        <div className="w-52 bg-surface border-r border-border flex flex-col h-full overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-border">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Series</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {statusInfo.images > 0 && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-border-light">
                <div className="w-10 h-10 rounded-md bg-surface-3 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-accent">DCM</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{statusInfo.study}</p>
                  <p className="text-[10px] text-muted">{statusInfo.images} imágenes</p>
                </div>
              </div>
            )}

            {/* MPR button in panel */}
            {!loading && statusInfo.images > 0 && (
              <button
                onClick={handleToggleLayout}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "mpr"
                    ? "bg-blue-600 text-white border border-blue-500"
                    : "bg-surface-3 text-muted border border-border hover:border-accent hover:text-accent"
                }`}
              >
                {viewMode === "mpr" ? "⬛ Vista Stack" : "⧉ Vista MPR"}
              </button>
            )}

            {viewMode === "mpr" && !mprLoading && (
              <button
                onClick={handleToggleCrossairs}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-surface-3 text-muted border border-border hover:border-blue-400 hover:text-blue-400 transition-all"
              >
                ✛ Crosshairs
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── STACK mode ── */}
          <div
            className="flex-1 relative min-h-0"
            style={{ display: viewMode === "stack" ? "flex" : "none", flexDirection: "column" }}
          >
            <div
              ref={stackRef}
              id="cs-viewport-stack"
              style={{ position: "absolute", inset: 0, background: "#000" }}
            />
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 text-[10px] font-medium text-white/60 backdrop-blur-sm border border-white/10 pointer-events-none">
              Axial
            </div>
            {!loading && totalSlices > 0 && (
              <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white/50 pointer-events-none">
                {currentSlice}/{totalSlices}
              </div>
            )}
          </div>

          {/* ── MPR mode — 3 panels ── */}
          <div
            className="flex-1 grid grid-cols-2 grid-rows-2 min-h-0"
            style={{ display: viewMode === "mpr" ? "grid" : "none" }}
          >
            {/* Axial — top-left */}
            <div className="relative border-r border-b border-border/40 min-h-0">
              <div ref={axialRef} id="cs-vp-axial" style={{ position: "absolute", inset: 0, background: "#000" }} />
              <MprLabel label="Axial" color="text-yellow-400" />
            </div>
            {/* Sagittal — top-right */}
            <div className="relative border-b border-border/40 min-h-0">
              <div ref={sagittalRef} id="cs-vp-sagittal" style={{ position: "absolute", inset: 0, background: "#000" }} />
              <MprLabel label="Sagital" color="text-green-400" />
            </div>
            {/* Coronal — bottom-left */}
            <div className="relative border-r border-border/40 min-h-0">
              <div ref={coronalRef} id="cs-vp-coronal" style={{ position: "absolute", inset: 0, background: "#000" }} />
              <MprLabel label="Coronal" color="text-blue-400" />
            </div>
            {/* Info panel — bottom-right */}
            <div className="relative min-h-0 flex items-center justify-center bg-surface/30">
              <div className="text-center p-4">
                <p className="text-xs text-muted mb-1 font-semibold uppercase tracking-wider">MPR Activo</p>
                <p className="text-[10px] text-muted-2">{statusInfo.images} cortes</p>
                <div className="mt-3 space-y-1 text-[10px] text-muted-2 text-left">
                  <p>🖱 Izq: W/L</p>
                  <p>🖱 Der: Pan</p>
                  <p>🖱 Scroll: Zoom</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cine controls only in stack mode */}
          {viewMode === "stack" && (
            <CineControls
              playing={playing}
              speed={speed}
              currentSlice={currentSlice}
              totalSlices={totalSlices}
              onTogglePlay={() => setPlaying((p) => !p)}
              onSpeedChange={setSpeed}
              onSliceChange={handleSliceChange}
            />
          )}
        </div>
      </div>

      <StatusBar
        patientName={statusInfo.patient}
        studyDescription={statusInfo.study}
        modality={statusInfo.modality}
        totalImages={statusInfo.images}
        onTogglePanel={() => {}}
      />

      {/* Debug toggle */}
      <button
        onClick={() => setShowDebug((v) => !v)}
        className="absolute bottom-16 right-4 z-50 px-2 py-1 bg-black/70 border border-white/10 rounded text-[10px] text-white/40 hover:text-white/80 transition-colors"
      >
        {showDebug ? "✕ Debug" : "🔍 Debug"}
      </button>

      {showDebug && (
        <div className="absolute bottom-24 right-4 z-50 w-[460px] max-h-[220px] bg-black/95 border border-white/10 rounded-lg overflow-hidden shadow-2xl font-mono text-[10px]">
          <div className="overflow-y-auto max-h-[220px] p-2 space-y-0.5">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs...</p>
            ) : (
              logs.map((msg, i) => (
                <p key={i} className={msg.startsWith("❌") ? "text-red-400" : "text-green-400"}>{msg}</p>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MprLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold ${color} backdrop-blur-sm border border-white/10 pointer-events-none`}>
      {label}
    </div>
  );
}
