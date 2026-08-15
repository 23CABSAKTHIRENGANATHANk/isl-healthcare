/**
 * Camera Service — ISL Setu
 * Production Camera Pipeline with Multi-Tier Resolution Fallback (1280x720 -> 960x540 -> 640x480 -> Default),
 * Metadata Ready Await, Singleton Stream Management, and Comprehensive Track Cleanup.
 */

export type CameraErrorState =
  | "CAMERA_PERMISSION_DENIED"
  | "CAMERA_UNAVAILABLE"
  | "CAMERA_IN_USE"
  | "BROWSER_UNSUPPORTED"
  | "UNKNOWN_ERROR";

export interface CameraInitOptions {
  deviceId?: string;
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
  frameRate?: number;
}

export interface CameraInitResult {
  success: boolean;
  stream?: MediaStream;
  actualWidth?: number;
  actualHeight?: number;
  errorState?: CameraErrorState;
  errorMessage?: string;
}

// Active singleton stream reference to prevent orphan duplicate camera streams
let activeGlobalStream: MediaStream | null = null;

const RESOLUTION_LADDER = [
  { width: 1280, height: 720, label: "720p HD" },
  { width: 960, height: 540, label: "qHD" },
  { width: 640, height: 480, label: "VGA" },
];

/**
 * Initializes the camera stream with progressive resolution fallback.
 * Attempts 1280x720 -> 960x540 -> 640x480 -> default constraints.
 */
export async function initializeCameraStream(
  videoElement: HTMLVideoElement | null,
  options: CameraInitOptions = {}
): Promise<CameraInitResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      success: false,
      errorState: "BROWSER_UNSUPPORTED",
      errorMessage: "Camera access is not supported by this browser or environment.",
    };
  }

  // Teardown any previously active orphan stream
  if (activeGlobalStream) {
    stopCameraStream(activeGlobalStream, null);
    activeGlobalStream = null;
  }

  const {
    deviceId,
    facingMode = "user",
    width = 1280,
    height = 720,
    frameRate = 30,
  } = options;

  const candidateResolutions = [
    { width, height },
    ...RESOLUTION_LADDER.filter((r) => r.width !== width || r.height !== height),
  ];

  let stream: MediaStream | null = null;
  let lastError: any = null;

  // Try each resolution in the fallback ladder
  for (const res of candidateResolutions) {
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: res.width },
              height: { ideal: res.height },
              frameRate: { ideal: frameRate, max: frameRate },
            }
          : {
              facingMode,
              width: { ideal: res.width },
              height: { ideal: res.height },
              frameRate: { ideal: frameRate, max: frameRate },
            },
        audio: false,
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stream) break;
    } catch (err: any) {
      lastError = err;
      // If permission is denied or in use, don't keep retrying resolution ladder
      if (
        err?.name === "NotAllowedError" ||
        err?.name === "SecurityError" ||
        err?.name === "NotReadableError"
      ) {
        break;
      }
    }
  }

  // Ultimate fallback: request video: true without specific dimensions
  if (!stream) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode },
        audio: false,
      });
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!stream) {
    const err = lastError as DOMException;
    let errorState: CameraErrorState = "UNKNOWN_ERROR";
    let errorMessage = "Could not initialize camera stream. Please try again.";

    if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
      errorState = "CAMERA_PERMISSION_DENIED";
      errorMessage =
        "Camera permission was denied. Allow camera access in your browser settings and try again.";
    } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
      errorState = "CAMERA_UNAVAILABLE";
      errorMessage = "No camera hardware was detected on your device.";
    } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
      errorState = "CAMERA_IN_USE";
      errorMessage = "Camera is currently in use by another application. Close it and retry.";
    }

    return { success: false, errorState, errorMessage };
  }

  activeGlobalStream = stream;

  let actualWidth = 640;
  let actualHeight = 480;

  if (videoElement) {
    videoElement.srcObject = stream;

    // Wait for video metadata to be ready
    await new Promise<void>((resolve) => {
      if (videoElement.readyState >= 1 && videoElement.videoWidth > 0) {
        actualWidth = videoElement.videoWidth;
        actualHeight = videoElement.videoHeight;
        resolve();
        return;
      }

      const onLoaded = () => {
        videoElement.removeEventListener("loadedmetadata", onLoaded);
        actualWidth = videoElement.videoWidth;
        actualHeight = videoElement.videoHeight;
        resolve();
      };
      videoElement.addEventListener("loadedmetadata", onLoaded);

      // Safety fallback timeout for loadedmetadata event
      setTimeout(() => {
        videoElement.removeEventListener("loadedmetadata", onLoaded);
        actualWidth = videoElement.videoWidth || 640;
        actualHeight = videoElement.videoHeight || 480;
        resolve();
      }, 1500);
    });

    await videoElement.play().catch(() => undefined);
  }

  return {
    success: true,
    stream,
    actualWidth,
    actualHeight,
  };
}

/**
 * Safely stops all tracks on a MediaStream and resets video element source.
 */
export function stopCameraStream(
  stream: MediaStream | null | undefined,
  videoElement: HTMLVideoElement | null = null
): void {
  const targetStream = stream || activeGlobalStream;
  if (targetStream) {
    try {
      targetStream.getTracks().forEach((track) => {
        track.stop();
        targetStream.removeTrack(track);
      });
    } catch {
      // Ignore cleanup error
    }
  }

  if (activeGlobalStream === targetStream) {
    activeGlobalStream = null;
  }

  if (videoElement) {
    try {
      videoElement.pause();
      videoElement.srcObject = null;
    } catch {
      // Ignore video pause error
    }
  }
}
