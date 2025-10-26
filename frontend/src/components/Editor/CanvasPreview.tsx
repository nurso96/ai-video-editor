import React, { useRef, useEffect } from "react";

type Props = {
  src?: string | null;
  poster?: string | null;
  className?: string;
};

export default function CanvasPreview({ src, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // small place to add WebGL / WebCodecs integrations later
  }, [src]);

  if (!src) {
    return <div className="h-64 flex items-center justify-center text-slate-500">Upload a clip to preview the timeline.</div>;
  }

  return (
    <div className={className}>
      <video ref={videoRef} controls className="w-full rounded" src={src} poster={poster ?? undefined} />
    </div>
  );
}
