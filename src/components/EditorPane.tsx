import { useLayoutEffect, useRef } from "react";

interface EditorPaneProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  label: string;
  className?: string;
}

export function EditorPane({
  value,
  onChange,
  readOnly = false,
  label,
  className = "",
}: EditorPaneProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const sel = selectionRef.current;
    if (!el || !sel || readOnly) return;
    const start = Math.min(sel.start, value.length);
    const end = Math.min(sel.end, value.length);
    el.setSelectionRange(start, end);
    selectionRef.current = null;
  });

  return (
    <div className={`pane ${className}`.trim()}>
      <div className="pane-label">{label}</div>
      <textarea
        ref={ref}
        className="editor"
        value={value}
        readOnly={readOnly}
        spellCheck={false}
        aria-label={label}
        onChange={
          onChange && !readOnly
            ? (e) => {
                selectionRef.current = {
                  start: e.target.selectionStart,
                  end: e.target.selectionEnd,
                };
                onChange(e.target.value);
              }
            : undefined
        }
      />
    </div>
  );
}
