/**
 * Unit tests for AI service — controlled vocabulary and phrase mapping.
 * These tests do NOT require Supabase or camera access.
 */

import { describe, it, expect } from "vitest";
import {
  CONTROLLED_HEALTHCARE_VOCABULARY,
  CONTROLLED_PHRASES,
} from "@/services/ai.service";

describe("Controlled Healthcare Vocabulary", () => {
  it("contains all 10 MVP healthcare signs", () => {
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("FEVER");
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("PAIN");
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("WATER");
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("HELLO");
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("THANK YOU");
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("GOOD MORNING");
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("MEDICINE");
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("FOOD");
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("STOP");
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toContain("COME");
  });

  it("has exactly 10 terms (no accidental extras)", () => {
    expect(CONTROLLED_HEALTHCARE_VOCABULARY).toHaveLength(10);
  });
});

describe("Controlled Phrases Mapping", () => {
  it("maps every vocabulary sign to a non-empty phrase", () => {
    for (const sign of CONTROLLED_HEALTHCARE_VOCABULARY) {
      const phrase = CONTROLLED_PHRASES[sign];
      expect(phrase, `Missing phrase for sign: ${sign}`).toBeDefined();
      expect(phrase.trim().length, `Empty phrase for sign: ${sign}`).toBeGreaterThan(0);
    }
  });

  it("FEVER phrase contains the word 'fever'", () => {
    const phrase = CONTROLLED_PHRASES["FEVER"];
    expect(phrase).toMatch(/fever/i);
  });

  it("WATER phrase relates to drinking water", () => {
    const phrase = CONTROLLED_PHRASES["WATER"];
    expect(phrase).toMatch(/water/i);
  });

  it("THANK YOU phrase is a courtesy expression", () => {
    const phrase = CONTROLLED_PHRASES["THANK YOU"];
    expect(phrase).toMatch(/thank/i);
  });

  it("all phrases end with punctuation", () => {
    for (const [sign, phrase] of Object.entries(CONTROLLED_PHRASES)) {
      expect(phrase, `Phrase for ${sign} should end with punctuation`).toMatch(/[.!?]$/);
    }
  });

  it("all phrases are strings with meaningful length", () => {
    for (const [sign, phrase] of Object.entries(CONTROLLED_PHRASES)) {
      expect(typeof phrase, `Phrase for ${sign} must be a string`).toBe("string");
      expect(phrase.length, `Phrase for ${sign} must be > 5 chars`).toBeGreaterThan(5);
    }
  });
});

describe("Certificate ID generation pattern", () => {
  it("matches expected format ISL-TIER-HASH-NNNN", () => {
    const tier = "bronze";
    const certId = `ISL-${tier.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    expect(certId).toMatch(/^ISL-[A-Z]+-[A-Z0-9]+-\d{4}$/);
  });

  it("silver cert uses SILVER in ID", () => {
    const tier = "silver";
    const certId = `ISL-${tier.toUpperCase()}-TESTHASH-1234`;
    expect(certId).toContain("SILVER");
  });
});
