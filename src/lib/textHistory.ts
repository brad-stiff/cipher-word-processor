const DEFAULT_MAX = 100;

export interface TextHistory {
  past: string[];
  present: string;
  future: string[];
}

export function createTextHistory(present = ""): TextHistory {
  return { past: [], present, future: [] };
}

export function editText(
  history: TextHistory,
  next: string,
  options: { recordUndo: boolean; max?: number } = { recordUndo: true },
): TextHistory {
  if (next === history.present) return history;
  const max = options.max ?? DEFAULT_MAX;
  if (!options.recordUndo) {
    return { ...history, present: next };
  }
  const past =
    history.past[history.past.length - 1] === history.present
      ? history.past
      : [...history.past, history.present].slice(-max);
  return { past, present: next, future: [] };
}

export function undoText(history: TextHistory): TextHistory {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [...history.future, history.present],
  };
}

export function redoText(history: TextHistory): TextHistory {
  if (history.future.length === 0) return history;
  const next = history.future[history.future.length - 1];
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(0, -1),
  };
}

export function replaceText(_history: TextHistory, present: string): TextHistory {
  return { past: [], present, future: [] };
}

export function canUndo(history: TextHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: TextHistory): boolean {
  return history.future.length > 0;
}
