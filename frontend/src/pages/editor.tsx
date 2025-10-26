import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import type { CaptionSegment, TimelineSegment } from "../types";

import { ChatDrawer } from "../components/ChatDrawer";
import { ModelSelect, type ModelSettings } from "../components/ModelSelect";
import { SettingsModal } from "../components/SettingsModal";
import { ToolsPanel } from "../components/ToolsPanel";
import VideoPreview from "../components/Editor/VideoPreview";
import Timeline from "../components/Editor/Timeline";
import EffectsPanel from "../components/Editor/EffectsPanel";
import Exporter from "../components/Editor/Exporter";
import { useEditorStore } from "../stores/editorStore";
import * as api from "../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

export default function Editor() {
  const router = useRouter();
  const { projectId } = router.query;

  const {
    project,
    selectedSegmentIndex,
    saving,
    rendering,
    jobId,
    renderStatus,
    toast,
    error,
    setProject,
    setSelectedSegmentIndex,
    setSaving,
    setRendering,
    setJobId,
    setRenderStatus,
    setToast,
    setError,
  } = useEditorStore();

  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    whisperModel: "small.en",
    chatBackend: "stub",
    hfModel: "distilgpt2",
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [redisHealthy, setRedisHealthy] = useState(false);

  // Load project on mount if projectId is provided
  useEffect(() => {
    const loadProjectData = async (id: number) => {
      try {
        const proj = await api.loadProject(id);
        setProject(proj);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    if (projectId && typeof projectId === "string") {
      loadProjectData(parseInt(projectId, 10));
    }
  }, [projectId, setProject, setError]);

  // Check Redis health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await api.healthCheck();
        setRedisHealthy(health.redis === true);
      } catch {
        setRedisHealthy(false);
      }
    };
    checkHealth();
  }, []);

  // Poll render status when rendering
  useEffect(() => {
    if (!rendering || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const status = await api.getRenderStatus(jobId);
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
        setError((err as Error).message);
        setRendering(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [rendering, jobId, setRenderStatus, setRendering, setToast, setError]);

  const loadProject = async (id: number) => {
    try {
      const proj = await api.loadProject(id);
      setProject(proj);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
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
        body: formData,
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
        router.push(`/editor?projectId=${newProjectId}`, undefined, { shallow: true });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveTimeline = async () => {
    if (!project) return;

    setSaving(true);
    setError(null);

    try {
      await api.saveTimeline(project.id, project.timeline);
      setToast("Timeline saved!");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleEffectsChange = (effectsStr: string) => {
    if (!project) return;

    const effects = effectsStr.split(",").map((e) => e.trim()).filter(Boolean);
    const updatedSegments = [...project.timeline.segments];
    updatedSegments[selectedSegmentIndex] = {
      ...updatedSegments[selectedSegmentIndex],
      effects,
    };

    setProject({
      ...project,
      timeline: {
        ...project.timeline,
        segments: updatedSegments,
      },
    });
  };

  const handleRenderQueued = (newJobId: string) => {
    setJobId(newJobId);
    setRendering(true);
  };

  const handleToolApply = (tool: string, result: any) => {
    if (!project) return;

    // Apply tool results to the timeline
    if (tool === "transcribe" && result.captions) {
      setProject({
        ...project,
        timeline: {
          ...project.timeline,
          captions: result.captions,
        },
      });
      setToast("Captions applied to timeline");
    } else if (tool === "beats" && result.beats) {
      setProject({
        ...project,
        timeline: {
          ...project.timeline,
          beats: result.beats,
          tempo: result.tempo || project.timeline.tempo,
        },
      });
      setToast("Beats applied to timeline");
    }

    setToolsPanelOpen(false);
  };

  const selectedSegment = project?.timeline.segments[selectedSegmentIndex];
  const videoUrl = project?.asset?.ingest_url;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Video Editor</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-3 py-2 border border-slate-700 rounded hover:border-slate-600"
            >
              Settings
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="px-3 py-2 border border-slate-700 rounded hover:border-slate-600"
            >
              Chat
            </button>
            <button
              onClick={() => setToolsPanelOpen(true)}
              className="px-3 py-2 bg-emerald-600 rounded hover:bg-emerald-700"
            >
              AI Tools
            </button>
          </div>
        </div>
        {project && (
          <div className="mt-2 text-sm text-slate-400">
            Project: {project.title} (ID: {project.id})
          </div>
        )}
      </header>

      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-20 right-6 bg-emerald-600 text-white px-4 py-3 rounded shadow-lg z-50">
          {toast}
          <button onClick={() => setToast(null)} className="ml-4 text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Error notifications */}
      {error && (
        <div className="fixed top-20 right-6 bg-red-600 text-white px-4 py-3 rounded shadow-lg z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="p-6">
        {!project ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-12 text-center">
              <h2 className="text-xl font-semibold mb-4">Upload a Video to Get Started</h2>
              <p className="text-slate-400 mb-6">
                Upload a video file to begin editing. AI will automatically analyze it for transcription and beats.
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                />
                <span className="px-6 py-3 bg-emerald-600 rounded hover:bg-emerald-700 cursor-pointer inline-block">
                  {uploadingFile ? "Uploading..." : "Choose Video File"}
                </span>
              </label>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Video preview */}
            <div className="lg:col-span-2 space-y-4">
              <VideoPreview videoSrc={videoUrl} />

              {/* Timeline */}
              {project.timeline.segments.length > 0 && (
                <Timeline
                  segments={project.timeline.segments}
                  selectedIndex={selectedSegmentIndex}
                  onSelect={setSelectedSegmentIndex}
                />
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveTimeline}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Timeline"}
                </button>
                {project && (
                  <Exporter
                    projectId={project.id}
                    onQueued={handleRenderQueued}
                    watermark={watermarkEnabled}
                    setError={setError}
                    setToast={setToast}
                  />
                )}
                {rendering && renderStatus && (
                  <div className="px-4 py-2 bg-slate-800 rounded">
                    Rendering: {Math.round(renderStatus.progress * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Segment details */}
            <div className="space-y-4">
              {selectedSegment && (
                <>
                  <div className="bg-slate-800 border border-slate-700 rounded p-4">
                    <h3 className="text-lg font-semibold mb-2">Segment: {selectedSegment.name}</h3>
                    <p className="text-sm text-slate-400">
                      {selectedSegment.start.toFixed(2)}s - {selectedSegment.end.toFixed(2)}s
                    </p>
                  </div>

                  <EffectsPanel
                    effects={selectedSegment.effects}
                    onChange={handleEffectsChange}
                  />

                  {selectedSegment.captions.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded p-4">
                      <h4 className="text-sm font-semibold mb-2">Captions</h4>
                      <ul className="text-xs space-y-1">
                        {selectedSegment.captions.map((cap, i) => (
                          <li key={i} className="text-slate-400">
                            [{cap.start.toFixed(1)}s] {cap.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* Project info */}
              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <h4 className="text-sm font-semibold mb-2">Project Info</h4>
                <dl className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Status:</dt>
                    <dd>{project.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Segments:</dt>
                    <dd>{project.timeline.segments.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Tempo:</dt>
                    <dd>{project.timeline.tempo.toFixed(1)} BPM</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals & Panels */}
      <ToolsPanel
        open={toolsPanelOpen}
        apiBase={API_BASE}
        assetPath={project?.asset?.path}
        onClose={() => setToolsPanelOpen(false)}
        onApply={handleToolApply}
        modelSettings={modelSettings}
      />

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        apiBase={API_BASE}
        modelSettings={modelSettings}
      />

      <SettingsModal
        open={settingsOpen}
        watermarkEnabled={watermarkEnabled}
        onWatermarkChange={setWatermarkEnabled}
        consent={project?.consent}
        redisHealthy={redisHealthy}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
