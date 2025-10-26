import { create } from "zustand";
import type { ProjectDetail, RenderStatusPayload } from "../types";

type EditorState = {
  project: ProjectDetail | null;
  selectedSegmentIndex: number;
  saving: boolean;
  rendering: boolean;
  jobId: string | null;
  renderStatus: RenderStatusPayload | null;
  toast: string | null;
  error: string | null;
  setProject: (p: ProjectDetail | null) => void;
  setSelectedSegmentIndex: (i: number) => void;
  setSaving: (v: boolean) => void;
  setRendering: (v: boolean) => void;
  setJobId: (id: string | null) => void;
  setRenderStatus: (s: RenderStatusPayload | null) => void;
  setToast: (t: string | null) => void;
  setError: (e: string | null) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  project: null,
  selectedSegmentIndex: 0,
  saving: false,
  rendering: false,
  jobId: null,
  renderStatus: null,
  toast: null,
  error: null,
  setProject: (p) => set(() => ({ project: p })),
  setSelectedSegmentIndex: (i) => set(() => ({ selectedSegmentIndex: i })),
  setSaving: (v) => set(() => ({ saving: v })),
  setRendering: (v) => set(() => ({ rendering: v })),
  setJobId: (id) => set(() => ({ jobId: id })),
  setRenderStatus: (s) => set(() => ({ renderStatus: s })),
  setToast: (t) => set(() => ({ toast: t })),
  setError: (e) => set(() => ({ error: e })),
}));