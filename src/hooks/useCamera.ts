import { useCallback, useEffect, useRef, useState } from "react";
import {
  cameraConstraints,
  isMobilePerfProfile,
} from "@/lib/devicePerf";

export type CameraState = {
  stream: MediaStream | null;
  error: string | null;
  ready: boolean;
  width: number;
  height: number;
};

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
      const mobile = isMobilePerfProfile();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: cameraConstraints(mobile),
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings() ?? {};

      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");
      video.srcObject = stream;
      // iOS : playsInline déjà sur l’élément ; aide le decode
      video.setAttribute("playsinline", "true");
      await video.play();

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
        width: video.videoWidth || settings.width || 0,
        height: video.videoHeight || settings.height || 0,
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
