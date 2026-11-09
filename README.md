# BOXOS — Windows 99 Edition

A retro Windows 99-style desktop that runs as a real app on Windows, macOS and Linux (Electron).

- **Look:** beveled windows, navy title bars, Start menu, taskbar, teal cloud wallpaper, shaded 2.5D icons.
- **Apps:** BOX Explorer (your real files), BrowseBOX (tabbed browser), Search BOXOS, Notepad, Calculator, Run, Control Panel.
- **Smart search:** one box for web, URLs, calculator, installed programs, files, bookmarks and history.
  Shortcuts like `!w cats`, `yt lofi`, `gh electron`, `2*(3+4)^2`, `!ff <address>`.
- **Compatibility:** `.exe` (native on Windows, Wine/CrossOver elsewhere), macOS `.app`, `.url`/`.webloc`/`.lnk` links,
  web links, drag-and-drop desktop shortcuts, Firefox detection and "open in Firefox".

## Run

```bash
npm install
npm start
```

## Build

```bash
npm run pack:mac    # macOS .app (arm64 + x64)
npm run pack:win    # Windows BOXOS.exe folder
npm run pack:linux
```

Output goes to `dist/`. Builds are unsigned: on macOS right-click → Open the first time; on Windows choose "More info → Run anyway".

## Layout

- `main.js`, `preload.js` — Electron main process: real file system, host-app discovery and launching, Firefox, search suggestions.
- `src/` — the desktop UI (`os.js` window manager, `apps.js` programs, `search.js` smart search, `icons*.js` icon set).
- `build/` — app icons.

Opening `src/index.html` in a plain browser (e.g. `python3 -m http.server`) runs a demo mode with sample files.
