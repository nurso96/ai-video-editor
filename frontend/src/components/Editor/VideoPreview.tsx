import React, { memo, useEffect, useRef } from "react";

type Props = {
  videoSrc: string | null | undefined;
};

const VideoPreview: React.FC<Props> = ({ videoSrc }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      try {
        videoRef.current.preload = "metadata";
      } catch {
        /* noop */
      }
    }
  }, [videoSrc]);

  if (!videoSrc) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        Upload a clip to preview the timeline.
      </div>
    );
  }

  return (
    <div className="w-full">
      <video
        ref={videoRef}
        controls
        className="w-full rounded"
        src={videoSrc}
        data-testid="video-preview"
      />
    </div>
  );
};

export default memo(VideoPreview);