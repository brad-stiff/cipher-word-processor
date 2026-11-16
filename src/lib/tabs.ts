export function tabTitle(filePath: string | null): string {
  if (!filePath) return "Untitled";
  return filePath.split(/[/\\]/).pop() ?? filePath;
}

export function isBlankUntitled(doc: {
  filePath: string | null;
  dirty: boolean;
  text: string;
}): boolean {
  return doc.filePath === null && !doc.dirty && doc.text === "";
}
