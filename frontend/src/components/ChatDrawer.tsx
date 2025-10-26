import { FormEvent, useEffect, useMemo, useState } from "react";

import type { ModelSettings } from "./ModelSelect";

type ChatMessage = {
  id: number;
  role: "user" | "assistant" | string;
  content: string;
  created_at: string;
};

type ChatSession = {
  id: number;
  title: string;
  backend: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
};

type ChatDrawerProps = {
  open: boolean;
  apiBase: string;
  onClose: () => void;
  modelSettings?: ModelSettings;
  onInsertCaption?: (text: string) => void;
};

const QUICK_PROMPTS: Record<string, string> = {
  punchline: "Suggest a punchline for the climax beat of this meme video",
  hook: "Write a hook caption that grabs attention in the first 2 seconds",
};

export function ChatDrawer({ open, apiBase, onClose, modelSettings, onInsertCaption }: ChatDrawerProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(() => sessions.find((session) => session.id === activeSessionId) ?? null, [sessions, activeSessionId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void refreshSessions();
  }, [open]);

  const refreshSessions = async () => {
    try {
      const response = await fetch(`${apiBase}/chat/sessions`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const payload = await response.json();
      setSessions(payload.sessions || []);
      if (!activeSessionId && payload.sessions?.length) {
        setActiveSessionId(payload.sessions[0].id);
      }
    } catch (fetchError) {
      setError((fetchError as Error).message);
    }
  };

  const createSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backend: modelSettings?.chatBackend ?? "stub",
          hf_model: modelSettings?.hfModel,
          title: "Editing Ideas",
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const payload = await response.json();
      setSessions((prev) => [payload, ...prev]);
      setActiveSessionId(payload.id);
    } catch (creationError) {
      setError((creationError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!activeSessionId || !message.trim()) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${apiBase}/chat/sessions/${activeSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const payload = await response.json();
      setSessions((prev) => [payload.session, ...prev.filter((session) => session.id !== payload.session.id)]);
      setActiveSessionId(payload.session.id);
      setInput("");
    } catch (sendError) {
      setError((sendError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleQuickPrompt = async (promptKey: string) => {
    const prompt = QUICK_PROMPTS[promptKey];
    if (!prompt) {
      return;
    }
    await sendMessage(prompt);
  };

  if (!open) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-full sm:w-[420px] bg-slate-950 border-r border-slate-800 shadow-xl flex flex-col z-40">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Chat Assistant</h2>
          <p className="text-xs text-slate-500">Backend: {modelSettings?.chatBackend ?? "stub"}</p>
        </div>
        <button className="text-slate-400 hover:text-slate-200" onClick={onClose}>
          ✕
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button className="px-3 py-1 border border-emerald-400 text-emerald-300 rounded text-sm" onClick={createSession} disabled={loading}>
            New Session
          </button>
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`px-3 py-1 rounded text-sm border ${session.id === activeSessionId ? "border-emerald-400 text-emerald-300" : "border-slate-700 text-slate-300"}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              {session.title}
            </button>
          ))}
        </div>
        {activeSession ? (
          <div className="px-4 py-4 space-y-3">
            {activeSession.messages.map((message) => (
              <div key={message.id} className={`p-3 rounded border ${message.role === "assistant" ? "border-emerald-500/40 bg-emerald-500/10" : "border-slate-700"}`}>
                <div className="text-xs text-slate-400 mb-1 capitalize">{message.role}</div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === "assistant" && (
                  <button
                    className="mt-2 text-xs text-emerald-300 underline"
                    onClick={() => onInsertCaption?.(message.content)}
                  >
                    Insert as caption
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-sm text-slate-400">No session selected.</div>
        )}
      </div>
      <footer className="border-t border-slate-800 p-4 space-y-3">
        {error && <p className="text-xs text-red-400 bg-red-900/30 border border-red-900 rounded px-3 py-2">{error}</p>}
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 border border-slate-700 rounded text-xs text-slate-300" onClick={() => handleQuickPrompt("hook")}>
            Write hook
          </button>
          <button className="flex-1 px-3 py-2 border border-slate-700 rounded text-xs text-slate-300" onClick={() => handleQuickPrompt("punchline")}>
            Suggest punchline
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 h-16"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about comedic timing, captions, etc."
          />
          <button className="px-4 py-2 bg-emerald-500 text-black font-semibold rounded self-end disabled:opacity-50" disabled={loading || !activeSessionId}>
            Send
          </button>
        </form>
      </footer>
    </aside>
  );
}
