import { useEffect, useRef, useState } from "react";

interface PasswordDialogProps {
  mode: "unlock" | "set";
  fileName?: string;
  error?: string | null;
  busy?: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

export function PasswordDialog({
  mode,
  fileName,
  error = null,
  busy = false,
  onConfirm,
  onCancel,
}: PasswordDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!busy) onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const submit = () => {
    setLocalError(null);
    if (!password) {
      setLocalError("Enter a password.");
      return;
    }
    if (mode === "set" && password !== confirm) {
      setLocalError("Passwords do not match.");
      return;
    }
    onConfirm(password);
  };

  const title = mode === "unlock" ? "Unlock document" : "Set password";
  const copy =
    mode === "unlock"
      ? `Enter the password for ${fileName ? fileName : "this locked document"}.`
      : "A password is required to save when a classical cipher is active. The file is locked with AES; cipher settings are stored inside the vault.";

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="password-dialog-title">{title}</h2>
        <p className="modal-copy">{copy}</p>

        <form
          className="password-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) submit();
          }}
        >
          <div className="modal-fields password-fields">
            <label className="field">
              <span>Password</span>
              <input
                ref={inputRef}
                type="password"
                autoComplete={
                  mode === "unlock" ? "current-password" : "new-password"
                }
                value={password}
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {mode === "set" && (
              <label className="field">
                <span>Confirm</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  disabled={busy}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            )}
          </div>
          {(localError || error) && (
            <p className="modal-error" role="alert">
              {localError || error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {mode === "unlock" ? "Unlock" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
