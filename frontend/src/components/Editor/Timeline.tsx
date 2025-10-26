import React from "react";
import type { TimelineSegment } from "../../types";

type Props = {
  segments: TimelineSegment[];
  selectedIndex: number;
  onSelect: (i: number) => void;
};

export default function Timeline({ segments, selectedIndex, onSelect }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-2">
      <h4 className="text-sm text-slate-300 mb-2">Timeline</h4>
      <ul className="space-y-2 max-h-48 overflow-auto">
        {segments.map((s, i) => (
          <li key={`${s.name}-${i}`}>
            <button
              className={`w-full text-left px-3 py-2 rounded border transition ${
                selectedIndex === i ? "border-emerald-400 bg-emerald-400/10" : "border-slate-800 hover:border-slate-600"
              }`}
              onClick={() => onSelect(i)}
            >
              <div className="flex justify-between">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-slate-400">{s.start.toFixed(2)}–{s.end.toFixed(2)}s</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
