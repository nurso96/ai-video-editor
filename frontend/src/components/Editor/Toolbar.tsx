import React from "react";

type Props = {
  onSave?: () => void;
  onRender?: () => void;
  saving?: boolean;
  rendering?: boolean;
};

export default function Toolbar({ onSave, onRender, saving, rendering }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button className="px-4 py-2 bg-emerald-500 text-black font-semibold rounded" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save Timeline"}
      </button>
      <button className="px-4 py-2 bg-indigo-500 text-black font-semibold rounded" onClick={onRender} disabled={rendering}>
        {rendering ? "Rendering…" : "Render Video"}
      </button>
    </div>
  );
}
