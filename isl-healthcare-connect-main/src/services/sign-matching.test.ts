import { describe, expect, it } from "vitest";

import { isTargetMatch, normalizeSignLabel } from "./sign-matching";

describe("sign matching", () => {
  it("normalizes spaced and punctuation variations", () => {
    expect(normalizeSignLabel("What is your Name?")).toBe("what is your name");
    expect(normalizeSignLabel("THANK YOU")).toBe("thank you");
  });

  it("matches target signs accurately across common formatting differences", () => {
    expect(isTargetMatch("Good morning", "good morning")).toBe(true);
    expect(isTargetMatch("What is your Name", "WHAT IS YOUR NAME?")).toBe(true);
    expect(isTargetMatch("Medicine", "Nurse")).toBe(false);
  });
});
