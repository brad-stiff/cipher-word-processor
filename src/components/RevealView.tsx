import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type UIEvent,
} from "react";
import type { EditorPaneHandle } from "./EditorPane";

interface RevealViewProps {
  plain: string;
  encrypted: string;
  onPlainChange: (value: string) => void;
}

export const RevealView = forwardRef<EditorPaneHandle, RevealViewProps>(
  function RevealView({ plain, encrypted, onPlainChange }, ref) {
  const [split, setSplit] = useState(0.45);
  const containerRef = useRef<HTMLDivElement>(null);
  const encryptedRef = useRef<HTMLPreElement>(null);
  const plainRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragging = useRef(false);
  const syncing = useRef(false);

  const syncScrollFromInput = useCallback(() => {
    if (syncing.current) return;
    const from = inputRef.current;
    if (!from) return;
    syncing.current = true;
    for (const to of [encryptedRef.current, plainRef.current]) {
      if (!to) continue;
      to.scrollTop = from.scrollTop;
      to.scrollLeft = from.scrollLeft;
    }
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      selectRange: (start: number, end: number) => {
        const el = inputRef.current;
        if (!el) return;
        const s = Math.max(0, Math.min(start, plain.length));
        const e = Math.max(0, Math.min(end, plain.length));
        el.focus();
        el.setSelectionRange(s, e);
        const before = plain.slice(0, s);
        const line = before.split("\n").length;
        const lineHeight = Number.parseFloat(
          getComputedStyle(el).lineHeight || "20",
        );
        const targetTop = (line - 1) * lineHeight - el.clientHeight / 3;
        el.scrollTop = Math.max(0, targetTop);
        syncScrollFromInput();
      },
    }),
    [plain.length, syncScrollFromInput],
  );

  const onInputScroll = useCallback(
    (_e: UIEvent<HTMLTextAreaElement>) => {
      syncScrollFromInput();
    },
    [syncScrollFromInput],
  );

  const onPointerMove = useCallback((clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = (clientY - rect.top) / rect.height;
    setSplit(Math.min(1, Math.max(0, next)));
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

  // Lift Encrypted out as the Plain label approaches the top
  const encryptedFadeStart = 0.16;
  const encryptedFadeEnd = 0.05;
  const encryptedVisible = Math.min(
    1,
    Math.max(
      0,
      (split - encryptedFadeEnd) / (encryptedFadeStart - encryptedFadeEnd),
    ),
  );

  return (
    <div className="reveal" ref={containerRef}>
      <div
        className="reveal-label reveal-label-encrypted"
        style={{
          opacity: encryptedVisible,
          transform: `translateY(${(1 - encryptedVisible) * -0.75}rem)`,
        }}
        aria-hidden={encryptedVisible < 0.05}
      >
        Encrypted
      </div>
      <div
        className="reveal-label reveal-label-plain"
        style={{ top: `${topPct}%` }}
      >
        Plain
      </div>

      <pre
        ref={plainRef}
        className="editor reveal-full reveal-plain-layer"
        aria-hidden="true"
      >
        {plain}
      </pre>

      <pre
        ref={encryptedRef}
        className="editor reveal-full reveal-encrypted-layer"
        style={{ clipPath: `inset(0 0 ${bottomClip}% 0)` }}
        aria-hidden="true"
      >
        {encrypted}
      </pre>

      <textarea
        ref={inputRef}
        className="editor reveal-full reveal-input-layer"
        value={plain}
        spellCheck={false}
        aria-label="Plain"
        onChange={(e) => onPlainChange(e.target.value)}
        onScroll={onInputScroll}
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
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reveal divider"
        tabIndex={0}
      >
        <span className="reveal-handle" />
      </div>
    </div>
  );
});
