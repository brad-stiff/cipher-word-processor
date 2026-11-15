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
  return (
    <div className={`pane ${className}`.trim()}>
      <div className="pane-label">{label}</div>
      <textarea
        className="editor"
        value={value}
        readOnly={readOnly}
        spellCheck={false}
        aria-label={label}
        onChange={
          onChange && !readOnly
            ? (e) => onChange(e.target.value)
            : undefined
        }
      />
    </div>
  );
}
