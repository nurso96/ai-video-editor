import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

export const client = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function loadProject(projectId: number) {
  return client.get(`/timeline/${projectId}`).then((r) => r.data);
}

export async function saveTimeline(projectId: number, timeline: Record<string, any>) {
  return client.post(`/timeline/${projectId}`, { timeline }).then((r) => r.data);
}

export async function startRender(projectId: number, options: { watermark?: boolean } = {}) {
  return client.post(`/render/${projectId}`, { ...options }).then((r) => r.data);
}

export async function getRenderStatus(jobId: string) {
  return client.get(`/render/status/${jobId}`).then((r) => r.data);
}

export async function healthCheck() {
  return client.get(`/healthz`).then((r) => r.data);
}

// compatibility alias (some components call triggerRender)
export const triggerRender = startRender;

export default client;
