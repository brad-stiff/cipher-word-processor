import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type UIEvent,
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
  const encryptedRef = useRef<HTMLPreElement>(null);
  const plainRef = useRef<HTMLTextAreaElement>(null);
  const dragging = useRef(false);
  const syncing = useRef(false);

  const syncScroll = useCallback((source: "encrypted" | "plain") => {
    if (syncing.current) return;
    const from =
      source === "encrypted" ? encryptedRef.current : plainRef.current;
    const to =
      source === "encrypted" ? plainRef.current : encryptedRef.current;
    if (!from || !to) return;
    syncing.current = true;
    to.scrollTop = from.scrollTop;
    to.scrollLeft = from.scrollLeft;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  const onEncryptedScroll = useCallback(
    (_e: UIEvent<HTMLPreElement>) => {
      syncScroll("encrypted");
    },
    [syncScroll],
  );

  const onPlainScroll = useCallback(
    (_e: UIEvent<HTMLTextAreaElement>) => {
      syncScroll("plain");
    },
    [syncScroll],
  );

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

  const topPct = split * 100;
  const bottomClip = 100 - topPct;

  return (
    <div className="reveal" ref={containerRef}>
      <div className="reveal-label reveal-label-encrypted">Encrypted</div>
      <div
        className="reveal-label reveal-label-plain"
        style={{ top: `${topPct}%` }}
      >
        Plain
      </div>

      <pre
        ref={encryptedRef}
        className="editor reveal-full reveal-encrypted-layer"
        style={{ clipPath: `inset(0 0 ${bottomClip}% 0)` }}
        aria-label="Encrypted"
        onScroll={onEncryptedScroll}
      >
        {encrypted}
      </pre>

      <textarea
        ref={plainRef}
        className="editor reveal-full reveal-plain-layer"
        style={{ clipPath: `inset(${topPct}% 0 0 0)` }}
        value={plain}
        spellCheck={false}
        aria-label="Plain"
        onChange={(e) => onPlainChange(e.target.value)}
        onScroll={onPlainScroll}
      />

      <div
        className="reveal-divider"
        style={{ top: `${topPct}%` }}
        onPointerDown={startDrag}
        onPointerMove={onDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="separator"
        aria-orientation="horizontal"
        aria-valuenow={Math.round(topPct)}
        aria-label="Reveal divider"
        tabIndex={0}
      >
        <span className="reveal-handle" />
      </div>
    </div>
  );
}
