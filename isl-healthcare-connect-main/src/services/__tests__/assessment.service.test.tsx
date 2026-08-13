import { expect } from "vitest";
import { scoreAssessment } from "@/services/assessment.service";

const sampleAssessment = {
  id: "a1",
  tier: "bronze",
  title: "Test",
  duration_minutes: 10,
  pass_percent: 75,
  questions: [
    { id: "q1", prompt: "A", kind: "identify", options: ["A", "B"], answer: "A" },
    { id: "q2", prompt: "B", kind: "identify", options: ["A", "B"], answer: "B" },
    { id: "q3", prompt: "C", kind: "identify", options: ["C", "D"], answer: "C" },
    { id: "q4", prompt: "D", kind: "identify", options: ["C", "D"], answer: "D" },
  ],
};

it("scoreAssessment: full score passes", () => {
  const answers = { q1: "A", q2: "B", q3: "C", q4: "D" };
  const result = scoreAssessment(sampleAssessment as any, answers as any);
  expect(result.score).toBe(4);
  expect(result.total).toBe(4);
  expect(result.accuracy_percent).toBe(100);
  expect(result.passed).toBe(true);
});

it("scoreAssessment: fails below threshold", () => {
  const answers = { q1: "A", q2: "A", q3: "D", q4: "C" };
  const result = scoreAssessment(sampleAssessment as any, answers as any);
  expect(result.score).toBe(1);
  expect(result.total).toBe(4);
  expect(result.accuracy_percent).toBe(25);
  expect(result.passed).toBe(false);
});

it("scoreAssessment: passes at exactly 75%", () => {
  const answers = { q1: "A", q2: "B", q3: "C", q4: "C" };
  const result = scoreAssessment(sampleAssessment as any, answers as any);
  expect(result.score).toBe(3);
  expect(result.accuracy_percent).toBeGreaterThanOrEqual(75);
  expect(result.passed).toBe(true);
});

it("scoreAssessment: returns correct tier", () => {
  const answers = { q1: "A", q2: "B", q3: "C", q4: "D" };
  const result = scoreAssessment(sampleAssessment as any, answers as any);
  expect(result.tier).toBe("bronze");
});

it("scoreAssessment: handles partial answers", () => {
  const answers = { q1: "A", q2: "B" };
  const result = scoreAssessment(sampleAssessment as any, answers as any);
  expect(result.score).toBe(2);
  expect(result.total).toBe(4);
  expect(result.accuracy_percent).toBe(50);
  expect(result.passed).toBe(false);
});
