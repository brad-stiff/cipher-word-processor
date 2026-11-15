import { CIPHERS, type CipherSettings } from "../ciphers";

interface StatusBarProps {
  settings: CipherSettings;
  charCount: number;
  dirty: boolean;
  filePath: string | null;
}

export function StatusBar({
  settings,
  charCount,
  dirty,
  filePath,
}: StatusBarProps) {
  const cipher = CIPHERS.find((c) => c.id === settings.id)!;
  const name = filePath
    ? filePath.split(/[/\\]/).pop()
    : "Untitled";

  return (
    <footer className="status-bar">
      <span>{name}{dirty ? " •" : ""}</span>
      <span>{cipher.name}</span>
      <span>{charCount} characters</span>
    </footer>
  );
}
