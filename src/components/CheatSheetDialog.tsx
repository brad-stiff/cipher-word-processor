import { useEffect, useMemo, useState } from "react";
import {
  CIPHER_HELP_SAMPLE,
  CIPHERS,
  encrypt,
  type CipherId,
  type CipherSettings,
} from "../ciphers";

interface CheatSheetDialogProps {
  settings: CipherSettings;
  onClose: () => void;
}

function paramSummary(cipherId: CipherId, settings: CipherSettings): string[] {
  const cipher = CIPHERS.find((c) => c.id === cipherId);
  if (!cipher) return [];
  const lines: string[] = [];
  if (cipher.needsShift) lines.push(`Shift: ${settings.shift}`);
  if (cipher.needsKeyword) {
    lines.push(`Keyword: ${settings.keyword || "(empty)"}`);
  }
  if (cipher.needsRails) lines.push(`Rails: ${settings.rails}`);
  if (cipher.needsAffine) {
    lines.push(`a: ${settings.affineA}`, `b: ${settings.affineB}`);
  }
  if (cipher.needsSubstitution) {
    lines.push(`Key: ${settings.substitutionKey}`);
  }
  return lines;
}

export function CheatSheetDialog({ settings, onClose }: CheatSheetDialogProps) {
  const [selectedId, setSelectedId] = useState<CipherId>(settings.id);

  useEffect(() => {
    setSelectedId(settings.id);
  }, [settings.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const selected =
    CIPHERS.find((c) => c.id === selectedId) ?? CIPHERS[0];

  const exampleSettings = useMemo(
    () => ({ ...settings, id: selected.id }),
    [settings, selected.id],
  );
  const example = encrypt(CIPHER_HELP_SAMPLE, exampleSettings);
  const params = paramSummary(selected.id, settings);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal cheat-sheet-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cheat-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cheat-sheet-header">
          <h2 id="cheat-sheet-title">Cipher cheat sheet</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="modal-copy cheat-sheet-intro">
          Classical ciphers are for on-screen views. Locked files use a
          password (.cwp); cipher settings are stored inside the vault.
        </p>

        <div className="cheat-sheet-body">
          <nav className="cheat-sheet-nav" aria-label="Ciphers">
            {CIPHERS.map((cipher) => (
              <button
                key={cipher.id}
                type="button"
                className={
                  cipher.id === selected.id ? "cheat-sheet-nav-active" : ""
                }
                onClick={() => setSelectedId(cipher.id)}
              >
                {cipher.name}
                {cipher.id === settings.id ? " · active" : ""}
              </button>
            ))}
          </nav>

          <div className="cheat-sheet-detail">
            <h3>{selected.name}</h3>
            <p className="cheat-sheet-description">{selected.description}</p>

            <div className="cheat-sheet-block">
              <span className="cipher-help-label">Formula</span>
              <code className="cheat-sheet-formula">{selected.formula}</code>
            </div>

            {params.length > 0 && (
              <div className="cheat-sheet-block">
                <span className="cipher-help-label">
                  Current settings (from toolbar)
                </span>
                <ul className="cheat-sheet-params">
                  {params.map((line) => (
                    <li key={line}>
                      <code>{line}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!selected.preservesLength && (
              <p className="cheat-sheet-note">
                Encrypted view is read-only for this cipher (positions are not
                1:1 with plaintext).
              </p>
            )}

            <div className="cheat-sheet-block">
              <span className="cipher-help-label">Live example</span>
              <div className="cipher-help-example">
                <div>
                  <span className="cipher-help-label">Plain</span>
                  <code>{CIPHER_HELP_SAMPLE}</code>
                </div>
                <div>
                  <span className="cipher-help-label">Encrypted</span>
                  <code>{example}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
