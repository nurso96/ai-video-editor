import { useEffect, useState } from "react";
import type { ConsentStatus } from "../types";

type SettingsModalProps = {
  open: boolean;
  watermarkEnabled: boolean;
  onWatermarkChange?: (value: boolean) => void;
  consent?: ConsentStatus | null;
  redisHealthy?: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, watermarkEnabled, onWatermarkChange, consent, redisHealthy, onClose }: SettingsModalProps) {
  const [localWatermark, setLocalWatermark] = useState(watermarkEnabled);

  useEffect(() => {
    setLocalWatermark(watermarkEnabled);
  }, [watermarkEnabled, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-lg shadow-xl p-6 space-y-4 text-slate-100">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button className="text-slate-400 hover:text-slate-200" onClick={onClose}>
            ✕
          </button>
        </header>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">Watermark</h3>
          <p className="text-xs text-slate-400">
            Toggles whether renders include the ffmpeg drawtext watermark. Applies to future render jobs.
          </p>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={localWatermark}
              onChange={(event) => {
                const value = event.target.checked;
                setLocalWatermark(value);
                onWatermarkChange?.(value);
              }}
            />
            Watermark enabled
          </label>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">Consent</h3>
          {consent?.has_checkbox ? (
            <p className="text-xs text-emerald-300">✅ Consent checkbox acknowledged</p>
          ) : (
            <p className="text-xs text-yellow-300">⚠️ Consent not yet confirmed</p>
          )}
          {consent?.document_url ? (
            <a className="text-xs text-emerald-400 underline" href={consent.document_url} target="_blank" rel="noreferrer">
              View consent document
            </a>
          ) : (
            <p className="text-xs text-slate-500">Upload a consent document to unblock rendering.</p>
          )}
        </section>

        <section className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-300">System</h3>
          <p className="text-xs text-slate-400">Redis: {redisHealthy ? "✅ reachable" : "⚠️ offline"}</p>
        </section>

        <footer className="flex justify-end">
          <button className="px-4 py-2 bg-emerald-500 text-black font-semibold rounded" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
