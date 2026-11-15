# Cipher Word Processor

Desktop word processor with built-in classical ciphers. Type plaintext, switch views to see encrypted output live.

## Features

- **Ciphers:** Caesar, ROT13, Atbash, Vigenère
- **Views:** Plain, Encrypted, Side by side, Reveal (horizontal wipe)
- **Files:** New / Open / Save / Save As plaintext; export ciphertext

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
| ⌘/Ctrl+1–4 | Plain / Encrypted / Side by side / Reveal |
