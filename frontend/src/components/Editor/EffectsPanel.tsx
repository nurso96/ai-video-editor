import React from "react";

type Props = {
  effects: string[];
  onChange?: (v: string) => void;
};

export default function EffectsPanel({ effects = [], onChange }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-3">
      <h4 className="text-sm text-slate-300 mb-2">Effects</h4>
      <textarea
        className="w-full h-28 bg-transparent border border-slate-800 rounded p-2 text-slate-200"
        value={effects.join(", ")}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="comma-separated effects"
      />
      <p className="text-xs text-slate-500 mt-2">Example: brightness(1.1), crop(0,0,1080,1920), caption(style)</p>
    </div>
  );
}
