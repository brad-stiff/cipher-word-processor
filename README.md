# Cipher Word Processor

Desktop word processor with built-in classical ciphers. Type plaintext, switch views to see encrypted output live.

## Features

- **Ciphers:** None, Caesar, ROT13, Atbash, Vigenère, Affine, Substitution (editable key + Shuffle), Rail Fence, Playfair — use **?** for a quick tip, or **Help → Cipher Cheat Sheet…** (⌘/Ctrl+/) for formulas and live examples for every cipher. Rail Fence and Playfair keep Encrypted view read-only (`preservesLength: false`).
- **Views:** Plain, Encrypted, Side by side, Reveal (horizontal wipe). In Encrypted view, type plaintext and the cipher letters appear — only for length-preserving ciphers (all current ones). Future ciphers that change length or pairing will keep Encrypted view read-only.
- **Find / replace:** Searches the plaintext buffer (⌘/Ctrl+F, ⌘/Ctrl+H).
- **Tabs:** Multiple documents at once; each tab has its own text, cipher, view, undo stack, and unlock password. New reuses a blank untitled tab when possible. Close Tab (⌘/Ctrl+W) confirms if dirty; closing the last tab resets it to Untitled.
- **Files:**
  - Cipher **None** → save/open ordinary `.txt` (plaintext).
  - Any classical cipher → Save requires a password and writes a locked `.cwp` vault (AES-GCM). Cipher settings live *inside* the vault, not in readable file metadata. Open asks for the password only — no cipher guessing. **Change Password…** re-seals a saved `.cwp` (current + new + confirm).
  - **Export Ciphertext…** writes the classical cipher letters to a separate `.txt` (does not replace Save).
  - **Print…** (⌘/Ctrl+P) opens a layout chooser (Plain / Ciphertext / Side by side), then the system print dialog.

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
| ⌘/Ctrl+N | New (tab) |
| ⌘/Ctrl+O | Open (tab) |
| ⌘/Ctrl+W | Close tab |
| ⌘/Ctrl+S | Save |
| ⌘/Ctrl+Shift+S | Save As |
| ⌘/Ctrl+P | Print (choose layout) |
| ⌘/Ctrl+/ | Cipher cheat sheet |
| ⌘/Ctrl+Z | Undo |
| ⌘/Ctrl+Shift+Z or ⌘/Ctrl+Y | Redo |
| ⌘/Ctrl+F | Find |
| ⌘/Ctrl+H | Replace |
| ⌘/Ctrl+1–4 | Plain / Encrypted / Side by side / Reveal |
