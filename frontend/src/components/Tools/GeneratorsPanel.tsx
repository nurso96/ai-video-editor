import React, { useState } from "react";
import { startRender } from "../../lib/api";

export default function GeneratorsPanel() {
  const [prompt, setPrompt] = useState("funny mechanic tries to fix a lawnmower, comedic timing, vertical");
  const [numFrames, setNumFrames] = useState(6);
  const [width, setWidth] = useState(480);
  const [height, setHeight] = useState(832);
  const [steps, setSteps] = useState(12);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    setMsg(null);
    try {
      // We'll call the existing startRender as a simple enqueue example.
      // If your API uses a different endpoint, update src/lib/api.ts accordingly.
      const resp = await fetch("/api/tools/generate_video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, num_frames: numFrames, width, height, steps })
      });
      const j = await resp.json();
      setMsg(JSON.stringify(j).slice(0, 300));
    } catch (e) {
      setMsg("Error: " + String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-slate-800 p-4 rounded">
      <label className="block text-sm font-medium mb-2">Prompt</label>
      <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} className="w-full p-2 rounded bg-slate-900" rows={3} />
      <div className="flex gap-2 mt-3">
        <div>
          <label className="text-xs">Frames</label>
          <input type="number" value={numFrames} onChange={(e)=>setNumFrames(Number(e.target.value))} className="w-20 p-1 rounded bg-slate-900" />
        </div>
        <div>
          <label className="text-xs">W</label>
          <input type="number" value={width} onChange={(e)=>setWidth(Number(e.target.value))} className="w-20 p-1 rounded bg-slate-900" />
        </div>
        <div>
          <label className="text-xs">H</label>
          <input type="number" value={height} onChange={(e)=>setHeight(Number(e.target.value))} className="w-20 p-1 rounded bg-slate-900" />
        </div>
        <div>
          <label className="text-xs">Steps</label>
          <input type="number" value={steps} onChange={(e)=>setSteps(Number(e.target.value))} className="w-20 p-1 rounded bg-slate-900" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button disabled={busy} onClick={handleGenerate} className="px-4 py-2 bg-emerald-500 rounded disabled:opacity-50">
          {busy ? "Generating…" : "Generate"}
        </button>
      </div>
      {msg && <pre className="mt-3 p-2 bg-slate-900 rounded text-xs">{msg}</pre>}
    </div>
  );
}
