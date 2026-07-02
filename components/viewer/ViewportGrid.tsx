"use client";

import ViewportCanvas from "./ViewportCanvas";

interface ViewportGridProps {
  layout: "single" | "mpr";
}

export default function ViewportGrid({ layout }: ViewportGridProps) {
  if (layout === "single") {
    return (
      <div className="flex-1 grid grid-cols-1">
        <ViewportCanvas
          id="viewport-axial"
          label="Axial"
          orientation="A"
          className="rounded-none"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-2">
      <div className="border-r border-b border-border/50">
        <ViewportCanvas
          id="viewport-axial"
          label="Axial"
          orientation="A / P"
        />
      </div>
      <div className="border-b border-border/50">
        <ViewportCanvas
          id="viewport-sagittal"
          label="Sagital"
          orientation="L / R"
        />
      </div>
      <div className="border-r border-border/50">
        <ViewportCanvas
          id="viewport-coronal"
          label="Coronal"
          orientation="L / R"
        />
      </div>
      <div>
        <ViewportCanvas
          id="viewport-3d"
          label="Volumen 3D"
          orientation="3D"
        />
      </div>
    </div>
  );
}
