import { describe, expect, it } from "vitest";
import { normalizeCipherSettings } from "../ciphers";
import { isVaultFile, sealVault, unlockVault } from "./vault";

describe("vault", () => {
  it("round-trips text and cipher settings", async () => {
    const settings = normalizeCipherSettings({
      id: "vigenere",
      shift: 3,
      keyword: "LEMON",
    });
    const sealed = await sealVault(
      {
        text: "Attack at dawn",
        settings,
      },
      "correct horse battery",
    );

    expect(isVaultFile(sealed)).toBe(true);
    expect(sealed).not.toContain("Attack at dawn");
    expect(sealed).not.toContain("LEMON");

    const opened = await unlockVault(sealed, "correct horse battery");
    expect(opened.text).toBe("Attack at dawn");
    expect(opened.settings).toEqual(settings);
  });

  it("rejects the wrong password", async () => {
    const sealed = await sealVault(
      {
        text: "secret",
        settings: normalizeCipherSettings({
          id: "caesar",
          shift: 4,
          keyword: "",
        }),
      },
      "right-password",
    );

    await expect(unlockVault(sealed, "wrong-password")).rejects.toThrow(
      /Incorrect password/,
    );
  });

  it("does not treat plain text as a vault", () => {
    expect(isVaultFile("Khoor Zruog")).toBe(false);
    expect(isVaultFile("{ \"hello\": true }")).toBe(false);
  });
});
