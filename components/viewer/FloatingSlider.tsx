"use client";

import { IconClose } from "@/components/ui/icons";

interface FloatingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
  onClose: () => void;
}

export default function FloatingSlider({
  label,
  value,
  min,
  max,
  step = 1,
  formatValue = (v) => v.toString(),
  onChange,
  onClose,
}: FloatingSliderProps) {
  return (
    <div className="bg-surface/95 backdrop-blur border border-border rounded-xl shadow-2xl p-4 w-56 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
          <IconClose className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none bg-border rounded-full outline-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-none
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
      />
      <div className="text-right text-[10px] text-muted-2 mt-1">{formatValue(value)}</div>
    </div>
  );
}
