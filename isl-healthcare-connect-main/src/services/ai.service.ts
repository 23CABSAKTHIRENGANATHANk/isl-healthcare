/**
 * Sign recognition service.
 *
 * IMPORTANT: there is no real ISL recognition model wired in yet. Everything
 * here is honest, clearly labelled Demo Mode: `predictSign` returns *simulated*
 * results shaped exactly like a future real response.
 *
 * This is the ONLY place that changes when a real recognition endpoint is wired
 * in later — swap the body of `predictSign` for a network call and keep the
 * returned shape identical (set `demo: false` for real predictions).
 */
import { demoPhrases, demoVocabulary } from "./mock/data";
import type { SignPrediction } from "@/types";

export type SignImageInput = HTMLVideoElement | HTMLCanvasElement | Blob | string | null;

export interface PredictOptions {
  /** When provided, the simulation biases toward this target sign. */
  targetSign?: string;
  /** Simulated chance of a "not recognised" outcome, 0-1. */
  failureRate?: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function isDemoMode(): boolean {
  // No recognition endpoint is configured, so the platform is always in Demo Mode.
  return true;
}

export function getDemoVocabulary(): string[] {
  return [...demoVocabulary];
}

export function phraseForSign(sign: string): string {
  return demoPhrases[sign] ?? `${sign.charAt(0)}${sign.slice(1).toLowerCase()}.`;
}

/**
 * Returns a simulated prediction. Never present the result as a real model
 * output — the `demo` flag is always true today and the UI must label it.
 */
export async function predictSign(
  _imageInput: SignImageInput,
  options: PredictOptions = {},
): Promise<SignPrediction | null> {
  const { targetSign, failureRate = 0.15 } = options;

  await wait(900 + Math.random() * 900);

  if (Math.random() < failureRate) return null;

  const vocabulary = getDemoVocabulary();
  const sign =
    targetSign && Math.random() < 0.82
      ? targetSign
      : (vocabulary[Math.floor(Math.random() * vocabulary.length)] as string);

  const confidence = Number((0.78 + Math.random() * 0.2).toFixed(2));

  return { sign, confidence, demo: isDemoMode() };
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
