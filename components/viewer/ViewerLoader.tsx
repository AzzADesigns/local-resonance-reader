"use client";

import dynamic from "next/dynamic";

const ViewerScreen = dynamic(() => import("@/components/viewer/ViewerScreen"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted">Cargando visor...</p>
      </div>
    </div>
  ),
});

export default function ViewerLoader() {
  return <ViewerScreen />;
}
