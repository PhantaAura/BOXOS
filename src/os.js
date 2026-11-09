// BOXOS shell: window manager, taskbar, menus, desktop, dialogs.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const OS = { wins: [], z: 10, cascade: 0, el, $, esc, apps: {} };
  window.OS = OS;

  // ================= wallpaper (soft cloud sky, like the reference) =================
  function drawWallpaper() {
    const cv = $('#wallpaper'); const W = 480, H = 300; cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); const img = g.createImageData(W, H);
    const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
    const sm = (t) => t * t * (3 - 2 * t);
    const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
    const fbm = (x, y) => { let v = 0, a = .5, f = 1; for (let i = 0; i < 6; i++) { v += a * vn(x * f, y * f); f *= 2; a *= .5; } return v; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      // base sky gradient: deep teal -> brighter cyan toward lower right
      let r = 6 + 20 * v, gg = 112 + 34 * v - 10 * u, b = 148 + 28 * v;
      // cloud masks: top-right bank and wide lower band
      const n = fbm(u * 5 + 3.1, v * 3.4 + 1.7), n2 = fbm(u * 9 + 8, v * 6 + 2);
      const band = Math.exp(-Math.pow((v - .78 - .1 * Math.sin(u * 3.2)) / .17, 2)) * (.35 + .65 * Math.min(1, u * 1.6));
      const top = Math.exp(-Math.pow((u - .86) / .28, 2)) * Math.exp(-Math.pow((v - .16) / .2, 2));
      const left = Math.exp(-Math.pow((u - .12) / .22, 2)) * Math.exp(-Math.pow((v - .62) / .18, 2)) * .55;
      let m = (band + top * 1.1 + left) * (n * 1.5 + n2 * .6 - .55);
      m = Math.max(0, Math.min(1, m * 1.5));
      m = sm(m);
      r += (150 - r) * m * .8; gg += (206 - gg) * m * .8; b += (226 - b) * m * .8;
      const i = (y * W + x) * 4; img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  // ================= menus =================
  const stack = [];
  const closeFrom = (n) => { while (stack.length > n) stack.pop().remove(); };
  const closeAll = () => { closeFrom(0); $('#ctxmenu').classList.add('hidden'); };
  function renderMenu(items, level, x, y) {
    closeFrom(level);
    const m = el('div', 'menu sub');
    for (const it of items) {
      if (it.sep) { m.appendChild(el('div', 'msep')); continue; }
      const d = el('div', 'mi' + (it.disabled ? ' disabled' : ''), `${it.icon ? icon(it.icon) : ''}<span>${esc(it.label)}${it.check ? '' : ''}</span>${it.sub ? '<i class="arr">▶</i>' : ''}`);
      if (it.check) d.firstElementChild && (d.querySelector('span').innerHTML = '✓ ' + esc(it.label));
      d.onmouseenter = () => {
        closeFrom(level + 1);
        m.querySelectorAll('.mi.hot').forEach(h => h.classList.remove('hot'));
        if (it.sub && !it.disabled) { d.classList.add('hot'); const r = d.getBoundingClientRect(); renderMenu(typeof it.sub === 'function' ? it.sub() : it.sub, level + 1, r.right - 3, r.top - 3); }
      };
      d.onclick = (e) => { e.stopPropagation(); if (it.sub || it.disabled) return; closeAll(); hideStart(); it.action && it.action(); };
      m.appendChild(d);
    }
    document.body.appendChild(m);
    const w = m.offsetWidth, h = m.offsetHeight;
    if (x + w > innerWidth - 2) x = Math.max(2, (level ? x - w - 200 : innerWidth - w - 2));
    if (y + h > innerHeight - 36) y = Math.max(2, innerHeight - 36 - h);
    m.style.left = x + 'px'; m.style.top = y + 'px';
    stack[level] = m; return m;
  }
  OS.menu = (items, x, y) => { closeAll(); renderMenu(items, 0, x, y); };
  OS.closeMenus = closeAll;
  document.addEventListener('mousedown', (e) => {
    if (e.target.closest('.menu') || e.target.closest('#startmenu') || e.target.closest('#startbtn')) return;
    closeAll(); hideStart(); document.querySelectorAll('.menubar>div.open').forEach(d => d.classList.remove('open'));
  }, true);
  window.addEventListener('blur', () => { closeAll(); });

  OS.menubar = (defs, host) => {
    const bar = el('div', 'menubar');
    for (const [label, items] of defs) {
      const d = el('div', '', label.replace(/&(.)/, '<u>$1</u>'));
      d.onmousedown = (e) => {
        e.stopPropagation(); const was = d.classList.contains('open'); closeAll();
        bar.querySelectorAll('.open').forEach(o => o.classList.remove('open'));
        if (was) return; d.classList.add('open'); const r = d.getBoundingClientRect();
        renderMenu(typeof items === 'function' ? items() : items, 0, r.left, r.bottom);
      };
      d.onmouseenter = () => { if (bar.querySelector('.open') && !d.classList.contains('open')) d.onmousedown(new MouseEvent('mousedown')); };
      bar.appendChild(d);
    }
    host.appendChild(bar); return bar;
  };

  // ================= windows =================
  OS.open = (o) => {
    if (o.single) { const ex = OS.wins.find(w => w.key === o.single); if (ex) { ex.restore(); ex.focus(); return ex; } }
    const w = { key: o.single, title: o.title, icon: o.icon || 'doc', opts: o };
    const dw = Math.min(o.w || 560, innerWidth - 20), dh = Math.min(o.h || 400, innerHeight - 60);
    const off = (OS.cascade++ % 8) * 24;
    const win = el('div', 'win' + (o.fixed ? ' nosize' : ''));
    win.style.width = dw + 'px'; win.style.height = dh + 'px';
    win.style.left = (o.x != null ? o.x : Math.max(4, Math.min(innerWidth - dw - 10, (innerWidth - dw) / 2 - 120 + off))) + 'px';
    win.style.top = (o.y != null ? o.y : Math.max(4, Math.min(innerHeight - dh - 50, 40 + off))) + 'px';
    const tb = el('div', 'titlebar');
    tb.innerHTML = `${icon(w.icon)}<div class="t">${esc(o.title)}</div>`;
    const mk = (cls, fn, title) => { const b = el('button', 'tb ' + cls, cls === 'q' ? '?' : '<i></i>'); b.title = title || ''; b.onmousedown = e => e.stopPropagation(); b.onclick = (e) => { e.stopPropagation(); fn(); }; return b; };
    if (o.help) tb.appendChild(mk('q', () => OS.msg('Help', 'No online help is available for this dialog yet.', 'info'), 'Help'));
    if (!o.noMin) tb.appendChild(mk('min', () => w.minimize(), 'Minimize'));
    if (!o.fixed) { w.maxBtn = mk('max', () => w.toggleMax(), 'Maximize'); tb.appendChild(w.maxBtn); }
    tb.appendChild(mk('x', () => w.close(), 'Close'));
    const body = el('div', 'wbody');
    win.append(tb, body);
    if (!o.fixed) for (const d of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) { const r = el('div', 'rz ' + d); r.dataset.d = d; win.appendChild(r); }
    $('#windows').appendChild(win);
    w.el = win; w.body = body; w.tb = tb;

    // taskbar button
    const tbtn = el('button', 'task', `${icon(w.icon)}<span>${esc(o.title)}</span>`);
    tbtn.onclick = () => { if (w.minimized) { w.restore(); w.focus(); } else if (w.active) w.minimize(); else w.focus(); };
    $('#tasks').appendChild(tbtn); w.task = tbtn;

    w.setTitle = (t) => { w.title = t; tb.querySelector('.t').textContent = t; tbtn.querySelector('span').textContent = t; };
    w.setIcon = (n) => { w.icon = n; tb.firstElementChild.outerHTML = icon(n); tbtn.firstElementChild.outerHTML = icon(n); };
    w.focus = () => { OS.wins.forEach(x => { x.active = false; x.el.classList.remove('active'); x.task.classList.remove('active'); });
      w.active = true; win.classList.add('active'); tbtn.classList.add('active'); win.style.zIndex = ++OS.z; OS.focused = w; w.onFocus && w.onFocus(); };
    w.minimize = () => { w.minimized = true; win.classList.add('minimized'); w.active = false; tbtn.classList.remove('active'); win.classList.remove('active');
      const next = OS.wins.filter(x => !x.minimized).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0]; if (next) next.focus(); };
    w.restore = () => { w.minimized = false; win.classList.remove('minimized'); };
    w.toggleMax = () => { if (o.fixed) return; w.maximized = !w.maximized; win.classList.toggle('max', w.maximized);
      w.maxBtn.className = 'tb ' + (w.maximized ? 'rest' : 'max'); w.maxBtn.title = w.maximized ? 'Restore' : 'Maximize'; w.onResize && w.onResize(); };
    w.close = async () => { if (w.onClose && (await w.onClose()) === false) return; win.remove(); tbtn.remove(); OS.wins = OS.wins.filter(x => x !== w);
      const next = OS.wins.filter(x => !x.minimized).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0]; if (next) next.focus(); };

    win.addEventListener('mousedown', () => { if (!w.active) w.focus(); }, true);
    tb.addEventListener('dblclick', () => w.toggleMax());
    tb.addEventListener('mousedown', (e) => { if (w.maximized || e.button) return; startDrag(e, win, 'move', w); });
    win.querySelectorAll('.rz').forEach(r => r.addEventListener('mousedown', (e) => { if (!w.maximized && !e.button) startDrag(e, win, r.dataset.d, w); }));

    OS.wins.push(w);
    if (o.maximize) w.toggleMax();
    o.build && o.build(w, body);
    w.focus(); return w;
  };

  function startDrag(e, win, mode, w) {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, r = { l: win.offsetLeft, t: win.offsetTop, w: win.offsetWidth, h: win.offsetHeight };
    const shield = el('div', 'drag-shield'); shield.style.cursor = mode === 'move' ? 'default' : getComputedStyle(e.target).cursor; document.body.appendChild(shield);
    const maxY = $('#desktop').clientHeight;
    const mv = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (mode === 'move') { win.style.left = (r.l + dx) + 'px'; win.style.top = Math.max(-2, Math.min(maxY - 22, r.t + dy)) + 'px'; return; }
      let L = r.l, T = r.t, Wd = r.w, H = r.h; const mw = 220, mh = 120;
      if (mode.includes('e')) Wd = Math.max(mw, r.w + dx);
      if (mode.includes('s')) H = Math.max(mh, r.h + dy);
      if (mode.includes('w')) { Wd = Math.max(mw, r.w - dx); L = r.l + r.w - Wd; }
      if (mode.includes('n')) { H = Math.max(mh, r.h - dy); T = r.t + r.h - H; }
      Object.assign(win.style, { left: L + 'px', top: T + 'px', width: Wd + 'px', height: H + 'px' }); w.onResize && w.onResize();
    };
    const up = () => { shield.remove(); removeEventListener('mousemove', mv); removeEventListener('mouseup', up); };
    addEventListener('mousemove', mv); addEventListener('mouseup', up);
  }

  // ================= dialogs =================
  OS.msg = (title, text, ic = 'info', buttons = ['OK']) => new Promise(res => {
    OS.open({ title, icon: ic, w: 380, h: 150, fixed: true, noMin: true, x: Math.max(10, innerWidth / 2 - 190 + OS.cascade % 3 * 14), y: Math.max(10, innerHeight / 2 - 120),
      build(w, b) {
        const m = el('div', 'msgbox', `<div class="ic">${icon(ic)}</div><div class="tx">${esc(text).replace(/\n/g, '<br>')}</div>`);
        const bt = el('div', 'btns'); bt.style.cssText = 'display:flex;gap:6px;justify-content:center;padding:6px 0 10px';
        buttons.forEach((t, i) => { const x = el('button', 'b' + (i === 0 ? ' def' : ''), t); x.onclick = () => { w.onClose = null; w.close(); res(t); }; bt.appendChild(x); });
        b.append(m, bt); w.onClose = () => { res(null); };
        setTimeout(() => { const f = bt.firstChild; f && f.focus(); const h = m.offsetHeight + bt.offsetHeight + 34 + 12; w.el.style.height = Math.max(150, h) + 'px'; }, 0);
      } });
  });
  OS.prompt = (title, label, def = '') => new Promise(res => {
    OS.open({ title, icon: 'folder', w: 360, h: 140, fixed: true, noMin: true,
      build(w, b) {
        const d = el('div', 'dlg', `<div>${esc(label)}</div><div class="row"><input type="text"></div><div class="btns"><button class="b def">OK</button><button class="b">Cancel</button></div>`);
        b.appendChild(d); const inp = $('input', d); inp.value = def; setTimeout(() => { inp.focus(); inp.select(); }, 0);
        const done = (v) => { w.onClose = null; w.close(); res(v); };
        inp.onkeydown = (e) => { if (e.key === 'Enter') done(inp.value); if (e.key === 'Escape') done(null); };
        d.querySelectorAll('button')[0].onclick = () => done(inp.value); d.querySelectorAll('button')[1].onclick = () => done(null);
        w.onClose = () => { res(null); };
      } });
  });

  // ================= start menu + taskbar =================
  function hideStart() { $('#startmenu').classList.add('hidden'); $('#startbtn').classList.remove('on'); }
  OS.hideStart = hideStart;
  OS.buildStart = (items) => {
    const sm = $('#startmenu'); sm.innerHTML = '<div class="side"><span>BOXOS <i>99</i></span></div><div class="items"></div>';
    const box = $('.items', sm);
    for (const it of items) {
      if (it.sep) { box.appendChild(el('div', 'msep')); continue; }
      const d = el('div', 'mi', `${icon(it.icon)}<span>${it.label.replace(/&(.)/, '<u>$1</u>')}</span>${it.sub ? '<i class="arr">▶</i>' : ''}`);
      d.onmouseenter = () => { closeFrom(0); box.querySelectorAll('.mi.hot').forEach(h => h.classList.remove('hot'));
        if (it.sub) { d.classList.add('hot'); const r = d.getBoundingClientRect(); renderMenu(typeof it.sub === 'function' ? it.sub() : it.sub, 0, r.right - 1, r.top - 3); } };
      d.onclick = () => { if (it.sub) return; closeAll(); hideStart(); it.action && it.action(); };
      box.appendChild(d);
    }
  };
  $('#startbtn').addEventListener('mousedown', (e) => { e.stopPropagation(); const sm = $('#startmenu'); const open = !sm.classList.contains('hidden'); closeAll(); if (open) hideStart(); else { sm.classList.remove('hidden'); $('#startbtn').classList.add('on'); } });

  OS.setQuick = (items) => { const q = $('#quick'); q.innerHTML = ''; for (const it of items) { const b = el('div', 'q', icon(it.icon)); b.title = it.label; b.onclick = it.action; q.appendChild(b); } };

  function tick() { const d = new Date(); let h = d.getHours(), m = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; $('#clock').textContent = `${h}:${String(m).padStart(2, '0')} ${ap}`; $('#clock').title = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }

  // ================= desktop icons =================
  OS.desktop = {
    items: [], sel: new Set(),
    render() {
      const host = $('#icons'); host.innerHTML = '';
      this.items.forEach((it, idx) => {
        const d = el('div', 'dicon' + (this.sel.has(it.id) ? ' sel' : ''), `${it.img ? `<img src="${it.img}">` : icon(it.icon)}<span>${esc(it.label)}</span>`);
        d.style.left = it.x + 'px'; d.style.top = it.y + 'px'; d.dataset.id = it.id;
        d.addEventListener('mousedown', (e) => {
          e.stopPropagation(); if (e.button === 2) { if (!this.sel.has(it.id)) { this.sel = new Set([it.id]); this.render(); } return; }
          if (!(e.ctrlKey || e.metaKey) && !this.sel.has(it.id)) this.sel.clear(); this.sel.add(it.id); host.querySelectorAll('.dicon').forEach(x => x.classList.toggle('sel', this.sel.has(x.dataset.id)));
          const sx = e.clientX, sy = e.clientY, start = this.items.filter(i => this.sel.has(i.id)).map(i => [i, i.x, i.y]); let moved = false;
          const mv = (ev) => { if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 5) return; moved = true;
            start.forEach(([i, x, y]) => { i.x = Math.max(0, x + ev.clientX - sx); i.y = Math.max(0, y + ev.clientY - sy); const n = host.querySelector(`[data-id="${i.id}"]`); if (n) { n.style.left = i.x + 'px'; n.style.top = i.y + 'px'; } }); };
          const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); if (moved) { start.forEach(([i]) => { i.x = Math.round(i.x / 4) * 4; }); this.save(); this.render(); } };
          addEventListener('mousemove', mv); addEventListener('mouseup', up);
        });
        d.addEventListener('dblclick', () => OS.runItem && OS.runItem(it));
        d.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); OS.itemMenu && OS.itemMenu(it, e.clientX, e.clientY); });
        host.appendChild(d);
      });
    },
    save() { OS.onDesktopSave && OS.onDesktopSave(this.items); },
    nextPos() { const H = $('#desktop').clientHeight; const rows = Math.max(1, Math.floor((H - 8) / 84)); const n = this.items.length; return { x: 6 + Math.floor(n / rows) * 92, y: 6 + (n % rows) * 84 }; },
  };
  // rubber-band selection
  $('#desktop').addEventListener('mousedown', (e) => {
    if (e.target.id !== 'desktop' && e.target.id !== 'icons' && e.target.id !== 'brandmark') return;
    if (e.button) return;
    OS.desktop.sel.clear(); OS.desktop.render(); closeAll(); hideStart();
    const sb = $('#selbox'), r0 = $('#desktop').getBoundingClientRect(); const sx = e.clientX - r0.left, sy = e.clientY - r0.top;
    const mv = (ev) => { const x = ev.clientX - r0.left, y = ev.clientY - r0.top; Object.assign(sb.style, { display: 'block', left: Math.min(sx, x) + 'px', top: Math.min(sy, y) + 'px', width: Math.abs(x - sx) + 'px', height: Math.abs(y - sy) + 'px' });
      const bx = sb.getBoundingClientRect(); OS.desktop.sel.clear(); $('#icons').querySelectorAll('.dicon').forEach(n => { const nb = n.getBoundingClientRect(); const hit = !(nb.right < bx.left || nb.left > bx.right || nb.bottom < bx.top || nb.top > bx.bottom); n.classList.toggle('sel', hit); if (hit) OS.desktop.sel.add(n.dataset.id); }); };
    const up = () => { sb.style.display = 'none'; removeEventListener('mousemove', mv); removeEventListener('mouseup', up); };
    addEventListener('mousemove', mv); addEventListener('mouseup', up);
  });
  $('#desktop').addEventListener('contextmenu', (e) => { if (e.target.id === 'desktop' || e.target.id === 'icons' || e.target.id === 'brandmark') { e.preventDefault(); OS.desktopMenu && OS.desktopMenu(e.clientX, e.clientY); } });

  OS.init = () => {
    drawWallpaper(); tick(); setInterval(tick, 10000);
    $('#startlogo').innerHTML = icon('logo'); $('#brandlogo').innerHTML = icon('logo');
    $('#trayvol').innerHTML = icon('volume'); $('#traynet').innerHTML = icon('netTray');
    addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); hideStart(); } if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) { $('#startbtn').dispatchEvent(new MouseEvent('mousedown')); } });
  };
})();
