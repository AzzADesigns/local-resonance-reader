"use client";

import { useState, useCallback } from "react";
import { IconDropbox, IconFolder, IconSpinner } from "@/components/ui/icons";

interface PathInputProps {
  onLoad: (path: string) => void;
  loading: boolean;
}

export default function PathInput({ onLoad, loading }: PathInputProps) {
  const [path, setPath] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (path.trim() && !loading) onLoad(path.trim());
    },
    [path, loading, onLoad]
  );

  const handleDropboxConnect = useCallback(() => {
    // Placeholder: Aquí irá la integración con Dropbox Chooser/PKCE
    console.log("Conectar con Dropbox");
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <IconFolder className="w-5 h-5 text-muted" />
          </div>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="Pega la ruta de la carpeta en tu Dropbox..."
            className="w-full h-14 pl-12 pr-4 bg-surface-2 border border-border rounded-xl text-foreground placeholder-muted text-base outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!path.trim() || loading}
            className="flex-1 h-12 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <IconSpinner className="w-5 h-5" />
                Cargando estudio...
              </>
            ) : (
              <>
                <IconFolder className="w-5 h-5" />
                Generar Visor
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDropboxConnect}
            disabled={loading}
            className="h-12 px-5 bg-surface-2 hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed border border-border rounded-xl font-medium transition-colors flex items-center gap-2 text-foreground"
          >
            <IconDropbox className="w-5 h-5 text-accent" />
            <span className="hidden sm:inline">Dropbox</span>
          </button>
        </div>
      </form>
    </div>
  );
}
