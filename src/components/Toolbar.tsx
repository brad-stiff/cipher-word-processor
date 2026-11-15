import type { CipherSettings, ViewMode } from "../ciphers";
import { CipherControls } from "./CipherControls";

interface ToolbarProps {
  settings: CipherSettings;
  viewMode: ViewMode;
  canUndo: boolean;
  canRedo: boolean;
  onSettingsChange: (settings: CipherSettings) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "encrypted", label: "Encrypted" },
  { id: "side-by-side", label: "Side by side" },
  { id: "reveal", label: "Reveal" },
];

export function Toolbar({
  settings,
  viewMode,
  canUndo,
  canRedo,
  onSettingsChange,
  onViewModeChange,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onUndo,
  onRedo,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">Cipher</div>

      <div className="toolbar-group">
        <button type="button" onClick={onNew}>
          New
        </button>
        <button type="button" onClick={onOpen}>
          Open
        </button>
        <button type="button" onClick={onSave}>
          Save
        </button>
        <button type="button" onClick={onSaveAs}>
          Save As
        </button>
        <button type="button" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
      </div>

      <div className="toolbar-group">
        <CipherControls settings={settings} onChange={onSettingsChange} />
      </div>

      <div className="view-switch" role="group" aria-label="View mode">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={viewMode === v.id ? "active" : ""}
            onClick={() => onViewModeChange(v.id)}
            disabled={settings.id === "none" && v.id !== "plain"}
          >
            {v.label}
          </button>
        ))}
      </div>
    </header>
  );
}
