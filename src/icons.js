// Original pseudo-3D icon set (flat shapes with bevel highlights/shadows, no gradients so they can be reused freely).
(function () {
  const S = (body, vb = '0 0 32 32') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" shape-rendering="geometricPrecision">${body}</svg>`;
  const K = '#000', W = '#fff', G = '#c0c0c0', DG = '#808080', Y = '#f8d800', DY = '#c09800', NB = '#000080', B = '#1084d0', TEAL = '#087a94';
  const folder = (c1 = Y, c2 = DY) => `<path d="M2 8h10l2 3h16v17H2z" fill="${c2}" stroke="${K}"/><path d="M2.5 13h27v14.5h-27z" fill="${c1}" stroke="${K}"/><path d="M4 14.5h24" stroke="#fff6a0" stroke-width="1.5"/>`;
  const page = `<path d="M8 3h12l6 6v20H8z" fill="#fff" stroke="${K}"/><path d="M20 3v6h6" fill="${G}" stroke="${K}"/>`;
  const lines = (c = DG) => [11, 15, 19, 23].map(y => `<path d="M11 ${y}h11" stroke="${c}"/>`).join('');
  const globe = `<circle cx="16" cy="16" r="13" fill="#2878e0" stroke="${K}"/><path d="M8 8c4-3 9-2 10 2s-4 4-3 8-4 5-6 3-4-8-1-13zM21 17c4-1 6 3 5 6s-5 3-6 0-1-5 1-6z" fill="#38b038"/><path d="M7 9c3-3 7-4 10-3" stroke="#a8d8ff" stroke-width="1.6" fill="none"/>`;
  const monitor = (screen = '#1b3fd0') => `<path d="M3 3h26v19H3z" fill="${G}" stroke="${K}"/><path d="M3.5 3.5h25M3.5 3.5v18" stroke="${W}"/><path d="M6 6h20v13H6z" fill="${screen}" stroke="${DG}"/><path d="M7 7h8l-5 6z" fill="#7aa0ff" opacity=".7"/><path d="M11 22h10v3H11z" fill="${G}" stroke="${K}"/><path d="M6 25h20v4H6z" fill="${G}" stroke="${K}"/><path d="M6.5 25.5h19" stroke="${W}"/>`;
  const arrow = (d, c = '#38a028') => `<path d="${d}" fill="${c}" stroke="${K}" stroke-linejoin="round"/>`;
  const gear = `<circle cx="16" cy="16" r="9" fill="${G}" stroke="${K}"/><circle cx="16" cy="16" r="3.5" fill="${DG}" stroke="${K}"/><g stroke="${K}" fill="${G}">${[0, 45, 90, 135].map(a => `<rect x="14" y="2" width="4" height="6" transform="rotate(${a} 16 16)"/><rect x="14" y="24" width="4" height="6" transform="rotate(${a} 16 16)"/>`).join('')}</g><circle cx="16" cy="16" r="9" fill="${G}" stroke="${K}"/><circle cx="16" cy="16" r="3.5" fill="#406080" stroke="${K}"/>`;

  const I = {
    logo: S(`<g stroke="none"><path d="M10 6c4-3 8-3 12 0l-2 8c-4-3-8-3-12 0z" fill="#f2461e"/><path d="M23 7c3 1 5 1 7 0l-2 8c-2 1-4 1-7 0z" fill="#7ac020"/><path d="M8 17c4-3 8-3 12 0l-2 8c-4-3-8-3-12 0z" fill="#1c9be8"/><path d="M21 18c3 1 5 1 7 0l-2 8c-2 1-4 1-7 0z" fill="#ffc400"/><g fill="#f2461e"><rect x="1" y="9" width="2" height="2"/><rect x="4" y="7" width="2" height="2"/><rect x="2" y="13" width="2" height="2"/></g><g fill="#1c9be8"><rect x="1" y="19" width="2" height="2"/><rect x="4" y="21" width="2" height="2"/><rect x="2" y="25" width="2" height="2"/></g></g>`),
    cube: S(`<path d="M16 2l12 6v14l-12 7-12-7V8z" fill="#f08000" stroke="${K}" stroke-linejoin="round"/><path d="M16 15L4 8l12-6 12 6z" fill="#ffc040"/><path d="M16 15v14L4 22V8z" fill="#d86800"/><path d="M16 15v14l12-7V8z" fill="#a84800"/><path d="M16 2l12 6v14l-12 7-12-7V8z" fill="none" stroke="${K}" stroke-linejoin="round"/><path d="M4 8l12 7 12-7M16 15v14" stroke="${K}" fill="none"/>`),
    computer: S(monitor()),
    mycomputer: S(monitor('#1b3fd0')),
    folder: S(folder()),
    folderOpen: S(`<path d="M2 8h10l2 3h14v5H2z" fill="${DY}" stroke="${K}"/><path d="M6 14h25l-4 14H2z" fill="${Y}" stroke="${K}" stroke-linejoin="round"/><path d="M7 15.5h22" stroke="#fff6a0"/>`),
    docs: S(folder() + `<rect x="18" y="16" width="8" height="9" fill="#fff" stroke="${K}"/><path d="M19.5 19h5M19.5 21.5h5" stroke="${DG}"/>`),
    network: S(`<g><path d="M2 12h17v12H2z" fill="${G}" stroke="${K}"/><path d="M4 14h13v8H4z" fill="#1b3fd0" stroke="${DG}"/><path d="M6 24h9v3H6z" fill="${G}" stroke="${K}"/></g><g><path d="M14 4h16v12H14z" fill="${G}" stroke="${K}"/><path d="M16 6h12v8H16z" fill="#2a60e8" stroke="${DG}"/><path d="M18 16h8v3h-8z" fill="${G}" stroke="${K}"/></g><path d="M9 28h18" stroke="${K}" stroke-width="1.5"/><circle cx="26" cy="24" r="4" fill="#38b038" stroke="${K}"/>`),
    recycle: S(`<path d="M7 9h18l-2 19H9z" fill="#e8e8e8" stroke="${K}"/><path d="M6 6h20v3H6z" fill="${G}" stroke="${K}"/><path d="M13 3h6v3h-6z" fill="${G}" stroke="${K}"/><path d="M11 12l1.5 14M16 12v14M21 12l-1.5 14" stroke="#b8b8b8"/><path d="M16 13l3 5h-6zM12 20l5.5-1-3 4.5z" fill="#28a830" opacity=".9"/>`),
    recycleFull: S(`<path d="M7 11h18l-2 17H9z" fill="#e8e8e8" stroke="${K}"/><path d="M8 11l3-6 4 3 3-5 5 8z" fill="#fff" stroke="${K}"/><path d="M6 8h20v3H6z" fill="${G}" stroke="${K}"/>`),
    explorer: S(folder() + `<rect x="17" y="14" width="12" height="11" fill="${NB}" stroke="${K}"/><path d="M18 16h10" stroke="${B}" stroke-width="2"/><circle cx="23" cy="21" r="2" fill="#ffd000"/>`),
    browse: S(globe),
    globe: S(globe),
    notepad: S(`<path d="M6 4h20v24H6z" fill="#fff" stroke="${K}"/><path d="M6 4h20v5H6z" fill="${NB}" stroke="${K}"/><path d="M9 13h14M9 17h14M9 21h10" stroke="#4060c0"/><circle cx="10" cy="6.5" r="1" fill="#fff"/><circle cx="16" cy="6.5" r="1" fill="#fff"/><circle cx="22" cy="6.5" r="1" fill="#fff"/>`),
    doc: S(page + lines()),
    textfile: S(page + lines('#406080')),
    image: S(`<path d="M3 5h26v22H3z" fill="#fff" stroke="${K}"/><path d="M5 7h22v18H5z" fill="#68b8f0"/><path d="M5 25l7-9 5 5 4-4 6 8z" fill="#38a038"/><circle cx="21" cy="12" r="2.5" fill="#ffe040"/>`),
    music: S(page + `<path d="M12 22v-8l8-2v8" fill="none" stroke="${NB}" stroke-width="1.6"/><circle cx="11" cy="22" r="2" fill="${NB}"/><circle cx="19" cy="20" r="2" fill="${NB}"/>`),
    video: S(`<path d="M3 6h26v20H3z" fill="#202020" stroke="${K}"/><path d="M13 11l8 5-8 5z" fill="#ffd000"/><path d="M5 8h2M5 12h2M5 16h2M5 20h2M5 24h2M25 8h2M25 12h2M25 16h2M25 20h2M25 24h2" stroke="#808080" stroke-width="1.5"/>`),
    zip: S(page + `<path d="M15 3v22" stroke="${DY}" stroke-width="4" stroke-dasharray="2 2"/>`),
    app: S(`<path d="M3 5h26v22H3z" fill="${G}" stroke="${K}"/><path d="M3.5 5.5h25M3.5 5.5v21" stroke="${W}"/><path d="M5 7h22v4H5z" fill="${NB}"/><path d="M6 14h20v11H6z" fill="#fff" stroke="${DG}"/><path d="M9 17l3 3-3 3M14 23h5" stroke="${NB}" fill="none" stroke-width="1.5"/>`),
    exe: S(`<path d="M3 5h26v22H3z" fill="${G}" stroke="${K}"/><path d="M3.5 5.5h25M3.5 5.5v21" stroke="${W}"/><path d="M5 7h22v4H5z" fill="${NB}"/><path d="M6 14h20v11H6z" fill="#fff" stroke="${DG}"/><g transform="translate(10 15.5) scale(.34)"><path d="M0 0h13v13H0zM15 0h13v13H15zM0 15h13v13H0zM15 15h13v13H15z" fill="#f2461e"/></g>`),
    macapp: S(`<path d="M4 4h24v24H4z" fill="#e8e8e8" stroke="${K}"/><circle cx="16" cy="16" r="8" fill="#4890f0" stroke="${K}"/><path d="M12 19l4-8 4 8M13.5 16.5h5" fill="none" stroke="#fff" stroke-width="1.6"/>`),
    link: S(globe + `<path d="M2 30V20l6 4z" fill="${W}" stroke="${K}" transform="translate(0 -2)"/><path d="M3 27l5-6" stroke="${K}" stroke-width="1.5"/>`),
    shortcutOverlay: S(`<rect x="1" y="1" width="12" height="12" fill="#fff" stroke="${K}"/><path d="M4 10l5-5M5 5h4v4" stroke="${K}" stroke-width="1.5" fill="none"/>`, '0 0 14 14'),
    hd: S(`<path d="M3 11h26v13H3z" fill="${G}" stroke="${K}"/><path d="M3.5 11.5h25" stroke="${W}"/><path d="M3 11l3-5h20l3 5" fill="#e0e0e0" stroke="${K}" stroke-linejoin="round"/><rect x="6" y="17" width="12" height="3" fill="${DG}"/><circle cx="24" cy="19" r="1.6" fill="#28c028" stroke="${K}" stroke-width=".6"/>`),
    cd: S(`<circle cx="16" cy="16" r="13" fill="#d8d8d8" stroke="${K}"/><path d="M8 9a11 11 0 0 1 10-3" stroke="#fff" stroke-width="2" fill="none"/><circle cx="16" cy="16" r="9" fill="none" stroke="#b0b0d8"/><circle cx="16" cy="16" r="3.5" fill="${TEAL}" stroke="${K}"/>`),
    usb: S(`<path d="M5 9h22v14H5z" fill="${G}" stroke="${K}"/><path d="M5.5 9.5h21" stroke="${W}"/><path d="M5 12H2v8h3z" fill="${DG}" stroke="${K}"/><rect x="9" y="13" width="9" height="6" fill="${DG}"/><circle cx="23" cy="16" r="1.5" fill="#28c028"/>`),
    start: S(`<path d="M6 3h20v26H6z" fill="${G}" stroke="${K}"/>`),
    programs: S(`<path d="M3 5h26v22H3z" fill="#d8d8e8" stroke="${K}"/><path d="M5 7h22v3H5z" fill="${NB}"/><rect x="6" y="13" width="8" height="5" fill="#f2461e" stroke="${K}" stroke-width=".6"/><rect x="16" y="13" width="9" height="5" fill="#38a038" stroke="${K}" stroke-width=".6"/><rect x="6" y="20" width="8" height="5" fill="#1c9be8" stroke="${K}" stroke-width=".6"/><rect x="16" y="20" width="9" height="5" fill="#ffc400" stroke="${K}" stroke-width=".6"/>`),
    settings: S(gear),
    search: S(`<circle cx="13" cy="13" r="9" fill="#bfe4ff" stroke="${K}" stroke-width="1.5"/><path d="M8 9a6 6 0 0 1 6-3" stroke="#fff" stroke-width="2" fill="none"/><path d="M20 20l9 9" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M20 20l9 9" stroke="#a06820" stroke-width="3" stroke-linecap="round"/>`),
    help: S(`<path d="M5 3h18v26H5z" fill="#d02060" stroke="${K}" transform="skewY(-4) translate(2 2)"/><path d="M6 5h16" stroke="#ff80b0"/><text x="9" y="22" font-family="Verdana" font-weight="700" font-size="19" fill="#fff" stroke="${K}" stroke-width=".8">?</text><circle cx="25" cy="24" r="5" fill="#ffd800" stroke="${K}"/>`),
    run: S(`<path d="M2 6h28v20H2z" fill="${G}" stroke="${K}"/><path d="M4 8h24v4H4z" fill="${NB}"/><path d="M7 16h6M7 20h10" stroke="${K}"/><path d="M19 15l8 5-8 5z" fill="#38b038" stroke="${K}" stroke-linejoin="round"/>`),
    shutdown: S(monitor('#202040') + `<circle cx="16" cy="13" r="5" fill="none" stroke="#f04040" stroke-width="2"/><path d="M16 7v6" stroke="#f04040" stroke-width="2"/>`),
    logoff: S(`<path d="M4 4h14v24H4z" fill="${G}" stroke="${K}"/><path d="M18 16h10M23 11l5 5-5 5" stroke="${K}" fill="none" stroke-width="2"/>`),
    sleep: S(`<path d="M20 4a12 12 0 1 0 8 20A10 10 0 0 1 20 4z" fill="#ffd840" stroke="${K}"/>`),
    props: S(monitor('#1b3fd0') + `<circle cx="25" cy="25" r="5" fill="#fff" stroke="${K}"/><path d="M25 22.5v3M25 27v.5" stroke="${NB}" stroke-width="1.6"/>`),
    calc: S(`<path d="M6 3h20v26H6z" fill="${G}" stroke="${K}"/><path d="M8 5h16v6H8z" fill="#a8e0a0" stroke="${DG}"/>${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${9 + c * 5.5}" y="${14 + r * 5}" width="4" height="3.4" fill="${(r + c) % 2 ? '#e04040' : '#fff'}" stroke="${K}" stroke-width=".6"/>`).join('')).join('')}`),
    dos: S(`<path d="M2 5h28v22H2z" fill="${K}" stroke="${DG}"/><path d="M2 5h28v4H2z" fill="${G}"/><path d="M6 14l4 3-4 3M13 21h7" stroke="#38e038" fill="none" stroke-width="1.8"/>`),
    tasks: S(`<path d="M3 4h26v24H3z" fill="#fff" stroke="${K}"/><path d="M3 4h26v5H3z" fill="${NB}"/><path d="M6 24l4-6 4 3 4-7 5 6" stroke="#38a038" fill="none" stroke-width="2"/>`),
    home: S(`<path d="M3 16L16 4l13 12h-4v12H7V16z" fill="#e8d8b0" stroke="${K}" stroke-linejoin="round"/><path d="M3 16L16 4l13 12z" fill="#d03030" stroke="${K}" stroke-linejoin="round"/><path d="M13 28v-9h6v9z" fill="#805020" stroke="${K}"/>`),
    info: S(`<circle cx="16" cy="16" r="13" fill="#fff" stroke="${K}"/><circle cx="16" cy="16" r="11" fill="#2060e0"/><path d="M16 14v9" stroke="#fff" stroke-width="3"/><circle cx="16" cy="9.5" r="1.8" fill="#fff"/>`),
    warn: S(`<path d="M16 3L30 28H2z" fill="#ffd800" stroke="${K}" stroke-linejoin="round"/><path d="M16 11v8" stroke="${K}" stroke-width="3"/><circle cx="16" cy="23.5" r="1.7" fill="${K}"/>`),
    error: S(`<circle cx="16" cy="16" r="13" fill="#e02020" stroke="${K}"/><path d="M10 10l12 12M22 10L10 22" stroke="#fff" stroke-width="3.4"/>`),
    volume: S(`<path d="M3 11h6l7-6v22l-7-6H3z" fill="${G}" stroke="${K}"/><path d="M20 11c3 3 3 7 0 10M24 8c5 5 5 11 0 16" stroke="${K}" fill="none" stroke-width="1.6"/>`),
    netTray: S(monitor('#1b3fd0')),
    star: S(`<path d="M16 3l4 9 10 1-7.5 7 2.3 10L16 25l-8.8 5 2.3-10L2 13l10-1z" fill="#ffd800" stroke="${K}" stroke-linejoin="round"/>`),
    web: S(globe),
    up: S(`<path d="M6 12L16 3l10 9h-6v10h-8V12z" fill="#ffd800" stroke="${K}" stroke-linejoin="round" transform="translate(0 2)"/><path d="M4 27h24" stroke="${K}"/>`),
    back: S(arrow('M2 16l12-12v8h16v8H14v8z', '#38b028')),
    fwd: S(arrow('M30 16L18 4v8H2v8h16v8z', '#98b0a0')),
    stop: S(`<circle cx="16" cy="16" r="13" fill="#e02020" stroke="${K}"/><path d="M10 10l12 12M22 10L10 22" stroke="#fff" stroke-width="3.2"/>`),
    refresh: S(`<path d="M26 12A11 11 0 1 0 27 20" fill="none" stroke="${K}" stroke-width="7"/><path d="M26 12A11 11 0 1 0 27 20" fill="none" stroke="#38b038" stroke-width="4"/><path d="M19 4l10 2-3 9z" fill="#38b038" stroke="${K}" stroke-linejoin="round"/>`),
    folders: S(`<path d="M2 6h8l2 2h8v8H2z" fill="${Y}" stroke="${K}"/><path d="M12 14h8l2 2h8v12H12z" fill="${Y}" stroke="${K}"/><path d="M6 16v5h4M16 24h-6" stroke="${K}" fill="none"/>`),
    views: S(`<rect x="3" y="4" width="10" height="10" fill="${Y}" stroke="${K}"/><rect x="17" y="4" width="10" height="10" fill="${Y}" stroke="${K}"/><rect x="3" y="18" width="10" height="10" fill="${Y}" stroke="${K}"/><rect x="17" y="18" width="10" height="10" fill="${Y}" stroke="${K}"/>`),
    props2: S(page + `<path d="M11 14l3 3 6-6" stroke="#d02020" stroke-width="2.4" fill="none"/>${lines()}`),
    pc: S(`<path d="M10 4h60v46H10z" fill="#d8d8d8" stroke="${K}" stroke-width="1.4"/><path d="M14 8h52v38H14z" fill="#1c2f9a" stroke="#606060"/><g transform="translate(24 12) scale(1.35)"><path d="M0 4c4-3 8-3 12 0l-2 8c-4-3-8-3-12 0z" fill="#f2461e"/><path d="M12 5c3 1 5 1 7 0l-2 8c-2 1-4 1-7 0z" fill="#7ac020"/><path d="M-2 14c4-3 8-3 12 0l-2 8c-4-3-8-3-12 0z" fill="#1c9be8"/><path d="M11 15c3 1 5 1 7 0l-2 8c-2 1-4 1-7 0z" fill="#ffc400"/></g><path d="M28 50h24v8H28z" fill="#c0c0c0" stroke="${K}"/><path d="M12 58h56v10H12z" fill="#d0d0d0" stroke="${K}"/><path d="M20 63h30" stroke="#808080"/>`, '0 0 80 72'),
  };
  // generic mapping from file extension -> icon
  const EXT = {
    txt: 'textfile', md: 'textfile', log: 'textfile', json: 'textfile', js: 'textfile', css: 'textfile', html: 'globe', htm: 'globe', ini: 'settings', cfg: 'settings',
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', bmp: 'image', webp: 'image', svg: 'image', ico: 'image',
    mp3: 'music', wav: 'music', flac: 'music', ogg: 'music', m4a: 'music', mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
    zip: 'zip', rar: 'zip', '7z': 'zip', gz: 'zip', tar: 'zip', dmg: 'zip', iso: 'cd',
    exe: 'exe', msi: 'exe', bat: 'dos', cmd: 'dos', sh: 'dos', command: 'dos', app: 'macapp', url: 'link', webloc: 'link', lnk: 'app', desktop: 'app',
    pdf: 'doc', doc: 'doc', docx: 'doc', xls: 'doc', xlsx: 'doc', ppt: 'doc', pptx: 'doc', elf: 'app',
  };
  window.ICONS = I;
  window.icon = (n) => I[n] || I.doc;
  window.iconForExt = (ext, dir) => dir ? (ext === '.app' && window.boxosMac ? I.macapp : I.folder) : (I[EXT[(ext || '').replace('.', '')]] || I.doc);
})();
