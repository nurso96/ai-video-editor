import React from "react";

type Clip = { id: string; title?: string; thumbnail?: string };

type Props = {
  clips: Clip[];
  onImport?: () => void;
  onSelect?: (id: string) => void;
};

export default function ClipList({ clips = [], onImport, onSelect }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-2">
      <div className="flex justify-between items-center">
        <h4 className="text-sm text-slate-300">Clips</h4>
        <button className="px-2 py-1 border rounded" onClick={onImport}>Import</button>
      </div>
      <ul className="mt-2 space-y-2 max-h-48 overflow-auto">
        {clips.map((c) => (
          <li key={c.id}>
            <button className="w-full text-left px-2 py-1 rounded border border-slate-800 hover:border-slate-600" onClick={() => onSelect?.(c.id)}>
              <div className="text-sm">{c.title ?? c.id}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
