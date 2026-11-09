// BOXOS main process: window, real file system, and host-app / link compatibility.
const { app, BrowserWindow, ipcMain, shell, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execFile } = require('child_process');
const https = require('https');

const IS_WIN = process.platform === 'win32';
const IS_MAC = process.platform === 'darwin';
let win;

// ---------- single instance / launch args (BOXOS can be the handler for links) ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
app.on('second-instance', (_e, argv) => { focus(); forwardArgs(argv); });
app.setAsDefaultProtocolClient('boxos');

function focus() { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } }
function forwardArgs(argv) {
  const items = argv.slice(app.isPackaged ? 1 : 2).filter(a => !a.startsWith('--'));
  if (win && items.length) win.webContents.send('boxos:open-external', items);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 560,
    backgroundColor: '#087a94', title: 'BOXOS Windows 99 Edition',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
      webviewTag: true, spellcheck: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.webContents.once('did-finish-load', () => forwardArgs(process.argv));
  // never let the shell window itself navigate away
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
// links dragged/opened via OS (macOS)
app.on('open-file', (e, p) => { e.preventDefault(); if (win) win.webContents.send('boxos:open-external', [p]); });
app.on('open-url', (e, u) => { e.preventDefault(); if (win) win.webContents.send('boxos:open-external', [u]); });

// new-tab/popup requests inside BrowseBOX webviews are routed back to the shell
app.on('web-contents-created', (_e, wc) => {
  if (wc.getType() === 'webview') {
    wc.setWindowOpenHandler(({ url }) => { win && win.webContents.send('boxos:new-tab', url); return { action: 'deny' }; });
  }
});

// ---------- helpers ----------
const toStat = (full, name) => {
  let st; try { st = fs.statSync(full); } catch { try { st = fs.lstatSync(full); } catch { return null; } }
  return { name, path: full, dir: st.isDirectory(), size: st.size, mtime: st.mtimeMs, ext: path.extname(name).toLowerCase() };
};

function home() { return os.homedir(); }

function drives() {
  const out = [];
  if (IS_WIN) {
    for (const l of 'CDEFGHIJKLMNOPQRSTUVWXYZ') { const p = l + ':\\'; try { fs.accessSync(p); out.push({ name: `(${l}:)`, path: p, kind: l === 'C' ? 'fixed' : 'drive' }); } catch {} }
  } else {
    out.push({ name: IS_MAC ? 'Macintosh HD' : 'Root', path: '/', kind: 'fixed' });
    const vols = IS_MAC ? '/Volumes' : '/media';
    try { for (const v of fs.readdirSync(vols)) { const p = path.join(vols, v); if (p !== '/Volumes/Macintosh HD') out.push({ name: v, path: p, kind: 'drive' }); } } catch {}
  }
  return out;
}

// ---------- host application discovery (for Programs menu + search + Run) ----------
let appCache = null;
function walk(dir, depth, test, acc) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (test(e, full)) acc.push(full);
    else if (e.isDirectory() && depth > 0 && !e.name.endsWith('.app')) walk(full, depth - 1, test, acc);
  }
}
function listHostApps() {
  if (appCache) return appCache;
  const res = [];
  if (IS_MAC) {
    const acc = [];
    for (const d of ['/Applications', '/System/Applications', '/System/Applications/Utilities', path.join(home(), 'Applications')])
      walk(d, 1, (e) => e.name.endsWith('.app'), acc);
    for (const p of acc) res.push({ name: path.basename(p, '.app'), path: p, type: 'app' });
  } else if (IS_WIN) {
    const acc = [];
    for (const d of [path.join(process.env.ProgramData || 'C:\\ProgramData', 'Microsoft\\Windows\\Start Menu\\Programs'),
      path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs')])
      walk(d, 3, (e) => e.isFile() && /\.(lnk|url|exe)$/i.test(e.name) && !/uninstall/i.test(e.name), acc);
    for (const p of acc) res.push({ name: path.basename(p).replace(/\.(lnk|url|exe)$/i, ''), path: p, type: 'app' });
  } else {
    const acc = [];
    for (const d of ['/usr/share/applications', '/usr/local/share/applications', path.join(home(), '.local/share/applications')])
      walk(d, 1, (e) => e.name.endsWith('.desktop'), acc);
    for (const p of acc) {
      try {
        const t = fs.readFileSync(p, 'utf8');
        if (/^NoDisplay=true/m.test(t)) continue;
        const n = (t.match(/^Name=(.+)$/m) || [])[1];
        if (n) res.push({ name: n, path: p, type: 'app' });
      } catch {}
    }
  }
  const seen = new Set();
  appCache = res.filter(a => { const k = a.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.name.localeCompare(b.name));
  return appCache;
}

// ---------- launching anything ----------
function which(cmd) {
  return new Promise(r => execFile(IS_WIN ? 'where' : 'which', [cmd], (err, out) => r(err ? null : String(out).split(/\r?\n/)[0])));
}
function parseInternetShortcut(p) {
  try {
    const t = fs.readFileSync(p, 'utf8');
    if (/\.url$/i.test(p)) return (t.match(/^URL=(.+)$/mi) || [])[1]?.trim();
    if (/\.webloc$/i.test(p)) return (t.match(/<string>(https?:[^<]+)<\/string>/i) || [])[1];
    if (/\.desktop$/i.test(p) && /^Type=Link/m.test(t)) return (t.match(/^URL=(.+)$/m) || [])[1];
  } catch {}
  return null;
}

async function launch(target) {
  if (!target || typeof target !== 'string') return { ok: false, msg: 'Nothing to run.' };
  target = target.trim().replace(/^"(.*)"$/, '$1');

  // web links -> BrowseBOX
  if (/^(https?|ftp):\/\//i.test(target) || /^(mailto|tel):/i.test(target)) {
    if (/^(https?|ftp):/i.test(target)) return { ok: true, action: 'browse', url: target };
    shell.openExternal(target); return { ok: true, action: 'external' };
  }
  if (target === 'boxos:trash') {
    if (IS_WIN) { spawn('explorer.exe', ['shell:RecycleBinFolder'], { detached: true, stdio: 'ignore' }).unref(); return { ok: true, action: 'native' }; }
    const t = IS_MAC ? path.join(home(), '.Trash') : path.join(home(), '.local/share/Trash/files');
    const r = await shell.openPath(t); return r ? { ok: false, msg: 'Cannot open the Recycle Bin: ' + r } : { ok: true, action: 'native' };
  }
  const ext = path.extname(target).toLowerCase();

  // internet shortcuts (.url / .webloc / link-type .desktop) -> BrowseBOX
  if (['.url', '.webloc'].includes(ext) || (ext === '.desktop' && fs.existsSync(target) && parseInternetShortcut(target))) {
    const u = parseInternetShortcut(target);
    if (u) return { ok: true, action: 'browse', url: u };
  }

  // Windows shortcut files: resolve and report; shell.openPath runs them natively on Windows
  if (ext === '.lnk') {
    if (IS_WIN) { const r = await shell.openPath(target); return r ? { ok: false, msg: r } : { ok: true, action: 'native' }; }
    return { ok: false, msg: 'Windows .lnk shortcuts can only be followed on Windows.' };
  }

  const exists = fs.existsSync(target);

  // Windows programs on a non-Windows host: try Wine / CrossOver / Whisky
  if (['.exe', '.msi', '.bat', '.cmd', '.com'].includes(ext) && !IS_WIN) {
    if (!exists) return { ok: false, msg: `Cannot find '${target}'.` };
    const wine = (await which('wine64')) || (await which('wine')) || (await which('crossover'));
    if (wine) {
      const child = spawn(wine, ['start', '/unix', target], { detached: true, stdio: 'ignore', cwd: path.dirname(target) });
      child.unref(); return { ok: true, action: 'wine', msg: `Started with ${path.basename(wine)}.` };
    }
    return { ok: false, msg: IS_MAC
      ? 'This is a Windows program. Install Wine (brew install --cask --no-quarantine wine-stable), CrossOver or Whisky and BOXOS will run it automatically.'
      : 'This is a Windows program. Install Wine (sudo apt install wine) and BOXOS will run it automatically.' };
  }

  // macOS apps / Windows exe / generic files
  if (exists) {
    if (IS_MAC && ext === '.app') {
      return new Promise(res => execFile('open', [target], err => res(err ? { ok: false, msg: err.message } : { ok: true, action: 'native' })));
    }
    if (IS_WIN && ['.bat', '.cmd', '.exe', '.com'].includes(ext)) {
      const child = spawn(target, [], { detached: true, stdio: 'ignore', cwd: path.dirname(target), shell: ext !== '.exe', windowsHide: false });
      child.on('error', () => {}); child.unref(); return { ok: true, action: 'native' };
    }
    if (!IS_WIN && ['.sh', '.command'].includes(ext)) {
      try { fs.accessSync(target, fs.constants.X_OK); } catch { return { ok: false, msg: 'Script is not marked executable (chmod +x).' }; }
    }
    const st = fs.statSync(target);
    if (st.isDirectory()) return { ok: true, action: 'folder', path: target };
    const r = await shell.openPath(target);
    return r ? { ok: false, msg: r } : { ok: true, action: 'native' };
  }

  // bare app name or command: look in host app list first
  const lower = target.toLowerCase();
  const hit = listHostApps().find(a => a.name.toLowerCase() === lower) || listHostApps().find(a => a.name.toLowerCase().startsWith(lower));
  if (hit) return launch(hit.path);

  // domain-looking text
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(target)) return { ok: true, action: 'browse', url: 'https://' + target };

  // shell command (Run dialog behaves like Win+R)
  return new Promise(res => {
    const child = spawn(target, { shell: true, detached: true, stdio: 'ignore' });
    let done = false;
    child.on('error', e => { if (!done) { done = true; res({ ok: false, msg: e.message }); } });
    setTimeout(() => { if (!done) { done = true; child.unref(); res({ ok: true, action: 'command' }); } }, 400);
    child.on('exit', code => { if (!done && code) { done = true; res({ ok: false, msg: `Cannot find '${target}'. Check the name and try again.` }); } });
  });
}

// ---------- Firefox ----------
function findFirefox() {
  const c = IS_MAC ? ['/Applications/Firefox.app', path.join(home(), 'Applications/Firefox.app'), '/Applications/Firefox Developer Edition.app']
    : IS_WIN ? [path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Mozilla Firefox\\firefox.exe'), path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Mozilla Firefox\\firefox.exe'), path.join(process.env.LOCALAPPDATA || '', 'Mozilla Firefox\\firefox.exe')]
    : ['/usr/bin/firefox', '/usr/local/bin/firefox', '/snap/bin/firefox', '/usr/lib/firefox/firefox', '/opt/firefox/firefox'];
  return c.find(p => { try { return fs.existsSync(p); } catch { return false; } }) || null;
}
function openInFirefox(url) {
  const ff = findFirefox();
  if (!ff) return { ok: false, msg: 'Firefox was not found on this computer. Install it from firefox.com and try again.' };
  if (url && !/^(https?|file|about):/i.test(url)) return { ok: false, msg: 'Only web addresses can be opened in Firefox.' };
  const args = url ? [url] : [];
  if (IS_MAC) execFile('open', ['-a', ff, ...(url ? [url] : [])], () => {});
  else spawn(ff, args, { detached: true, stdio: 'ignore' }).unref();
  return { ok: true };
}

// ---------- IPC ----------
ipcMain.handle('app:firefox', () => ({ path: findFirefox() }));
ipcMain.handle('app:openInFirefox', (_e, u) => openInFirefox(u));
ipcMain.handle('sys:info', () => ({
  platform: process.platform, arch: process.arch, host: os.hostname(), user: os.userInfo().username,
  cpu: os.cpus()[0]?.model || 'CPU', cores: os.cpus().length,
  memTotal: os.totalmem(), memFree: os.freemem(), osVer: `${os.type()} ${os.release()}`,
  home: home(), version: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome,
  uptime: os.uptime(),
}));
ipcMain.handle('fs:places', () => {
  const h = home();
  const p = (n) => { try { return app.getPath(n); } catch { return path.join(h, n); } };
  return { home: h, desktop: p('desktop'), documents: p('documents'), downloads: p('downloads'),
    pictures: p('pictures'), music: p('music'), videos: p('videos'), drives: drives() };
});
ipcMain.handle('fs:list', (_e, dir) => {
  try {
    const out = [];
    for (const n of fs.readdirSync(dir)) {
      if (n.startsWith('.') && n !== '..') { out.push({ hidden: true, ...(toStat(path.join(dir, n), n) || { name: n }) }); continue; }
      const s = toStat(path.join(dir, n), n); if (s) out.push(s);
    }
    return { ok: true, items: out, parent: path.dirname(dir) === dir ? null : path.dirname(dir) };
  } catch (e) { return { ok: false, msg: e.code === 'EACCES' || e.code === 'EPERM' ? `Access denied: ${dir}` : e.message }; }
});
ipcMain.handle('fs:readText', (_e, p) => { try { const st = fs.statSync(p); if (st.size > 5e6) return { ok: false, msg: 'File too large for Notepad (5 MB limit).' }; return { ok: true, text: fs.readFileSync(p, 'utf8') }; } catch (e) { return { ok: false, msg: e.message }; } });
ipcMain.handle('fs:writeText', (_e, p, t) => { try { fs.writeFileSync(p, t, 'utf8'); return { ok: true }; } catch (e) { return { ok: false, msg: e.message }; } });
ipcMain.handle('fs:mkdir', (_e, p) => { try { fs.mkdirSync(p); return { ok: true }; } catch (e) { return { ok: false, msg: e.message }; } });
ipcMain.handle('fs:rename', (_e, a, b) => { try { fs.renameSync(a, b); return { ok: true }; } catch (e) { return { ok: false, msg: e.message }; } });
ipcMain.handle('fs:trash', async (_e, p) => { try { await shell.trashItem(p); return { ok: true }; } catch (e) { return { ok: false, msg: e.message }; } });
ipcMain.handle('fs:reveal', (_e, p) => { shell.showItemInFolder(p); return true; });
ipcMain.handle('fs:icon', async (_e, p) => {
  try { const img = await app.getFileIcon(p, { size: 'normal' }); return img.isEmpty() ? null : img.toDataURL(); } catch { return null; }
});
ipcMain.handle('fs:pickFile', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'openDirectory', 'multiSelections'], title: 'Browse' });
  return r.canceled ? [] : r.filePaths;
});
ipcMain.handle('fs:saveAs', async (_e, name) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(home(), name || 'Untitled.txt') });
  return r.canceled ? null : r.filePath;
});
ipcMain.handle('app:list', () => listHostApps());
ipcMain.handle('app:launch', (_e, t) => launch(t));
ipcMain.handle('app:openExternal', (_e, u) => { if (/^https?:/i.test(u)) shell.openExternal(u); return true; });
ipcMain.handle('app:quit', () => { app.quit(); });
ipcMain.handle('app:fullscreen', () => { win.setFullScreen(!win.isFullScreen()); return win.isFullScreen(); });
ipcMain.handle('app:setDefault', () => { app.setAsDefaultProtocolClient('http'); app.setAsDefaultProtocolClient('https'); return true; });
ipcMain.handle('app:power', (_e, what) => {
  const cmds = IS_WIN ? { sleep: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0', lock: 'rundll32.exe user32.dll,LockWorkStation' }
    : IS_MAC ? { sleep: 'pmset sleepnow', lock: 'pmset displaysleepnow' } : { sleep: 'systemctl suspend', lock: 'loginctl lock-session' };
  if (cmds[what]) spawn(cmds[what], { shell: true, detached: true, stdio: 'ignore' }).unref();
  return true;
});

// recursive file search (local), cheap and bounded
ipcMain.handle('fs:search', async (_e, root, query, limit = 200) => {
  const q = String(query || '').toLowerCase().trim(); if (!q) return [];
  const out = []; let visited = 0; const t0 = Date.now();
  const skip = new Set(['node_modules', '.git', 'Library', 'AppData', '$Recycle.Bin', 'System Volume Information', 'proc', 'sys', 'dev']);
  const stack = [root];
  while (stack.length && out.length < limit && visited < 60000 && Date.now() - t0 < 4000) {
    const dir = stack.pop(); let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      visited++;
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.name.toLowerCase().includes(q)) out.push({ name: e.name, path: full, dir: e.isDirectory() });
      if (e.isDirectory() && !skip.has(e.name) && !e.isSymbolicLink()) stack.push(full);
    }
  }
  return out;
});

// web search suggestions (DuckDuckGo autocomplete) fetched from main to avoid CORS
ipcMain.handle('search:suggest', (_e, q) => new Promise(resolve => {
  if (!q || q.length > 100) return resolve([]);
  const req = https.get({ host: 'duckduckgo.com', path: '/ac/?q=' + encodeURIComponent(q), headers: { 'User-Agent': 'Mozilla/5.0 BOXOS' }, timeout: 2500 }, res => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d).map(x => x.phrase).filter(Boolean).slice(0, 8)); } catch { resolve([]); } });
  });
  req.on('error', () => resolve([])); req.on('timeout', () => { req.destroy(); resolve([]); });
}));
