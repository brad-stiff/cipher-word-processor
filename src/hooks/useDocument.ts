import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  encrypt,
  type CipherSettings,
  type ViewMode,
} from "../ciphers";
import { loadPreferences, savePreferences } from "../lib/preferences";
import { isBlankUntitled, tabTitle } from "../lib/tabs";
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

export interface TabSummary {
  id: string;
  title: string;
  dirty: boolean;
}

interface DocRecord {
  id: string;
  history: TextHistory;
  settings: CipherSettings;
  viewMode: ViewMode;
  filePath: string | null;
  dirty: boolean;
}

export interface DocumentState {
  tabs: TabSummary[];
  activeId: string;
  text: string;
  ciphertext: string;
  settings: CipherSettings;
  viewMode: ViewMode;
  filePath: string | null;
  dirty: boolean;
  anyDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  setActiveId: (id: string) => void;
  setText: (text: string) => void;
  setSettings: (settings: CipherSettings) => void;
  setViewMode: (mode: ViewMode) => void;
  undo: () => void;
  redo: () => void;
  /** 1B: no-op on blank untitled; otherwise opens a new tab. */
  newDocument: () => void;
  /**
   * Load into the blank untitled tab if possible; otherwise create a tab.
   * Returns the tab id that received the document.
   */
  loadDocument: (
    text: string,
    path: string,
    settings: CipherSettings,
  ) => string;
  markSaved: (path: string) => void;
  /**
   * Close a tab. If it was the last tab, reset it to a blank untitled doc.
   * Caller must confirm discard when the tab is dirty.
   */
  closeTab: (id: string) => void;
}

function newId(): string {
  return crypto.randomUUID();
}

function createRecord(
  partial?: Partial<
    Pick<DocRecord, "settings" | "viewMode" | "history" | "filePath" | "dirty">
  >,
): DocRecord {
  const prefs = loadPreferences();
  return {
    id: newId(),
    history: partial?.history ?? createTextHistory(""),
    settings: partial?.settings ?? { ...prefs.settings },
    viewMode: partial?.viewMode ?? prefs.viewMode,
    filePath: partial?.filePath ?? null,
    dirty: partial?.dirty ?? false,
  };
}

function summaryOf(doc: DocRecord): TabSummary {
  return {
    id: doc.id,
    title: tabTitle(doc.filePath),
    dirty: doc.dirty,
  };
}

export function useDocument(): DocumentState {
  const initial = useMemo(() => createRecord(), []);
  const [docs, setDocs] = useState<DocRecord[]>([initial]);
  const [activeId, setActiveIdState] = useState(initial.id);

  const docsRef = useRef(docs);
  docsRef.current = docs;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const lastGroupAtRef = useRef<Map<string, number>>(new Map());

  const active = docs.find((d) => d.id === activeId) ?? docs[0];
  const text = active.history.present;
  const ciphertext = useMemo(
    () => encrypt(text, active.settings),
    [text, active.settings],
  );

  useEffect(() => {
    savePreferences({
      settings: active.settings,
      viewMode: active.viewMode,
    });
  }, [active.settings, active.viewMode]);

  const updateActive = useCallback(
    (recipe: (doc: DocRecord) => DocRecord) => {
      const id = activeIdRef.current;
      setDocs((prev) =>
        prev.map((doc) => (doc.id === id ? recipe(doc) : doc)),
      );
    },
    [],
  );

  const setActiveId = useCallback((id: string) => {
    if (!docsRef.current.some((d) => d.id === id)) return;
    activeIdRef.current = id;
    setActiveIdState(id);
  }, []);

  const setText = useCallback(
    (next: string) => {
      const id = activeIdRef.current;
      const doc = docsRef.current.find((d) => d.id === id);
      if (!doc || next === doc.history.present) return;
      const now = Date.now();
      const last = lastGroupAtRef.current.get(id) ?? 0;
      const recordUndo = now - last > COALESCE_MS;
      lastGroupAtRef.current.set(id, now);
      const history = editText(doc.history, next, { recordUndo });
      updateActive((d) => ({ ...d, history, dirty: true }));
    },
    [updateActive],
  );

  const undo = useCallback(() => {
    const id = activeIdRef.current;
    const doc = docsRef.current.find((d) => d.id === id);
    if (!doc || !canUndo(doc.history)) return;
    lastGroupAtRef.current.set(id, 0);
    updateActive((d) => ({
      ...d,
      history: undoText(d.history),
      dirty: true,
    }));
  }, [updateActive]);

  const redo = useCallback(() => {
    const id = activeIdRef.current;
    const doc = docsRef.current.find((d) => d.id === id);
    if (!doc || !canRedo(doc.history)) return;
    lastGroupAtRef.current.set(id, 0);
    updateActive((d) => ({
      ...d,
      history: redoText(d.history),
      dirty: true,
    }));
  }, [updateActive]);

  const setSettings = useCallback(
    (next: CipherSettings) => {
      updateActive((d) => ({ ...d, settings: next, dirty: true }));
    },
    [updateActive],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      updateActive((d) => ({ ...d, viewMode: mode }));
    },
    [updateActive],
  );

  const newDocument = useCallback(() => {
    const current = docsRef.current.find((d) => d.id === activeIdRef.current);
    if (
      current &&
      isBlankUntitled({
        filePath: current.filePath,
        dirty: current.dirty,
        text: current.history.present,
      })
    ) {
      return;
    }
    const tab = createRecord({
      settings: current ? { ...current.settings } : undefined,
      viewMode: current?.viewMode,
    });
    if (tab.settings.id === "none") {
      tab.viewMode = "plain";
    }
    lastGroupAtRef.current.set(tab.id, 0);
    setDocs((prev) => [...prev, tab]);
    activeIdRef.current = tab.id;
    setActiveIdState(tab.id);
  }, []);

  const loadDocument = useCallback(
    (nextText: string, path: string, nextSettings: CipherSettings) => {
      const current = docsRef.current.find((d) => d.id === activeIdRef.current);
      const reuse =
        current &&
        isBlankUntitled({
          filePath: current.filePath,
          dirty: current.dirty,
          text: current.history.present,
        });

      const viewMode =
        nextSettings.id === "none"
          ? "plain"
          : (current?.viewMode ?? loadPreferences().viewMode);

      if (reuse && current) {
        lastGroupAtRef.current.set(current.id, 0);
        setDocs((prev) =>
          prev.map((doc) =>
            doc.id === current.id
              ? {
                  ...doc,
                  history: replaceText(doc.history, nextText),
                  settings: nextSettings,
                  viewMode,
                  filePath: path,
                  dirty: false,
                }
              : doc,
          ),
        );
        return current.id;
      }

      const tab = createRecord({
        history: createTextHistory(nextText),
        settings: nextSettings,
        viewMode,
        filePath: path,
        dirty: false,
      });
      lastGroupAtRef.current.set(tab.id, 0);
      setDocs((prev) => [...prev, tab]);
      activeIdRef.current = tab.id;
      setActiveIdState(tab.id);
      return tab.id;
    },
    [],
  );

  const markSaved = useCallback(
    (path: string) => {
      updateActive((d) => ({ ...d, filePath: path, dirty: false }));
    },
    [updateActive],
  );

  const closeTab = useCallback((id: string) => {
    const list = docsRef.current;
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) return;

    lastGroupAtRef.current.delete(id);

    if (list.length === 1) {
      const prefs = loadPreferences();
      const reset: DocRecord = {
        ...list[0],
        history: createTextHistory(""),
        settings: { ...prefs.settings },
        viewMode:
          prefs.settings.id === "none" ? "plain" : prefs.viewMode,
        filePath: null,
        dirty: false,
      };
      lastGroupAtRef.current.set(reset.id, 0);
      setDocs([reset]);
      activeIdRef.current = reset.id;
      setActiveIdState(reset.id);
      return;
    }

    const nextDocs = list.filter((d) => d.id !== id);
    let nextActive = activeIdRef.current;
    if (nextActive === id) {
      const neighbor = nextDocs[Math.max(0, index - 1)] ?? nextDocs[0];
      nextActive = neighbor.id;
    }
    setDocs(nextDocs);
    activeIdRef.current = nextActive;
    setActiveIdState(nextActive);
  }, []);

  return {
    tabs: docs.map(summaryOf),
    activeId: active.id,
    text,
    ciphertext,
    settings: active.settings,
    viewMode: active.viewMode,
    filePath: active.filePath,
    dirty: active.dirty,
    anyDirty: docs.some((d) => d.dirty),
    canUndo: canUndo(active.history),
    canRedo: canRedo(active.history),
    setActiveId,
    setText,
    setSettings,
    setViewMode,
    undo,
    redo,
    newDocument,
    loadDocument,
    markSaved,
    closeTab,
  };
}
