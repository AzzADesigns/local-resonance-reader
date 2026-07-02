"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PathInput from "@/components/dashboard/PathInput";
import RecentStudies, { addRecentStudy } from "@/components/dashboard/RecentStudies";
import LoadingOverlay from "@/components/dashboard/LoadingOverlay";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLoad = useCallback(
    async (path: string) => {
      setLoading(true);
      addRecentStudy(path, path.split("/").pop() || path, 0);
      // Placeholder: Aquí se conectará con Dropbox para listar archivos
      // y luego navegar al visor con los datos
      setTimeout(() => {
        router.push(`/viewer?path=${encodeURIComponent(path)}`);
      }, 1500);
    },
    [router]
  );

  const handleSelectRecent = useCallback(
    (path: string) => {
      handleLoad(path);
    },
    [handleLoad]
  );

  return (
    <>
      {loading && <LoadingOverlay />}
      <div className="min-h-screen flex flex-col bg-background">
        <header className="px-6 h-16 flex items-center border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-xs font-bold text-white">D</span>
            </div>
            <span className="text-sm font-semibold">Visor DICOM</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center mb-8 max-w-lg">
            <h1 className="text-2xl font-bold mb-2">Visor de Estudios DICOM</h1>
            <p className="text-muted text-sm">
              Pega la ruta de Dropbox donde están tus archivos .dcm y visualiza al instante.
              Sin compresiones, sin subidas manuales.
            </p>
          </div>

          <PathInput onLoad={handleLoad} loading={loading} />

          <RecentStudies onSelect={handleSelectRecent} />
        </main>

        <footer className="px-6 h-12 flex items-center justify-center border-t border-border">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Visor DICOM Personal
          </p>
        </footer>
      </div>
    </>
  );
}
