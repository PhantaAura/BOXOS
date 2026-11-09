// BOXOS built-in applications.
(function () {
  const { $, el, esc } = OS;
  const A = OS.apps;

  // ---------- host bridge (real in the packaged app, demo data when opened in a plain browser) ----------
  const MOCK = (() => {
    const fs = { 'BOX:\\': ['Apps/', 'Docs/', 'Games/', 'System/', 'Users/', 'README.TXT', 'BOXOS.INI', 'HELLO.ELF'], 'BOX:\\Docs': ['Letters/', 'notes.txt'], 'BOX:\\Users': ['Guest/'], 'BOX:\\Apps': ['Notepad.exe'], 'BOX:\\Games': ['Solitaire.exe'], 'BOX:\\System': ['kernel.sys'] };
    const text = { 'BOX:\\README.TXT': 'Welcome to BOXOS Windows 99 Edition.\r\n\r\nThis is demo data. In the desktop app you browse your real files.', 'BOX:\\BOXOS.INI': '[boxos]\r\nedition=Windows 99\r\n' };
    return {
      native: false, sep: '\\',
      sysInfo: async () => ({ platform: 'boxos', arch: 'x64', host: 'BOX-PC', user: 'BOX User', cpu: 'BOX Virtual CPU', cores: 2, memTotal: 512 * 1048576, memFree: 409 * 1048576, osVer: 'BOX Kernel (x86-64)', home: 'BOX:\\Users', version: '0.3.0', electron: '-', chrome: '-', uptime: 3600 }),
      places: async () => ({ home: 'BOX:\\Users', desktop: 'BOX:\\Users', documents: 'BOX:\\Docs', downloads: 'BOX:\\Users', pictures: 'BOX:\\Users', music: 'BOX:\\Users', videos: 'BOX:\\Users', drives: [{ name: 'BOX (C:)', path: 'BOX:\\', kind: 'fixed' }, { name: 'CD Drive (D:)', path: 'D:\\', kind: 'cd' }, { name: 'Removable (E:)', path: 'E:\\', kind: 'usb' }] }),
      list: async (p) => { p = p.replace(/\\$/, '') || p; const key = fs[p] ? p : (fs[p + '\\'] ? p + '\\' : null); if (!key) return { ok: true, items: [], parent: null };
        return { ok: true, parent: p.includes('\\') && !/^BOX:\\?$/.test(p) ? p.slice(0, p.lastIndexOf('\\')) || 'BOX:\\' : null, items: fs[key].map(n => { const dir = n.endsWith('/'); const name = n.replace('/', ''); const full = key.replace(/\\$/, '') + '\\' + name; return { name, path: full, dir, size: 1024 * (name.length * 13), mtime: Date.now() - name.length * 86400000, ext: dir ? '' : '.' + name.split('.').pop().toLowerCase() }; }) }; },
      readText: async (p) => text[p] != null ? { ok: true, text: text[p] } : { ok: true, text: '' },
      writeText: async () => ({ ok: true }), mkdir: async () => ({ ok: false, msg: 'Demo mode is read-only.' }), rename: async () => ({ ok: false, msg: 'Demo mode is read-only.' }),
      trash: async () => ({ ok: false, msg: 'Demo mode is read-only.' }), reveal: async () => true, icon: async () => null, pickFile: async () => [], saveAs: async (n) => n,
      search: async (r, q) => [{ name: 'README.TXT', path: 'BOX:\\README.TXT', dir: false }].filter(x => x.name.toLowerCase().includes(q.toLowerCase())),
      apps: async () => ['Calculator', 'Chess', 'Firefox', 'Notes', 'Terminal', 'Visual Studio Code', 'Spotify'].map(n => ({ name: n, path: '/Applications/' + n + '.app', type: 'app' })),
      launch: async (t) => /^https?:/.test(t) ? { ok: true, action: 'browse', url: t } : { ok: false, msg: 'Demo mode cannot start host programs. Run the BOXOS desktop app to launch real .exe, .app and link files.' },
      openExternal: async (u) => { window.open(u, '_blank'); }, quit: async () => location.reload(), fullscreen: async () => false, power: async () => true,
      suggest: async (q) => [q + ' near me', q + ' tutorial', q + ' wiki', q + ' download'].slice(0, 4),
      firefox: async () => ({ path: null }), openInFirefox: async () => ({ ok: false, msg: 'Firefox integration needs the BOXOS desktop app.' }),
      onOpen() {}, onNewTab() {}, pathForFile: () => '',
    };
  })();
  const H = window.boxos || MOCK;
  OS.H = H;
  let SYS = null; OS.sys = async () => SYS || (SYS = await H.sysInfo());

  const sepOf = (p) => (p.includes('\\') || /^[A-Za-z]:/.test(p)) ? '\\' : '/';
  const join = (a, b) => { const s = sepOf(a); return a.endsWith(s) ? a + b : a + s + b; };
  const baseName = (p) => { const s = sepOf(p); const t = p.replace(/[\\/]+$/, ''); return t.slice(t.lastIndexOf(s) + 1) || p; };
  const fmtSize = (n) => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(1) + ' GB';
  OS.join = join; OS.baseName = baseName;

  // ---------- launching anything (exe / .app / .url / folders / commands / web) ----------
  async function launchTarget(t) {
    const r = await H.launch(t);
    if (!r.ok) { OS.msg(baseName(t) || 'BOXOS', r.msg || 'Cannot open this item.', 'error'); return r; }
    if (r.action === 'browse') A.browser(r.url);
    else if (r.action === 'folder') A.explorer(r.path);
    else if (r.msg) OS.msg('BOXOS', r.msg, 'info');
    return r;
  }
  OS.launchTarget = launchTarget;
  OS.firefox = null; H.firefox().then(r => { OS.firefox = r.path; });
  OS.openFirefox = async (url) => { const r = await H.openInFirefox(url); if (!r.ok) OS.msg('Firefox', r.msg, 'error'); return r; };
  const prefFF = () => Search.store.get('browserPref', 'boxos') === 'firefox' && !!OS.firefox;

  // ---------- reusable suggestion dropdown ----------
  function attachSuggest(input, host, opts = {}) {
    const box = el('div', 'sugg hidden'); host.appendChild(box); let items = [], hot = -1, seq = 0;
    const hide = () => { box.classList.add('hidden'); hot = -1; };
    const paint = () => {
      box.innerHTML = ''; if (!items.length) return hide();
      let last = '';
      items.forEach((it, i) => {
        const grp = it.group || ''; if (grp && grp !== last) { box.appendChild(el('div', 'hd', esc(grp))); last = grp; }
        const d = el('div', 'sg' + (i === hot ? ' hot' : ''), `${it.img ? `<img src="${it.img}" width=18 height=18>` : icon(it.icon || 'search')}<span>${highlight(it.text, input.value)}${it.sub ? ` <small style="opacity:.6">— ${esc(it.sub.length > 60 ? it.sub.slice(0, 57) + '…' : it.sub)}</small>` : ''}</span>${it.tag ? `<span class="k">${esc(it.tag)}</span>` : ''}`);
        d.onmousedown = (e) => { e.preventDefault(); pick(it); };
        d.onmouseenter = () => { hot = i; box.querySelectorAll('.sg').forEach((n, k) => n.classList.toggle('hot', items.indexOf(it) === k - 0 && false)); };
        box.appendChild(d);
      });
      box.classList.remove('hidden');
    };
    const highlight = (txt, q) => { q = q.trim(); const i = q ? txt.toLowerCase().indexOf(q.toLowerCase()) : -1; return i < 0 ? esc(txt) : esc(txt.slice(0, i)) + '<b>' + esc(txt.slice(i, i + q.length)) + '</b>' + esc(txt.slice(i + q.length)); };
    const pick = (it) => { hide(); opts.onPick && opts.onPick(it, input.value); };
    let timer;
    const update = async () => {
      const q = input.value; const my = ++seq; if (!q.trim()) { items = opts.empty ? opts.empty() : []; hot = -1; paint(); return; }
      items = opts.local(q).map(x => ({ ...x })); hot = -1; paint();
      if (opts.remote) { clearTimeout(timer); timer = setTimeout(async () => { const extra = await opts.remote(q); if (my !== seq) return; const have = new Set(items.map(i => (i.text || '').toLowerCase())); const add = extra.filter(e => !have.has(e.text.toLowerCase())).slice(0, 6); if (add.length) { items = items.concat(add); paint(); } }, 120); }
    };
    input.addEventListener('input', update);
    input.addEventListener('focus', () => { if (opts.showOnFocus) update(); });
    input.addEventListener('blur', () => setTimeout(hide, 120));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); hot = (hot + 1) % items.length; if (box.classList.contains('hidden')) paint(); refresh(); }
      else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); hot = (hot - 1 + items.length) % items.length; refresh(); }
      else if (e.key === 'Tab' && hot >= 0 && items[hot] && !e.shiftKey && items[hot].kind === 'search') { e.preventDefault(); input.value = items[hot].text; update(); }
      else if (e.key === 'Escape') hide();
      else if (e.key === 'Enter') { if (hot >= 0 && items[hot] && !box.classList.contains('hidden')) { e.preventDefault(); e.stopImmediatePropagation(); pick(items[hot]); } }
    }, true);
    function refresh() { box.querySelectorAll('.sg').forEach((n, k) => n.classList.toggle('hot', k === hot)); const h = box.querySelectorAll('.sg')[hot]; h && h.scrollIntoView({ block: 'nearest' }); }
    return { hide, update, box };
  }
  OS.attachSuggest = attachSuggest;

  // unified provider used by every search box
  const withGroups = (arr) => arr.map(x => ({ ...x, group: x.kind === 'app' ? 'Programs' : x.kind === 'calc' ? 'Calculator' : x.kind === 'native' ? 'Run' : (x.tag === 'History' || x.tag === 'Bookmark') ? 'History & Favorites' : x.tag === 'Recent' ? 'Recent searches' : x.kind === 'file' ? 'Files' : x.kind === 'search' && x.tag !== 'Suggestion' ? 'Search' : x.tag === 'Suggestion' ? 'Web suggestions' : 'Go to' }));
  OS.activate = (it, raw) => {
    if (!it) return; if (it.kind === 'calc') { navigator.clipboard && navigator.clipboard.writeText(it.copy).catch(() => {}); OS.toast && OS.toast('Copied ' + it.copy); return; }
    if (it.kind === 'app' || it.kind === 'native' || it.kind === 'file') return it.dir ? A.explorer(it.path) : launchTarget(it.target || it.path);
    if (it.kind === 'builtin') return it.run();
    if (it.query) Search.remember(it.query);
    if (it.url) A.browser(it.url);
  };

  // ================= BOX Explorer =================
  A.explorer = function (startPath) {
    return OS.open({ title: 'BOX Explorer', icon: 'explorer', w: 600, h: 440, build(w, body) {
      const st = { path: null, hist: [], pos: -1, view: 'icons', sel: null, tree: true, items: [] };
      body.classList.add('explorer');
      const bar = OS.menubar([
        ['&File', () => [{ label: 'New Folder', icon: 'folder', action: newFolder }, { sep: 1 }, { label: 'Open', action: () => st.sel && open(st.sel) }, { label: 'Show in file manager', action: () => st.sel ? H.reveal(st.sel.path) : st.path && H.reveal(st.path) }, { sep: 1 }, { label: 'Close', action: () => w.close() }]],
        ['&Edit', () => [{ label: 'Rename', action: () => rename(st.sel), disabled: !st.sel }, { label: 'Delete', action: () => del(st.sel), disabled: !st.sel }, { sep: 1 }, { label: 'Select All', action: () => { } , disabled: true }]],
        ['&View', () => [{ label: 'Large Icons', check: st.view === 'icons', action: () => setView('icons') }, { label: 'List', check: st.view === 'list', action: () => setView('list') }, { sep: 1 }, { label: 'Refresh', action: () => go(st.path, true) }]],
        ['&Go', () => [{ label: 'Back', action: back }, { label: 'Forward', action: fwd }, { label: 'Up One Level', action: up }, { sep: 1 }, { label: 'My Computer', action: () => go('computer:') }]],
        ['F&avorites', () => Search.S.bookmarks.slice(0, 12).map(b => ({ label: b.title, icon: 'star', action: () => A.browser(b.url) }))],
        ['&Tools', () => [{ label: 'Find Files or Folders...', icon: 'search', action: () => A.find(st.path && !st.path.endsWith(':') ? st.path : null) }]],
        ['&Help', () => [{ label: 'About BOXOS', action: A.about }]],
      ], body);
      const tool = el('div', 'toolbar'); body.appendChild(tool);
      const tbn = (id, ic, label, fn) => { const b = el('div', 'tbn', `${icon(ic)}<span>${label}</span>`); b.id = id; b.onclick = fn; tool.appendChild(b); return b; };
      const bBack = tbn('b', 'back', 'Back', () => back()), bFwd = tbn('f', 'fwd', 'Forward', () => fwd()); tool.appendChild(el('div', 'vs'));
      const bUp = tbn('u', 'up', 'Up', () => up()); tool.appendChild(el('div', 'vs'));
      tbn('s', 'search', 'Search', () => A.find(st.path && !st.path.endsWith(':') ? st.path : null));
      const bTree = tbn('t', 'folders', 'Folders', () => { st.tree = !st.tree; treeEl.style.display = st.tree ? '' : 'none'; bTree.classList.toggle('on', st.tree); }); bTree.classList.add('on');
      tbn('v', 'views', 'Views', () => setView(st.view === 'icons' ? 'list' : 'icons')); tbn('p', 'props2', 'Properties', () => st.sel ? OS.msg('Properties', `${st.sel.name}\n\nPath: ${st.sel.path}\nType: ${st.sel.dir ? 'Folder' : (st.sel.ext || 'File')}\nSize: ${st.sel.dir ? '-' : fmtSize(st.sel.size)}\nModified: ${new Date(st.sel.mtime).toLocaleString()}`, 'info') : OS.msg('Properties', 'Select an item first.', 'info'));
      const ab = el('div', 'addrbar', '<label>Address:</label><div class="field"></div>'); body.appendChild(ab);
      const field = $('.field', ab); field.innerHTML = icon('folderOpen') + '<input spellcheck="false"><button class="dd">▼</button>'; const addr = $('input', field);
      const split = el('div', 'split'); body.appendChild(split);
      const treeEl = el('div', 'tree sunken'); const files = el('div', 'files sunken'); split.append(treeEl, files);
      const sb = el('div', 'statusbar', '<div></div><div></div>'); body.appendChild(sb);
      OS.attachSuggest(addr, field, { local: (q) => withGroups(Search.local(q, 6)), onPick: (it, raw) => { if (it.kind === 'file' || it.kind === 'native') { navTo(it.path || it.target); } else OS.activate(it, raw); } });

      const setView = (v) => { st.view = v; files.classList.toggle('list', v === 'list'); render(); };
      const title = (p) => p === 'computer:' ? 'My Computer' : p === 'network:' ? 'Network Neighborhood' : baseName(p);
      async function listDir(p) {
        if (p === 'computer:') { const pl = await H.places(); return [...pl.drives.map(d => ({ name: d.name === '/' ? 'Root' : (/^\(/.test(d.name) ? `Local Disk ${d.name}` : d.name), path: d.path, dir: true, drive: d.kind })),
          ...[['Desktop', pl.desktop], ['My Documents', pl.documents], ['Downloads', pl.downloads], ['Pictures', pl.pictures], ['Music', pl.music], ['Videos', pl.videos]].map(([n, pa]) => ({ name: n, path: pa, dir: true, place: true }))]; }
        if (p === 'network:') return Search.S.bookmarks.map(b => ({ name: b.title, path: b.url, dir: false, web: true }));
        const r = await H.list(p); if (!r.ok) { OS.msg('BOX Explorer', r.msg, 'error'); return null; }
        let items = r.items.filter(i => !i.hidden); items.sort((a, b) => (b.dir && b.ext !== '.app' ? 1 : 0) - (a.dir && a.ext !== '.app' ? 1 : 0) || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })); return items;
      }
      async function go(p, keep) {
        if (p === 'trash:') { launchTarget('boxos:trash'); return; }
        const items = await listDir(p); if (!items) return;
        if (!keep) { st.hist = st.hist.slice(0, st.pos + 1); st.hist.push(p); st.pos = st.hist.length - 1; }
        st.path = p; st.items = items; st.sel = null; addr.value = p === 'computer:' ? 'My Computer' : p === 'network:' ? 'Network Neighborhood' : p;
        w.setTitle(`BOX Explorer - ${title(p)}`); render(); upd(); markTree();
      }
      const upd = () => { bBack.classList.toggle('dis', st.pos <= 0); bFwd.classList.toggle('dis', st.pos >= st.hist.length - 1); bUp.classList.toggle('dis', st.path === 'computer:'); };
      const back = () => { if (st.pos > 0) { st.pos--; go(st.hist[st.pos], true); } };
      const fwd = () => { if (st.pos < st.hist.length - 1) { st.pos++; go(st.hist[st.pos], true); } };
      const up = async () => { if (st.path === 'computer:' || st.path === 'network:') return; const r = await H.list(st.path); go(r.ok && r.parent ? r.parent : 'computer:'); };
      function open(it) {
        if (it.web) return A.browser(it.path);
        if (it.dir && it.ext !== '.app') return go(it.path);
        launchTarget(it.path);
      }
      const iconFor = (it) => it.web ? icon('globe') : it.drive ? icon(it.drive === 'cd' ? 'cd' : it.drive === 'usb' ? 'usb' : 'hd') : it.place ? icon(it.name === 'Desktop' ? 'computer' : it.name === 'My Documents' ? 'docs' : 'folder') : iconForExt(it.ext, it.dir);
      function render() {
        files.innerHTML = '';
        if (!st.items.length) files.appendChild(el('div', 'empty', 'This folder is empty.'));
        st.items.forEach((it) => {
          const d = el('div', 'fi' + (st.sel === it ? ' sel' : ''), `${iconFor(it)}<span>${esc(it.name)}</span>${st.view === 'list' ? `<em>${it.dir || it.web ? '' : fmtSize(it.size)}</em>` : ''}`);
          d.onmousedown = (e) => { st.sel = it; files.querySelectorAll('.fi').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); sbUpdate(); };
          d.ondblclick = () => open(it);
          d.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); d.onmousedown(); itemCtx(it, e.clientX, e.clientY); };
          files.appendChild(d);
          if (!it.dir || it.ext === '.app') if (/\.(exe|app|lnk|png|jpe?g|gif|ico|pdf)$/i.test(it.name) && H.native) H.icon(it.path).then(u => { if (u) { const s = d.firstElementChild; const img = new Image(); img.src = u; s.replaceWith(img); } });
        });
        sbUpdate();
      }
      const sbUpdate = () => { sb.children[0].textContent = st.sel ? `1 object(s) selected  ${st.sel.dir ? '' : fmtSize(st.sel.size)}` : `${st.items.length} item(s)`; sb.children[1].textContent = st.path && !st.path.endsWith(':') ? st.path : 'My Computer'; };
      files.onmousedown = (e) => { if (e.target === files) { st.sel = null; files.querySelectorAll('.fi.sel').forEach(x => x.classList.remove('sel')); sbUpdate(); } };
      files.oncontextmenu = (e) => { if (e.target !== files) return; e.preventDefault(); OS.menu([{ label: 'View', sub: [{ label: 'Large Icons', action: () => setView('icons') }, { label: 'List', action: () => setView('list') }] }, { label: 'Refresh', action: () => go(st.path, true) }, { sep: 1 }, { label: 'New Folder', icon: 'folder', action: newFolder }], e.clientX, e.clientY); };
      function itemCtx(it, x, y) { OS.menu([{ label: 'Open', action: () => open(it) }, ...(it.web ? [] : [{ label: 'Show in file manager', action: () => H.reveal(it.path) }, { sep: 1 }, { label: 'Create Shortcut on Desktop', icon: 'link', action: () => OS.addShortcut(it.name, it.path, it.dir && it.ext !== '.app' ? 'folder' : null, it.ext) }, { sep: 1 }, { label: 'Rename', action: () => rename(it) }, { label: 'Delete', action: () => del(it) }])], x, y); }
      async function newFolder() { if (!st.path || st.path.endsWith(':')) return; const n = await OS.prompt('New Folder', 'Folder name:', 'New Folder'); if (!n) return; const r = await H.mkdir(join(st.path, n)); if (!r.ok) OS.msg('BOX Explorer', r.msg, 'error'); go(st.path, true); }
      async function rename(it) { if (!it || it.web || it.place || it.drive) return; const n = await OS.prompt('Rename', 'New name:', it.name); if (!n || n === it.name) return; const r = await H.rename(it.path, join(it.path.slice(0, it.path.length - it.name.length), n)); if (!r.ok) OS.msg('Rename', r.msg, 'error'); go(st.path, true); }
      async function del(it) { if (!it || it.web || it.place || it.drive) return; const a = await OS.msg('Confirm File Delete', `Are you sure you want to send '${it.name}' to the Recycle Bin?`, 'warn', ['Yes', 'No']); if (a !== 'Yes') return; const r = await H.trash(it.path); if (!r.ok) OS.msg('Delete', r.msg, 'error'); go(st.path, true); }
      addr.addEventListener('keydown', (e) => { if (e.key === 'Enter') navTo(addr.value); });
      function navTo(v) { v = v.trim(); if (/^my computer$/i.test(v)) return go('computer:'); const r = Search.resolve(v); if (r.type === 'native') { H.list(r.target).then(x => x.ok ? go(r.target) : launchTarget(r.target)); } else if (r.type === 'url') A.browser(r.url); }
      w.onFocus = () => {};

      // tree
      const nodes = { open: new Set(['desktop', 'computer']) };
      async function kids(id) {
        if (id === 'computer') { const pl = await H.places(); return pl.drives.map(d => ({ id: d.path, label: d.name === '/' ? 'Root' : (/^\(/.test(d.name) ? `Local Disk ${d.name}` : d.name), icon: d.kind === 'cd' ? 'cd' : d.kind === 'usb' ? 'usb' : 'hd', path: d.path, lazy: true })); }
        const r = await H.list(id); if (!r.ok) return []; return r.items.filter(i => i.dir && !i.hidden && i.ext !== '.app').sort((a, b) => a.name.localeCompare(b.name)).map(i => ({ id: i.path, label: i.name, icon: 'folder', path: i.path, lazy: true }));
      }
      async function drawTree() {
        treeEl.innerHTML = '';
        const row = (lvl, n, hasKids, isOpen, key) => { const d = el('div', 'n' + (st.path === n.path ? ' sel' : ''), `<span style="width:${lvl * 16}px;display:inline-block;padding:0"></span><i class="tw">${hasKids ? (isOpen ? '−' : '+') : ''}</i>${icon(n.icon)}<span>${esc(n.label)}</span>`); d.dataset.path = n.path || '';
          const tw = $('.tw', d); if (!hasKids) tw.style.visibility = 'hidden';
          tw.onclick = async (e) => { e.stopPropagation(); if (nodes.open.has(key)) nodes.open.delete(key); else nodes.open.add(key); drawTree(); };
          d.onclick = () => n.path && go(n.path); treeEl.appendChild(d); };
        const pl = await H.places(); const lvl0 = { label: 'Desktop', icon: 'desk', path: pl.desktop };
        row(0, lvl0, true, true, 'desktop');
        row(1, { label: 'My Computer', icon: 'mycomputer', path: 'computer:' }, true, nodes.open.has('computer'), 'computer');
        const drawKids = async (id, lvl) => { for (const k of await kids(id)) { const isO = nodes.open.has(k.id); row(lvl, k, true, isO, k.id); if (isO) await drawKids(k.id, lvl + 1); } };
        if (nodes.open.has('computer')) await drawKids('computer', 2);
        row(1, { label: 'My Documents', icon: 'docs', path: pl.documents }, false, false, 'docs');
        row(1, { label: 'Network Neighborhood', icon: 'network', path: 'network:' }, false, false, 'net');
        row(1, { label: 'Recycle Bin', icon: 'recycle', path: 'trash:' }, false, false, 'bin');
      }
      function markTree() { treeEl.querySelectorAll('.n').forEach(n => n.classList.toggle('sel', n.dataset.path === st.path)); }
      (async () => { const pl = await H.places(); await drawTree(); go(startPath || pl.documents || pl.home); })();
      body.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && e.target.tagName !== 'INPUT') up(); if (e.key === 'F5') go(st.path, true); if (e.key === 'Enter' && st.sel && e.target.tagName !== 'INPUT') open(st.sel); });
      w.go = go; body.tabIndex = 0;
    } });
  };

  // ================= BrowseBOX =================
  A.browser = function (url, forceNew) {
    if (url && url !== 'boxos://home' && prefFF() && /^https?:/i.test(url) && !forceNew) { OS.openFirefox(url); return null; }
    let win = OS.wins.find(x => x.key === 'browser');
    if (win) { win.restore(); win.focus(); if (url) win.navigate(url, forceNew); return win; }
    win = OS.open({ single: 'browser', title: 'BrowseBOX - BOXOS', icon: 'browse', w: 780, h: 540, x: 120, y: 40, build(w, body) {
      body.classList.add('browser');
      const tabs = []; let cur = null; const native = !!window.boxos;
      const bar = OS.menubar([
        ['&File', () => [{ label: 'New Tab', icon: 'browse', action: () => newTab() }, { label: 'Close Tab', action: () => closeTab(cur) }, { sep: 1 }, { label: 'Open in Firefox', icon: 'globe', disabled: !OS.firefox, action: () => cur && cur.url && OS.openFirefox(cur.url) }, { label: 'Open in default browser', action: () => cur && cur.url && H.openExternal(cur.url) }, { sep: 1 }, { label: 'Close', action: () => w.close() }]],
        ['&Edit', () => [{ label: 'Find in page...', action: findInPage }]],
        ['&View', () => [{ label: 'Home', action: () => showHome(cur) }, { label: 'Refresh', action: refresh }, { label: 'Stop', action: () => cur && cur.view && cur.view.stop && cur.view.stop() }, { sep: 1 }, { label: 'Zoom In', action: () => zoom(.1) }, { label: 'Zoom Out', action: () => zoom(-.1) }, { label: 'Actual Size', action: () => zoom(0) }, { sep: 1 }, { label: 'Developer Tools', action: () => cur && cur.view && cur.view.openDevTools && cur.view.openDevTools() }]],
        ['F&avorites', () => [{ label: 'Add to Favorites', icon: 'star', action: toggleFav }, { label: 'Add Page to Desktop', icon: 'link', action: () => cur && cur.url && OS.addShortcut(cur.title || cur.url, cur.url, 'link') }, { sep: 1 }, ...Search.S.bookmarks.map(b => ({ label: b.title, icon: 'star', action: () => navigate(b.url) }))]],
        ['&Tools', () => [{ label: 'Search engine', icon: 'search', sub: Object.entries(Search.ENGINES).map(([id, e]) => ({ label: e.name, check: Search.S.engine === id, action: () => { Search.setEngine(id); refreshHome(); } })) },
          { label: 'Clear browsing history', action: () => { Search.clearHistory(); refreshHome(); OS.msg('BrowseBOX', 'Browsing history and recent searches cleared.', 'info'); } },
          { sep: 1 }, { label: 'Open links from BOXOS in', sub: [{ label: 'BrowseBOX', check: !prefFF(), action: () => Search.store.set('browserPref', 'boxos') }, { label: OS.firefox ? 'Firefox' : 'Firefox (not installed)', disabled: !OS.firefox, check: prefFF(), action: () => Search.store.set('browserPref', 'firefox') }] }]],
        ['&Help', () => [{ label: 'Search tips', action: A.help }, { label: 'About BOXOS', action: A.about }]],
      ], body);
      const tool = el('div', 'toolbar'); body.appendChild(tool);
      const tbn = (ic, label, fn) => { const b = el('div', 'tbn', `${icon(ic)}<span>${label}</span>`); b.onclick = fn; tool.appendChild(b); return b; };
      const bBack = tbn('back', 'Back', () => goBack()), bFwd = tbn('fwd', 'Forward', () => goFwd()); tool.appendChild(el('div', 'vs'));
      const bStop = tbn('stop', 'Stop', () => cur && cur.view && cur.view.stop && cur.view.stop()), bRef = tbn('refresh', 'Refresh', () => refresh()), bHome = tbn('home', 'Home', () => showHome(cur)); tool.appendChild(el('div', 'vs'));
      tbn('search', 'Search', () => { showHome(cur); setTimeout(() => cur.homeEl.querySelector('input') && cur.homeEl.querySelector('input').focus(), 30); });
      const bFav = tbn('star', 'Favorites', toggleFav);
      const tabbar = el('div', 'tabs'); body.appendChild(tabbar);
      const ab = el('div', 'addrbar', '<label>Address:</label><div class="field"></div>'); body.appendChild(ab);
      const field = $('.field', ab); field.innerHTML = icon('globe') + '<input spellcheck="false" placeholder="Search or enter address"><button class="dd">▼</button>'; const addr = $('input', field);
      const page = el('div', 'page sunken'); body.appendChild(page); const load = el('div', 'loadbar'); page.appendChild(load);
      const sb = el('div', 'statusbar', '<div>Done</div><div>Internet</div>'); body.appendChild(sb);

      const sug = OS.attachSuggest(addr, field, { local: (q) => withGroups(Search.local(q, 7)), remote: async (q) => withGroups(await Search.web(q)), onPick: (it, raw) => { if (it.kind === 'url' || it.kind === 'search') { if (it.query) Search.remember(it.query); navigate(it.url); } else OS.activate(it, raw); } });
      addr.addEventListener('keydown', (e) => { if (e.key === 'Enter') { go(addr.value); addr.blur(); } });
      addr.addEventListener('focus', () => addr.select());

      function go(raw) {
        const r = Search.resolve(raw); if (r.type === 'none') return;
        if (r.type === 'native') return launchTarget(r.target);
        if (r.type === 'firefox') return OS.openFirefox(r.url);
        if (r.query) Search.remember(r.query);
        navigate(r.url);
      }
      function newTab(url) {
        const t = { id: Math.random().toString(36).slice(2), title: 'New Tab', url: '', atHome: true, loading: false, zoom: 0 };
        t.homeEl = buildHome(t); page.appendChild(t.homeEl);
        if (native) { const v = document.createElement('webview'); v.setAttribute('partition', 'persist:boxos'); v.style.visibility = 'hidden'; v.className = ''; page.insertBefore(v, t.homeEl); t.view = v; wire(t, v); }
        else { const f = document.createElement('iframe'); f.className = 'wv'; f.style.visibility = 'hidden'; page.insertBefore(f, t.homeEl); t.view = f; f.addEventListener('load', () => { t.loading = false; sync(); }); }
        tabs.push(t); select(t); drawTabs(); if (url && url !== 'boxos://home') navigate(url, false, t); return t;
      }
      function wire(t, v) {
        v.addEventListener('did-start-loading', () => { t.loading = true; sync(); });
        v.addEventListener('did-stop-loading', () => { t.loading = false; sync(); });
        v.addEventListener('page-title-updated', (e) => { t.title = e.title; if (t.url) Search.visit(t.url, e.title); drawTabs(); if (t === cur) w.setTitle(`${e.title} - BrowseBOX`); });
        const nav = (e) => { if (!e.isMainFrame && e.isMainFrame !== undefined) return; t.url = e.url; if (!t.atHome && t === cur) addr.value = e.url; Search.visit(e.url, t.title); sync(); };
        v.addEventListener('did-navigate', nav); v.addEventListener('did-navigate-in-page', nav);
        v.addEventListener('did-fail-load', (e) => { if (e.errorCode !== -3 && e.isMainFrame) { t.title = 'Cannot find server'; t.err = e; sb.children[0].textContent = `Cannot open page (${e.errorDescription})`; sync(); } });
        v.addEventListener('update-target-url', (e) => { sb.children[0].textContent = e.url || (t.loading ? 'Loading…' : 'Done'); });
        v.addEventListener('dom-ready', () => { t.ready = true; if (t.zoom) v.setZoomFactor && v.setZoomFactor(1 + t.zoom); });
      }
      function navigate(url, _x, tab) {
        const t = tab || cur || newTab();
        if (url === 'boxos://home') return showHome(t);
        url = Search.normalizeURL(url); t.url = url; t.atHome = false; t.homeEl.style.display = 'none'; t.view.style.visibility = 'visible'; t.title = Search.S.history[url]?.title || url;
        if (native) { if (t.ready) { try { t.view.loadURL(url); } catch { t.view.src = url; } } else t.view.src = url; } else t.view.src = url;
        t.loading = true; if (t === cur) addr.value = url; drawTabs(); sync();
      }
      function showHome(t) { if (!t) return; t.atHome = true; t.homeEl.style.display = ''; t.view.style.visibility = 'hidden'; t.title = 'New Tab'; refreshHome(t); if (t === cur) { addr.value = ''; w.setTitle('BrowseBOX - BOXOS'); } drawTabs(); sync(); }
      function select(t) { cur = t; tabs.forEach(x => { x.homeEl.style.zIndex = x === t ? 4 : 0; x.homeEl.style.pointerEvents = x === t ? '' : 'none'; if (x !== t) { x.homeEl.style.visibility = 'hidden'; x.view.style.display = 'none'; } else { x.homeEl.style.visibility = ''; x.view.style.display = ''; } });
        addr.value = t.atHome ? '' : t.url; w.setTitle(t.atHome ? 'BrowseBOX - BOXOS' : `${t.title} - BrowseBOX`); drawTabs(); sync(); }
      function closeTab(t) { if (!t) return; const i = tabs.indexOf(t); t.homeEl.remove(); t.view.remove(); tabs.splice(i, 1); if (!tabs.length) { w.close(); return; } if (cur === t) select(tabs[Math.max(0, i - 1)]); else drawTabs(); }
      function drawTabs() {
        tabbar.innerHTML = '';
        tabs.forEach(t => { const d = el('div', 'tab' + (t === cur ? ' on' : ''), `${icon('globe')}<span>${esc(t.title)}</span><i class="cx">✕</i>`); d.onmousedown = (e) => { if (e.target.classList.contains('cx')) return; select(t); }; $('.cx', d).onclick = (e) => { e.stopPropagation(); closeTab(t); }; tabbar.appendChild(d); });
        const p = el('div', 'tab plus', '+'); p.style.minWidth = '22px'; p.style.flex = 'none'; p.style.justifyContent = 'center'; p.onclick = () => newTab(); tabbar.appendChild(p); tabbar.style.display = tabs.length > 1 ? '' : 'none';
      }
      function sync() {
        if (!cur) return; const v = cur.view; let cb = false, cf = false;
        try { if (native && cur.ready) { cb = v.canGoBack(); cf = v.canGoForward(); } } catch {}
        bBack.classList.toggle('dis', !(cb || (!cur.atHome && cur.url))); bFwd.classList.toggle('dis', !(cf || (cur.atHome && cur.url)));
        bStop.classList.toggle('dis', !cur.loading); load.style.width = cur.loading ? '70%' : '0'; if (!cur.loading) sb.children[0].textContent = 'Done';
        bFav.classList.toggle('on', !!(cur.url && Search.isBookmarked(cur.url)));
      }
      function goBack() { if (!cur) return; let ok = false; try { if (native && cur.ready && cur.view.canGoBack() && !cur.atHome) { cur.view.goBack(); ok = true; } } catch {} if (!ok && !cur.atHome) showHome(cur); }
      function goFwd() { if (!cur) return; if (cur.atHome && cur.url) { cur.atHome = false; cur.homeEl.style.display = 'none'; cur.view.style.visibility = 'visible'; addr.value = cur.url; sync(); } else { try { cur.view.goForward(); } catch {} } }
      function refresh() { if (!cur || cur.atHome) return; try { native ? cur.view.reload() : (cur.view.src = cur.view.src); } catch {} }
      function toggleFav() { if (!cur || !cur.url) return; if (Search.isBookmarked(cur.url)) Search.removeBookmark(cur.url); else Search.addBookmark(cur.title || cur.url, cur.url); sync(); }
      function zoom(d) { if (!cur || !native || !cur.view.setZoomFactor) return; cur.zoom = d === 0 ? 0 : Math.max(-.5, Math.min(2, cur.zoom + d)); cur.view.setZoomFactor(1 + cur.zoom); }
      async function findInPage() { if (!native || !cur || cur.atHome) return; const q = await OS.prompt('Find', 'Find what:', ''); if (q) cur.view.findInPage(q); }
      function refreshHome(t) { const tt = t || cur; if (!tt) return; const nh = buildHome(tt); tt.homeEl.replaceWith(nh); tt.homeEl = nh; if (tt !== cur) nh.style.visibility = 'hidden'; if (tt.atHome === false) nh.style.display = 'none'; }

      function buildHome(t) {
        const h = el('div', 'home');
        const sites = Search.topSites(8);
        h.innerHTML = `<div class="nav"><div class="lg"><i>${icon('logo')}</i>BOXOS</div><a class="on">Home</a><a data-u="https://news.ycombinator.com/">Updates</a><a data-u="https://winworldpc.com/">Apps</a><a data-u="https://en.wikipedia.org/">Docs</a></div>
          <div class="hero"><h1>BOXOS</h1><p class="tag">The modern retro OS.</p>
          <div class="sbox"><div class="row"><select title="Search engine">${Object.entries(Search.ENGINES).map(([id, e]) => `<option value="${id}" ${id === Search.S.engine ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select><input placeholder="Search the web, type an address, calculate, or find an app…" spellcheck="false"><button>Search</button></div></div>
          <div class="hint">Try <code>!w moon landing</code> · <code>yt lofi</code> · <code>gh electron</code> · <code>2*(3+4)^2</code> · <code>photoshop.exe</code></div></div>
          <div class="tiles"></div>`;
        const tiles = $('.tiles', h);
        sites.forEach(s => { const tl = el('div', 'tile', `<div class="fav">${esc((s.title || hostOf(s.url) || '?')[0].toUpperCase())}</div>${esc((s.title || '').slice(0, 22))}`); tl.onclick = () => navigate(s.url, 0, t); tiles.appendChild(tl); });
        h.querySelectorAll('.nav a[data-u]').forEach(a => a.onclick = () => navigate(a.dataset.u, 0, t));
        const inp = $('input', h), sel = $('select', h), btn = $('button', h), sbox = $('.sbox', h);
        sel.onchange = () => { Search.setEngine(sel.value); };
        const run = () => { const v = inp.value; if (!v.trim()) return; const r = Search.resolve(v); if (r.type === 'native') return launchTarget(r.target); if (r.type === 'firefox') return OS.openFirefox(r.url); if (r.query) Search.remember(r.query); navigate(r.url, 0, t); };
        btn.onclick = run; inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
        OS.attachSuggest(inp, sbox, { local: (q) => withGroups(Search.local(q, 6)), remote: async (q) => withGroups(await Search.web(q)), onPick: (it, raw) => { if (it.kind === 'url' || it.kind === 'search') { if (it.query) Search.remember(it.query); navigate(it.url, 0, t); } else OS.activate(it, raw); }, showOnFocus: false });
        return h;
      }
      const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

      w.navigate = (u, nw) => { if (nw && cur && !cur.atHome) newTab(u); else if (cur && cur.atHome && !tabs.length) newTab(u); else navigate(u); };
      w.onResize = () => {};
      body.addEventListener('keydown', (e) => { const c = e.ctrlKey || e.metaKey; if (c && e.key === 'l') { e.preventDefault(); addr.focus(); } else if (c && e.key === 't') { e.preventDefault(); newTab(); } else if (c && e.key === 'w') { e.preventDefault(); closeTab(cur); } else if (e.key === 'F5') refresh(); else if (c && e.key === 'f') { e.preventDefault(); findInPage(); } });
      body.tabIndex = 0;
      newTab(url && url !== 'boxos://home' ? url : null);
      if (native) H.onNewTab((u) => { w.focus(); newTab(u); });
    } });
    return win;
  };

  // ================= Search BOXOS (unified: programs, files, web, calculator) =================
  A.find = function (root, focusWeb) {
    return OS.open({ single: 'find', title: 'Search BOXOS', icon: 'search', w: 560, h: 460, build(w, body) {
      const hdr = el('div', 'dlg'); hdr.style.cssText = 'flex:none;padding:8px 10px 4px;gap:6px';
      hdr.innerHTML = `<div class="row"><label style="width:62px">Search for:</label><input type="text" placeholder="programs, files, web, calculator…" spellcheck="false"><select style="height:22px"></select></div>
        <div class="row"><label style="width:62px">Look in:</label><select class="where" style="flex:1;height:22px"></select><button class="b def go">Search</button></div>`;
      body.appendChild(hdr); const inp = $('input', hdr), eng = hdr.querySelectorAll('select')[0], where = $('.where', hdr);
      eng.innerHTML = Object.entries(Search.ENGINES).map(([id, e]) => `<option value="${id}" ${id === Search.S.engine ? 'selected' : ''}>${esc(e.name)}</option>`).join(''); eng.onchange = () => { Search.setEngine(eng.value); run(); };
      const res = el('div', 'results sunken'); body.appendChild(res); const sb = el('div', 'statusbar', '<div>Type to search everything at once.</div>'); body.appendChild(sb);
      (async () => { const pl = await H.places(); const opts = [['Home folder', pl.home], ['Desktop', pl.desktop], ['My Documents', pl.documents], ['Downloads', pl.downloads], ...pl.drives.map(d => [d.name, d.path])]; where.innerHTML = opts.map(([n, p]) => `<option value="${esc(p)}">${esc(n)}</option>`).join(''); if (root) { const i = opts.findIndex(o => o[1] === root); if (i >= 0) where.selectedIndex = i; } })();
      let seq = 0, sel = -1, rows = [];
      const draw = () => { res.innerHTML = ''; let last = ''; rows.forEach((it, i) => { if (it.group !== last) { const g = el('div', 'r', `<b style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.5px">${esc(it.group)}</b>`); g.style.cssText = 'background:#e8e8e8;min-height:18px;pointer-events:none'; res.appendChild(g); last = it.group; }
        const d = el('div', 'r' + (i === sel ? ' sel' : ''), `${it.img ? `<img src="${it.img}">` : icon(it.icon || 'doc')}<span>${esc(it.text)}</span><small>${esc(it.sub || it.tag || '')}</small>`); d.onclick = () => { sel = i; draw(); }; d.ondblclick = () => OS.activate(it, inp.value); res.appendChild(d); }); };
      let timer;
      const run = async () => {
        const q = inp.value.trim(); const my = ++seq; if (!q) { rows = []; draw(); sb.firstChild.textContent = 'Type to search everything at once.'; return; }
        rows = withGroups(Search.local(q, 14)); const ql = q.toLowerCase();
        const builtins = [['BOX Explorer', 'explorer', () => A.explorer()], ['BrowseBOX', 'browse', () => A.browser()], ['Notepad', 'notepad', () => A.notepad()], ['Calculator', 'calc', () => A.calc()], ['System Properties', 'props', () => A.sysprops()], ['Control Panel', 'settings', () => A.control()], ['Run', 'run', () => A.run()]].filter(b => b[0].toLowerCase().includes(ql));
        builtins.forEach(([t, i, run]) => rows.unshift({ kind: 'builtin', icon: i, text: t, sub: 'BOXOS program', group: 'Programs', run }));
        rows.push({ kind: 'search', icon: 'search', text: `Search the web for "${q}"`, sub: Search.ENGINES[Search.S.engine].name, group: 'Web', url: Search.searchURL(q), query: q });
        sel = 0; draw(); sb.firstChild.textContent = 'Searching files…';
        clearTimeout(timer); timer = setTimeout(async () => {
          const [files, web] = await Promise.all([H.search(where.value, q, 120), Search.web(q)]); if (my !== seq) return;
          const f = files.map(x => ({ kind: 'file', icon: x.dir ? 'folder' : 'doc', text: x.name, sub: x.path, path: x.path, dir: x.dir, group: 'Files and folders' }));
          const wl = withGroups(web).map(x => ({ ...x, group: 'Web suggestions' }));
          rows = rows.filter(r => r.group !== 'Web').concat(f, wl, [rows.find(r => r.group === 'Web')].filter(Boolean)); draw();
          sb.firstChild.textContent = `${rows.length} result(s) · ${f.length} file(s) found in ${where.selectedOptions[0]?.text || ''}`;
        }, 220);
      };
      inp.addEventListener('input', run); where.onchange = run; $('.go', hdr).onclick = run;
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && rows[sel]) OS.activate(rows[sel], inp.value); else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(rows.length - 1, sel + 1); draw(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); } });
      setTimeout(() => inp.focus(), 30);
    } });
  };

  // ================= Run =================
  A.run = function () {
    return OS.open({ single: 'run', title: 'Run', icon: 'run', w: 410, h: 190, fixed: true, noMin: true, y: innerHeight - 260, x: 8, build(w, body) {
      const d = el('div', 'dlg'); d.innerHTML = `<div class="row" style="align-items:flex-start;gap:12px">${icon('run').replace('<svg', '<svg width="32" height="32" style="flex:none"')}<div style="line-height:1.35">Type the name of a program, folder, document, or Internet resource, and BOXOS will open it for you.</div></div>
        <div class="row" style="position:relative"><label style="width:42px"><u>O</u>pen:</label><div class="fld" style="flex:1;position:relative;display:flex"><input type="text" spellcheck="false" style="flex:1"></div></div>
        <div class="btns"><button class="b def ok">OK</button><button class="b cancel">Cancel</button><button class="b br">Browse...</button></div>`;
      body.appendChild(d); const inp = $('input', d);
      const go = async () => { const v = inp.value.trim(); if (!v) return; const r = Search.resolve(v); w.close(); if (r.type === 'firefox') OS.openFirefox(r.url); else if (r.type === 'native') launchTarget(r.target); else if (r.type === 'url' && (r.query || /^(https?|boxos):/.test(v) || Search.looksLikeUrl(v))) A.browser(r.url); else launchTarget(v); };
      OS.attachSuggest(inp, $('.fld', d), { local: (q) => withGroups(Search.local(q, 6)), onPick: (it, raw) => { if (it.kind === 'app' || it.kind === 'native') { w.close(); launchTarget(it.target || it.path); } else { w.close(); OS.activate(it, raw); } } });
      // Run first tries a host program/command; plain words fall through to the launcher
      $('.ok', d).onclick = async () => { const v = inp.value.trim(); if (!v) return; const r = Search.resolve(v); if (r.type === 'firefox') { w.close(); return OS.openFirefox(r.url); } if (r.type === 'url' && r.query) { const res = await H.launch(v); if (res.ok) { w.close(); if (res.action === 'browse') A.browser(res.url); return; } w.close(); A.browser(r.url); return; } go(); };
      $('.cancel', d).onclick = () => w.close();
      $('.br', d).onclick = async () => { const f = await H.pickFile(); if (f && f[0]) inp.value = f[0]; inp.focus(); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('.ok', d).click(); else if (e.key === 'Escape') w.close(); });
      setTimeout(() => inp.focus(), 30);
    } });
  };

  // ================= About / System Properties =================
  A.about = function () {
    return OS.open({ single: 'about', title: 'About BOXOS', icon: 'logo', w: 370, h: 330, fixed: true, noMin: true, build(w, body) {
      OS.sys().then(s => {
        const d = el('div', 'about', `<div class="l"><i>${icon('logo')}</i><div>BOXOS<sup style="font-size:14px;vertical-align:top">®</sup><small>Windows 99 Edition</small></div></div><div class="hr"></div>
          <div><b>BOXOS ${s.version}</b> &nbsp; (Build 9900)</div><div>A modern retro operating system<br>with a classic Windows 99 look and feel.</div>
          <div style="text-align:left;margin-top:8px;line-height:1.5">Kernel: &nbsp;${esc(s.osVer)} (${esc(s.arch)})<br>Host: &nbsp;&nbsp;&nbsp;${esc(s.cpu)}<br>Memory: ${(s.memTotal / 1048576).toFixed(0)} MB (${(s.memFree / 1048576).toFixed(0)} MB free)</div>
          <button class="b def" style="margin-top:12px;min-width:90px">OK</button>`);
        body.appendChild(d); $('button', d).onclick = () => w.close(); $('button', d).focus(); w.el.style.height = 'auto';
      });
    } });
  };
  A.sysprops = function () {
    return OS.open({ single: 'sys', title: 'System Properties', icon: 'props', w: 420, h: 450, fixed: true, noMin: true, help: true, build(w, body) {
      OS.sys().then(s => {
        const d = el('div', 'dlg'); const tabs = ['General', 'Hardware', 'Devices', 'Performance'];
        d.innerHTML = `<div class="tabsheet">${tabs.map((t, i) => `<div class="${i ? '' : 'on'}">${t}</div>`).join('')}</div><div class="sheet"></div><div class="btns"><button class="b ok">OK</button><button class="b cancel">Cancel</button><button class="b" disabled>Apply</button></div>`;
        body.appendChild(d); const sheet = $('.sheet', d);
        const pages = {
          General: () => `<div class="sysp"><div class="pc">${icon('pc')}</div><dl><dt>System:</dt><dd>BOXOS ${esc(s.version)}<br>Windows 99 Edition</dd><dt>Kernel:</dt><dd>${esc(s.osVer)} (${esc(s.arch)})</dd><dt>Registered to:</dt><dd>${esc(s.user)}</dd><dt>Memory:</dt><dd>${(s.memTotal / 1048576).toFixed(0)} MB RAM</dd></dl></div>`,
          Hardware: () => `<dl style="margin:0;line-height:1.7"><dt><b>Processor</b></dt><dd>${esc(s.cpu)}<br>${s.cores} logical core(s)</dd><dt><b>Computer name</b></dt><dd>${esc(s.host)}</dd><dt><b>Host platform</b></dt><dd>${esc(s.platform)} (${esc(s.arch)})</dd></dl>`,
          Devices: () => `<div>Drives detected:</div><ul id="dv" style="line-height:1.7"></ul>`,
          Performance: () => `<div style="line-height:1.8">Memory in use: <b>${((s.memTotal - s.memFree) / 1048576).toFixed(0)} MB</b> of ${(s.memTotal / 1048576).toFixed(0)} MB<br>Uptime: <b>${Math.floor(s.uptime / 3600)} h ${Math.floor(s.uptime % 3600 / 60)} min</b><br>Shell: Electron ${esc(s.electron)} / Chromium ${esc(s.chrome)}<br>Programs: Windows <b>.exe</b>${s.platform === 'darwin' ? ' (via Wine/CrossOver)' : s.platform === 'win32' ? ' (native)' : ' (via Wine)'}, macOS <b>.app</b>, <b>.lnk/.url/.webloc</b> links, web links</div>`,
        };
        const show = async (n) => { sheet.innerHTML = pages[n](); if (n === 'Devices') { const pl = await H.places(); $('#dv', sheet).innerHTML = pl.drives.map(x => `<li>${esc(x.name)} — ${esc(x.path)}</li>`).join(''); } };
        d.querySelectorAll('.tabsheet div').forEach((t, i) => t.onclick = () => { d.querySelectorAll('.tabsheet div').forEach(x => x.classList.remove('on')); t.classList.add('on'); show(tabs[i]); });
        show('General'); $('.ok', d).onclick = $('.cancel', d).onclick = () => w.close();
      });
    } });
  };

  // ================= Notepad / Calculator =================
  A.notepad = function (path) {
    return OS.open({ title: 'Untitled - Notepad', icon: 'notepad', w: 520, h: 380, build(w, body) {
      body.classList.add('notepad'); let file = null, dirty = false;
      const ta = el('textarea'); ta.spellcheck = false;
      const set = (p) => { file = p; w.setTitle(`${p ? baseName(p) : 'Untitled'} - Notepad`); };
      const save = async (as) => { let p = file; if (!p || as) { p = await H.saveAs(file ? baseName(file) : 'Untitled.txt'); if (!p) return false; } const r = await H.writeText(p, ta.value); if (!r.ok) { OS.msg('Notepad', r.msg, 'error'); return false; } set(p); dirty = false; return true; };
      const open = async (p) => { if (!p) { const f = await H.pickFile(); p = f && f[0]; } if (!p) return; const r = await H.readText(p); if (!r.ok) return OS.msg('Notepad', r.msg, 'error'); ta.value = r.text; set(p); dirty = false; };
      OS.menubar([['&File', () => [{ label: 'New', action: () => { ta.value = ''; set(null); } }, { label: 'Open...', action: () => open() }, { label: 'Save', action: () => save() }, { label: 'Save As...', action: () => save(true) }, { sep: 1 }, { label: 'Exit', action: () => w.close() }]],
        ['&Edit', () => [{ label: 'Select All', action: () => { ta.focus(); ta.select(); } }, { label: 'Time/Date', action: () => { ta.setRangeText(new Date().toLocaleString(), ta.selectionStart, ta.selectionEnd, 'end'); } }]],
        ['F&ormat', () => [{ label: 'Word Wrap', check: ta.style.whiteSpace === 'pre-wrap', action: () => { ta.style.whiteSpace = ta.style.whiteSpace === 'pre-wrap' ? 'pre' : 'pre-wrap'; } }]], ['&Help', () => [{ label: 'About BOXOS', action: A.about }]]], body);
      body.appendChild(ta); ta.addEventListener('input', () => dirty = true);
      w.onClose = async () => { if (!dirty || !ta.value) return true; const a = await OS.msg('Notepad', 'The text has changed.\n\nDo you want to save the changes?', 'warn', ['Yes', 'No', 'Cancel']); if (a === 'Yes') return await save(); return a === 'No'; };
      if (path) open(path); setTimeout(() => ta.focus(), 30);
    } });
  };
  A.calc = function () {
    return OS.open({ single: 'calc', title: 'Calculator', icon: 'calc', w: 236, h: 270, fixed: true, build(w, body) {
      body.classList.add('calc'); const disp = el('div', 'disp', '0'); const keys = el('div', 'keys'); body.append(disp, keys); let expr = '';
      const layout = ['C', '(', ')', '⌫', '/', '7', '8', '9', 'sqrt(', '*', '4', '5', '6', '%', '-', '1', '2', '3', '^', '+', '0', '.', 'π', 'ans', '='];
      let ans = '0';
      const press = (k) => { if (k === 'C') expr = ''; else if (k === '⌫') expr = expr.slice(0, -1); else if (k === 'π') expr += 'pi'; else if (k === 'ans') expr += ans; else if (k === '=') { const v = Search.calc(expr || '0'); ans = v === null ? 'Error' : String(v); expr = v === null ? '' : String(v); disp.textContent = ans; return; } else expr += k; disp.textContent = expr || '0'; };
      layout.forEach(k => { const b = el('button', 'b', k); b.onclick = () => press(k); keys.appendChild(b); });
      body.tabIndex = 0; body.addEventListener('keydown', (e) => { if (/^[\d+\-*/().%^]$/.test(e.key)) press(e.key); else if (e.key === 'Enter') press('='); else if (e.key === 'Backspace') press('⌫'); else if (e.key === 'Escape') press('C'); });
    } });
  };

  // ================= Control panel, Search options, Network, Help =================
  A.searchOptions = function () {
    return OS.open({ single: 'sopt', title: 'Search Engine Options', icon: 'search', w: 360, h: 470, fixed: true, noMin: true, build(w, body) {
      const d = el('div', 'dlg'); d.innerHTML = `<div>Choose the default search engine for BrowseBOX and Search BOXOS. You can always jump to another one by typing a shortcut such as <b>!g</b> (Google), <b>!w</b> (Wikipedia) or <b>yt</b> (YouTube) before your words.</div><fieldset class="fieldset"><legend>Default search engine</legend><div class="opts" style="display:flex;flex-direction:column;gap:4px;max-height:170px;overflow:auto"></div></fieldset><fieldset class="fieldset"><legend>Open web links from BOXOS in</legend><label><input type="radio" name="br" value="boxos"> BrowseBOX</label><br><label><input type="radio" name="br" value="firefox" ${OS.firefox ? '' : 'disabled'}> Mozilla Firefox ${OS.firefox ? '' : '(not installed)'}</label></fieldset><div class="btns"><button class="b def ok">OK</button><button class="b cancel">Cancel</button><button class="b clr" style="min-width:100px">Clear history</button></div>`;
      body.appendChild(d); const o = $('.opts', d); let pick = Search.S.engine;
      Object.entries(Search.ENGINES).forEach(([id, e]) => { const l = el('label', '', `<input type="radio" name="e" ${id === pick ? 'checked' : ''}> ${esc(e.name)} <small style="color:#666">(${e.bang.map(b => '!' + b).join(' ')})</small>`); $('input', l).onchange = () => pick = id; o.appendChild(l); });
      d.querySelector(`input[name=br][value=${Search.store.get('browserPref', 'boxos')}]`).checked = true;
      $('.ok', d).onclick = () => { Search.setEngine(pick); Search.store.set('browserPref', d.querySelector('input[name=br]:checked').value); w.close(); }; $('.cancel', d).onclick = () => w.close(); $('.clr', d).onclick = () => { Search.clearHistory(); OS.msg('Search', 'History cleared.', 'info'); };
    } });
  };
  A.control = function () {
    return OS.open({ single: 'cp', title: 'Control Panel', icon: 'settings', w: 480, h: 320, build(w, body) {
      body.classList.add('cp'); const g = el('div', 'grid sunken'); body.appendChild(g);
      const items = [['System', 'props', A.sysprops], ['Search Engine', 'search', A.searchOptions], ['Programs', 'programs', () => A.explorer('computer:')], ['Display: Full Screen', 'computer', () => H.fullscreen()], ['Run Program...', 'run', A.run], ['Internet Options', 'globe', () => A.browser()], ['About BOXOS', 'logo', A.about]];
      items.forEach(([n, i, fn]) => { const d = el('div', 'it', `${icon(i)}<span>${n}</span>`); d.onmousedown = () => { g.querySelectorAll('.it').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); }; d.ondblclick = fn; g.appendChild(d); });
      body.appendChild(el('div', 'statusbar', `<div>${items.length} object(s)</div>`));
    } });
  };
  A.help = function () {
    return OS.open({ single: 'help', title: 'BOXOS Help - Getting Started', icon: 'help', w: 560, h: 460, build(w, body) {
      const c = el('div', 'results sunken'); c.style.cssText += ';padding:14px 18px;line-height:1.55;-webkit-user-select:text;user-select:text';
      c.innerHTML = `<h3 style="margin-top:0">Smart search (BrowseBOX, Search BOXOS, Run)</h3>
        <ul><li>Type a <b>web address</b> or just words – BOXOS knows which one you mean.</li>
        <li><b>Shortcuts:</b> <code>!w cats</code> (Wikipedia), <code>g: cats</code> (Google), <code>yt lofi</code>, <code>gh electron</code>, <code>so regex</code>, <code>mdn fetch</code>, <code>cats !b</code> (Bing)…</li>
        <li><b>Calculator:</b> type <code>2*(3+4)^2</code> or <code>sqrt(144)+pi</code> and press Enter to copy the answer.</li>
        <li><b>Everything at once:</b> programs on this computer, files, bookmarks, history, previous searches and live web suggestions appear as you type. Frequently used results rise to the top.</li>
        <li><b>Tab</b> completes a suggestion into the box, <b>Ctrl+L</b> focuses the address bar, <b>Ctrl+T</b> opens a tab.</li></ul>
        <h3>Running programs and links</h3>
        <ul><li><b>.exe</b> files run natively on Windows. On macOS/Linux, BOXOS hands them to Wine or CrossOver if installed.</li>
        <li><b>.app</b> bundles launch on macOS. Programs → Installed Programs lists every app on this computer.</li>
        <li><b>.url / .webloc / .lnk</b> shortcut files, folders and web links all open: drag them onto the desktop to make icons, or use Start → Run.</li></ul>`;
      body.appendChild(c);
    } });
  };
  A.network = function () {
    return A.explorer('network:');
  };
})();
