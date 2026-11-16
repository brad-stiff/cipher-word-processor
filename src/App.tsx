import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Toolbar } from "./components/Toolbar";
import { TabBar } from "./components/TabBar";
import { StatusBar } from "./components/StatusBar";
import { EditorPane, type EditorPaneHandle } from "./components/EditorPane";
import { SideBySide } from "./components/SideBySide";
import { RevealView } from "./components/RevealView";
import { PasswordDialog } from "./components/PasswordDialog";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";
import { CheatSheetDialog } from "./components/CheatSheetDialog";
import {
  PrintDialog,
  type PrintLayout,
} from "./components/PrintDialog";
import { FindReplaceBar } from "./components/FindReplaceBar";
import { useDocument } from "./hooks/useDocument";
import {
  CIPHERS,
  cipherPreservesLength,
  DEFAULT_SETTINGS,
  type CipherSettings,
} from "./ciphers";
import {
  confirmDiscard,
  exportCiphertextFile,
  openDocumentFile,
  readTextFile,
  saveLockedFile,
  saveLockedFileAs,
  savePlainTextFile,
  savePlainTextFileAs,
  showInfo,
  writeTextFile,
} from "./lib/files";
import { plaintextFromEncryptedEdit } from "./lib/encryptedEdit";
import {
  isVaultFile,
  pathLooksLocked,
  sealVault,
  unlockVault,
} from "./lib/vault";
import { tabTitle } from "./lib/tabs";
import "./App.css";

interface PendingUnlock {
  path: string;
  contents: string;
}

type PasswordPrompt =
  | { kind: "unlock"; pending: PendingUnlock }
  | { kind: "set"; saveAs: boolean };

function fileName(path: string): string {
  return tabTitle(path);
}

function App() {
  const doc = useDocument();
  const anyDirtyRef = useRef(doc.anyDirty);
  anyDirtyRef.current = doc.anyDirty;
  const activeIdRef = useRef(doc.activeId);
  activeIdRef.current = doc.activeId;

  const [findOpen, setFindOpen] = useState(false);
  const [findPreferReplace, setFindPreferReplace] = useState(false);
  const [findNonce, setFindNonce] = useState(0);
  const [passwordPrompt, setPasswordPrompt] = useState<PasswordPrompt | null>(
    null,
  );
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(
    null,
  );
  const [changePasswordBusy, setChangePasswordBusy] = useState(false);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printLayout, setPrintLayout] = useState<PrintLayout>("plain");
  const [printNonce, setPrintNonce] = useState(0);

  const editorRef = useRef<EditorPaneHandle>(null);
  const sessionPasswordsRef = useRef<Map<string, string>>(new Map());
  const allowsEncryptedEdit = cipherPreservesLength(doc.settings.id);

  const getSessionPassword = useCallback(
    () => sessionPasswordsRef.current.get(activeIdRef.current) ?? null,
    [],
  );

  const setSessionPassword = useCallback((tabId: string, password: string) => {
    sessionPasswordsRef.current.set(tabId, password);
  }, []);

  const clearSessionPassword = useCallback((tabId?: string) => {
    sessionPasswordsRef.current.delete(tabId ?? activeIdRef.current);
  }, []);

  const handleNew = useCallback(() => {
    doc.newDocument();
  }, [doc.newDocument]);

  const handleOpen = useCallback(async () => {
    const file = await openDocumentFile();
    if (!file) return;

    if (isVaultFile(file.contents)) {
      setPasswordError(null);
      setPasswordPrompt({ kind: "unlock", pending: file });
      return;
    }

    const tabId = doc.loadDocument(file.contents, file.path, {
      ...DEFAULT_SETTINGS,
      id: "none",
    });
    clearSessionPassword(tabId);
  }, [doc.loadDocument, clearSessionPassword]);

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
      setSessionPassword(activeIdRef.current, password);
      doc.markSaved(path);
      return true;
    },
    [doc.text, doc.settings, doc.filePath, doc.markSaved, setSessionPassword],
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
    const existing = getSessionPassword();
    if (existing) {
      await writeLocked(existing, false);
      return;
    }
    setPasswordError(null);
    setPasswordPrompt({ kind: "set", saveAs: false });
  }, [doc.settings.id, writePlain, writeLocked, getSessionPassword]);

  const handleSaveAs = useCallback(async () => {
    if (doc.settings.id === "none") {
      await writePlain(true);
      return;
    }
    const existing = getSessionPassword();
    if (existing) {
      await writeLocked(existing, true);
      return;
    }
    setPasswordError(null);
    setPasswordPrompt({ kind: "set", saveAs: true });
  }, [doc.settings.id, writePlain, writeLocked, getSessionPassword]);

  const handleExportCiphertext = useCallback(async () => {
    await exportCiphertextFile(doc.ciphertext);
  }, [doc.ciphertext]);

  const handleChangePasswordMenu = useCallback(async () => {
    if (doc.settings.id === "none") {
      await showInfo(
        "Change Password is only available when a classical cipher is active.",
        "Change Password",
      );
      return;
    }
    if (!pathLooksLocked(doc.filePath) && !getSessionPassword()) {
      await showInfo(
        "Save a locked .cwp file first to set a password, then you can change it here.",
        "Change Password",
      );
      return;
    }
    setChangePasswordError(null);
    setChangePasswordOpen(true);
  }, [doc.settings.id, doc.filePath, getSessionPassword]);

  const handleChangePasswordConfirm = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setChangePasswordBusy(true);
      setChangePasswordError(null);
      try {
        if (pathLooksLocked(doc.filePath) && doc.filePath) {
          const onDisk = await readTextFile(doc.filePath);
          await unlockVault(onDisk, currentPassword);
          const sealed = await sealVault(
            { text: doc.text, settings: doc.settings },
            newPassword,
          );
          await writeTextFile(doc.filePath, sealed);
          setSessionPassword(activeIdRef.current, newPassword);
          doc.markSaved(doc.filePath);
        } else {
          const session = getSessionPassword();
          if (session === null || session !== currentPassword) {
            throw new Error("Incorrect password.");
          }
          setSessionPassword(activeIdRef.current, newPassword);
        }
        setChangePasswordOpen(false);
      } catch (err) {
        setChangePasswordError(
          err instanceof Error ? err.message : "Could not change password.",
        );
      } finally {
        setChangePasswordBusy(false);
      }
    },
    [
      doc.filePath,
      doc.text,
      doc.settings,
      doc.markSaved,
      getSessionPassword,
      setSessionPassword,
    ],
  );

  const handlePrint = useCallback(() => {
    setPrintOpen(true);
  }, []);

  const handlePrintConfirm = useCallback((layout: PrintLayout) => {
    setPrintLayout(layout);
    setPrintOpen(false);
    setPrintNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (printNonce === 0) return;
    const id = window.setTimeout(() => window.print(), 0);
    return () => window.clearTimeout(id);
  }, [printNonce]);

  const handleCloseTab = useCallback(
    async (id: string) => {
      const tab = doc.tabs.find((t) => t.id === id);
      if (!tab) return;
      if (tab.dirty && !(await confirmDiscard(true))) return;
      clearSessionPassword(id);
      doc.closeTab(id);
    },
    [doc.tabs, doc.closeTab, clearSessionPassword],
  );

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
          const tabId = doc.loadDocument(
            payload.text,
            passwordPrompt.pending.path,
            payload.settings,
          );
          setSessionPassword(tabId, password);
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
    [passwordPrompt, doc.loadDocument, writeLocked, setSessionPassword],
  );

  const handleSettingsChange = useCallback(
    (settings: CipherSettings) => {
      if (settings.id === "none" && doc.viewMode !== "plain") {
        doc.setViewMode("plain");
      }
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
        if (!anyDirtyRef.current) return;
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
          handleNew();
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
        case "file-change-password":
          void handleChangePasswordMenu();
          break;
        case "file-close-tab":
          void handleCloseTab(activeIdRef.current);
          break;
        case "file-export-ciphertext":
          void handleExportCiphertext();
          break;
        case "file-print":
          handlePrint();
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
        case "help-cheat-sheet":
          setCheatSheetOpen(true);
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
    handleChangePasswordMenu,
    handleCloseTab,
    handleExportCiphertext,
    handlePrint,
    openFind,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        passwordPrompt ||
        changePasswordOpen ||
        cheatSheetOpen ||
        printOpen
      ) {
        return;
      }
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
        handleNew();
      } else if (meta && (e.key === "w" || e.key === "W")) {
        e.preventDefault();
        void handleCloseTab(activeIdRef.current);
      } else if (meta && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        handlePrint();
      } else if (meta && e.key === "/") {
        e.preventDefault();
        setCheatSheetOpen(true);
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
    changePasswordOpen,
    cheatSheetOpen,
    printOpen,
    doc.setViewMode,
    doc.undo,
    doc.redo,
    doc.settings.id,
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleCloseTab,
    handlePrint,
    openFind,
  ]);

  const appClass = [
    "app",
    "app-with-tabs",
    findOpen ? "app-with-find" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={appClass}>
      <Toolbar
        settings={doc.settings}
        viewMode={doc.viewMode}
        canUndo={doc.canUndo}
        canRedo={doc.canRedo}
        onSettingsChange={handleSettingsChange}
        onViewModeChange={doc.setViewMode}
        onNew={handleNew}
        onOpen={() => void handleOpen()}
        onSave={() => void handleSave()}
        onSaveAs={() => void handleSaveAs()}
        onUndo={doc.undo}
        onRedo={doc.redo}
      />

      <TabBar
        tabs={doc.tabs}
        activeId={doc.activeId}
        onSelect={doc.setActiveId}
        onClose={(id) => void handleCloseTab(id)}
        onNew={handleNew}
      />

      {findOpen && (
        <FindReplaceBar
          key={`${doc.activeId}-${findNonce}`}
          text={doc.text}
          preferReplaceFocus={findPreferReplace}
          onReplaceText={doc.setText}
          onSelectMatch={selectMatch}
          onClose={closeFind}
        />
      )}

      <main className="workspace" key={doc.activeId}>
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

      {changePasswordOpen && (
        <ChangePasswordDialog
          fileName={
            pathLooksLocked(doc.filePath) && doc.filePath
              ? fileName(doc.filePath)
              : undefined
          }
          error={changePasswordError}
          busy={changePasswordBusy}
          onConfirm={(currentPassword, newPassword) =>
            void handleChangePasswordConfirm(currentPassword, newPassword)
          }
          onCancel={() => {
            if (changePasswordBusy) return;
            setChangePasswordOpen(false);
            setChangePasswordError(null);
          }}
        />
      )}

      {cheatSheetOpen && (
        <CheatSheetDialog
          settings={doc.settings}
          onClose={() => setCheatSheetOpen(false)}
        />
      )}

      {printOpen && (
        <PrintDialog
          settings={doc.settings}
          onConfirm={handlePrintConfirm}
          onCancel={() => setPrintOpen(false)}
        />
      )}

      <div
        className={`print-sheet print-layout-${printLayout}`}
        aria-hidden="true"
      >
        <header className="print-meta">
          <span>
            {doc.filePath ? fileName(doc.filePath) : "Untitled"}
          </span>
          <span>
            {CIPHERS.find((c) => c.id === doc.settings.id)?.name ?? "Cipher"}
          </span>
        </header>
        {printLayout === "side" ? (
          <div className="print-side">
            <section>
              <h1>Plain</h1>
              <pre>{doc.text}</pre>
            </section>
            <section>
              <h1>Encrypted</h1>
              <pre>{doc.ciphertext}</pre>
            </section>
          </div>
        ) : (
          <pre>
            {printLayout === "cipher" ? doc.ciphertext : doc.text}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;
