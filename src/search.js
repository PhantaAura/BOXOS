// BOXOS Smart Search: one omnibox for web, URLs, bangs, calculator, apps, files, history and bookmarks.
(function () {
  const store = {
    get(k, d) { try { const v = localStorage.getItem('boxos.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('boxos.' + k, JSON.stringify(v)); } catch {} },
  };

  const ENGINES = {
    ddg:   { name: 'DuckDuckGo', bang: ['d', 'ddg'], url: 'https://duckduckgo.com/?q=%s' },
    google:{ name: 'Google', bang: ['g', 'google'], url: 'https://www.google.com/search?q=%s' },
    bing:  { name: 'Bing', bang: ['b', 'bing'], url: 'https://www.bing.com/search?q=%s' },
    brave: { name: 'Brave', bang: ['br', 'brave'], url: 'https://search.brave.com/search?q=%s' },
    wiki:  { name: 'Wikipedia', bang: ['w', 'wiki'], url: 'https://en.wikipedia.org/w/index.php?search=%s' },
    yt:    { name: 'YouTube', bang: ['yt', 'youtube'], url: 'https://www.youtube.com/results?search_query=%s' },
    gh:    { name: 'GitHub', bang: ['gh', 'github'], url: 'https://github.com/search?q=%s' },
    so:    { name: 'Stack Overflow', bang: ['so'], url: 'https://stackoverflow.com/search?q=%s' },
    maps:  { name: 'OpenStreetMap', bang: ['map', 'maps', 'osm'], url: 'https://www.openstreetmap.org/search?query=%s' },
    img:   { name: 'Images', bang: ['i', 'img', 'images'], url: 'https://duckduckgo.com/?q=%s&iax=images&ia=images' },
    ia:    { name: 'Internet Archive', bang: ['ia', 'archive'], url: 'https://archive.org/search?query=%s' },
    wiby:  { name: 'Wiby (retro web)', bang: ['wiby', 'retro'], url: 'https://wiby.me/?q=%s' },
    mdn:   { name: 'MDN Web Docs', bang: ['mdn'], url: 'https://developer.mozilla.org/en-US/search?q=%s' },
    amazon:{ name: 'Amazon', bang: ['a', 'amazon'], url: 'https://www.amazon.com/s?k=%s' },
  };
  const BANG = {};
  for (const [id, e] of Object.entries(ENGINES)) e.bang.forEach(b => BANG[b] = id);

  const DEFAULT_BOOKMARKS = [
    { title: 'BOXOS Home', url: 'boxos://home' },
    { title: 'DuckDuckGo', url: 'https://duckduckgo.com/' },
    { title: 'Wikipedia', url: 'https://www.wikipedia.org/' },
    { title: 'Internet Archive', url: 'https://archive.org/' },
    { title: 'Wayback Machine', url: 'https://web.archive.org/' },
    { title: 'Hacker News', url: 'https://news.ycombinator.com/' },
    { title: 'GitHub', url: 'https://github.com/' },
    { title: 'YouTube', url: 'https://www.youtube.com/' },
    { title: 'Wiby - retro web', url: 'https://wiby.me/' },
    { title: 'Archive of Old Software', url: 'https://winworldpc.com/' },
  ];

  // ---------- state ----------
  const S = {
    engine: store.get('engine', 'ddg'),
    history: store.get('history', {}),        // url -> {title,count,last}
    queries: store.get('queries', {}),        // text -> {count,last}
    bookmarks: store.get('bookmarks', DEFAULT_BOOKMARKS),
    index: [],                                 // local items: apps, desktop shortcuts, places
    cache: new Map(),
  };

  const looksLikeUrl = (q) => {
    q = q.trim();
    if (/\s/.test(q)) return false;
    if (/^(https?|ftp|file|boxos):\/\//i.test(q)) return true;
    if (/^localhost(:\d+)?(\/.*)?$/i.test(q)) return true;
    if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(q)) return true;
    return /^([a-z0-9-]+\.)+(com|net|org|io|dev|app|co|gov|edu|info|me|tv|ai|xyz|us|uk|de|fr|jp|ru|ca|au|nl|se|ch|it|es|br|in|cn|site|online|tech|blog|wiki|club|fun|games)(:\d+)?([/?#].*)?$/i.test(q);
  };
  const searchURL = (q, engine = S.engine) => (ENGINES[engine] || ENGINES.ddg).url.replace('%s', encodeURIComponent(q));
  const normalizeURL = (q) => /^[a-z][a-z0-9+.-]*:\/\//i.test(q) ? q : (/^(localhost|\d{1,3}(\.\d{1,3}){3})/i.test(q) ? 'http://' : 'https://') + q;

  // "g: cats", "!g cats", "cats !g", "yt cats"  ->  {engine, query}
  const parseBang = (q) => {
    let m = q.match(/^!([a-z]+)\s+(.+)$/i) || q.match(/^([a-z]+):\s*(.+)$/i);
    if (m && BANG[m[1].toLowerCase()]) return { engine: BANG[m[1].toLowerCase()], query: m[2].trim() };
    m = q.match(/^(.+?)\s+!([a-z]+)$/i);
    if (m && BANG[m[2].toLowerCase()]) return { engine: BANG[m[2].toLowerCase()], query: m[1].trim() };
    m = q.match(/^(yt|gh|wiki|so|mdn)\s+(.+)$/i);
    if (m) return { engine: BANG[m[1].toLowerCase()], query: m[2].trim() };
    return null;
  };

  // ---------- safe calculator (no eval) ----------
  function calc(src) {
    if (!/^[\d\s+\-*/^%().,a-z]+$/i.test(src) || !/\d/.test(src) || !/[+\-*/^%]|sqrt|sin|cos|tan|log|ln|abs|round|floor|ceil|pi|e\b/i.test(src)) return null;
    const t = src.toLowerCase().replace(/,/g, '').match(/\d*\.?\d+(e[+-]?\d+)?|[a-z]+|[()+\-*/^%]/g);
    if (!t || t.join('').length < src.replace(/[\s,]/g, '').length) return null;
    let i = 0;
    const F = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil };
    const C = { pi: Math.PI, e: Math.E };
    const peek = () => t[i], next = () => t[i++];
    function expr() { let v = term(); while (peek() === '+' || peek() === '-') v = next() === '+' ? v + term() : v - term(); return v; }
    function term() { let v = pow(); while (peek() === '*' || peek() === '/' || peek() === '%') { const o = next(); const r = pow(); v = o === '*' ? v * r : o === '/' ? v / r : v % r; } return v; }
    function pow() { const b = unary(); if (peek() === '^') { next(); return Math.pow(b, pow()); } return b; }
    function unary() { if (peek() === '-') { next(); return -unary(); } if (peek() === '+') { next(); return unary(); } return atom(); }
    function atom() {
      const x = next();
      if (x === undefined) throw 0;
      if (x === '(') { const v = expr(); if (next() !== ')') throw 0; return v; }
      if (/^[\d.]/.test(x)) return parseFloat(x);
      if (F[x]) { if (next() !== '(') throw 0; const v = expr(); if (next() !== ')') throw 0; return F[x](v); }
      if (x in C) return C[x];
      throw 0;
    }
    try { const v = expr(); if (i !== t.length || !isFinite(v)) return null; return +v.toPrecision(12); } catch { return null; }
  }

  // ---------- fuzzy scoring ----------
  function score(text, q) {
    text = text.toLowerCase();
    if (text === q) return 100;
    if (text.startsWith(q)) return 80 - Math.min(text.length - q.length, 30) * 0.3;
    const wi = text.search(new RegExp('[\\s._/\\-]' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    if (wi >= 0) return 60 - wi * 0.05;
    const si = text.indexOf(q);
    if (si >= 0) return 45 - si * 0.1;
    // subsequence (abbreviations like "ff" -> "Firefox", "vsc" -> "Visual Studio Code")
    let ti = 0, qi = 0, gaps = 0, last = -1;
    while (ti < text.length && qi < q.length) { if (text[ti] === q[qi]) { if (last >= 0 && ti - last > 1) gaps++; last = ti; qi++; } ti++; }
    const starts = /^[a-z0-9]/.test(text[0]) && (text[0] === q[0] || new RegExp('[\\s._\\-]' + q[0]).test(text));
    if (qi === q.length && q.length >= 2 && starts && gaps <= 3) return 25 - gaps * 3;
    return 0;
  }
  const frecency = (rec) => rec ? Math.min(20, Math.log2(1 + rec.count) * 4) + Math.max(0, 8 - (Date.now() - rec.last) / 864e5) : 0;

  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }

  // ---------- public API ----------
  const API = {
    ENGINES, S, store, calc, looksLikeUrl, searchURL, normalizeURL, parseBang,
    setEngine(id) { S.engine = id; store.set('engine', id); },
    setIndex(items) { S.index = items; },

    // Decide what pressing Enter on raw text means.
    resolve(raw) {
      const q = raw.trim();
      if (!q) return { type: 'none' };
      if (q === 'boxos://home' || q === 'about:home') return { type: 'url', url: 'boxos://home' };
      const ff = q.match(/^(?:!ff|firefox:)\s*(.+)$/i);
      if (ff) { const r = API.resolve(ff[1]); return r.type === 'url' && /^https?:/.test(r.url) ? { ...r, type: 'firefox' } : r; }
      if (/^(file|mailto):/i.test(q)) return { type: 'native', target: q };
      if (/^[a-z]:\\|^\/(?!\/)|^~\//i.test(q) && !/\s{2,}/.test(q) && /[\\/]/.test(q)) return { type: 'native', target: q };
      if (looksLikeUrl(q)) return { type: 'url', url: normalizeURL(q) };
      const b = parseBang(q);
      if (b) return { type: 'url', url: searchURL(b.query, b.engine), query: b.query, engine: b.engine };
      return { type: 'url', url: searchURL(q), query: q, engine: S.engine };
    },

    // Remember what the user visited / searched
    visit(url, title) {
      if (!url || /^(about:|boxos:|data:)/.test(url)) return;
      const r = S.history[url] || { count: 0 };
      S.history[url] = { title: title || r.title || hostOf(url), count: r.count + 1, last: Date.now() };
      const keys = Object.keys(S.history);
      if (keys.length > 1500) keys.sort((a, b) => S.history[a].last - S.history[b].last).slice(0, 300).forEach(k => delete S.history[k]);
      store.set('history', S.history);
    },
    remember(q) {
      if (!q) return; const r = S.queries[q] || { count: 0 };
      S.queries[q] = { count: r.count + 1, last: Date.now() }; store.set('queries', S.queries);
    },
    clearHistory() { S.history = {}; S.queries = {}; store.set('history', {}); store.set('queries', {}); },
    addBookmark(title, url) { if (!S.bookmarks.some(b => b.url === url)) { S.bookmarks.push({ title, url }); store.set('bookmarks', S.bookmarks); } },
    isBookmarked(url) { return S.bookmarks.some(b => b.url === url); },
    removeBookmark(url) { S.bookmarks = S.bookmarks.filter(b => b.url !== url); store.set('bookmarks', S.bookmarks); },
    topSites(n = 8) {
      const arr = Object.entries(S.history).map(([url, r]) => ({ url, title: r.title, s: frecency(r) + r.count })).sort((a, b) => b.s - a.s);
      const seen = new Set(), out = [];
      for (const a of arr) { const h = hostOf(a.url); if (seen.has(h)) continue; seen.add(h); out.push({ title: a.title, url: a.url }); if (out.length >= n) break; }
      for (const b of S.bookmarks) { if (out.length >= n) break; const h = hostOf(b.url); if (!seen.has(h) && b.url !== 'boxos://home') { seen.add(h); out.push(b); } }
      return out.slice(0, n);
    },

    // Instant (synchronous) suggestions from local sources + smart parsing
    local(raw, limit = 8) {
      const q = raw.trim(), ql = q.toLowerCase(); const out = [];
      if (!q) return out;
      const c = calc(q);
      if (c !== null) out.push({ kind: 'calc', icon: 'calc', text: `= ${c}`, sub: q, tag: 'Calculator', copy: String(c), score: 1000 });
      const b = parseBang(q);
      if (b) out.push({ kind: 'search', icon: 'search', text: b.query, sub: `Search ${ENGINES[b.engine].name}`, tag: ENGINES[b.engine].name, url: searchURL(b.query, b.engine), query: b.query, score: 900 });
      else if (!looksLikeUrl(q) && !/^[a-z]:\\|^\/|^~\//i.test(q) && calc(q) === null) out.push({ kind: 'search', icon: 'search', text: q, sub: 'Search ' + ENGINES[S.engine].name, tag: ENGINES[S.engine].name, url: searchURL(q), query: q, score: 20 });
      else if (looksLikeUrl(q)) out.push({ kind: 'url', icon: 'globe', text: q, sub: 'Go to address', tag: 'Open', url: normalizeURL(q), score: 900 });
      if (/^[a-z]:\\|^\/|^~\//i.test(q)) out.push({ kind: 'native', icon: 'run', text: q, sub: 'Open path or program', tag: 'Run', target: q, score: 850 });

      // history + bookmarks
      const pool = [];
      for (const [url, r] of Object.entries(S.history)) pool.push({ kind: 'url', icon: 'globe', text: r.title || hostOf(url), sub: url, url, tag: 'History', f: frecency(r), hay: [r.title || '', hostOf(url)] });
      for (const bm of S.bookmarks) pool.push({ kind: 'url', icon: 'star', text: bm.title, sub: bm.url, url: bm.url, tag: 'Bookmark', f: 10, hay: [bm.title, hostOf(bm.url)] });
      for (const it of S.index) pool.push({ ...it, f: it.f || 0, hay: [it.text] });
      for (const p of pool) {
        const s = Math.max(...p.hay.map(h => score(h, ql)));
        if (s > 0) out.push({ ...p, score: s + p.f + (p.kind === 'app' ? 6 : 0) });
      }
      // previous queries
      for (const [text, r] of Object.entries(S.queries)) {
        const s = score(text, ql); if (s > 0 && text.toLowerCase() !== ql) out.push({ kind: 'search', icon: 'search', text, sub: 'Previous search', tag: 'Recent', url: searchURL(text), query: text, score: s + frecency(r) });
      }
      out.sort((a, b) => b.score - a.score);
      // de-dupe by (kind,url/text)
      const seen = new Set(), res = [];
      for (const o of out) { const k = o.kind + '|' + (o.url || o.target || o.text); if (seen.has(k)) continue; seen.add(k); res.push(o); if (res.length >= limit) break; }
      return res;
    },

    // Web suggestions, async + cached
    async web(raw) {
      const q = raw.trim(); if (q.length < 2 || looksLikeUrl(q)) return [];
      const key = q.toLowerCase(); if (S.cache.has(key)) return S.cache.get(key);
      let list = [];
      try { if (window.boxos && window.boxos.suggest) list = await window.boxos.suggest(q); } catch {}
      S.cache.set(key, list); if (S.cache.size > 200) S.cache.delete(S.cache.keys().next().value);
      return list.map(t => ({ kind: 'search', icon: 'search', text: t, sub: ENGINES[S.engine].name, tag: 'Suggestion', url: searchURL(t), query: t }));
    },
  };
  window.Search = API;
})();
