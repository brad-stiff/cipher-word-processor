import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

export interface EditorPaneHandle {
  focus: () => void;
  selectRange: (start: number, end: number) => void;
}

interface EditorPaneProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  label: string;
  className?: string;
}

export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(
  function EditorPane(
    { value, onChange, readOnly = false, label, className = "" },
    ref,
  ) {
    const elRef = useRef<HTMLTextAreaElement>(null);
    const selectionRef = useRef<{ start: number; end: number } | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        elRef.current?.focus();
      },
      selectRange: (start: number, end: number) => {
        const el = elRef.current;
        if (!el) return;
        const s = Math.max(0, Math.min(start, value.length));
        const e = Math.max(0, Math.min(end, value.length));
        el.focus();
        el.setSelectionRange(s, e);
        // Keep the match visible in long documents.
        const before = value.slice(0, s);
        const line = before.split("\n").length;
        const lineHeight = Number.parseFloat(
          getComputedStyle(el).lineHeight || "20",
        );
        const targetTop = (line - 1) * lineHeight - el.clientHeight / 3;
        el.scrollTop = Math.max(0, targetTop);
      },
    }));

    useLayoutEffect(() => {
      const el = elRef.current;
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
          ref={elRef}
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
  },
);
