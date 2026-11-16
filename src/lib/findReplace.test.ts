import { describe, expect, it } from "vitest";
import {
  findAllMatches,
  replaceAllMatches,
  replaceMatch,
  stepMatchIndex,
} from "./findReplace";

describe("findAllMatches", () => {
  it("finds overlapping-safe non-overlapping matches", () => {
    expect(findAllMatches("abcabcabc", "abc", true)).toEqual([
      { start: 0, end: 3 },
      { start: 3, end: 6 },
      { start: 6, end: 9 },
    ]);
  });

  it("respects case sensitivity", () => {
    expect(findAllMatches("Hello hello", "hello", false)).toHaveLength(2);
    expect(findAllMatches("Hello hello", "hello", true)).toEqual([
      { start: 6, end: 11 },
    ]);
  });

  it("returns empty for empty query", () => {
    expect(findAllMatches("abc", "", false)).toEqual([]);
  });
});

describe("stepMatchIndex", () => {
  it("wraps forward and backward", () => {
    expect(stepMatchIndex(3, null, 1)).toBe(0);
    expect(stepMatchIndex(3, null, -1)).toBe(2);
    expect(stepMatchIndex(3, 2, 1)).toBe(0);
    expect(stepMatchIndex(3, 0, -1)).toBe(2);
  });

  it("returns null when there are no matches", () => {
    expect(stepMatchIndex(0, 0, 1)).toBeNull();
  });
});

describe("replace", () => {
  it("replaces a single match", () => {
    expect(replaceMatch("one two one", { start: 4, end: 7 }, "2")).toBe(
      "one 2 one",
    );
  });

  it("replaces all matches", () => {
    expect(replaceAllMatches("Aa a A", "a", "x", false)).toBe("xx x x");
    expect(replaceAllMatches("Aa a A", "a", "x", true)).toBe("Ax x A");
  });
});
