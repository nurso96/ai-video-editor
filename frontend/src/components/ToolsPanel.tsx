import { Fragment, useMemo, useState } from "react";

import type { ModelSettings } from "./ModelSelect";

type ToolResult = Record<string, unknown> | null;

type ToolsPanelProps = {
  open: boolean;
  apiBase: string;
  assetPath?: string | null;
  onClose: () => void;
  onApply?: (tool: string, result: ToolResult) => void;
  modelSettings?: ModelSettings;
};

const TOOL_ORDER = ["transcribe", "beats", "thumbnail", "caption_srt", "suggest_effects"] as const;
type ToolName = (typeof TOOL_ORDER)[number];

export function ToolsPanel({ open, apiBase, assetPath, onClose, onApply, modelSettings }: ToolsPanelProps) {
  const [activeTool, setActiveTool] = useState<ToolName>("transcribe");
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [transcriptText, setTranscriptText] = useState("");
  const [toolResult, setToolResult] = useState<ToolResult>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assetHint = useMemo(() => assetPath ?? "", [assetPath]);

  const runTool = async () => {
    if (!assetHint && activeTool !== "caption_srt" && activeTool !== "suggest_effects") {
      setError("No asset path available. Upload a clip first.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = { tool: activeTool, args: {} };
      const args: Record<string, unknown> = body.args as Record<string, unknown>;
      if (activeTool !== "caption_srt" && activeTool !== "suggest_effects") {
        args.path = assetHint;
      }
      if (activeTool === "transcribe" && modelSettings) {
        args.model = modelSettings.whisperModel;
      }
      if (activeTool === "thumbnail") {
        args.time = thumbnailTime;
      }
      if (activeTool === "caption_srt") {
        try {
          args.segments = JSON.parse(transcriptText || "[]");
        } catch (parseError) {
          setBusy(false);
          setError("Provide caption segments JSON (array of {start,end,text}).");
          return;
        }
      }
      if (activeTool === "suggest_effects") {
        if (!transcriptText) {
          setBusy(false);
          setError("Paste the transcript text to get suggestions.");
          return;
        }
        args.transcript = transcriptText;
        args.beats = [];
        if (modelSettings?.chatBackend === "hf") {
          args.backend = "hf";
          args.hf_model = modelSettings?.hfModel;
        }
      }

      const response = await fetch(`${apiBase}/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const payload = await response.json();
      setToolResult(payload.result ?? null);
    } catch (runError) {
      setError((runError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const applyResult = () => {
    if (!toolResult) {
      return;
    }
    onApply?.(activeTool, toolResult);
  };

  if (!open) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-950 border-l border-slate-800 shadow-xl flex flex-col z-40">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100">AI Tools</h2>
        <button className="text-slate-400 hover:text-slate-200" onClick={onClose}>
          ✕
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-slate-200">
        <div>
          <p className="text-sm text-slate-400 mb-2">Choose a tool:</p>
          <div className="flex flex-wrap gap-2">
            {TOOL_ORDER.map((tool) => (
              <button
                key={tool}
                className={`px-3 py-1 rounded border text-sm transition ${activeTool === tool ? "border-emerald-400 text-emerald-300" : "border-slate-700 text-slate-300"}`}
                onClick={() => setActiveTool(tool)}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>

        {assetHint && (
          <div className="text-xs text-slate-500">Asset: {assetHint}</div>
        )}

        {activeTool === "thumbnail" && (
          <label className="flex flex-col text-sm text-slate-300">
            Timestamp (seconds)
            <input
              type="number"
              step="0.1"
              min={0}
              className="mt-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100"
              value={thumbnailTime}
              onChange={(event) => setThumbnailTime(Number(event.target.value))}
            />
          </label>
        )}

        {(activeTool === "caption_srt" || activeTool === "suggest_effects") && (
          <label className="flex flex-col text-sm text-slate-300">
            {activeTool === "caption_srt" ? "Caption segments JSON" : "Transcript text"}
            <textarea
              className="mt-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 h-32"
              value={transcriptText}
              onChange={(event) => setTranscriptText(event.target.value)}
              placeholder={activeTool === "caption_srt" ? '[{"start":0,"end":1.2,"text":"Hello"}]' : "Paste transcript"}
            />
          </label>
        )}

        {error && <p className="text-sm text-red-400 bg-red-900/30 border border-red-900 rounded px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 bg-emerald-500 text-black font-semibold rounded disabled:opacity-50"
            onClick={runTool}
            disabled={busy}
          >
            {busy ? "Running…" : "Run Tool"}
          </button>
          {toolResult && (
            <button className="px-4 py-2 border border-emerald-400 text-emerald-300 rounded" onClick={applyResult}>
              Apply to Timeline
            </button>
          )}
        </div>

        {toolResult && (
          <div>
            <p className="text-sm text-slate-400 mb-2">Result</p>
            <pre className="bg-slate-900 border border-slate-800 rounded p-3 text-xs overflow-x-auto">
              {JSON.stringify(toolResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}
