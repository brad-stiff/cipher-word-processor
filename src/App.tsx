import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Toolbar } from "./components/Toolbar";
import { StatusBar } from "./components/StatusBar";
import { EditorPane, type EditorPaneHandle } from "./components/EditorPane";
import { SideBySide } from "./components/SideBySide";
import { RevealView } from "./components/RevealView";
import { PasswordDialog } from "./components/PasswordDialog";
import { FindReplaceBar } from "./components/FindReplaceBar";
import { useDocument } from "./hooks/useDocument";
import {
  cipherPreservesLength,
  DEFAULT_SETTINGS,
  type CipherSettings,
} from "./ciphers";
import {
  confirmDiscard,
  openDocumentFile,
  saveLockedFile,
  saveLockedFileAs,
  savePlainTextFile,
  savePlainTextFileAs,
} from "./lib/files";
import { plaintextFromEncryptedEdit } from "./lib/encryptedEdit";
import { isVaultFile, sealVault, unlockVault } from "./lib/vault";
import "./App.css";

interface PendingUnlock {
  path: string;
  contents: string;
}

type PasswordPrompt =
  | { kind: "unlock"; pending: PendingUnlock }
  | { kind: "set"; saveAs: boolean };

function fileName(path: string): string {
  return path.split(/[/\\]/).pop() ?? path;
}

function App() {
  const doc = useDocument();
  const dirtyRef = useRef(doc.dirty);
  dirtyRef.current = doc.dirty;

  const [findOpen, setFindOpen] = useState(false);
  const [findPreferReplace, setFindPreferReplace] = useState(false);
  const [findNonce, setFindNonce] = useState(0);
  const [passwordPrompt, setPasswordPrompt] = useState<PasswordPrompt | null>(
    null,
  );
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const editorRef = useRef<EditorPaneHandle>(null);
  const sessionPasswordRef = useRef<string | null>(null);
  const allowsEncryptedEdit = cipherPreservesLength(doc.settings.id);

  const clearSessionPassword = useCallback(() => {
    sessionPasswordRef.current = null;
  }, []);

  const handleNew = useCallback(async () => {
    if (!(await confirmDiscard(doc.dirty))) return;
    clearSessionPassword();
    doc.newDocument();
  }, [doc.dirty, doc.newDocument, clearSessionPassword]);

  const handleOpen = useCallback(async () => {
    if (!(await confirmDiscard(doc.dirty))) return;
    const file = await openDocumentFile();
    if (!file) return;

    if (isVaultFile(file.contents)) {
      setPasswordError(null);
      setPasswordPrompt({ kind: "unlock", pending: file });
      return;
    }

    clearSessionPassword();
    doc.loadDocument(file.contents, file.path, {
      ...DEFAULT_SETTINGS,
      id: "none",
    });
  }, [doc.dirty, doc.loadDocument, clearSessionPassword]);

  const writeLocked = useCallback(
    async (password: string, saveAs: boolean) => {
      const contents = await sealVault(
        { text: doc.text, settings: doc.settings },
        password,
      );
      const path = saveAs
        ? await saveLockedFileAs(contents)
        : await saveLockedFile(contents, doc.filePath);
      if (!path) return false;
      sessionPasswordRef.current = password;
      doc.markSaved(path);
      return true;
    },
    [doc.text, doc.settings, doc.filePath, doc.markSaved],
  );

  const writePlain = useCallback(
    async (saveAs: boolean) => {
      const path = saveAs
        ? await savePlainTextFileAs(doc.text)
        : await savePlainTextFile(doc.text, doc.filePath);
      if (!path) return;
      clearSessionPassword();
      doc.markSaved(path);
    },
    [doc.text, doc.filePath, doc.markSaved, clearSessionPassword],
  );

  const handleSave = useCallback(async () => {
    if (doc.settings.id === "none") {
      await writePlain(false);
      return;
    }
    if (sessionPasswordRef.current) {
      await writeLocked(sessionPasswordRef.current, false);
      return;
    }
    setPasswordError(null);
    setPasswordPrompt({ kind: "set", saveAs: false });
  }, [doc.settings.id, writePlain, writeLocked]);

  const handleSaveAs = useCallback(async () => {
    if (doc.settings.id === "none") {
      await writePlain(true);
      return;
    }
    if (sessionPasswordRef.current) {
      await writeLocked(sessionPasswordRef.current, true);
      return;
    }
    setPasswordError(null);
    setPasswordPrompt({ kind: "set", saveAs: true });
  }, [doc.settings.id, writePlain, writeLocked]);

  const handlePasswordConfirm = useCallback(
    async (password: string) => {
      if (!passwordPrompt) return;
      setPasswordBusy(true);
      setPasswordError(null);
      try {
        if (passwordPrompt.kind === "unlock") {
          const payload = await unlockVault(
            passwordPrompt.pending.contents,
            password,
          );
          sessionPasswordRef.current = password;
          doc.loadDocument(
            payload.text,
            passwordPrompt.pending.path,
            payload.settings,
          );
          setPasswordPrompt(null);
        } else {
          const ok = await writeLocked(password, passwordPrompt.saveAs);
          if (ok) setPasswordPrompt(null);
        }
      } catch (err) {
        setPasswordError(
          err instanceof Error ? err.message : "Could not use that password.",
        );
      } finally {
        setPasswordBusy(false);
      }
    },
    [passwordPrompt, doc.loadDocument, writeLocked],
  );

  const handleSettingsChange = useCallback(
    (settings: CipherSettings) => {
      if (settings.id === "none" && doc.viewMode !== "plain") {
        doc.setViewMode("plain");
      }
      // Switching into or out of locked saves invalidates a prior password
      // only when leaving locked mode; staying locked can reuse the session.
      if (settings.id === "none") {
        clearSessionPassword();
      }
      doc.setSettings(settings);
    },
    [doc.setSettings, doc.setViewMode, doc.viewMode, clearSessionPassword],
  );

  const openFind = useCallback((preferReplace = false) => {
    setFindPreferReplace(preferReplace);
    setFindOpen(true);
    setFindNonce((n) => n + 1);
  }, []);

  const closeFind = useCallback(() => {
    setFindOpen(false);
    editorRef.current?.focus();
  }, []);

  const selectMatch = useCallback((start: number, end: number) => {
    editorRef.current?.selectRange(start, end);
  }, []);

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
        case "edit-find":
          openFind(false);
          break;
        case "edit-replace":
          openFind(true);
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
    openFind,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (passwordPrompt) return;
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
      } else if (meta && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        openFind(false);
      } else if (meta && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        openFind(true);
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
    passwordPrompt,
    doc.setViewMode,
    doc.undo,
    doc.redo,
    doc.settings.id,
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    openFind,
  ]);

  return (
    <div className={`app${findOpen ? " app-with-find" : ""}`}>
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

      {findOpen && (
        <FindReplaceBar
          key={findNonce}
          text={doc.text}
          preferReplaceFocus={findPreferReplace}
          onReplaceText={doc.setText}
          onSelectMatch={selectMatch}
          onClose={closeFind}
        />
      )}

      <main className="workspace">
        {doc.viewMode === "plain" && (
          <EditorPane
            ref={editorRef}
            label="Plain"
            value={doc.text}
            onChange={doc.setText}
          />
        )}
        {doc.viewMode === "encrypted" && (
          <EditorPane
            ref={editorRef}
            label="Encrypted"
            value={doc.ciphertext}
            readOnly={!allowsEncryptedEdit}
            onChange={
              allowsEncryptedEdit
                ? (next) =>
                    doc.setText(
                      plaintextFromEncryptedEdit(
                        doc.text,
                        doc.ciphertext,
                        next,
                      ),
                    )
                : undefined
            }
          />
        )}
        {doc.viewMode === "side-by-side" && (
          <SideBySide
            ref={editorRef}
            plain={doc.text}
            encrypted={doc.ciphertext}
            encryptedEditable={allowsEncryptedEdit}
            onPlainChange={doc.setText}
          />
        )}
        {doc.viewMode === "reveal" && (
          <RevealView
            ref={editorRef}
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

      {passwordPrompt && (
        <PasswordDialog
          mode={passwordPrompt.kind === "unlock" ? "unlock" : "set"}
          fileName={
            passwordPrompt.kind === "unlock"
              ? fileName(passwordPrompt.pending.path)
              : undefined
          }
          error={passwordError}
          busy={passwordBusy}
          onConfirm={(password) => void handlePasswordConfirm(password)}
          onCancel={() => {
            if (passwordBusy) return;
            setPasswordPrompt(null);
            setPasswordError(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
