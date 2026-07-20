import { useCallback, useEffect, useRef, useState } from "react";

export type CameraState = {
  stream: MediaStream | null;
  error: string | null;
  ready: boolean;
};

export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<CameraState>({
    stream: null,
    error: null,
    ready: false,
  });
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState({ stream: null, error: null, ready: false });
  }, [videoRef]);

  const start = useCallback(async () => {
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");
      video.srcObject = stream;
      await video.play();
      setState({ stream, error: null, ready: true });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Impossible d'accéder à la caméra";
      setState({ stream: null, error: message, ready: false });
    }
  }, [stop, videoRef]);

  useEffect(() => () => stop(), [stop]);

  return { ...state, start, stop };
}
