"use client";

import { IconMenu } from "@/components/ui/icons";

interface StatusBarProps {
  patientName?: string;
  studyDescription?: string;
  modality?: string;
  totalImages?: number;
  onTogglePanel: () => void;
}

export default function StatusBar({
  patientName = "Paciente",
  studyDescription = "TC Abdomen",
  modality = "CT",
  totalImages = 120,
  onTogglePanel,
}: StatusBarProps) {
  return (
    <div className="flex items-center gap-3 px-3 h-8 bg-surface border-t border-border text-[11px] text-muted">
      <button
        onClick={onTogglePanel}
        className="flex items-center gap-1.5 px-2 h-6 rounded hover:bg-surface-2 transition-colors"
      >
        <IconMenu className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-border" />

      <span className="font-medium text-foreground/80">{patientName}</span>

      <span className="text-muted-2">&middot;</span>

      <span>{studyDescription}</span>

      <span className="text-muted-2">&middot;</span>

      <span>{modality}</span>

      <span className="text-muted-2">&middot;</span>

      <span>{totalImages} imágenes</span>
    </div>
  );
}
