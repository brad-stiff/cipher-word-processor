import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  encrypt,
  type CipherSettings,
  type ViewMode,
} from "../ciphers";
import { loadPreferences, savePreferences } from "../lib/preferences";
import {
  canRedo,
  canUndo,
  createTextHistory,
  editText,
  redoText,
  replaceText,
  undoText,
  type TextHistory,
} from "../lib/textHistory";

const COALESCE_MS = 500;

export interface DocumentState {
  text: string;
  ciphertext: string;
  settings: CipherSettings;
  viewMode: ViewMode;
  filePath: string | null;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  setText: (text: string) => void;
  setSettings: (settings: CipherSettings) => void;
  setViewMode: (mode: ViewMode) => void;
  undo: () => void;
  redo: () => void;
  newDocument: () => void;
  loadDocument: (text: string, path: string | null) => void;
  markSaved: (path: string) => void;
}

export function useDocument(): DocumentState {
  const initial = useMemo(() => loadPreferences(), []);
  const [history, setHistory] = useState<TextHistory>(() =>
    createTextHistory(""),
  );
  const [settings, setSettingsState] = useState<CipherSettings>(
    initial.settings,
  );
  const [viewMode, setViewModeState] = useState<ViewMode>(initial.viewMode);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const historyRef = useRef(history);
  historyRef.current = history;
  const lastGroupAt = useRef(0);

  const text = history.present;

  const ciphertext = useMemo(
    () => encrypt(text, settings),
    [text, settings],
  );

  useEffect(() => {
    savePreferences({ settings, viewMode });
  }, [settings, viewMode]);

  const setText = useCallback((next: string) => {
    const prev = historyRef.current;
    if (next === prev.present) return;
    const now = Date.now();
    const recordUndo = now - lastGroupAt.current > COALESCE_MS;
    lastGroupAt.current = now;
    const updated = editText(prev, next, { recordUndo });
    historyRef.current = updated;
    setHistory(updated);
    setDirty(true);
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current;
    if (!canUndo(prev)) return;
    lastGroupAt.current = 0;
    const updated = undoText(prev);
    historyRef.current = updated;
    setHistory(updated);
    setDirty(true);
  }, []);

  const redo = useCallback(() => {
    const prev = historyRef.current;
    if (!canRedo(prev)) return;
    lastGroupAt.current = 0;
    const updated = redoText(prev);
    historyRef.current = updated;
    setHistory(updated);
    setDirty(true);
  }, []);

  const setSettings = useCallback((next: CipherSettings) => {
    setSettingsState(next);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const newDocument = useCallback(() => {
    lastGroupAt.current = 0;
    const updated = createTextHistory("");
    historyRef.current = updated;
    setHistory(updated);
    setFilePath(null);
    setDirty(false);
  }, []);

  const loadDocument = useCallback((next: string, path: string | null) => {
    lastGroupAt.current = 0;
    const updated = replaceText(historyRef.current, next);
    historyRef.current = updated;
    setHistory(updated);
    setFilePath(path);
    setDirty(false);
  }, []);

  const markSaved = useCallback((path: string) => {
    setFilePath(path);
    setDirty(false);
  }, []);

  return {
    text,
    ciphertext,
    settings,
    viewMode,
    filePath,
    dirty,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
    setText,
    setSettings,
    setViewMode,
    undo,
    redo,
    newDocument,
    loadDocument,
    markSaved,
  };
}
