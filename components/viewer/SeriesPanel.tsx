"use client";

import { useState } from "react";
import { IconImage } from "@/components/ui/icons";

interface Series {
  id: string;
  label: string;
  modality: string;
  count: number;
  selected: boolean;
}

export default function SeriesPanel() {
  const [series] = useState<Series[]>([
    { id: "1", label: "Abdomen CT", modality: "CT", count: 120, selected: true },
    { id: "2", label: "Coronal Reformat", modality: "MPR", count: 120, selected: false },
    { id: "3", label: "Sagital Reformat", modality: "MPR", count: 120, selected: false },
  ]);

  return (
    <div className="w-56 bg-surface border-r border-border flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Series</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {series.map((s) => (
          <button
            key={s.id}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
              s.selected
                ? "bg-surface-2 border border-border-light"
                : "hover:bg-surface-2 border border-transparent"
            }`}
          >
            <div className="w-10 h-10 rounded-md bg-surface-3 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <IconImage className="w-4 h-4 text-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{s.label}</p>
              <p className="text-[10px] text-muted">
                {s.modality} &middot; {s.count} cortes
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
