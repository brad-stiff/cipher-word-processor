import {
  CIPHERS,
  type CipherSettings,
  type ViewMode,
} from "../ciphers";

interface ToolbarProps {
  settings: CipherSettings;
  viewMode: ViewMode;
  onSettingsChange: (settings: CipherSettings) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportEncrypted: () => void;
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
  onSettingsChange,
  onViewModeChange,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExportEncrypted,
}: ToolbarProps) {
  const cipher = CIPHERS.find((c) => c.id === settings.id)!;

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
        <button type="button" onClick={onExportEncrypted}>
          Export Encrypted
        </button>
      </div>

      <div className="toolbar-group">
        <label className="field">
          <span>Cipher</span>
          <select
            value={settings.id}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                id: e.target.value as CipherSettings["id"],
              })
            }
          >
            {CIPHERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {cipher.needsShift && (
          <label className="field">
            <span>Shift</span>
            <input
              type="number"
              min={0}
              max={25}
              value={settings.shift}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  shift: Math.min(
                    25,
                    Math.max(0, Number(e.target.value) || 0),
                  ),
                })
              }
            />
          </label>
        )}

        {cipher.needsKeyword && (
          <label className="field">
            <span>Keyword</span>
            <input
              type="text"
              value={settings.keyword}
              spellCheck={false}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  keyword: e.target.value,
                })
              }
            />
          </label>
        )}
      </div>

      <div className="view-switch" role="group" aria-label="View mode">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={viewMode === v.id ? "active" : ""}
            onClick={() => onViewModeChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </header>
  );
}
