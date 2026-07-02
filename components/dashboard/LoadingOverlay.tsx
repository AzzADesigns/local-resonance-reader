export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-surface-3 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-accent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-base font-medium">Cargando estudio</p>
          <p className="text-sm text-muted mt-1">
            Descargando archivos DICOM desde Dropbox...
          </p>
        </div>
        <div className="w-64 h-1 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full animate-pulse" style={{ width: "45%" }} />
        </div>
      </div>
    </div>
  );
}
