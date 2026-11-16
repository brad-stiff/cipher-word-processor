import { useEffect, useState } from "react";
import { CIPHERS, type CipherSettings } from "../ciphers";

export type PrintLayout = "plain" | "cipher" | "side";

interface PrintDialogProps {
  settings: CipherSettings;
  onConfirm: (layout: PrintLayout) => void;
  onCancel: () => void;
}

const OPTIONS: {
  id: PrintLayout;
  label: string;
  hint: string;
  needsCipher: boolean;
}[] = [
  {
    id: "plain",
    label: "Plain",
    hint: "Print the plaintext document only.",
    needsCipher: false,
  },
  {
    id: "cipher",
    label: "Ciphertext",
    hint: "Print the classical cipher output only.",
    needsCipher: true,
  },
  {
    id: "side",
    label: "Side by side",
    hint: "Two columns: plaintext and ciphertext.",
    needsCipher: true,
  },
];

export function PrintDialog({
  settings,
  onConfirm,
  onCancel,
}: PrintDialogProps) {
  const cipherOn = settings.id !== "none";
  const cipherName =
    CIPHERS.find((c) => c.id === settings.id)?.name ?? "Cipher";
  const [layout, setLayout] = useState<PrintLayout>("plain");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm(layout);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layout, onCancel, onConfirm]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="print-dialog-title">Print</h2>
        <p className="modal-copy">
          Choose a layout, then continue to the system print dialog.
          {cipherOn
            ? ` Active cipher: ${cipherName}.`
            : " Cipher is None — only plain text is available."}
        </p>

        <div className="print-options" role="radiogroup" aria-label="Print layout">
          {OPTIONS.map((option) => {
            const disabled = option.needsCipher && !cipherOn;
            return (
              <label
                key={option.id}
                className={`print-option${disabled ? " print-option-disabled" : ""}`}
              >
                <input
                  type="radio"
                  name="print-layout"
                  value={option.id}
                  checked={layout === option.id}
                  disabled={disabled}
                  onChange={() => setLayout(option.id)}
                />
                <span>
                  <strong>{option.label}</strong>
                  <span className="print-option-hint">{option.hint}</span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => onConfirm(layout)}
          >
            Print…
          </button>
        </div>
      </div>
    </div>
  );
}
