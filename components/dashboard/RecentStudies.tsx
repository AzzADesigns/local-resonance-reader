"use client";

import { useEffect, useState } from "react";
import { IconHistory, IconClose } from "@/components/ui/icons";

interface RecentStudy {
  path: string;
  label: string;
  date: string;
  count: number;
}

const STORAGE_KEY = "recent-studies";

function loadRecent(): RecentStudy[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentStudy(path: string, label: string, count: number) {
  const studies = loadRecent();
  const filtered = studies.filter((s) => s.path !== path);
  const updated = [
    { path, label, date: new Date().toLocaleDateString("es-ES"), count },
    ...filtered,
  ].slice(0, 3);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

interface RecentStudiesProps {
  onSelect: (path: string) => void;
}

export default function RecentStudies({ onSelect }: RecentStudiesProps) {
  const [studies, setStudies] = useState<RecentStudy[]>([]);

  useEffect(() => {
    setStudies(loadRecent());
  }, []);

  const remove = (path: string) => {
    const updated = studies.filter((s) => s.path !== path);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setStudies(updated);
  };

  if (studies.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div className="flex items-center gap-2 mb-4">
        <IconHistory className="w-4 h-4 text-muted" />
        <span className="text-sm font-medium text-muted">Recientes</span>
      </div>
      <div className="space-y-2">
        {studies.map((study) => (
          <div
            key={study.path}
            className="group flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border hover:border-border-light transition-colors cursor-pointer"
            onClick={() => onSelect(study.path)}
          >
            <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-accent">DCM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{study.label}</p>
              <p className="text-xs text-muted">
                {study.date} &middot; {study.count} archivos
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                remove(study.path);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-surface-3 transition-all"
            >
              <IconClose className="w-4 h-4 text-muted" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
