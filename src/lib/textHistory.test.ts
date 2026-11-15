import { describe, expect, it } from "vitest";
import {
  canRedo,
  canUndo,
  createTextHistory,
  editText,
  redoText,
  replaceText,
  undoText,
} from "./textHistory";

describe("textHistory", () => {
  it("records edits and undoes them", () => {
    let h = createTextHistory("");
    h = editText(h, "a", { recordUndo: true });
    h = editText(h, "ab", { recordUndo: false });
    h = editText(h, "abc", { recordUndo: false });
    expect(h.present).toBe("abc");
    expect(canUndo(h)).toBe(true);

    h = undoText(h);
    expect(h.present).toBe("");
    expect(canRedo(h)).toBe(true);

    h = redoText(h);
    expect(h.present).toBe("abc");
  });

  it("starts a new undo step when recordUndo is true", () => {
    let h = createTextHistory("hello");
    h = editText(h, "hello!", { recordUndo: true });
    h = editText(h, "hello!!", { recordUndo: true });
    h = undoText(h);
    expect(h.present).toBe("hello!");
    h = undoText(h);
    expect(h.present).toBe("hello");
  });

  it("clears redo after a new edit", () => {
    let h = createTextHistory("a");
    h = editText(h, "b", { recordUndo: true });
    h = undoText(h);
    h = editText(h, "c", { recordUndo: true });
    expect(canRedo(h)).toBe(false);
    expect(h.present).toBe("c");
  });

  it("replaceText resets stacks", () => {
    let h = createTextHistory("a");
    h = editText(h, "b", { recordUndo: true });
    h = replaceText(h, "loaded");
    expect(h).toEqual({ past: [], present: "loaded", future: [] });
  });
});
