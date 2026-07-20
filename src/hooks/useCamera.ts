import { useCallback, useEffect, useRef, useState } from "react";

export type CameraState = {
  stream: MediaStream | null;
  error: string | null;
  ready: boolean;
  width: number;
  height: number;
};

async function requestMaxResolution(
  track: MediaStreamTrack,
): Promise<{ width: number; height: number }> {
  const caps = track.getCapabilities?.() as
    | { width?: { max?: number }; height?: { max?: number } }
    | undefined;

  const maxW = caps?.width?.max;
  const maxH = caps?.height?.max;

  if (maxW && maxH) {
    try {
      await track.applyConstraints({
        width: { ideal: maxW },
        height: { ideal: maxH },
      });
    } catch {
      // ignore — keep whatever the browser negotiated
    }
  }

  const settings = track.getSettings();
  return {
    width: settings.width ?? 0,
    height: settings.height ?? 0,
  };
}

export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<CameraState>({
    stream: null,
    error: null,
    ready: false,
    width: 0,
    height: 0,
  });
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState({
      stream: null,
      error: null,
      ready: false,
      width: 0,
      height: 0,
    });
  }, [videoRef]);

  const start = useCallback(async () => {
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 30 },
        },
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const dims = track
        ? await requestMaxResolution(track)
        : { width: 0, height: 0 };

      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");
      video.srcObject = stream;
      await video.play();

      // Attendre les dimensions natives du flux
      await new Promise<void>((resolve) => {
        if (video.videoWidth > 0) {
          resolve();
          return;
        }
        const onMeta = () => {
          video.removeEventListener("loadedmetadata", onMeta);
          resolve();
        };
        video.addEventListener("loadedmetadata", onMeta);
      });

      setState({
        stream,
        error: null,
        ready: true,
        width: video.videoWidth || dims.width,
        height: video.videoHeight || dims.height,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Impossible d'accéder à la caméra";
      setState({
        stream: null,
        error: message,
        ready: false,
        width: 0,
        height: 0,
      });
    }
  }, [stop, videoRef]);

  useEffect(() => () => stop(), [stop]);

  return { ...state, start, stop };
}
