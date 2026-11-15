import { open, save, ask } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

const TXT_FILTER = {
  name: "Text",
  extensions: ["txt"],
};

export async function confirmDiscard(dirty: boolean): Promise<boolean> {
  if (!dirty) return true;
  return ask("Discard unsaved changes?", {
    title: "Unsaved changes",
    kind: "warning",
  });
}

export async function openTextFile(): Promise<{
  path: string;
  contents: string;
} | null> {
  const path = await open({
    multiple: false,
    directory: false,
    filters: [TXT_FILTER],
  });
  if (!path || Array.isArray(path)) return null;
  const contents = await invoke<string>("read_text_file", { path });
  return { path, contents };
}

export async function saveTextFile(
  contents: string,
  currentPath: string | null,
): Promise<string | null> {
  let path = currentPath;
  if (!path) {
    path = await save({
      filters: [TXT_FILTER],
      defaultPath: "document.txt",
    });
  }
  if (!path) return null;
  await invoke("write_text_file", { path, contents });
  return path;
}

export async function saveTextFileAs(contents: string): Promise<string | null> {
  const path = await save({
    filters: [TXT_FILTER],
    defaultPath: "document.txt",
  });
  if (!path) return null;
  await invoke("write_text_file", { path, contents });
  return path;
}
