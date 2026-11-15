import {
  CIPHERS,
  type CipherSettings,
} from "../ciphers";

interface CipherControlsProps {
  settings: CipherSettings;
  onChange: (settings: CipherSettings) => void;
  idPrefix?: string;
}

export function CipherControls({
  settings,
  onChange,
  idPrefix = "cipher",
}: CipherControlsProps) {
  const cipher = CIPHERS.find((c) => c.id === settings.id) ?? CIPHERS[0];

  return (
    <>
      <label className="field" htmlFor={`${idPrefix}-id`}>
        <span>Cipher</span>
        <select
          id={`${idPrefix}-id`}
          value={settings.id}
          onChange={(e) =>
            onChange({
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
        <label className="field" htmlFor={`${idPrefix}-shift`}>
          <span>Shift</span>
          <input
            id={`${idPrefix}-shift`}
            type="number"
            min={0}
            max={25}
            value={settings.shift}
            onChange={(e) =>
              onChange({
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
        <label className="field" htmlFor={`${idPrefix}-keyword`}>
          <span>Keyword</span>
          <input
            id={`${idPrefix}-keyword`}
            type="text"
            value={settings.keyword}
            spellCheck={false}
            onChange={(e) =>
              onChange({
                ...settings,
                keyword: e.target.value,
              })
            }
          />
        </label>
      )}
    </>
  );
}
