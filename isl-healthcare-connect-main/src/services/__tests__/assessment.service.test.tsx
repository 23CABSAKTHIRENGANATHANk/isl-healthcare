/**
 * Unit tests for assessment service scoring logic.
 * These tests cover the pure scoreAssessment function (no Supabase dependency).
 */

import { describe, it, expect } from "vitest";
import { scoreAssessment } from "@/services/assessment.service";
import type { Assessment } from "@/types";

const mockAssessment: Assessment = {
  id: "bronze-test",
  tier: "bronze",
  title: "Healthcare ISL Bronze Assessment",
  duration_minutes: 15,
  pass_percent: 75,
  questions: [
    {
      id: "q1",
      prompt: "Which sign is used to greet someone at the hospital entrance?",
      kind: "mcq",
      options: ["HELLO", "PAIN", "STOP", "FEVER"],
      answer: "HELLO",
    },
    {
      id: "q2",
      prompt: "A patient holds their forehead. Which sign expresses high temperature?",
      kind: "mcq",
      options: ["WATER", "FEVER", "MEDICINE", "FOOD"],
      answer: "FEVER",
    },
    {
      id: "q3",
      prompt: "Which ISL sign indicates a need for drinking water?",
      kind: "mcq",
      options: ["COME", "STOP", "WATER", "THANK YOU"],
      answer: "WATER",
    },
    {
      id: "q4",
      prompt: "The correct response when a patient thanks you in ISL is:",
      kind: "mcq",
      options: ["PAIN", "THANK YOU", "NO", "EMERGENCY"],
      answer: "THANK YOU",
    },
  ],
};

describe("scoreAssessment", () => {
  it("returns perfect score when all answers are correct", () => {
    const answers = { q1: "HELLO", q2: "FEVER", q3: "WATER", q4: "THANK YOU" };
    const result = scoreAssessment(mockAssessment, answers);

    expect(result.score).toBe(4);
    expect(result.total).toBe(4);
    expect(result.accuracy_percent).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.tier).toBe("bronze");
  });

  it("returns zero score when all answers are wrong", () => {
    const answers = { q1: "PAIN", q2: "STOP", q3: "COME", q4: "PAIN" };
    const result = scoreAssessment(mockAssessment, answers);

    expect(result.score).toBe(0);
    expect(result.total).toBe(4);
    expect(result.accuracy_percent).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("passes when accuracy is exactly at the pass threshold (75%)", () => {
    // 3 out of 4 = 75% — should pass
    const answers = { q1: "HELLO", q2: "FEVER", q3: "WATER", q4: "PAIN" };
    const result = scoreAssessment(mockAssessment, answers);

    expect(result.score).toBe(3);
    expect(result.accuracy_percent).toBe(75);
    expect(result.passed).toBe(true);
  });

  it("fails when accuracy is below the pass threshold (50%)", () => {
    const answers = { q1: "HELLO", q2: "FEVER", q3: "COME", q4: "PAIN" };
    const result = scoreAssessment(mockAssessment, answers);

    expect(result.score).toBe(2);
    expect(result.accuracy_percent).toBe(50);
    expect(result.passed).toBe(false);
  });

  it("handles empty answers gracefully (all wrong)", () => {
    const result = scoreAssessment(mockAssessment, {});

    expect(result.score).toBe(0);
    expect(result.total).toBe(4);
    expect(result.passed).toBe(false);
  });

  it("handles assessment with no questions (edge case)", () => {
    const emptyAssessment: Assessment = { ...mockAssessment, questions: [] };
    const result = scoreAssessment(emptyAssessment, {});

    expect(result.score).toBe(0);
    expect(result.total).toBe(0);
    expect(result.accuracy_percent).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("is case-sensitive in answer matching (HELLO !== hello)", () => {
    const answers = { q1: "hello", q2: "fever", q3: "water", q4: "thank you" };
    const result = scoreAssessment(mockAssessment, answers);
    // Lowercase values do not match uppercase answers
    expect(result.score).toBe(0);
  });

  it("preserves the tier in the result", () => {
    const silverAssessment: Assessment = {
      ...mockAssessment,
      id: "silver-test",
      tier: "silver",
      pass_percent: 80,
    };
    const answers = { q1: "HELLO", q2: "FEVER", q3: "WATER", q4: "THANK YOU" };
    const result = scoreAssessment(silverAssessment, answers);
    expect(result.tier).toBe("silver");
  });

  it("calculates accuracy correctly for 1/4 correct", () => {
    const answers = { q1: "HELLO", q2: "WATER", q3: "COME", q4: "PAIN" };
    const result = scoreAssessment(mockAssessment, answers);
    expect(result.score).toBe(1);
    expect(result.accuracy_percent).toBe(25);
    expect(result.passed).toBe(false);
  });
});

describe("Certificate number format", () => {
  it("generates a unique ISL credential ID format", () => {
    const tier = "bronze";
    const certNumber = `ISL-${tier.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    expect(certNumber).toMatch(/^ISL-BRONZE-[A-Z0-9]+-\d{4}$/);
  });

  it("generates unique IDs on each call", () => {
    const generate = () =>
      `ISL-BRONZE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const ids = new Set(Array.from({ length: 20 }, generate));
    expect(ids.size).toBeGreaterThan(1);
  });
});
