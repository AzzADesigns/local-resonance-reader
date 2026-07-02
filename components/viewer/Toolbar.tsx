"use client";

import { IconSun, IconZoomIn, IconLayout, IconCrosshair, IconReset, IconImage } from "@/components/ui/icons";

interface ToolbarProps {
  activeTool: string;
  cineActive: boolean;
  layout: "single" | "mpr";
  onToggleCine: () => void;
  onToggleLayout: () => void;
  onWindowing: () => void;
  onZoom: () => void;
  onCrosshair?: () => void;
  onReset: () => void;
}

export default function Toolbar({
  activeTool,
  cineActive,
  layout,
  onToggleCine,
  onToggleLayout,
  onWindowing,
  onZoom,
  onCrosshair,
  onReset,
}: ToolbarProps) {
  const tools = [
    {
      id: "windowing",
      icon: IconSun,
      label: "Ventana (W/L)",
      shortcut: "W",
      action: onWindowing,
    },
    {
      id: "zoom",
      icon: IconZoomIn,
      label: "Lupa (Zoom)",
      shortcut: "Z",
      action: onZoom,
    },
    {
      id: "crosshairs",
      icon: IconCrosshair,
      label: "Crosshair",
      shortcut: "C",
      action: onCrosshair ?? (() => {}),
    },
    {
      id: "layout",
      icon: IconLayout,
      label: layout === "mpr" ? "Vista Simple" : "MPR",
      shortcut: "L",
      action: onToggleLayout,
    },
    {
      id: "reset",
      icon: IconReset,
      label: "Reset",
      shortcut: "R",
      action: onReset,
    },
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-surface border-b border-border overflow-x-auto">
      <div className="flex items-center gap-1 mr-2">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
          <IconImage className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={tool.action}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors text-xs relative group ${
            tool.id !== "layout" && tool.id !== "reset" && activeTool === tool.id
              ? "bg-accent/20 text-accent"
              : "hover:bg-surface-2 text-muted hover:text-foreground"
          }`}
        >
          <tool.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{tool.label}</span>
          <kbd className="hidden lg:inline text-[10px] text-muted-2 ml-1">
            {tool.shortcut}
          </kbd>
        </button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={onToggleCine}
        className={`flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors text-xs ${
          cineActive
            ? "bg-accent/20 text-accent"
            : "hover:bg-surface-2 text-muted hover:text-foreground"
        }`}
      >
        <span className="text-base leading-none">{cineActive ? "⏹" : "▶"}</span>
        <span>Cine</span>
      </button>
    </div>
  );
}
