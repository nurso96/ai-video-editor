module.exports = [
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/react-dom [external] (react-dom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react-dom", () => require("react-dom"));

module.exports = mod;
}),
"[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChatDrawer",
    ()=>ChatDrawer
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
const QUICK_PROMPTS = {
    punchline: "Suggest a punchline for the climax beat of this meme video",
    hook: "Write a hook caption that grabs attention in the first 2 seconds"
};
function ChatDrawer({ open, apiBase, onClose, modelSettings, onInsertCaption }) {
    const [sessions, setSessions] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [activeSessionId, setActiveSessionId] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const activeSession = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>sessions.find((session)=>session.id === activeSessionId) ?? null, [
        sessions,
        activeSessionId
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!open) {
            return;
        }
        void refreshSessions();
    }, [
        open
    ]);
    const refreshSessions = async ()=>{
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
            setError(fetchError.message);
        }
    };
    const createSession = async ()=>{
        try {
            setLoading(true);
            const response = await fetch(`${apiBase}/chat/sessions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    backend: modelSettings?.chatBackend ?? "stub",
                    hf_model: modelSettings?.hfModel,
                    title: "Editing Ideas"
                })
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const payload = await response.json();
            setSessions((prev)=>[
                    payload,
                    ...prev
                ]);
            setActiveSessionId(payload.id);
        } catch (creationError) {
            setError(creationError.message);
        } finally{
            setLoading(false);
        }
    };
    const sendMessage = async (message)=>{
        if (!activeSessionId || !message.trim()) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${apiBase}/chat/sessions/${activeSessionId}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message
                })
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const payload = await response.json();
            setSessions((prev)=>[
                    payload.session,
                    ...prev.filter((session)=>session.id !== payload.session.id)
                ]);
            setActiveSessionId(payload.session.id);
            setInput("");
        } catch (sendError) {
            setError(sendError.message);
        } finally{
            setLoading(false);
        }
    };
    const handleSubmit = async (event)=>{
        event.preventDefault();
        await sendMessage(input);
    };
    const handleQuickPrompt = async (promptKey)=>{
        const prompt = QUICK_PROMPTS[promptKey];
        if (!prompt) {
            return;
        }
        await sendMessage(prompt);
    };
    if (!open) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("aside", {
        className: "fixed inset-y-0 left-0 w-full sm:w-[420px] bg-slate-950 border-r border-slate-800 shadow-xl flex flex-col z-40",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("header", {
                className: "px-6 py-4 flex items-center justify-between border-b border-slate-800",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-semibold text-slate-100",
                                children: "Chat Assistant"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                lineNumber: 138,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "text-xs text-slate-500",
                                children: [
                                    "Backend: ",
                                    modelSettings?.chatBackend ?? "stub"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                lineNumber: 139,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                        lineNumber: 137,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        className: "text-slate-400 hover:text-slate-200",
                        onClick: onClose,
                        children: "✕"
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                lineNumber: 136,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "px-4 py-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "px-3 py-1 border border-emerald-400 text-emerald-300 rounded text-sm",
                                onClick: createSession,
                                disabled: loading,
                                children: "New Session"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                lineNumber: 147,
                                columnNumber: 11
                            }, this),
                            sessions.map((session)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                    className: `px-3 py-1 rounded text-sm border ${session.id === activeSessionId ? "border-emerald-400 text-emerald-300" : "border-slate-700 text-slate-300"}`,
                                    onClick: ()=>setActiveSessionId(session.id),
                                    children: session.title
                                }, session.id, false, {
                                    fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                    lineNumber: 151,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    activeSession ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "px-4 py-4 space-y-3",
                        children: activeSession.messages.map((message)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: `p-3 rounded border ${message.role === "assistant" ? "border-emerald-500/40 bg-emerald-500/10" : "border-slate-700"}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "text-xs text-slate-400 mb-1 capitalize",
                                        children: message.role
                                    }, void 0, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                        lineNumber: 164,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        className: "text-sm whitespace-pre-wrap",
                                        children: message.content
                                    }, void 0, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                        lineNumber: 165,
                                        columnNumber: 17
                                    }, this),
                                    message.role === "assistant" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        className: "mt-2 text-xs text-emerald-300 underline",
                                        onClick: ()=>onInsertCaption?.(message.content),
                                        children: "Insert as caption"
                                    }, void 0, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                        lineNumber: 167,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, message.id, true, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                lineNumber: 163,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                        lineNumber: 161,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "px-4 py-6 text-sm text-slate-400",
                        children: "No session selected."
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                        lineNumber: 178,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("footer", {
                className: "border-t border-slate-800 p-4 space-y-3",
                children: [
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        className: "text-xs text-red-400 bg-red-900/30 border border-red-900 rounded px-3 py-2",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                        lineNumber: 182,
                        columnNumber: 19
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "flex-1 px-3 py-2 border border-slate-700 rounded text-xs text-slate-300",
                                onClick: ()=>handleQuickPrompt("hook"),
                                children: "Write hook"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                lineNumber: 184,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "flex-1 px-3 py-2 border border-slate-700 rounded text-xs text-slate-300",
                                onClick: ()=>handleQuickPrompt("punchline"),
                                children: "Suggest punchline"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                lineNumber: 187,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                        onSubmit: handleSubmit,
                        className: "flex gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                                className: "flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 h-16",
                                value: input,
                                onChange: (event)=>setInput(event.target.value),
                                placeholder: "Ask about comedic timing, captions, etc."
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                lineNumber: 192,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "px-4 py-2 bg-emerald-500 text-black font-semibold rounded self-end disabled:opacity-50",
                                disabled: loading || !activeSessionId,
                                children: "Send"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                                lineNumber: 198,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                        lineNumber: 191,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
                lineNumber: 181,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx",
        lineNumber: 135,
        columnNumber: 5
    }, this);
}
}),
"[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SettingsModal",
    ()=>SettingsModal
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
function SettingsModal({ open, watermarkEnabled, onWatermarkChange, consent, redisHealthy, onClose }) {
    const [localWatermark, setLocalWatermark] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(watermarkEnabled);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        setLocalWatermark(watermarkEnabled);
    }, [
        watermarkEnabled,
        open
    ]);
    if (!open) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/60 flex items-center justify-center z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "w-full max-w-lg bg-slate-950 border border-slate-800 rounded-lg shadow-xl p-6 space-y-4 text-slate-100",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("header", {
                    className: "flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                            className: "text-xl font-semibold",
                            children: "Settings"
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 28,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            className: "text-slate-400 hover:text-slate-200",
                            onClick: onClose,
                            children: "✕"
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 29,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                    className: "space-y-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                            className: "text-sm font-semibold text-slate-300",
                            children: "Watermark"
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            className: "text-xs text-slate-400",
                            children: "Toggles whether renders include the ffmpeg drawtext watermark. Applies to future render jobs."
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                            className: "flex items-center gap-3 text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: localWatermark,
                                    onChange: (event)=>{
                                        const value = event.target.checked;
                                        setLocalWatermark(value);
                                        onWatermarkChange?.(value);
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                                    lineNumber: 40,
                                    columnNumber: 13
                                }, this),
                                "Watermark enabled"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                    className: "space-y-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                            className: "text-sm font-semibold text-slate-300",
                            children: "Consent"
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 54,
                            columnNumber: 11
                        }, this),
                        consent?.has_checkbox ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            className: "text-xs text-emerald-300",
                            children: "✅ Consent checkbox acknowledged"
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 56,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            className: "text-xs text-yellow-300",
                            children: "⚠️ Consent not yet confirmed"
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 58,
                            columnNumber: 13
                        }, this),
                        consent?.document_url ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                            className: "text-xs text-emerald-400 underline",
                            href: consent.document_url,
                            target: "_blank",
                            rel: "noreferrer",
                            children: "View consent document"
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 61,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            className: "text-xs text-slate-500",
                            children: "Upload a consent document to unblock rendering."
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 65,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                    lineNumber: 53,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                    className: "space-y-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                            className: "text-sm font-semibold text-slate-300",
                            children: "System"
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 70,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            className: "text-xs text-slate-400",
                            children: [
                                "Redis: ",
                                redisHealthy ? "✅ reachable" : "⚠️ offline"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                            lineNumber: 71,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                    lineNumber: 69,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("footer", {
                    className: "flex justify-end",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        className: "px-4 py-2 bg-emerald-500 text-black font-semibold rounded",
                        onClick: onClose,
                        children: "Close"
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                        lineNumber: 75,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
                    lineNumber: 74,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
            lineNumber: 26,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
}),
"[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ToolsPanel",
    ()=>ToolsPanel
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
const TOOL_ORDER = [
    "transcribe",
    "beats",
    "thumbnail",
    "caption_srt",
    "suggest_effects"
];
function ToolsPanel({ open, apiBase, assetPath, onClose, onApply, modelSettings }) {
    const [activeTool, setActiveTool] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("transcribe");
    const [thumbnailTime, setThumbnailTime] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(0);
    const [transcriptText, setTranscriptText] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [toolResult, setToolResult] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const assetHint = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>assetPath ?? "", [
        assetPath
    ]);
    const runTool = async ()=>{
        if (!assetHint && activeTool !== "caption_srt" && activeTool !== "suggest_effects") {
            setError("No asset path available. Upload a clip first.");
            return;
        }
        setError(null);
        setBusy(true);
        try {
            const body = {
                tool: activeTool,
                args: {}
            };
            const args = body.args;
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
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const payload = await response.json();
            setToolResult(payload.result ?? null);
        } catch (runError) {
            setError(runError.message);
        } finally{
            setBusy(false);
        }
    };
    const applyResult = ()=>{
        if (!toolResult) {
            return;
        }
        onApply?.(activeTool, toolResult);
    };
    if (!open) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("aside", {
        className: "fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-950 border-l border-slate-800 shadow-xl flex flex-col z-40",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("header", {
                className: "px-6 py-4 flex items-center justify-between border-b border-slate-800",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        className: "text-lg font-semibold text-slate-100",
                        children: "AI Tools"
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        className: "text-slate-400 hover:text-slate-200",
                        onClick: onClose,
                        children: "✕"
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                        lineNumber: 103,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto px-6 py-4 space-y-4 text-slate-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "text-sm text-slate-400 mb-2",
                                children: "Choose a tool:"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                                lineNumber: 109,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                children: TOOL_ORDER.map((tool)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        className: `px-3 py-1 rounded border text-sm transition ${activeTool === tool ? "border-emerald-400 text-emerald-300" : "border-slate-700 text-slate-300"}`,
                                        onClick: ()=>setActiveTool(tool),
                                        children: tool
                                    }, tool, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                                        lineNumber: 112,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                                lineNumber: 110,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this),
                    assetHint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "text-xs text-slate-500",
                        children: [
                            "Asset: ",
                            assetHint
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                        lineNumber: 124,
                        columnNumber: 11
                    }, this),
                    activeTool === "thumbnail" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        className: "flex flex-col text-sm text-slate-300",
                        children: [
                            "Timestamp (seconds)",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                type: "number",
                                step: "0.1",
                                min: 0,
                                className: "mt-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100",
                                value: thumbnailTime,
                                onChange: (event)=>setThumbnailTime(Number(event.target.value))
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                        lineNumber: 128,
                        columnNumber: 11
                    }, this),
                    (activeTool === "caption_srt" || activeTool === "suggest_effects") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        className: "flex flex-col text-sm text-slate-300",
                        children: [
                            activeTool === "caption_srt" ? "Caption segments JSON" : "Transcript text",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                                className: "mt-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 h-32",
                                value: transcriptText,
                                onChange: (event)=>setTranscriptText(event.target.value),
                                placeholder: activeTool === "caption_srt" ? '[{"start":0,"end":1.2,"text":"Hello"}]' : "Paste transcript"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                                lineNumber: 144,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                        lineNumber: 142,
                        columnNumber: 11
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        className: "text-sm text-red-400 bg-red-900/30 border border-red-900 rounded px-3 py-2",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                        lineNumber: 153,
                        columnNumber: 19
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "px-4 py-2 bg-emerald-500 text-black font-semibold rounded disabled:opacity-50",
                                onClick: runTool,
                                disabled: busy,
                                children: busy ? "Running…" : "Run Tool"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                                lineNumber: 156,
                                columnNumber: 11
                            }, this),
                            toolResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "px-4 py-2 border border-emerald-400 text-emerald-300 rounded",
                                onClick: applyResult,
                                children: "Apply to Timeline"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                                lineNumber: 164,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                        lineNumber: 155,
                        columnNumber: 9
                    }, this),
                    toolResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "text-sm text-slate-400 mb-2",
                                children: "Result"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("pre", {
                                className: "bg-slate-900 border border-slate-800 rounded p-3 text-xs overflow-x-auto",
                                children: JSON.stringify(toolResult, null, 2)
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                                lineNumber: 173,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                        lineNumber: 171,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this);
}
}),
"[project]/ai-video-editor/frontend/src/components/Editor/VideoPreview.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
const VideoPreview = ({ videoSrc })=>{
    const videoRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (videoRef.current && videoSrc) {
            try {
                videoRef.current.preload = "metadata";
            } catch  {
            /* noop */ }
        }
    }, [
        videoSrc
    ]);
    if (!videoSrc) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "h-64 flex items-center justify-center text-slate-500",
            children: "Upload a clip to preview the timeline."
        }, void 0, false, {
            fileName: "[project]/ai-video-editor/frontend/src/components/Editor/VideoPreview.tsx",
            lineNumber: 22,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("video", {
            ref: videoRef,
            controls: true,
            className: "w-full rounded",
            src: videoSrc,
            "data-testid": "video-preview"
        }, void 0, false, {
            fileName: "[project]/ai-video-editor/frontend/src/components/Editor/VideoPreview.tsx",
            lineNumber: 30,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/ai-video-editor/frontend/src/components/Editor/VideoPreview.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(VideoPreview);
}),
"[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Timeline
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
;
function Timeline({ segments, selectedIndex, onSelect }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "bg-slate-900 border border-slate-800 rounded p-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h4", {
                className: "text-sm text-slate-300 mb-2",
                children: "Timeline"
            }, void 0, false, {
                fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                className: "space-y-2 max-h-48 overflow-auto",
                children: segments.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            className: `w-full text-left px-3 py-2 rounded border transition ${selectedIndex === i ? "border-emerald-400 bg-emerald-400/10" : "border-slate-800 hover:border-slate-600"}`,
                            onClick: ()=>onSelect(i),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium",
                                        children: s.name
                                    }, void 0, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx",
                                        lineNumber: 24,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "text-xs text-slate-400",
                                        children: [
                                            s.start.toFixed(2),
                                            "–",
                                            s.end.toFixed(2),
                                            "s"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx",
                                        lineNumber: 25,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx",
                                lineNumber: 23,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx",
                            lineNumber: 17,
                            columnNumber: 13
                        }, this)
                    }, `${s.name}-${i}`, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx",
                        lineNumber: 16,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
}),
"[project]/ai-video-editor/frontend/src/components/Editor/EffectsPanel.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EffectsPanel
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
;
function EffectsPanel({ effects = [], onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "bg-slate-900 border border-slate-800 rounded p-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h4", {
                className: "text-sm text-slate-300 mb-2",
                children: "Effects"
            }, void 0, false, {
                fileName: "[project]/ai-video-editor/frontend/src/components/Editor/EffectsPanel.tsx",
                lineNumber: 11,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                className: "w-full h-28 bg-transparent border border-slate-800 rounded p-2 text-slate-200",
                value: effects.join(", "),
                onChange: (e)=>onChange?.(e.target.value),
                placeholder: "comma-separated effects"
            }, void 0, false, {
                fileName: "[project]/ai-video-editor/frontend/src/components/Editor/EffectsPanel.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                className: "text-xs text-slate-500 mt-2",
                children: "Example: brightness(1.1), crop(0,0,1080,1920), caption(style)"
            }, void 0, false, {
                fileName: "[project]/ai-video-editor/frontend/src/components/Editor/EffectsPanel.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/ai-video-editor/frontend/src/components/Editor/EffectsPanel.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
}),
"[externals]/axios [external] (axios, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("axios");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/ai-video-editor/frontend/src/lib/api.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "client",
    ()=>client,
    "default",
    ()=>__TURBOPACK__default__export__,
    "getRenderStatus",
    ()=>getRenderStatus,
    "healthCheck",
    ()=>healthCheck,
    "loadProject",
    ()=>loadProject,
    "saveTimeline",
    ()=>saveTimeline,
    "startRender",
    ()=>startRender,
    "triggerRender",
    ()=>triggerRender
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/axios [external] (axios, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:8000/api") ?? "http://localhost:8000/api";
const client = __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__["default"].create({
    baseURL: API_BASE,
    timeout: 30_000,
    headers: {
        "Content-Type": "application/json"
    }
});
async function loadProject(projectId) {
    return client.get(`/timeline/${projectId}`).then((r)=>r.data);
}
async function saveTimeline(projectId, timeline) {
    return client.post(`/timeline/${projectId}`, {
        timeline
    }).then((r)=>r.data);
}
async function startRender(projectId, options = {}) {
    return client.post(`/render/${projectId}`, {
        ...options
    }).then((r)=>r.data);
}
async function getRenderStatus(jobId) {
    return client.get(`/render/status/${jobId}`).then((r)=>r.data);
}
async function healthCheck() {
    return client.get(`/healthz`).then((r)=>r.data);
}
const __TURBOPACK__default__export__ = client;
const triggerRender = startRender;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/ai-video-editor/frontend/src/components/Editor/Exporter.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Exporter
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/lib/api.ts [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
function Exporter({ projectId, onQueued, watermark = true, setError, setToast }) {
    const handleExport = async ()=>{
        try {
            const payload = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["triggerRender"])(projectId, {
                watermark
            });
            if (payload?.job_id) {
                onQueued?.(payload.job_id);
                setToast?.("Render job queued");
            } else {
                setError?.("No job id returned from render endpoint");
            }
        } catch (err) {
            setError?.(err.message);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
            className: "px-3 py-2 border rounded",
            onClick: handleExport,
            children: "Start Export"
        }, void 0, false, {
            fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Exporter.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/ai-video-editor/frontend/src/components/Editor/Exporter.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/zustand [external] (zustand, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("zustand");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/ai-video-editor/frontend/src/stores/editorStore.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "useEditorStore",
    ()=>useEditorStore
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$zustand__$5b$external$5d$__$28$zustand$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/zustand [external] (zustand, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$zustand__$5b$external$5d$__$28$zustand$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$zustand__$5b$external$5d$__$28$zustand$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const useEditorStore = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$zustand__$5b$external$5d$__$28$zustand$2c$__esm_import$29$__["create"])((set)=>({
        project: null,
        selectedSegmentIndex: 0,
        saving: false,
        rendering: false,
        jobId: null,
        renderStatus: null,
        toast: null,
        error: null,
        setProject: (p)=>set(()=>({
                    project: p
                })),
        setSelectedSegmentIndex: (i)=>set(()=>({
                    selectedSegmentIndex: i
                })),
        setSaving: (v)=>set(()=>({
                    saving: v
                })),
        setRendering: (v)=>set(()=>({
                    rendering: v
                })),
        setJobId: (id)=>set(()=>({
                    jobId: id
                })),
        setRenderStatus: (s)=>set(()=>({
                    renderStatus: s
                })),
        setToast: (t)=>set(()=>({
                    toast: t
                })),
        setError: (e)=>set(()=>({
                    error: e
                }))
    }));
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/ai-video-editor/frontend/src/pages/editor.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Editor
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$ChatDrawer$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/components/ChatDrawer.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$SettingsModal$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/components/SettingsModal.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$ToolsPanel$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/components/ToolsPanel.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$VideoPreview$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/components/Editor/VideoPreview.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$Timeline$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/components/Editor/Timeline.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$EffectsPanel$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/components/Editor/EffectsPanel.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$Exporter$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/components/Editor/Exporter.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$stores$2f$editorStore$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/stores/editorStore.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ai-video-editor/frontend/src/lib/api.ts [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$Exporter$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$stores$2f$editorStore$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$Exporter$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$stores$2f$editorStore$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
;
;
;
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:8000/api") ?? "http://localhost:8000/api";
function Editor() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { projectId } = router.query;
    const { project, selectedSegmentIndex, saving, rendering, jobId, renderStatus, toast, error, setProject, setSelectedSegmentIndex, setSaving, setRendering, setJobId, setRenderStatus, setToast, setError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$stores$2f$editorStore$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["useEditorStore"])();
    const [toolsPanelOpen, setToolsPanelOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [chatOpen, setChatOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [settingsOpen, setSettingsOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [modelSettings, setModelSettings] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        whisperModel: "small.en",
        chatBackend: "stub",
        hfModel: "distilgpt2"
    });
    const [uploadingFile, setUploadingFile] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [watermarkEnabled, setWatermarkEnabled] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [redisHealthy, setRedisHealthy] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    // Load project on mount if projectId is provided
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const loadProjectData = async (id)=>{
            try {
                const proj = await __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["loadProject"](id);
                setProject(proj);
            } catch (err) {
                setError(err.message);
            }
        };
        if (projectId && typeof projectId === "string") {
            loadProjectData(parseInt(projectId, 10));
        }
    }, [
        projectId,
        setProject,
        setError
    ]);
    // Check Redis health on mount
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const checkHealth = async ()=>{
            try {
                const health = await __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["healthCheck"]();
                setRedisHealthy(health.redis === true);
            } catch  {
                setRedisHealthy(false);
            }
        };
        checkHealth();
    }, []);
    // Poll render status when rendering
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!rendering || !jobId) return;
        const interval = setInterval(async ()=>{
            try {
                const status = await __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["getRenderStatus"](jobId);
                setRenderStatus(status);
                if (status.status === "finished") {
                    setRendering(false);
                    setToast("Render complete!");
                    if (status.output_url) {
                        setToast(`Render complete! Download: ${status.output_url}`);
                    }
                } else if (status.status === "failed") {
                    setRendering(false);
                    setError(status.error || "Render failed");
                }
            } catch (err) {
                setError(err.message);
                setRendering(false);
            }
        }, 2000);
        return ()=>clearInterval(interval);
    }, [
        rendering,
        jobId,
        setRenderStatus,
        setRendering,
        setToast,
        setError
    ]);
    const loadProject = async (id)=>{
        try {
            const proj = await __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["loadProject"](id);
            setProject(proj);
        } catch (err) {
            setError(err.message);
        }
    };
    const handleFileUpload = async (e)=>{
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingFile(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", file.name);
            formData.append("auto_analyze", "true");
            const response = await fetch(`${API_BASE}/ingest`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            const result = await response.json();
            const newProjectId = result.project?.id;
            if (newProjectId) {
                setToast("Video uploaded successfully!");
                // Reload the project
                await loadProject(newProjectId);
                // Update URL
                router.push(`/editor?projectId=${newProjectId}`, undefined, {
                    shallow: true
                });
            }
        } catch (err) {
            setError(err.message);
        } finally{
            setUploadingFile(false);
        }
    };
    const handleSaveTimeline = async ()=>{
        if (!project) return;
        setSaving(true);
        setError(null);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["saveTimeline"](project.id, project.timeline);
            setToast("Timeline saved!");
        } catch (err) {
            setError(err.message);
        } finally{
            setSaving(false);
        }
    };
    const handleEffectsChange = (effectsStr)=>{
        if (!project) return;
        const effects = effectsStr.split(",").map((e)=>e.trim()).filter(Boolean);
        const updatedSegments = [
            ...project.timeline.segments
        ];
        updatedSegments[selectedSegmentIndex] = {
            ...updatedSegments[selectedSegmentIndex],
            effects
        };
        setProject({
            ...project,
            timeline: {
                ...project.timeline,
                segments: updatedSegments
            }
        });
    };
    const handleRenderQueued = (newJobId)=>{
        setJobId(newJobId);
        setRendering(true);
    };
    const handleToolApply = (tool, result)=>{
        if (!project) return;
        // Apply tool results to the timeline
        if (tool === "transcribe" && result.captions) {
            setProject({
                ...project,
                timeline: {
                    ...project.timeline,
                    captions: result.captions
                }
            });
            setToast("Captions applied to timeline");
        } else if (tool === "beats" && result.beats) {
            setProject({
                ...project,
                timeline: {
                    ...project.timeline,
                    beats: result.beats,
                    tempo: result.tempo || project.timeline.tempo
                }
            });
            setToast("Beats applied to timeline");
        }
        setToolsPanelOpen(false);
    };
    const selectedSegment = project?.timeline.segments[selectedSegmentIndex];
    const videoUrl = project?.asset?.ingest_url;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-slate-900 text-slate-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("header", {
                className: "bg-slate-950 border-b border-slate-800 px-6 py-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                className: "text-2xl font-bold",
                                children: "AI Video Editor"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                lineNumber: 235,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setSettingsOpen(true),
                                        className: "px-3 py-2 border border-slate-700 rounded hover:border-slate-600",
                                        children: "Settings"
                                    }, void 0, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                        lineNumber: 237,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setChatOpen(true),
                                        className: "px-3 py-2 border border-slate-700 rounded hover:border-slate-600",
                                        children: "Chat"
                                    }, void 0, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                        lineNumber: 243,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setToolsPanelOpen(true),
                                        className: "px-3 py-2 bg-emerald-600 rounded hover:bg-emerald-700",
                                        children: "AI Tools"
                                    }, void 0, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                        lineNumber: 249,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                lineNumber: 236,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                        lineNumber: 234,
                        columnNumber: 9
                    }, this),
                    project && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "mt-2 text-sm text-slate-400",
                        children: [
                            "Project: ",
                            project.title,
                            " (ID: ",
                            project.id,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                        lineNumber: 258,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                lineNumber: 233,
                columnNumber: 7
            }, this),
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "fixed top-20 right-6 bg-emerald-600 text-white px-4 py-3 rounded shadow-lg z-50",
                children: [
                    toast,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        onClick: ()=>setToast(null),
                        className: "ml-4 text-white/80 hover:text-white",
                        children: "✕"
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                        lineNumber: 268,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                lineNumber: 266,
                columnNumber: 9
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "fixed top-20 right-6 bg-red-600 text-white px-4 py-3 rounded shadow-lg z-50",
                children: [
                    error,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        onClick: ()=>setError(null),
                        className: "ml-4 text-white/80 hover:text-white",
                        children: "✕"
                    }, void 0, false, {
                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                        lineNumber: 278,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                lineNumber: 276,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                className: "p-6",
                children: !project ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "max-w-2xl mx-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "text-xl font-semibold mb-4",
                                children: "Upload a Video to Get Started"
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                lineNumber: 289,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "text-slate-400 mb-6",
                                children: "Upload a video file to begin editing. AI will automatically analyze it for transcription and beats."
                            }, void 0, false, {
                                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                lineNumber: 290,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                className: "inline-block",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "file",
                                        accept: "video/*",
                                        onChange: handleFileUpload,
                                        disabled: uploadingFile,
                                        className: "hidden"
                                    }, void 0, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                        lineNumber: 294,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "px-6 py-3 bg-emerald-600 rounded hover:bg-emerald-700 cursor-pointer inline-block",
                                        children: uploadingFile ? "Uploading..." : "Choose Video File"
                                    }, void 0, false, {
                                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                        lineNumber: 301,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                lineNumber: 293,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                        lineNumber: 288,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                    lineNumber: 287,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "lg:col-span-2 space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$VideoPreview$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    videoSrc: videoUrl
                                }, void 0, false, {
                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                    lineNumber: 311,
                                    columnNumber: 15
                                }, this),
                                project.timeline.segments.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$Timeline$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    segments: project.timeline.segments,
                                    selectedIndex: selectedSegmentIndex,
                                    onSelect: setSelectedSegmentIndex
                                }, void 0, false, {
                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                    lineNumber: 315,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "flex gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            onClick: handleSaveTimeline,
                                            disabled: saving,
                                            className: "px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50",
                                            children: saving ? "Saving..." : "Save Timeline"
                                        }, void 0, false, {
                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                            lineNumber: 324,
                                            columnNumber: 17
                                        }, this),
                                        project && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$Exporter$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            projectId: project.id,
                                            onQueued: handleRenderQueued,
                                            watermark: watermarkEnabled,
                                            setError: setError,
                                            setToast: setToast
                                        }, void 0, false, {
                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                            lineNumber: 332,
                                            columnNumber: 19
                                        }, this),
                                        rendering && renderStatus && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "px-4 py-2 bg-slate-800 rounded",
                                            children: [
                                                "Rendering: ",
                                                Math.round(renderStatus.progress * 100),
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                            lineNumber: 341,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                    lineNumber: 323,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                            lineNumber: 310,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: [
                                selectedSegment && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "bg-slate-800 border border-slate-700 rounded p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                    className: "text-lg font-semibold mb-2",
                                                    children: [
                                                        "Segment: ",
                                                        selectedSegment.name
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                    lineNumber: 353,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-slate-400",
                                                    children: [
                                                        selectedSegment.start.toFixed(2),
                                                        "s - ",
                                                        selectedSegment.end.toFixed(2),
                                                        "s"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                    lineNumber: 354,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                            lineNumber: 352,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$Editor$2f$EffectsPanel$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            effects: selectedSegment.effects,
                                            onChange: handleEffectsChange
                                        }, void 0, false, {
                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                            lineNumber: 359,
                                            columnNumber: 19
                                        }, this),
                                        selectedSegment.captions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "bg-slate-800 border border-slate-700 rounded p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h4", {
                                                    className: "text-sm font-semibold mb-2",
                                                    children: "Captions"
                                                }, void 0, false, {
                                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                    lineNumber: 366,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                                    className: "text-xs space-y-1",
                                                    children: selectedSegment.captions.map((cap, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                            className: "text-slate-400",
                                                            children: [
                                                                "[",
                                                                cap.start.toFixed(1),
                                                                "s] ",
                                                                cap.text
                                                            ]
                                                        }, i, true, {
                                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                            lineNumber: 369,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                    lineNumber: 367,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                            lineNumber: 365,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "bg-slate-800 border border-slate-700 rounded p-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h4", {
                                            className: "text-sm font-semibold mb-2",
                                            children: "Project Info"
                                        }, void 0, false, {
                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                            lineNumber: 381,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("dl", {
                                            className: "text-xs space-y-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("dt", {
                                                            className: "text-slate-400",
                                                            children: "Status:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                            lineNumber: 384,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("dd", {
                                                            children: project.status
                                                        }, void 0, false, {
                                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                            lineNumber: 385,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                    lineNumber: 383,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("dt", {
                                                            className: "text-slate-400",
                                                            children: "Segments:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                            lineNumber: 388,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("dd", {
                                                            children: project.timeline.segments.length
                                                        }, void 0, false, {
                                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                            lineNumber: 389,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                    lineNumber: 387,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("dt", {
                                                            className: "text-slate-400",
                                                            children: "Tempo:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                            lineNumber: 392,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("dd", {
                                                            children: [
                                                                project.timeline.tempo.toFixed(1),
                                                                " BPM"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                            lineNumber: 393,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                                    lineNumber: 391,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                            lineNumber: 382,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                                    lineNumber: 380,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                            lineNumber: 349,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                    lineNumber: 308,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                lineNumber: 285,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$ToolsPanel$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["ToolsPanel"], {
                open: toolsPanelOpen,
                apiBase: API_BASE,
                assetPath: project?.asset?.path,
                onClose: ()=>setToolsPanelOpen(false),
                onApply: handleToolApply,
                modelSettings: modelSettings
            }, void 0, false, {
                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                lineNumber: 403,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$ChatDrawer$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["ChatDrawer"], {
                open: chatOpen,
                onClose: ()=>setChatOpen(false),
                apiBase: API_BASE,
                modelSettings: modelSettings
            }, void 0, false, {
                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                lineNumber: 412,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$ai$2d$video$2d$editor$2f$frontend$2f$src$2f$components$2f$SettingsModal$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["SettingsModal"], {
                open: settingsOpen,
                watermarkEnabled: watermarkEnabled,
                onWatermarkChange: setWatermarkEnabled,
                consent: project?.consent,
                redisHealthy: redisHealthy,
                onClose: ()=>setSettingsOpen(false)
            }, void 0, false, {
                fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
                lineNumber: 419,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/ai-video-editor/frontend/src/pages/editor.tsx",
        lineNumber: 231,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e659dba8._.js.map