import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "unavailable" | "error";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

/**
 * Enhanced Camera Access & Accessories Hook for ISL Setu.
 * Supports multi-device selection, horizontal mirroring, low-light boost, and digital zoom.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [brightness, setBrightness] = useState<number>(100); // 100% normal, up to 180% low-light boost
  const [contrast, setContrast] = useState<number>(100);
  const [zoom, setZoom] = useState<number>(1.0); // 1.0x, 1.25x, 1.5x

  // Enumerate cameras
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (err) {
      console.warn("[useCamera] Device enumeration notice:", err);
    }
  }, [selectedDeviceId]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
    setMessage("");
  }, []);

  const start = useCallback(async (deviceIdToUse?: string) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      setMessage("No camera is available on this device or browser.");
      return;
    }

    const devId = deviceIdToUse || selectedDeviceId;
    setStatus("requesting");
    setMessage("");

    // Stop current stream if already running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: devId
          ? { deviceId: { exact: devId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      setStatus("ready");
      void refreshDevices();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setStatus("denied");
        setMessage(
          "Camera permission was blocked. Allow camera access in your browser settings to practise.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setStatus("unavailable");
        setMessage("We couldn't find a camera on this device. You can still use Demo Mode.");
      } else {
        setStatus("error");
        setMessage("The camera could not be started. Close other apps using it and try again.");
      }
    }
  }, [selectedDeviceId, refreshDevices]);

  // Switch camera device
  const switchDevice = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      if (status === "ready") {
        await start(deviceId);
      }
    },
    [status, start]
  );

  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  const toggleLowLightBoost = useCallback(() => {
    setBrightness((prev) => (prev > 110 ? 100 : 145));
    setContrast((prev) => (prev > 110 ? 100 : 125));
  }, []);

  useEffect(() => {
    void refreshDevices();
    return () => stop();
  }, [refreshDevices, stop]);

  return {
    videoRef,
    status,
    message,
    start,
    stop,
    isLive: status === "ready",
    devices,
    selectedDeviceId,
    switchDevice,
    isMirrored,
    toggleMirror,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    toggleLowLightBoost,
    zoom,
    setZoom,
    refreshDevices,
  };
}
