export const MAX_LINE_WORDS = 17;
export const MAX_LINE_CHARACTERS = 180;
export const MAX_COMMENT_CHARACTERS = 500;

const BLOCKED_TERMS = [
  "kill yourself",
  "nazi",
  "white power",
  "child porn",
  "rape you",
];

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function countWords(value: string): number {
  const normalized = normalizeWhitespace(value);
  return normalized ? normalized.split(" ").length : 0;
}

export function containsBlockedContent(value: string): boolean {
  const normalized = normalizeWhitespace(value).toLocaleLowerCase();
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

export type ValidationResult =
  | { ok: true; value: string; wordCount: number }
  | { ok: false; message: string };

export function validatePoetryLine(value: string): ValidationResult {
  const normalized = normalizeWhitespace(value);
  const wordCount = countWords(normalized);

  if (!normalized) {
    return { ok: false, message: "Write at least one word." };
  }
  if (normalized.length > MAX_LINE_CHARACTERS) {
    return {
      ok: false,
      message: `Keep the line under ${MAX_LINE_CHARACTERS} characters.`,
    };
  }
  if (wordCount > MAX_LINE_WORDS) {
    return {
      ok: false,
      message: `Use no more than ${MAX_LINE_WORDS} words.`,
    };
  }
  if (containsBlockedContent(normalized)) {
    return {
      ok: false,
      message: "That line conflicts with Morrow’s community pledge.",
    };
  }
  return { ok: true, value: normalized, wordCount };
}

export function validateComment(value: string): ValidationResult {
  const normalized = normalizeWhitespace(value);
  const wordCount = countWords(normalized);
  if (!normalized) return { ok: false, message: "Write a comment first." };
  if (normalized.length > MAX_COMMENT_CHARACTERS) {
    return {
      ok: false,
      message: `Keep comments under ${MAX_COMMENT_CHARACTERS} characters.`,
    };
  }
  if (containsBlockedContent(normalized)) {
    return { ok: false, message: "Please revise that comment." };
  }
  return { ok: true, value: normalized, wordCount };
}
