import { useEffect, useMemo, useRef, useState } from "react";
import {
  findAllMatches,
  replaceAllMatches,
  replaceMatch,
  stepMatchIndex,
} from "../lib/findReplace";

interface FindReplaceBarProps {
  text: string;
  preferReplaceFocus?: boolean;
  onReplaceText: (next: string) => void;
  onSelectMatch: (start: number, end: number) => void;
  onClose: () => void;
}

export function FindReplaceBar({
  text,
  preferReplaceFocus = false,
  onReplaceText,
  onSelectMatch,
  onClose,
}: FindReplaceBarProps) {
  const findRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchIndex, setMatchIndex] = useState<number | null>(null);

  const matches = useMemo(
    () => findAllMatches(text, query, caseSensitive),
    [text, query, caseSensitive],
  );

  useEffect(() => {
    const el = preferReplaceFocus ? replaceRef.current : findRef.current;
    el?.focus();
    el?.select();
  }, [preferReplaceFocus]);

  useEffect(() => {
    if (matches.length === 0) {
      setMatchIndex(null);
      return;
    }
    setMatchIndex((prev) => {
      if (prev === null) return null;
      return Math.min(prev, matches.length - 1);
    });
  }, [matches]);

  const go = (direction: 1 | -1) => {
    const next = stepMatchIndex(matches.length, matchIndex, direction);
    setMatchIndex(next);
    if (next !== null) {
      const match = matches[next];
      if (match) onSelectMatch(match.start, match.end);
    }
  };

  const doReplace = () => {
    if (matchIndex === null) return;
    const match = matches[matchIndex];
    if (!match) return;
    const nextText = replaceMatch(text, match, replacement);
    onReplaceText(nextText);

    const nextMatches = findAllMatches(nextText, query, caseSensitive);
    if (nextMatches.length === 0) {
      setMatchIndex(null);
      return;
    }
    const nextIndex = Math.min(matchIndex, nextMatches.length - 1);
    setMatchIndex(nextIndex);
    const nextMatch = nextMatches[nextIndex];
    if (nextMatch) onSelectMatch(nextMatch.start, nextMatch.end);
  };

  const doReplaceAll = () => {
    if (!query || matches.length === 0) return;
    onReplaceText(replaceAllMatches(text, query, replacement, caseSensitive));
    setMatchIndex(null);
  };

  const status =
    !query
      ? ""
      : matches.length === 0
        ? "No matches"
        : matchIndex === null
          ? `${matches.length} matches`
          : `${matchIndex + 1} of ${matches.length}`;

  return (
    <div
      className="find-bar"
      role="search"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        } else if (e.key === "Enter") {
          e.preventDefault();
          go(e.shiftKey ? -1 : 1);
        }
      }}
    >
      <label className="field find-field">
        <span>Find</span>
        <input
          ref={findRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMatchIndex(null);
          }}
          aria-label="Find"
        />
      </label>

      <label className="field find-field">
        <span>Replace</span>
        <input
          ref={replaceRef}
          type="text"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          aria-label="Replace"
        />
      </label>

      <label className="find-check">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
        />
        Match case
      </label>

      <span className="find-status" aria-live="polite">
        {status}
      </span>

      <div className="find-actions">
        <button type="button" onClick={() => go(-1)} disabled={!matches.length}>
          Previous
        </button>
        <button type="button" onClick={() => go(1)} disabled={!matches.length}>
          Next
        </button>
        <button
          type="button"
          onClick={doReplace}
          disabled={matchIndex === null}
        >
          Replace
        </button>
        <button
          type="button"
          onClick={doReplaceAll}
          disabled={!matches.length}
        >
          Replace all
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
