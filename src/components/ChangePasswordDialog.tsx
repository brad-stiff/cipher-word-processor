import { useEffect, useRef, useState } from "react";

interface ChangePasswordDialogProps {
  fileName?: string;
  error?: string | null;
  busy?: boolean;
  onConfirm: (currentPassword: string, newPassword: string) => void;
  onCancel: () => void;
}

export function ChangePasswordDialog({
  fileName,
  error = null,
  busy = false,
  onConfirm,
  onCancel,
}: ChangePasswordDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
    if (!currentPassword) {
      setLocalError("Enter the current password.");
      return;
    }
    if (!newPassword) {
      setLocalError("Enter a new password.");
      return;
    }
    if (newPassword !== confirm) {
      setLocalError("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setLocalError("New password must be different.");
      return;
    }
    onConfirm(currentPassword, newPassword);
  };

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
        aria-labelledby="change-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="change-password-title">Change password</h2>
        <p className="modal-copy">
          {fileName
            ? `Update the password for ${fileName}. The document is re-sealed with the new password.`
            : "Update the session password used the next time this document is saved as a locked file."}
        </p>

        <form
          className="password-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) submit();
          }}
        >
          <div className="modal-fields password-fields">
            <label className="field">
              <span>Current</span>
              <input
                ref={inputRef}
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                disabled={busy}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="field">
              <span>New</span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                disabled={busy}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
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
              Change password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
