/**
 * ISL Setu — Frontend AI Recognition & Voice Service
 * Connects to Python FastAPI Backend (MediaPipe 3D Landmark Model).
 * Handles AI Mode vs Demo Mode, timeouts, error states, and SpeechSynthesis.
 */
import { supabase } from "@/integrations/supabase/client";

export type SignImageInput = HTMLVideoElement | HTMLCanvasElement | Blob | string | null;

export interface PredictOptions {
  targetSign?: string;
  mode?: "ai" | "demo";
  failureRate?: number;
}

export interface PredictionResult {
  success: boolean;
  sign: string | null;
  confidence: number;
  phrase?: string;
  mode: "ai" | "demo";
  model_version: string;
  message?: string;
}

export const CONTROLLED_HEALTHCARE_VOCABULARY = [
  "FEVER", "PAIN", "WATER", "HELLO", "THANK YOU",
  "GOOD MORNING", "MEDICINE", "FOOD", "STOP", "COME"
] as const;

export const CONTROLLED_PHRASES: Record<string, string> = {
  FEVER: "I have a high fever.",
  PAIN: "I am experiencing pain.",
  WATER: "Please give me drinking water.",
  HELLO: "Hello, welcome to the hospital.",
  "THANK YOU": "Thank you for your assistance.",
  "GOOD MORNING": "Good morning.",
  MEDICINE: "Please give me the prescribed medicine.",
  FOOD: "I need food or tea.",
  STOP: "Please stop or pause.",
  COME: "Please come inside the room.",
};

const getBackendUrl = (): string => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_AI_API_URL) {
    return import.meta.env.VITE_AI_API_URL as string;
  }
  return "http://localhost:8000";
};

function extractBase64FromInput(input: SignImageInput): string | null {
  if (!input) return null;
  if (typeof input === "string") return input;

  try {
    if (input instanceof HTMLVideoElement && input.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(640, input.videoWidth);
      canvas.height = Math.min(480, input.videoHeight);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(input, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.75);
      }
    } else if (input instanceof HTMLCanvasElement) {
      return input.toDataURL("image/jpeg", 0.75);
    }
  } catch (err) {
    console.warn("[AI Service] Frame extraction notice:", err);
  }

  return null;
}

/**
 * Predicts sign from camera frame via FastAPI backend or Demo simulation.
 */
export async function predictSign(
  imageInput: SignImageInput,
  options: PredictOptions = {}
): Promise<PredictionResult> {
  const mode = options.mode || "ai";
  const targetSign = options.targetSign?.toUpperCase();

  // 1. Explicit Demo Mode
  if (mode === "demo") {
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    const fallbackSign = targetSign || "HELLO";
    return {
      success: true,
      sign: fallbackSign,
      confidence: 0.92,
      phrase: CONTROLLED_PHRASES[fallbackSign] || `${fallbackSign}.`,
      mode: "demo",
      model_version: "isl_demo_sim",
      message: "Simulated demonstration result",
    };
  }

  const base64Image = extractBase64FromInput(imageInput);
  const backendUrl = getBackendUrl();

  // 2. Real AI Inference via FastAPI Backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${backendUrl}/predict-sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: base64Image,
        target_sign: targetSign,
        mode: "ai",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        success: data.success,
        sign: data.sign,
        confidence: data.confidence,
        phrase: data.phrase || (data.sign ? CONTROLLED_PHRASES[data.sign] : undefined),
        mode: "ai",
        model_version: data.model_version || "isl_v1",
        message: data.message,
      };
    }
  } catch (err) {
    console.warn("[AI Service] Backend call unreachable:", err);
  }

  // 3. Fallback when AI backend is unavailable
  return {
    success: false,
    sign: null,
    confidence: 0.0,
    mode: "ai",
    model_version: "offline",
    message: "AI recognition server is offline. Start the backend or switch to Demo Mode.",
  };
}

/**
 * Logs practice attempt to Supabase (Privacy-first: no camera frames stored).
 */
export async function logPracticeAttempt(params: {
  userId?: string;
  signId: string;
  predictedSign?: string | null;
  confidence: number;
  mode: "ai" | "demo";
  success: boolean;
}): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const uid = params.userId || session.session?.user.id;
    if (!uid) return;

    await supabase.from("ai_practice_attempts").insert({
      user_id: uid,
      sign_id: params.signId,
      predicted_sign: params.predictedSign,
      confidence: params.confidence,
      mode: params.mode,
      success: params.success,
      model_version: "isl_v1",
    } as never);
  } catch (err) {
    // Non-blocking telemetry
    console.warn("[AI Service] Attempt logging:", err);
  }
}

/** Browser speech synthesis for VoiceBridge output. */
export function speak(text: string): { ok: boolean; reason?: string } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { ok: false, reason: "Voice output is not supported in this browser." };
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.lang = "en-IN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return { ok: true };
}
