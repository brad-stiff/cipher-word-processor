import { useCallback, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { Toolbar } from "./components/Toolbar";
import { StatusBar } from "./components/StatusBar";
import { EditorPane } from "./components/EditorPane";
import { SideBySide } from "./components/SideBySide";
import { RevealView } from "./components/RevealView";
import { useDocument } from "./hooks/useDocument";
import {
  confirmDiscard,
  exportCiphertext,
  openTextFile,
  saveTextFile,
  saveTextFileAs,
} from "./lib/files";
import "./App.css";

function App() {
  const doc = useDocument();

  const handleNew = useCallback(async () => {
    if (!(await confirmDiscard(doc.dirty))) return;
    doc.newDocument();
  }, [doc.dirty, doc.newDocument]);

  const handleOpen = useCallback(async () => {
    if (!(await confirmDiscard(doc.dirty))) return;
    const file = await openTextFile();
    if (file) doc.loadDocument(file.contents, file.path);
  }, [doc.dirty, doc.loadDocument]);

  const handleSave = useCallback(async () => {
    const path = await saveTextFile(doc.text, doc.filePath);
    if (path) doc.markSaved(path);
  }, [doc.text, doc.filePath, doc.markSaved]);

  const handleSaveAs = useCallback(async () => {
    const path = await saveTextFileAs(doc.text);
    if (path) doc.markSaved(path);
  }, [doc.text, doc.markSaved]);

  const handleExport = useCallback(async () => {
    await exportCiphertext(doc.ciphertext);
  }, [doc.ciphertext]);

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
        case "file-export":
          void handleExport();
          break;
        case "view-plain":
          doc.setViewMode("plain");
          break;
        case "view-encrypted":
          doc.setViewMode("encrypted");
          break;
        case "view-side":
          doc.setViewMode("side-by-side");
          break;
        case "view-reveal":
          doc.setViewMode("reveal");
          break;
      }
    }).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, [
    doc.setViewMode,
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleExport,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
      } else if (meta && e.key === "1") {
        e.preventDefault();
        doc.setViewMode("plain");
      } else if (meta && e.key === "2") {
        e.preventDefault();
        doc.setViewMode("encrypted");
      } else if (meta && e.key === "3") {
        e.preventDefault();
        doc.setViewMode("side-by-side");
      } else if (meta && e.key === "4") {
        e.preventDefault();
        doc.setViewMode("reveal");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc.setViewMode, handleNew, handleOpen, handleSave, handleSaveAs]);

  return (
    <div className="app">
      <Toolbar
        settings={doc.settings}
        viewMode={doc.viewMode}
        onSettingsChange={doc.setSettings}
        onViewModeChange={doc.setViewMode}
        onNew={() => void handleNew()}
        onOpen={() => void handleOpen()}
        onSave={() => void handleSave()}
        onSaveAs={() => void handleSaveAs()}
        onExportEncrypted={() => void handleExport()}
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
            readOnly
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
    </div>
  );
}

export default App;
