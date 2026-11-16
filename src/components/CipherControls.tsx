import { useEffect, useId, useRef, useState } from "react";
import {
  AFFINE_A_VALUES,
  CIPHER_HELP_SAMPLE,
  CIPHERS,
  encrypt,
  normalizeSubstitutionKey,
  shuffleSubstitutionKey,
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
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const helpId = useId();
  const example = encrypt(CIPHER_HELP_SAMPLE, settings);

  useEffect(() => {
    if (!helpOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!helpRef.current?.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [helpOpen]);

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

      {cipher.needsRails && (
        <label className="field" htmlFor={`${idPrefix}-rails`}>
          <span>Rails</span>
          <input
            id={`${idPrefix}-rails`}
            type="number"
            min={2}
            max={10}
            value={settings.rails}
            onChange={(e) =>
              onChange({
                ...settings,
                rails: Math.min(
                  10,
                  Math.max(2, Number(e.target.value) || 2),
                ),
              })
            }
          />
        </label>
      )}

      {cipher.needsAffine && (
        <>
          <label className="field" htmlFor={`${idPrefix}-affine-a`}>
            <span>a</span>
            <select
              id={`${idPrefix}-affine-a`}
              value={settings.affineA}
              onChange={(e) =>
                onChange({
                  ...settings,
                  affineA: Number(e.target.value),
                })
              }
            >
              {AFFINE_A_VALUES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor={`${idPrefix}-affine-b`}>
            <span>b</span>
            <input
              id={`${idPrefix}-affine-b`}
              type="number"
              min={0}
              max={25}
              value={settings.affineB}
              onChange={(e) =>
                onChange({
                  ...settings,
                  affineB: Math.min(
                    25,
                    Math.max(0, Number(e.target.value) || 0),
                  ),
                })
              }
            />
          </label>
        </>
      )}

      {cipher.needsSubstitution && (
        <>
          <label className="field field-wide" htmlFor={`${idPrefix}-sub-key`}>
            <span>Key</span>
            <input
              id={`${idPrefix}-sub-key`}
              type="text"
              className="substitution-key"
              value={settings.substitutionKey}
              spellCheck={false}
              maxLength={26}
              onChange={(e) =>
                onChange({
                  ...settings,
                  substitutionKey: normalizeSubstitutionKey(e.target.value),
                })
              }
            />
          </label>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...settings,
                substitutionKey: shuffleSubstitutionKey(),
              })
            }
          >
            Shuffle
          </button>
        </>
      )}

      <div className="cipher-help" ref={helpRef}>
        <button
          type="button"
          className="cipher-help-toggle"
          aria-label={`About ${cipher.name}`}
          aria-expanded={helpOpen}
          aria-controls={helpId}
          onClick={() => setHelpOpen((open) => !open)}
        >
          ?
        </button>
        {helpOpen && (
          <div
            id={helpId}
            className="cipher-help-popover"
            role="dialog"
            aria-label={`${cipher.name} help`}
          >
            <strong className="cipher-help-title">{cipher.name}</strong>
            <p className="cipher-help-body">{cipher.description}</p>
            {!cipher.preservesLength && (
              <p className="cipher-help-body">
                Encrypted view is read-only for this cipher.
              </p>
            )}
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
        )}
      </div>
    </>
  );
}
