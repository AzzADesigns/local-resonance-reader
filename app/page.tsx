"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import PathInput from "@/components/dashboard/PathInput";
import RecentStudies, { addRecentStudy } from "@/components/dashboard/RecentStudies";
import LoadingOverlay from "@/components/dashboard/LoadingOverlay";
import { setStudyData } from "@/lib/cornerstone/studyStore";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoad = useCallback(
    async (path: string) => {
      setLoading(true);
      addRecentStudy(path, path.split("/").pop() || path, 0);
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

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadStatus(`Leyendo ${files.length} archivos...`);
    const dicomFiles = Array.from(files).filter((f) => f.name.endsWith(".dcm"));
    if (dicomFiles.length === 0) {
      setUploadStatus("No se encontraron archivos .dcm");
      return;
    }
    dicomFiles.sort((a, b) => a.name.localeCompare(b.name));
    const imageIds: string[] = [];
    for (const file of dicomFiles) {
      const buf = await file.arrayBuffer();
      const blob = new Blob([buf], { type: "application/dicom" });
      const url = URL.createObjectURL(blob);
      imageIds.push(`wadouri:${url}`);
    }
    setStudyData({
      imageIds,
      patientName: dicomFiles[0].name,
      studyDescription: "Upload",
      numImages: dicomFiles.length,
      firstFileName: dicomFiles[0].name,
    });
    setUploadStatus(`${dicomFiles.length} archivos listos — abriendo visor...`);
    setTimeout(() => router.push("/viewer?upload=true"), 500);
  }, [router]);

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
              Subí archivos .dcm desde tu PC o pegá una ruta local para visualizar al instante.
            </p>
          </div>

          {/* Upload section */}
          <div className="w-full max-w-md mb-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
            >
              <p className="text-sm text-muted font-medium mb-1">
                {uploadStatus || "Hacé click para seleccionar archivos .dcm"}
              </p>
              <p className="text-[10px] text-muted-2">o arrastrá una carpeta</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".dcm"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-3 w-full max-w-md mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-2 uppercase font-semibold">o</span>
            <div className="flex-1 h-px bg-border" />
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
