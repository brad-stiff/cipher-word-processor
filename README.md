# Cipher Word Processor

Desktop word processor with built-in classical ciphers. Type plaintext, switch views to see encrypted output live.

## Features

- **Ciphers:** None (plain text), Caesar, ROT13, Atbash, Vigenère
- **Views:** Plain, Encrypted, Side by side, Reveal (horizontal wipe). In Encrypted view, type plaintext and the cipher letters appear — only for length-preserving ciphers (all current ones). Future ciphers that change length or pairing will keep Encrypted view read-only.
- **Find / replace:** Searches the plaintext buffer (⌘/Ctrl+F, ⌘/Ctrl+H).
- **Files:**
  - Cipher **None** → save/open ordinary `.txt` (plaintext).
  - Any classical cipher → Save requires a password and writes a locked `.cwp` vault (AES-GCM). Cipher settings live *inside* the vault, not in readable file metadata. Open asks for the password only — no cipher guessing.

## Requirements

- Node.js 18+
- [Rust](https://rustup.rs/) (stable)
- macOS: Xcode Command Line Tools

## Develop

```bash
npm install
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

## Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘/Ctrl+N | New |
| ⌘/Ctrl+O | Open |
| ⌘/Ctrl+S | Save |
| ⌘/Ctrl+Shift+S | Save As |
| ⌘/Ctrl+Z | Undo |
| ⌘/Ctrl+Shift+Z or ⌘/Ctrl+Y | Redo |
| ⌘/Ctrl+F | Find |
| ⌘/Ctrl+H | Replace |
| ⌘/Ctrl+1–4 | Plain / Encrypted / Side by side / Reveal |
