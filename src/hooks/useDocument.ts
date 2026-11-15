import { useCallback, useEffect, useMemo, useState } from "react";
import {
  encrypt,
  type CipherSettings,
  type ViewMode,
} from "../ciphers";
import { loadPreferences, savePreferences } from "../lib/preferences";

export interface DocumentState {
  text: string;
  ciphertext: string;
  settings: CipherSettings;
  viewMode: ViewMode;
  filePath: string | null;
  dirty: boolean;
  setText: (text: string) => void;
  setSettings: (settings: CipherSettings) => void;
  setViewMode: (mode: ViewMode) => void;
  newDocument: () => void;
  loadDocument: (text: string, path: string | null) => void;
  markSaved: (path: string) => void;
}

export function useDocument(): DocumentState {
  const initial = useMemo(() => loadPreferences(), []);
  const [text, setTextState] = useState("");
  const [settings, setSettingsState] = useState<CipherSettings>(
    initial.settings,
  );
  const [viewMode, setViewModeState] = useState<ViewMode>(initial.viewMode);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const ciphertext = useMemo(
    () => encrypt(text, settings),
    [text, settings],
  );

  useEffect(() => {
    savePreferences({ settings, viewMode });
  }, [settings, viewMode]);

  const setText = useCallback((next: string) => {
    setTextState(next);
    setDirty(true);
  }, []);

  const setSettings = useCallback((next: CipherSettings) => {
    setSettingsState(next);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const newDocument = useCallback(() => {
    setTextState("");
    setFilePath(null);
    setDirty(false);
  }, []);

  const loadDocument = useCallback((next: string, path: string | null) => {
    setTextState(next);
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
    setText,
    setSettings,
    setViewMode,
    newDocument,
    loadDocument,
    markSaved,
  };
}
