/**
 * Assessment and certification service.
 */
import { bronzeAssessment, certificates } from "./mock/data";
import type { Assessment, AssessmentResult, Certificate } from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const latency = (ms = 240) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAssessment(tier = "bronze"): Promise<Assessment | null> {
  await latency();
  return tier === "bronze" ? clone(bronzeAssessment) : null;
}

export function scoreAssessment(assessment: Assessment, answers: Record<string, string>): AssessmentResult {
  const total = assessment.questions.length;
  const score = assessment.questions.filter((question) => answers[question.id] === question.answer).length;
  const accuracy = total === 0 ? 0 : Math.round((score / total) * 100);
  return {
    score,
    total,
    accuracy_percent: accuracy,
    passed: accuracy >= assessment.pass_percent,
    tier: assessment.tier,
  };
}

export async function listCertificates(): Promise<Certificate[]> {
  await latency();
  return clone(certificates);
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  await latency();
  return clone(certificates.find((certificate) => certificate.id === id) ?? null);
}
