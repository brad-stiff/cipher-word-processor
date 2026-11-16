import { describe, expect, it } from "vitest";
import { isBlankUntitled, tabTitle } from "./tabs";

describe("tabTitle", () => {
  it("uses the file basename", () => {
    expect(tabTitle("/tmp/notes.cwp")).toBe("notes.cwp");
    expect(tabTitle(null)).toBe("Untitled");
  });
});

describe("isBlankUntitled", () => {
  it("detects an empty unsaved tab", () => {
    expect(
      isBlankUntitled({ filePath: null, dirty: false, text: "" }),
    ).toBe(true);
    expect(
      isBlankUntitled({ filePath: null, dirty: true, text: "" }),
    ).toBe(false);
    expect(
      isBlankUntitled({ filePath: "/a.txt", dirty: false, text: "" }),
    ).toBe(false);
    expect(
      isBlankUntitled({ filePath: null, dirty: false, text: "x" }),
    ).toBe(false);
  });
});
