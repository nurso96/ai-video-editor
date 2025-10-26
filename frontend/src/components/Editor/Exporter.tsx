import React from "react";
import { triggerRender } from "../../lib/api";

type Props = {
  projectId: number;
  onQueued?: (jobId: string) => void;
  watermark?: boolean;
  setError?: (e: string | null) => void;
  setToast?: (m: string | null) => void;
};

export default function Exporter({ projectId, onQueued, watermark = true, setError, setToast }: Props) {
  const handleExport = async () => {
    try {
      const payload = await triggerRender(projectId, { watermark });
      if (payload?.job_id) {
        onQueued?.(payload.job_id);
        setToast?.("Render job queued");
      } else {
        setError?.("No job id returned from render endpoint");
      }
    } catch (err) {
      setError?.((err as Error).message);
    }
  };

  return (
    <div>
      <button className="px-3 py-2 border rounded" onClick={handleExport}>Start Export</button>
    </div>
  );
}
