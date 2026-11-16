import { open, save, ask } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { VAULT_EXTENSION } from "./vault";

const TXT_FILTER = {
  name: "Text",
  extensions: ["txt"],
};

const CWP_FILTER = {
  name: "Cipher Word Processor",
  extensions: [VAULT_EXTENSION],
};

const OPEN_FILTER = {
  name: "Documents",
  extensions: ["txt", VAULT_EXTENSION],
};

export async function confirmDiscard(dirty: boolean): Promise<boolean> {
  if (!dirty) return true;
  return ask("Discard unsaved changes?", {
    title: "Unsaved changes",
    kind: "warning",
  });
}

export async function openDocumentFile(): Promise<{
  path: string;
  contents: string;
} | null> {
  const path = await open({
    multiple: false,
    directory: false,
    filters: [OPEN_FILTER, TXT_FILTER, CWP_FILTER],
  });
  if (!path || Array.isArray(path)) return null;
  const contents = await invoke<string>("read_text_file", { path });
  return { path, contents };
}

export async function savePlainTextFile(
  contents: string,
  currentPath: string | null,
): Promise<string | null> {
  let path = currentPath;
  const needsPicker =
    !path || path.toLowerCase().endsWith(`.${VAULT_EXTENSION}`);
  if (needsPicker) {
    path = await save({
      filters: [TXT_FILTER],
      defaultPath: "document.txt",
    });
  }
  if (!path) return null;
  await invoke("write_text_file", { path, contents });
  return path;
}

export async function savePlainTextFileAs(
  contents: string,
): Promise<string | null> {
  const path = await save({
    filters: [TXT_FILTER],
    defaultPath: "document.txt",
  });
  if (!path) return null;
  await invoke("write_text_file", { path, contents });
  return path;
}

export async function saveLockedFile(
  contents: string,
  currentPath: string | null,
): Promise<string | null> {
  let path = currentPath;
  const needsPicker =
    !path || !path.toLowerCase().endsWith(`.${VAULT_EXTENSION}`);
  if (needsPicker) {
    path = await save({
      filters: [CWP_FILTER],
      defaultPath: `document.${VAULT_EXTENSION}`,
    });
  }
  if (!path) return null;
  await invoke("write_text_file", { path, contents });
  return path;
}

export async function saveLockedFileAs(
  contents: string,
): Promise<string | null> {
  const path = await save({
    filters: [CWP_FILTER],
    defaultPath: `document.${VAULT_EXTENSION}`,
  });
  if (!path) return null;
  await invoke("write_text_file", { path, contents });
  return path;
}
