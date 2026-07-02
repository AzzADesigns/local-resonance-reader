"use client";

import { IconPlay, IconPause, IconSpeed, IconScroll } from "@/components/ui/icons";

interface CineControlsProps {
  playing: boolean;
  speed: number;
  currentSlice: number;
  totalSlices: number;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onSliceChange: (slice: number) => void;
}

export default function CineControls({
  playing,
  speed,
  currentSlice,
  totalSlices,
  onTogglePlay,
  onSpeedChange,
  onSliceChange,
}: CineControlsProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-surface border-t border-border">
      <button
        onClick={onTogglePlay}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg hover:bg-surface-2 transition-colors text-sm"
      >
        {playing ? (
          <IconPause className="w-4 h-4 text-accent" />
        ) : (
          <IconPlay className="w-4 h-4" />
        )}
        <span className="text-xs">{playing ? "Pausa" : "Cine"}</span>
      </button>

      <div className="w-px h-6 bg-border" />

      <div className="flex items-center gap-2">
        <IconSpeed className="w-3.5 h-3.5 text-muted" />
        <input
          type="range"
          min={1}
          max={10}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-20 h-1 bg-surface-3 rounded-full appearance-none cursor-pointer accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
        />
        <span className="text-[10px] text-muted w-6">{speed}x</span>
      </div>

      <div className="w-px h-6 bg-border" />

      <div className="flex items-center gap-2 flex-1">
        <IconScroll className="w-3.5 h-3.5 text-muted" />
        <span className="text-xs text-muted w-16">
          {currentSlice}/{totalSlices}
        </span>
        <input
          type="range"
          min={1}
          max={totalSlices}
          value={currentSlice}
          onChange={(e) => onSliceChange(Number(e.target.value))}
          className="flex-1 h-1 bg-surface-3 rounded-full appearance-none cursor-pointer accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
        />
      </div>
    </div>
  );
}
