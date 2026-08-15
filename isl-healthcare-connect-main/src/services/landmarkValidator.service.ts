/**
 * Landmark & Hand Positioning Validator — ISL Setu
 * Validates hand size, bounding-box position, landmark visibility,
 * and environmental lighting quality before attempting sign recognition.
 */
import type { LandmarkPoint } from "./ai.service";

export type HandStatusCode =
  | "NO_HAND"
  | "HAND_TOO_SMALL"
  | "HAND_TOO_LARGE"
  | "HAND_LEFT"
  | "HAND_RIGHT"
  | "HAND_TOP"
  | "HAND_BOTTOM"
  | "HAND_CROPPED"
  | "LOW_LIGHT"
  | "MOTION_UNSTABLE"
  | "GOOD_POSITION"
  | "READY_TO_RECOGNIZE";

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  areaRatio: number;
  centerX: number;
  centerY: number;
}

export interface HandQualityResult {
  detected: boolean;
  statusCode: HandStatusCode;
  statusMessage: string;
  visibility: number;
  boundingBox?: BoundingBox;
  lightingOkay: boolean;
  lightingQuality: "GOOD" | "FAIR" | "POOR";
}

export interface ValidatorConfig {
  minHandAreaRatio?: number;
  maxHandAreaRatio?: number;
  frameMargin?: number;
  minVisibilityThreshold?: number;
}

const DEFAULT_CONFIG: Required<ValidatorConfig> = {
  minHandAreaRatio: 0.035, // Hand too far
  maxHandAreaRatio: 0.55,  // Hand too close
  frameMargin: 0.05,       // Margin around camera frame
  minVisibilityThreshold: 0.5,
};

/**
 * Calculates hand bounding box metrics normalized between 0.0 and 1.0.
 */
export function calculateHandBoundingBox(landmarks: LandmarkPoint[]): BoundingBox | null {
  if (!landmarks || landmarks.length < 21) return null;

  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;

  for (const pt of landmarks) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }

  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  const areaRatio = width * height;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  return { minX, minY, maxX, maxY, width, height, areaRatio, centerX, centerY };
}

/**
 * Evaluates overall lighting luminance and returns status rating: "GOOD", "FAIR", or "POOR".
 */
export function evaluateLightingQualityDetailed(
  videoElement: HTMLVideoElement | null
): { okay: boolean; rating: "GOOD" | "FAIR" | "POOR"; message: string } {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return { okay: true, rating: "FAIR", message: "Lighting is acceptable. Keep your hand steady." };
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { okay: true, rating: "FAIR", message: "Lighting is acceptable. Keep your hand steady." };
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalLuminance = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const avgLuminance = totalLuminance / (pixelCount / 4);

    if (avgLuminance < 35) {
      return { okay: false, rating: "POOR", message: "Lighting is too dark. Move to a brighter area." };
    } else if (avgLuminance > 240) {
      return { okay: false, rating: "POOR", message: "Extreme glare detected. Reduce direct light." };
    } else if (avgLuminance >= 65 && avgLuminance <= 210) {
      return { okay: true, rating: "GOOD", message: "Good lighting ✓" };
    } else {
      return { okay: true, rating: "FAIR", message: "Lighting is acceptable. Keep your hand steady." };
    }
  } catch {
    return { okay: true, rating: "FAIR", message: "Lighting is acceptable." };
  }
}

export function evaluateLightingQuality(videoElement: HTMLVideoElement | null): boolean {
  return evaluateLightingQualityDetailed(videoElement).okay;
}

/**
 * Validates hand position, distance, and framing against configured safety thresholds.
 */
export function validateHandQuality(
  landmarks: LandmarkPoint[] | undefined,
  videoElement: HTMLVideoElement | null = null,
  config: ValidatorConfig = {}
): HandQualityResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!landmarks || landmarks.length < 21) {
    return {
      detected: false,
      statusCode: "NO_HAND",
      statusMessage: "Place your complete hand inside the box",
      visibility: 0,
      lightingOkay: true,
      lightingQuality: "FAIR",
    };
  }

  const bbox = calculateHandBoundingBox(landmarks);
  if (!bbox) {
    return {
      detected: false,
      statusCode: "NO_HAND",
      statusMessage: "Place your complete hand inside the box",
      visibility: 0,
      lightingOkay: true,
      lightingQuality: "FAIR",
    };
  }

  // Lighting evaluation
  const lighting = evaluateLightingQualityDetailed(videoElement);
  if (!lighting.okay) {
    return {
      detected: true,
      statusCode: "LOW_LIGHT",
      statusMessage: lighting.message,
      visibility: 0.6,
      boundingBox: bbox,
      lightingOkay: false,
      lightingQuality: lighting.rating,
    };
  }

  // Check frame margins (hand cropped)
  if (
    bbox.minX < cfg.frameMargin ||
    bbox.maxX > 1 - cfg.frameMargin ||
    bbox.minY < cfg.frameMargin ||
    bbox.maxY > 1 - cfg.frameMargin
  ) {
    return {
      detected: true,
      statusCode: "HAND_CROPPED",
      statusMessage: "Keep complete hand inside box",
      visibility: 0.7,
      boundingBox: bbox,
      lightingOkay: true,
      lightingQuality: lighting.rating,
    };
  }

  // Check hand distance / size
  if (bbox.areaRatio < cfg.minHandAreaRatio) {
    return {
      detected: true,
      statusCode: "HAND_TOO_SMALL",
      statusMessage: "Move hand closer",
      visibility: 0.65,
      boundingBox: bbox,
      lightingOkay: true,
      lightingQuality: lighting.rating,
    };
  }

  if (bbox.areaRatio > cfg.maxHandAreaRatio) {
    return {
      detected: true,
      statusCode: "HAND_TOO_LARGE",
      statusMessage: "Move hand slightly farther",
      visibility: 0.75,
      boundingBox: bbox,
      lightingOkay: true,
      lightingQuality: lighting.rating,
    };
  }

  // Directional guidance based on center coordinates
  if (bbox.centerX < 0.25) {
    return {
      detected: true,
      statusCode: "HAND_LEFT",
      statusMessage: "Move hand right",
      visibility: 0.8,
      boundingBox: bbox,
      lightingOkay: true,
      lightingQuality: lighting.rating,
    };
  }
  if (bbox.centerX > 0.75) {
    return {
      detected: true,
      statusCode: "HAND_RIGHT",
      statusMessage: "Move hand left",
      visibility: 0.8,
      boundingBox: bbox,
      lightingOkay: true,
      lightingQuality: lighting.rating,
    };
  }
  if (bbox.centerY < 0.20) {
    return {
      detected: true,
      statusCode: "HAND_TOP",
      statusMessage: "Move hand down",
      visibility: 0.8,
      boundingBox: bbox,
      lightingOkay: true,
      lightingQuality: lighting.rating,
    };
  }
  if (bbox.centerY > 0.80) {
    return {
      detected: true,
      statusCode: "HAND_BOTTOM",
      statusMessage: "Move hand up",
      visibility: 0.8,
      boundingBox: bbox,
      lightingOkay: true,
      lightingQuality: lighting.rating,
    };
  }

  return {
    detected: true,
    statusCode: "GOOD_POSITION",
    statusMessage: "Good position ✓ Hold steady",
    visibility: 0.95,
    boundingBox: bbox,
    lightingOkay: true,
    lightingQuality: lighting.rating,
  };
}

/**
 * Validates that all 21 points exist, are finite numbers, and within valid range.
 */
export function validateLandmarks(landmarks: LandmarkPoint[] | undefined | null): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  for (const pt of landmarks) {
    if (
      typeof pt.x !== "number" ||
      typeof pt.y !== "number" ||
      !Number.isFinite(pt.x) ||
      !Number.isFinite(pt.y)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Normalizes 21 3D landmarks relative to wrist (Point 0) and scaled by palm span (distance 0 to 9).
 */
export function normalizeLandmarks(landmarks: LandmarkPoint[]): LandmarkPoint[] {
  if (!validateLandmarks(landmarks)) {
    return Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  }

  const wrist = { ...landmarks[0] };
  const originRel = landmarks.map((pt) => ({
    x: pt.x - wrist.x,
    y: pt.y - wrist.y,
    z: (pt.z ?? 0) - (wrist.z ?? 0),
  }));

  const palmScale = Math.hypot(originRel[9].x, originRel[9].y, originRel[9].z);
  const scale = palmScale > 1e-5 ? palmScale : 1.0;

  return originRel.map((pt) => ({
    x: pt.x / scale,
    y: pt.y / scale,
    z: pt.z / scale,
  }));
}

/**
 * Calculates hand center (centroid of palm: wrist + MCP joints).
 */
export function calculateHandCenter(landmarks: LandmarkPoint[]): { x: number; y: number } {
  if (!landmarks || landmarks.length < 21) return { x: 0.5, y: 0.5 };
  const keyIndices = [0, 5, 9, 13, 17];
  let sumX = 0;
  let sumY = 0;
  for (const idx of keyIndices) {
    sumX += landmarks[idx].x;
    sumY += landmarks[idx].y;
  }
  return { x: sumX / keyIndices.length, y: sumY / keyIndices.length };
}

/**
 * Calculates hand scale (distance between wrist 0 and middle MCP 9).
 */
export function calculateHandScale(landmarks: LandmarkPoint[]): number {
  if (!landmarks || landmarks.length < 21) return 1.0;
  return Math.hypot(landmarks[9].x - landmarks[0].x, landmarks[9].y - landmarks[0].y);
}

/**
 * Calculates individual finger extension states (thumb, index, middle, ring, pinky).
 */
export function calculateFingerExtension(landmarks: LandmarkPoint[]): {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  count: number;
} {
  if (!landmarks || landmarks.length < 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false, count: 0 };
  }

  const isExtended = (tip: number, pip: number, mcp: number) => {
    const tipDist = Math.hypot(landmarks[tip].x - landmarks[0].x, landmarks[tip].y - landmarks[0].y);
    const pipDist = Math.hypot(landmarks[pip].x - landmarks[0].x, landmarks[pip].y - landmarks[0].y);
    return tipDist > pipDist * 1.12;
  };

  const thumbDist = Math.hypot(landmarks[4].x - landmarks[2].x, landmarks[4].y - landmarks[2].y);
  const thumbMcpDist = Math.hypot(landmarks[3].x - landmarks[2].x, landmarks[3].y - landmarks[2].y);
  const thumb = thumbDist > thumbMcpDist * 1.15;

  const index = isExtended(8, 6, 5);
  const middle = isExtended(12, 10, 9);
  const ring = isExtended(16, 14, 13);
  const pinky = isExtended(20, 18, 17);

  const count = [thumb, index, middle, ring, pinky].filter(Boolean).length;
  return { thumb, index, middle, ring, pinky, count };
}

/**
 * Calculates hand orientation angle in degrees relative to vertical axis.
 */
export function calculateHandOrientation(landmarks: LandmarkPoint[]): number {
  if (!landmarks || landmarks.length < 21) return 0;
  const dx = landmarks[9].x - landmarks[0].x;
  const dy = landmarks[9].y - landmarks[0].y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}
