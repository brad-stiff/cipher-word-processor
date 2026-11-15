import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Toolbar } from "./components/Toolbar";
import { StatusBar } from "./components/StatusBar";
import { EditorPane } from "./components/EditorPane";
import { SideBySide } from "./components/SideBySide";
import { RevealView } from "./components/RevealView";
import { OpenDecryptDialog } from "./components/OpenDecryptDialog";
import { useDocument } from "./hooks/useDocument";
import { encrypt, type CipherSettings } from "./ciphers";
import {
  confirmDiscard,
  openTextFile,
  saveTextFile,
  saveTextFileAs,
} from "./lib/files";
import { plaintextFromEncryptedEdit } from "./lib/encryptedEdit";
import "./App.css";

interface PendingOpen {
  path: string;
  contents: string;
}

function App() {
  const doc = useDocument();
  const dirtyRef = useRef(doc.dirty);
  dirtyRef.current = doc.dirty;
  const [pendingOpen, setPendingOpen] = useState<PendingOpen | null>(null);

  const handleNew = useCallback(async () => {
    if (!(await confirmDiscard(doc.dirty))) return;
    doc.newDocument();
  }, [doc.dirty, doc.newDocument]);

  const handleOpen = useCallback(async () => {
    if (!(await confirmDiscard(doc.dirty))) return;
    const file = await openTextFile();
    if (file) setPendingOpen(file);
  }, [doc.dirty]);

  const handleOpenConfirm = useCallback(
    (settings: CipherSettings) => {
      if (!pendingOpen) return;
      if (settings.id === "none" && doc.viewMode !== "plain") {
        doc.setViewMode("plain");
      }
      doc.loadEncryptedFile(
        pendingOpen.contents,
        pendingOpen.path,
        settings,
      );
      setPendingOpen(null);
    },
    [pendingOpen, doc.setViewMode, doc.loadEncryptedFile, doc.viewMode],
  );

  const handleSettingsChange = useCallback(
    (settings: CipherSettings) => {
      if (settings.id === "none" && doc.viewMode !== "plain") {
        doc.setViewMode("plain");
      }
      doc.setSettings(settings);
    },
    [doc.setSettings, doc.setViewMode, doc.viewMode],
  );

  const handleSave = useCallback(async () => {
    const contents = encrypt(doc.text, doc.settings);
    const path = await saveTextFile(contents, doc.filePath);
    if (path) doc.markSaved(path);
  }, [doc.text, doc.settings, doc.filePath, doc.markSaved]);

  const handleSaveAs = useCallback(async () => {
    const contents = encrypt(doc.text, doc.settings);
    const path = await saveTextFileAs(contents);
    if (path) doc.markSaved(path);
  }, [doc.text, doc.settings, doc.markSaved]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void getCurrentWindow()
      .onCloseRequested(async (event) => {
        if (!dirtyRef.current) return;
        const allow = await confirmDiscard(true);
        if (!allow) event.preventDefault();
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen<string>("menu-action", (event) => {
      switch (event.payload) {
        case "file-new":
          void handleNew();
          break;
        case "file-open":
          void handleOpen();
          break;
        case "file-save":
          void handleSave();
          break;
        case "file-save-as":
          void handleSaveAs();
          break;
        case "edit-undo":
          doc.undo();
          break;
        case "edit-redo":
          doc.redo();
          break;
        case "view-plain":
          doc.setViewMode("plain");
          break;
        case "view-encrypted":
          if (doc.settings.id !== "none") doc.setViewMode("encrypted");
          break;
        case "view-side":
          if (doc.settings.id !== "none") doc.setViewMode("side-by-side");
          break;
        case "view-reveal":
          if (doc.settings.id !== "none") doc.setViewMode("reveal");
          break;
      }
    }).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, [
    doc.setViewMode,
    doc.undo,
    doc.redo,
    doc.settings.id,
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pendingOpen) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) void handleSaveAs();
        else void handleSave();
      } else if (meta && e.key === "o") {
        e.preventDefault();
        void handleOpen();
      } else if (meta && e.key === "n") {
        e.preventDefault();
        void handleNew();
      } else if (meta && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) doc.redo();
        else doc.undo();
      } else if (meta && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        doc.redo();
      } else if (meta && e.key === "1") {
        e.preventDefault();
        doc.setViewMode("plain");
      } else if (meta && e.key === "2") {
        e.preventDefault();
        if (doc.settings.id !== "none") doc.setViewMode("encrypted");
      } else if (meta && e.key === "3") {
        e.preventDefault();
        if (doc.settings.id !== "none") doc.setViewMode("side-by-side");
      } else if (meta && e.key === "4") {
        e.preventDefault();
        if (doc.settings.id !== "none") doc.setViewMode("reveal");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    pendingOpen,
    doc.setViewMode,
    doc.undo,
    doc.redo,
    doc.settings.id,
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
  ]);

  const pendingName = pendingOpen
    ? pendingOpen.path.split(/[/\\]/).pop() ?? pendingOpen.path
    : "";

  return (
    <div className="app">
      <Toolbar
        settings={doc.settings}
        viewMode={doc.viewMode}
        canUndo={doc.canUndo}
        canRedo={doc.canRedo}
        onSettingsChange={handleSettingsChange}
        onViewModeChange={doc.setViewMode}
        onNew={() => void handleNew()}
        onOpen={() => void handleOpen()}
        onSave={() => void handleSave()}
        onSaveAs={() => void handleSaveAs()}
        onUndo={doc.undo}
        onRedo={doc.redo}
      />

      <main className="workspace">
        {doc.viewMode === "plain" && (
          <EditorPane
            label="Plain"
            value={doc.text}
            onChange={doc.setText}
          />
        )}
        {doc.viewMode === "encrypted" && (
          <EditorPane
            label="Encrypted"
            value={doc.ciphertext}
            onChange={(next) =>
              doc.setText(
                plaintextFromEncryptedEdit(doc.text, doc.ciphertext, next),
              )
            }
          />
        )}
        {doc.viewMode === "side-by-side" && (
          <SideBySide
            plain={doc.text}
            encrypted={doc.ciphertext}
            onPlainChange={doc.setText}
          />
        )}
        {doc.viewMode === "reveal" && (
          <RevealView
            plain={doc.text}
            encrypted={doc.ciphertext}
            onPlainChange={doc.setText}
          />
        )}
      </main>

      <StatusBar
        settings={doc.settings}
        charCount={doc.text.length}
        dirty={doc.dirty}
        filePath={doc.filePath}
      />

      {pendingOpen && (
        <OpenDecryptDialog
          fileName={pendingName}
          initialSettings={doc.settings}
          onConfirm={handleOpenConfirm}
          onCancel={() => setPendingOpen(null)}
        />
      )}
    </div>
  );
}

export default App;
