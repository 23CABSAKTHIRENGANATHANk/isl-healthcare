import { useCallback, useEffect, useRef, useState } from "react";
import { initializeCameraStream, stopCameraStream } from "@/services/camera.service";

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
    stopCameraStream(streamRef.current, videoRef.current);
    streamRef.current = null;
    setStatus("idle");
    setMessage("");
  }, []);

  const start = useCallback(async (deviceIdToUse?: string) => {
    const devId = deviceIdToUse || selectedDeviceId;
    setStatus("requesting");
    setMessage("");

    // Stop current stream if already running
    if (streamRef.current) {
      stopCameraStream(streamRef.current, videoRef.current);
      streamRef.current = null;
    }

    const res = await initializeCameraStream(videoRef.current, {
      deviceId: devId,
      facingMode: "user",
      width: 1280,
      height: 720,
      frameRate: 30,
    });

    if (res.success && res.stream) {
      streamRef.current = res.stream;
      setStatus("ready");
      void refreshDevices();
    } else {
      if (res.errorState === "CAMERA_PERMISSION_DENIED") {
        setStatus("denied");
      } else if (res.errorState === "CAMERA_UNAVAILABLE") {
        setStatus("unavailable");
      } else {
        setStatus("error");
      }
      setMessage(res.errorMessage || "Camera access failed. Please try again.");
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

  // Ensure video element always has active stream attached across tab switches
  useEffect(() => {
    if (status === "ready" && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  });

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
