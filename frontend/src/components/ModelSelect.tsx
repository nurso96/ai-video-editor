import { useEffect, useState } from "react";

type ModelSettings = {
  whisperModel: string;
  chatBackend: "stub" | "hf";
  hfModel: string;
};

interface ModelSelectProps {
  onChange?: (settings: ModelSettings) => void;
}

const WHISPER_MODELS = ["tiny", "base", "small", "small.en", "medium", "medium.en", "large"]; // available community builds
const HF_MODELS = ["distilgpt2", "gpt2", "tiiuae/falcon-7b-instruct", "mistralai/Mistral-7B-Instruct-v0.2"];

const STORAGE_KEY = "ai-editing-model-settings";

export function ModelSelect({ onChange }: ModelSelectProps) {
  const [settings, setSettings] = useState<ModelSettings>(() => {
    if (typeof window === "undefined") {
      return { whisperModel: "small.en", chatBackend: "stub", hfModel: "distilgpt2" };
    }
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      try {
        return JSON.parse(existing) as ModelSettings;
      } catch (error) {
        console.warn("Failed to parse stored model settings", error);
      }
    }
    return { whisperModel: "small.en", chatBackend: "stub", hfModel: "distilgpt2" };
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    onChange?.(settings);
  }, [settings, onChange]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded p-4 flex flex-wrap gap-4">
      <div className="flex flex-col text-sm text-slate-300 min-w-[200px]">
        Whisper Model
        <select
          className="mt-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100"
          value={settings.whisperModel}
          onChange={(event) => setSettings((prev) => ({ ...prev, whisperModel: event.target.value }))}
        >
          {WHISPER_MODELS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col text-sm text-slate-300 min-w-[200px]">
        Chat Backend
        <select
          className="mt-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100"
          value={settings.chatBackend}
          onChange={(event) => setSettings((prev) => ({ ...prev, chatBackend: event.target.value as ModelSettings["chatBackend"] }))}
        >
          <option value="stub">Built-in helper</option>
          <option value="hf">Hugging Face</option>
        </select>
      </div>
      {settings.chatBackend === "hf" && (
        <div className="flex flex-col text-sm text-slate-300 min-w-[240px]">
          Hugging Face Model
          <input
            className="mt-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100"
            list="hf-models"
            value={settings.hfModel}
            onChange={(event) => setSettings((prev) => ({ ...prev, hfModel: event.target.value }))}
            placeholder="distilgpt2"
          />
          <datalist id="hf-models">
            {HF_MODELS.map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
        </div>
      )}
    </section>
  );
}

export type { ModelSettings };
