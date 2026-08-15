/**
 * Prediction Temporal Stabilizer — ISL Setu
 * Sliding-window buffer with majority voting, confidence smoothing,
 * speech/detection cooldown management, and explicit UNKNOWN fallback.
 */
import type { PredictionResult } from "./ai.service";

export interface StabilizerConfig {
  windowSize?: number;          // Number of recent frames to buffer (default: 5)
  minStableMatches?: number;    // Minimum matching predictions required for consensus (default: 3)
  minConfidence?: number;       // Minimum confidence threshold (default: 0.75)
  cooldownDurationMs?: number;  // Cooldown time after stable recognition (default: 1200ms)
}

export interface StabilizedPredictionOutput {
  isStable: boolean;
  sign: string | null;
  confidence: number;
  statusCode: "STABLE" | "HOLD_STEADY" | "LOW_CONFIDENCE" | "UNKNOWN" | "NO_PREDICTION" | "COOLDOWN";
  message: string;
  rawResult?: PredictionResult;
  inCooldown?: boolean;
}

export const DEFAULT_STABILIZER_CONFIG: Required<StabilizerConfig> = {
  windowSize: 5,
  minStableMatches: 3,
  minConfidence: 0.75,
  cooldownDurationMs: 1200,
};

export class PredictionStabilizer {
  private buffer: PredictionResult[] = [];
  private windowSize: number;
  private minMatches: number;
  private minConfidence: number;
  private cooldownDurationMs: number;
  private lastStableTimestamp = 0;
  private lastStableSign: string | null = null;

  constructor(config: StabilizerConfig = {}) {
    this.windowSize = config.windowSize ?? DEFAULT_STABILIZER_CONFIG.windowSize;
    this.minMatches = config.minStableMatches ?? DEFAULT_STABILIZER_CONFIG.minStableMatches;
    this.minConfidence = config.minConfidence ?? DEFAULT_STABILIZER_CONFIG.minConfidence;
    this.cooldownDurationMs = config.cooldownDurationMs ?? DEFAULT_STABILIZER_CONFIG.cooldownDurationMs;
  }

  /**
   * Resets prediction buffer history and cooldown timers.
   */
  public reset(): void {
    this.buffer = [];
    this.lastStableTimestamp = 0;
    this.lastStableSign = null;
  }

  /**
   * Pushes a new frame prediction into history and computes consensus output.
   */
  public processFrame(prediction: PredictionResult): StabilizedPredictionOutput {
    const now = performance.now();

    // Check if in cooldown period following a recent stable match
    if (this.lastStableTimestamp > 0 && now - this.lastStableTimestamp < this.cooldownDurationMs) {
      return {
        isStable: false,
        sign: this.lastStableSign,
        confidence: prediction.confidence,
        statusCode: "COOLDOWN",
        message: `Sign ${this.lastStableSign || "detected"} recognized. Cooldown active.`,
        rawResult: prediction,
        inCooldown: true,
      };
    }

    // If prediction failed or sign is UNKNOWN/null, push empty state
    if (!prediction.success || !prediction.sign || prediction.sign === "UNKNOWN") {
      this.buffer.push(prediction);
      if (this.buffer.length > this.windowSize) {
        this.buffer.shift();
      }

      return {
        isStable: false,
        sign: "UNKNOWN",
        confidence: 0,
        statusCode: "NO_PREDICTION",
        message: prediction.message || "Position hand clearly to recognize sign",
        rawResult: prediction,
        inCooldown: false,
      };
    }

    // Add valid prediction to window buffer
    this.buffer.push(prediction);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    // Count frequency of detected signs in window
    const counts: Record<string, number> = {};
    let maxCount = 0;
    let dominantSign: string | null = null;
    let totalConfidence = 0;
    let validCount = 0;

    for (const item of this.buffer) {
      if (item.success && item.sign && item.sign !== "UNKNOWN") {
        counts[item.sign] = (counts[item.sign] || 0) + 1;
        totalConfidence += item.confidence;
        validCount++;
        if (counts[item.sign] > maxCount) {
          maxCount = counts[item.sign];
          dominantSign = item.sign;
        }
      }
    }

    const avgConfidence = validCount > 0 ? Number((totalConfidence / validCount).toFixed(2)) : 0;

    // Reject if confidence is below minimum threshold
    if (avgConfidence < this.minConfidence) {
      return {
        isStable: false,
        sign: "UNKNOWN",
        confidence: avgConfidence,
        statusCode: "LOW_CONFIDENCE",
        message: "Gesture unclear. Hold hand steady inside guide box.",
        rawResult: prediction,
        inCooldown: false,
      };
    }

    // Check consensus stability
    if (dominantSign && maxCount >= this.minMatches) {
      this.lastStableTimestamp = now;
      this.lastStableSign = dominantSign;
      this.buffer = []; // Flush buffer after confirmed consensus

      return {
        isStable: true,
        sign: dominantSign,
        confidence: avgConfidence,
        statusCode: "STABLE",
        message: `Sign ${dominantSign} verified ✓`,
        rawResult: prediction,
        inCooldown: false,
      };
    }

    return {
      isStable: false,
      sign: dominantSign,
      confidence: avgConfidence,
      statusCode: "HOLD_STEADY",
      message: "Hold your sign steady for verification...",
      rawResult: prediction,
      inCooldown: false,
    };
  }
}
