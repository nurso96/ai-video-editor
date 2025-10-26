export type CaptionSegment = {
  text: string;
  start: number;
  end: number;
};

export type SfxMarker = {
  name?: string;
  path?: string;
  duration?: number;
} | null;

export type TimelineSegment = {
  name: string;
  start: number;
  end: number;
  effects: string[];
  beats: number[];
  captions: CaptionSegment[];
  sfx?: SfxMarker;
  energy_peaks?: number[];
};

export type TimelineData = {
  asset: Record<string, unknown>;
  beats: number[];
  tempo: number;
  energy_peaks?: number[];
  captions: CaptionSegment[];
  segments: TimelineSegment[];
  template_name?: string;
};

export type ConsentStatus = {
  has_checkbox: boolean;
  document_url?: string | null;
};

export type ProjectDetail = {
  id: number;
  title: string;
  status: string;
  asset: {
    id: number;
    path: string;
    ingest_url?: string | null;
    thumbnail_url?: string | null;
  };
  consent?: ConsentStatus | null;
  timeline: TimelineData;
};

export type RenderStatusPayload = {
  id: string;
  status: string;
  progress: number;
  logs: string[];
  result?: string | null;
  output_url?: string | null;
  error?: string | null;
};