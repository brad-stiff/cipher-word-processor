import { useEffect, useState } from "react";
import type { CipherSettings } from "../ciphers";
import { CipherControls } from "./CipherControls";

interface OpenDecryptDialogProps {
  fileName: string;
  initialSettings: CipherSettings;
  onConfirm: (settings: CipherSettings) => void;
  onCancel: () => void;
}

export function OpenDecryptDialog({
  fileName,
  initialSettings,
  onConfirm,
  onCancel,
}: OpenDecryptDialogProps) {
  const [settings, setSettings] = useState<CipherSettings>(initialSettings);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onConfirm(settings);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm, settings]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-decrypt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="open-decrypt-title">Open encrypted file</h2>
        <p className="modal-copy">
          Choose the cipher used to save <strong>{fileName}</strong>. You can
          change it in the toolbar after opening if the text looks wrong —
          cipher choice is not stored in the file.
        </p>
        <div className="modal-fields">
          <CipherControls
            settings={settings}
            onChange={setSettings}
            idPrefix="open-cipher"
          />
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => onConfirm(settings)}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
