// BOXOS boot: desktop icons, start menu, shortcut handling, drag & drop, external links.
(function () {
  const { $, el, esc, H } = OS, A = OS.apps;
  OS.init();

  // ---------- toast ----------
  OS.toast = (t) => { const d = el('div', 'raised', esc(t)); d.style.cssText = 'position:fixed;right:10px;bottom:44px;padding:8px 14px;z-index:99999;box-shadow:inset -1px -1px #0a0a0a,inset 1px 1px #fff,inset -2px -2px #808080,inset 2px 2px #dfdfdf,2px 2px 0 rgba(0,0,0,.3)'; document.body.appendChild(d); setTimeout(() => d.remove(), 1800); };

  // ---------- desktop items ----------
  const BUILTIN = {
    computer: () => A.explorer('computer:'), docs: async () => { const p = await H.places(); A.explorer(p.documents); }, network: () => A.network(),
    trash: () => OS.launchTarget('boxos:trash'), explorer: () => A.explorer(), browse: () => A.browser(), notepad: () => A.notepad(), calc: () => A.calc(),
    search: () => A.find(), run: () => A.run(), about: () => A.about(), sys: () => A.sysprops(),
  };
  const DEFAULTS = [
    { id: 'computer', label: 'My Computer', icon: 'mycomputer', kind: 'builtin', target: 'computer' },
    { id: 'docs', label: 'My Documents', icon: 'folder', kind: 'builtin', target: 'docs' },
    { id: 'network', label: 'Network Neighborhood', icon: 'network', kind: 'builtin', target: 'network' },
    { id: 'trash', label: 'Recycle Bin', icon: 'recycle', kind: 'builtin', target: 'trash' },
    { id: 'explorer', label: 'BOX Explorer', icon: 'explorer', kind: 'builtin', target: 'explorer' },
    { id: 'browse', label: 'BrowseBOX', icon: 'browse', kind: 'builtin', target: 'browse' },
  ];
  const D = OS.desktop;
  let saved = Search.store.get('desktop', null);
  if (!saved || saved.v !== 2) saved = { v: 2, items: DEFAULTS.map((d, i) => ({ ...d, x: 6, y: 6 + i * 87 })) };
  D.items = saved.items; D.render();
  OS.onDesktopSave = (items) => Search.store.set('desktop', { v: 2, items: items.map(({ img, ...r }) => r) });
  // restore native icons (exe/app) asynchronously
  D.items.filter(i => i.kind === 'path' && i.iconPath && window.boxos).forEach(async i => { const u = await H.icon(i.iconPath); if (u) { i.img = u; D.render(); } });

  OS.runItem = (it) => {
    if (it.kind === 'builtin') return BUILTIN[it.target] && BUILTIN[it.target]();
    if (it.kind === 'url') return A.browser(it.target);
    return OS.launchTarget(it.target);
  };
  OS.addShortcut = async (label, target, kindHint, ext) => {
    const isUrl = /^https?:/i.test(target);
    const it = { id: 'u' + Date.now() + Math.random().toString(36).slice(2, 5), label: label.replace(/\.(lnk|url|webloc)$/i, ''), kind: isUrl ? 'url' : 'path', target, ...D.nextPos() };
    it.icon = isUrl || kindHint === 'link' ? 'link' : kindHint === 'folder' ? 'folder' : iconNameFor(ext || '', target);
    if (!isUrl && window.boxos && /\.(exe|app|lnk|png|jpe?g|gif)$/i.test(target)) { it.iconPath = target; const u = await H.icon(target); if (u) it.img = u; }
    D.items.push(it); D.save(); D.render(); return it;
  };
  const iconNameFor = (ext, t) => { const e = (ext || (t.match(/\.[^.\\/]+$/) || [''])[0]).toLowerCase(); return { '.exe': 'exe', '.msi': 'exe', '.app': 'macapp', '.url': 'link', '.webloc': 'link', '.lnk': 'app', '.bat': 'dos', '.sh': 'dos', '.command': 'dos' }[e] || 'doc'; };
  OS.itemMenu = (it, x, y) => OS.menu([
    { label: 'Open', action: () => OS.runItem(it) },
    ...(it.kind === 'path' && !/^boxos:/.test(it.target) ? [{ label: 'Show in file manager', action: () => H.reveal(it.target) }] : []),
    { sep: 1 },
    ...(it.kind === 'builtin' ? [] : [{ label: 'Delete', action: () => { D.items = D.items.filter(i => i !== it); D.sel.clear(); D.save(); D.render(); } }]),
    { label: 'Rename', action: async () => { const n = await OS.prompt('Rename', 'New name:', it.label); if (n) { it.label = n; D.save(); D.render(); } } },
    ...(it.id === 'computer' ? [{ sep: 1 }, { label: 'Properties', action: A.sysprops }] : []),
  ], x, y);
  OS.desktopMenu = (x, y) => OS.menu([
    { label: 'Arrange Icons', sub: [{ label: 'By Name', action: () => { D.items.sort((a, b) => a.label.localeCompare(b.label)); D.items.forEach((i, n) => { const p = (() => { const rows = Math.max(1, Math.floor(($('#desktop').clientHeight - 8) / 84)); return { x: 6 + Math.floor(n / rows) * 92, y: 6 + (n % rows) * 84 }; })(); i.x = p.x; i.y = p.y; }); D.save(); D.render(); } }, { label: 'Auto Arrange', action: () => { D.items.forEach((i, n) => { const rows = Math.max(1, Math.floor(($('#desktop').clientHeight - 8) / 84)); i.x = 6 + Math.floor(n / rows) * 92; i.y = 6 + (n % rows) * 84; }); D.save(); D.render(); } }] },
    { label: 'Refresh', action: () => D.render() }, { sep: 1 },
    { label: 'New Shortcut...', icon: 'link', action: async () => { const f = await H.pickFile(); if (f.length) f.forEach(p => OS.addShortcut(OS.baseName(p), p)); else { const t = await OS.prompt('Create Shortcut', 'Type a program path or web address:', 'https://'); if (t) OS.addShortcut(t.replace(/^https?:\/\//, '').split('/')[0] || t, t); } } },
    { sep: 1 }, { label: 'Search BOXOS...', icon: 'search', action: () => A.find() }, { label: 'Properties', icon: 'props', action: A.sysprops },
  ], x, y);

  // ---------- drag & drop: files, apps, links -> desktop shortcuts ----------
  addEventListener('dragover', (e) => e.preventDefault());
  addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = [...(e.dataTransfer.files || [])];
    if (files.length) { for (const f of files) { const p = H.pathForFile(f); if (p) await OS.addShortcut(f.name, p, null, (f.name.match(/\.[^.]+$/) || [''])[0]); } return; }
    const u = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (u && /^https?:\/\//i.test(u.split('\n')[0])) { const link = u.split('\n')[0].trim(); await OS.addShortcut(new URL(link).hostname.replace(/^www\./, ''), link, 'link'); }
  });

  // ---------- links / files handed to BOXOS by the host OS ----------
  if (window.boxos) H.onOpen((items) => items.forEach(t => OS.launchTarget(t)));

  // ---------- start menu + program index ----------
  const hostApps = []; const buckets = () => {
    if (!hostApps.length) return [{ label: '(No programs found)', disabled: true }];
    const launch = (a) => ({ label: a.name, icon: /\.app$/i.test(a.path) ? 'macapp' : 'exe', action: () => OS.launchTarget(a.path) });
    if (hostApps.length <= 22) return hostApps.map(launch);
    const groups = {}; hostApps.forEach(a => { const k = /[a-z]/i.test(a.name[0]) ? a.name[0].toUpperCase() : '#'; (groups[k] = groups[k] || []).push(a); });
    // merge letters into ~14-item buckets
    const out = []; let cur = [], from = null, last = null;
    Object.keys(groups).sort().forEach(k => { if (from === null) from = k; cur.push(...groups[k]); last = k; if (cur.length >= 14) { const c = cur, f = from, l = last; out.push({ label: f === l ? f : `${f} – ${l}`, icon: 'folder', sub: () => c.map(launch) }); cur = []; from = null; } });
    if (cur.length) { const c = cur, f = from; out.push({ label: f === last ? f : `${f} – ${last}`, icon: 'folder', sub: () => c.map(launch) }); }
    return out;
  };
  const places = async (e) => { const p = await H.places(); return p; };
  OS.buildStart([
    { label: '&Programs', icon: 'programs', sub: () => [
      { label: 'BOX Explorer', icon: 'explorer', action: () => A.explorer() }, { label: 'BrowseBOX', icon: 'browse', action: () => A.browser() },
      ...(OS.firefox ? [{ label: 'Mozilla Firefox', icon: 'globe', action: () => OS.openFirefox() }] : []),
      { label: 'Notepad', icon: 'notepad', action: () => A.notepad() }, { label: 'Calculator', icon: 'calc', action: () => A.calc() },
      { label: 'Search BOXOS', icon: 'search', action: () => A.find() }, { sep: 1 },
      { label: 'Installed Programs', icon: 'app', sub: buckets }] },
    { label: '&Documents', icon: 'docs', sub: () => [
      { label: 'My Documents', icon: 'docs', action: () => BUILTIN.docs() },
      { label: 'Desktop', icon: 'computer', action: async () => A.explorer((await H.places()).desktop) },
      { label: 'Downloads', icon: 'folder', action: async () => A.explorer((await H.places()).downloads) },
      { label: 'Pictures', icon: 'image', action: async () => A.explorer((await H.places()).pictures) },
      { label: 'Music', icon: 'music', action: async () => A.explorer((await H.places()).music) },
      { label: 'Videos', icon: 'video', action: async () => A.explorer((await H.places()).videos) }] },
    { label: '&Settings', icon: 'settings', sub: () => [
      { label: 'Control Panel', icon: 'settings', action: A.control }, { label: 'Search Engine...', icon: 'search', action: A.searchOptions },
      { label: 'System Properties', icon: 'props', action: A.sysprops }, { sep: 1 }, { label: 'Toggle Full Screen', icon: 'computer', action: () => H.fullscreen() }] },
    { label: '&Search', icon: 'searchGold', sub: () => [
      { label: 'Everything (programs, files, web)...', icon: 'search', action: () => A.find() },
      { label: 'For Files or Folders...', icon: 'folder', action: () => A.find() },
      { label: 'On the Internet...', icon: 'globe', action: () => { const w = A.browser(); w.navigate('boxos://home'); } }] },
    { label: '&Help', icon: 'help', action: A.help },
    { label: '&Run...', icon: 'run', action: A.run },
    { sep: 1 },
    { label: 'S&hut Down...', icon: 'shutdown', action: shutDown },
  ]);
  OS.setQuick([{ label: 'BrowseBOX', icon: 'globe', action: () => A.browser() }, { label: 'BOX Explorer', icon: 'folder', action: () => A.explorer() }, { label: 'Notepad', icon: 'notepad', action: () => A.notepad() }]);

  function shutDown() {
    OS.open({ title: 'Shut Down BOXOS', icon: 'shutdown', w: 360, h: 220, fixed: true, noMin: true, build(w, body) {
      const d = el('div', 'dlg'); d.innerHTML = `<div class="row" style="align-items:flex-start">${icon('shutdown').replace('<svg', '<svg width="40" height="40" style="flex:none"')}<div style="flex:1"><div>What do you want the computer to do?</div><select style="width:100%;margin-top:10px;height:22px"><option value="quit">Shut down BOXOS</option><option value="restart">Restart BOXOS</option><option value="sleep">Sleep (host computer)</option><option value="lock">Lock (host computer)</option></select></div></div><div class="btns"><button class="b def ok">OK</button><button class="b cancel">Cancel</button></div>`;
      body.appendChild(d); $('.cancel', d).onclick = () => w.close();
      $('.ok', d).onclick = async () => { const v = $('select', d).value; w.close(); if (v === 'quit') { document.body.style.background = '#000'; document.body.innerHTML = '<div style="color:#ff8a00;font:20px Tahoma;text-align:center;margin-top:35vh">It is now safe to turn off your computer.</div>'; setTimeout(() => H.quit(), 900); } else if (v === 'restart') location.reload(); else H.power(v); };
    } });
  }

  // ---------- indexing for search (programs + places + built-ins) ----------
  (async () => {
    try { const apps = await H.apps(); hostApps.push(...apps); } catch {}
    Search.setIndex(hostApps.map(a => ({ kind: 'app', icon: /\.app$/i.test(a.path) ? 'macapp' : 'exe', text: a.name, sub: a.path, target: a.path, tag: 'Program' })));
    if (window.boxos) { const s = await OS.sys(); window.boxosMac = s.platform === 'darwin'; }
  })();

  // ---------- first run: show reference-style layout ----------
  setTimeout(() => {
    if (new URLSearchParams(location.search).has('demo')) {
      A.explorer('BOX:\\').then; // demo handled below
    }
  }, 0);
  window.BOXOS_DEMO = async () => {
    const e = A.explorer('BOX:\\'); e.el.style.cssText += ';left:160px;top:52px;width:600px;height:468px';
    const ab = A.about(); ab.el.style.cssText += ';left:792px;top:52px';
    const b = A.browser(); b.el.style.cssText += ';left:298px;top:540px;width:640px;height:420px';
    const s = A.sysprops(); s.el.style.cssText += ';left:970px;top:490px';
  };
  // greet with a simple tip on first launch
  if (!Search.store.get('seen', false)) { Search.store.set('seen', true); setTimeout(() => OS.toast('Tip: drag programs, .url files or links onto the desktop to make shortcuts.'), 1200); }
})();
