import { describe, expect, it } from "vitest";

import {
  containsBlockedContent,
  countWords,
  normalizeWhitespace,
  validateComment,
  validatePoetryLine,
} from "@/lib/validation";

describe("poetry validation", () => {
  it("normalizes whitespace and counts words", () => {
    expect(normalizeWhitespace("  clouds   hold\nlight ")).toBe(
      "clouds hold light",
    );
    expect(countWords("  clouds   hold\nlight ")).toBe(3);
  });

  it("accepts a line with exactly seventeen words", () => {
    const text = Array.from({ length: 17 }, (_, index) => `word${index}`).join(
      " ",
    );
    expect(validatePoetryLine(text)).toEqual({
      ok: true,
      value: text,
      wordCount: 17,
    });
  });

  it("rejects an eighteenth word", () => {
    const text = Array.from({ length: 18 }, (_, index) => `word${index}`).join(
      " ",
    );
    expect(validatePoetryLine(text)).toMatchObject({ ok: false });
  });

  it("rejects empty and obviously abusive content", () => {
    expect(validatePoetryLine("   ")).toMatchObject({ ok: false });
    expect(containsBlockedContent("Go KILL YOURSELF now")).toBe(true);
    expect(validatePoetryLine("go kill yourself")).toMatchObject({ ok: false });
  });

  it("limits comment storage", () => {
    expect(validateComment("A thoughtful note")).toMatchObject({ ok: true });
    expect(validateComment("x".repeat(501))).toMatchObject({ ok: false });
  });
});
