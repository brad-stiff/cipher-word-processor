# Cipher Word Processor

Desktop word processor with built-in classical ciphers. Type plaintext, switch views to see encrypted output live. Save writes with the active cipher; open asks which cipher to use for decrypt.

## Features

- **Ciphers:** None (plain text), Caesar, ROT13, Atbash, Vigenère
- **Views:** Plain, Encrypted, Side by side, Reveal (horizontal wipe). In Encrypted view, type plaintext and the cipher letters appear.
- **Files:** New / Open / Save / Save As — Save encrypts with the current cipher (or plain text if None). Open prompts for the cipher used to encrypt the file; you can change the cipher afterward to re-decrypt until you edit or save. Settings are not stored in the file.

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
| ⌘/Ctrl+1–4 | Plain / Encrypted / Side by side / Reveal |
