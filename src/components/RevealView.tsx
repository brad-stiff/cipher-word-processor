import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

interface RevealViewProps {
  plain: string;
  encrypted: string;
  onPlainChange: (value: string) => void;
}

export function RevealView({
  plain,
  encrypted,
  onPlainChange,
}: RevealViewProps) {
  const [split, setSplit] = useState(0.45);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onPointerMove = useCallback((clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = (clientY - rect.top) / rect.height;
    setSplit(Math.min(0.9, Math.max(0.1, next)));
  }, []);

  const startDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onPointerMove(e.clientY);
    },
    [onPointerMove],
  );

  const onDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      onPointerMove(e.clientY);
    },
    [onPointerMove],
  );

  const endDrag = useCallback(() => {
    dragging.current = false;
  }, []);

  const topPct = `${split * 100}%`;

  return (
    <div className="reveal" ref={containerRef}>
      <div className="reveal-layer reveal-encrypted" style={{ height: topPct }}>
        <div className="pane-label">Encrypted</div>
        <pre className="editor reveal-text" aria-label="Encrypted">
          {encrypted}
        </pre>
      </div>

      <div
        className="reveal-divider"
        style={{ top: topPct }}
        onPointerDown={startDrag}
        onPointerMove={onDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="separator"
        aria-orientation="horizontal"
        aria-valuenow={Math.round(split * 100)}
        aria-label="Reveal divider"
        tabIndex={0}
      >
        <span className="reveal-handle" />
      </div>

      <div
        className="reveal-layer reveal-plain"
        style={{ top: topPct, height: `${(1 - split) * 100}%` }}
      >
        <div className="pane-label">Plain</div>
        <textarea
          className="editor"
          value={plain}
          spellCheck={false}
          aria-label="Plain"
          onChange={(e) => onPlainChange(e.target.value)}
        />
      </div>
    </div>
  );
}
