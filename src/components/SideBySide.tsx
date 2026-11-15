import { useRef, useCallback } from "react";
import { EditorPane } from "./EditorPane";

interface SideBySideProps {
  plain: string;
  encrypted: string;
  onPlainChange: (value: string) => void;
}

export function SideBySide({
  plain,
  encrypted,
  onPlainChange,
}: SideBySideProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const syncScroll = useCallback((source: "left" | "right") => {
    if (syncing.current) return;
    const from =
      source === "left"
        ? leftRef.current?.querySelector("textarea")
        : rightRef.current?.querySelector("textarea");
    const to =
      source === "left"
        ? rightRef.current?.querySelector("textarea")
        : leftRef.current?.querySelector("textarea");
    if (!from || !to) return;
    syncing.current = true;
    to.scrollTop = from.scrollTop;
    to.scrollLeft = from.scrollLeft;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  return (
    <div className="side-by-side">
      <div
        ref={leftRef}
        className="side-pane"
        onScrollCapture={() => syncScroll("left")}
      >
        <EditorPane
          label="Plain"
          value={plain}
          onChange={onPlainChange}
        />
      </div>
      <div className="side-divider" aria-hidden />
      <div
        ref={rightRef}
        className="side-pane"
        onScrollCapture={() => syncScroll("right")}
      >
        <EditorPane label="Encrypted" value={encrypted} readOnly />
      </div>
    </div>
  );
}
