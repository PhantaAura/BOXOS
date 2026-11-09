// Shaded "Windows 99" icon set: glossy gradients, dark outlines, matching the reference screenshot.
(function () {
  const I = window.ICONS;
  // shared gradients live in one always-rendered (zero-size) SVG so every icon can reference them
  const g = (id, stops, x2 = 1, y2 = 1) => `<linearGradient id="bx-${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const rg = (id, stops, cx = .35, cy = .3, r = .75) => `<radialGradient id="bx-${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.style.cssText = 'position:absolute;left:-9px;top:-9px';
  defs.innerHTML = '<defs>' + [
    g('y', [[0, '#fffbb0'], [.35, '#ffe640'], [1, '#d99a00']], .3, 1), g('yd', [[0, '#f6c800'], [1, '#a87800']], 0, 1),
    g('silver', [[0, '#ffffff'], [.5, '#d6d6d6'], [1, '#8a8a8a']]), g('case', [[0, '#f4f4f4'], [1, '#9a9a9a']], 0, 1),
    g('screen', [[0, '#4a64ff'], [.55, '#1426c8'], [1, '#08106e']]), g('navy', [[0, '#2850e0'], [1, '#00007a']], 1, 0),
    g('bluef', [[0, '#c8e0ff'], [.45, '#6aa0f0'], [1, '#2a50c0']], .2, 1), g('blued', [[0, '#7aa8ff'], [1, '#2038a8']], 0, 1),
    g('green', [[0, '#a8ff80'], [.5, '#38c820'], [1, '#0e7a14']], .3, 1), g('gray', [[0, '#f0f0f0'], [1, '#8c8c8c']], .4, 1),
    g('page', [[0, '#ffffff'], [1, '#d8d8d8']], .3, 1), g('bin', [[0, '#ffffff'], [.6, '#e4e8ec'], [1, '#a8b0b8']], 1, .2),
    g('pink', [[0, '#ff9ad0'], [.5, '#e0287c'], [1, '#8a0a44']]), g('gold', [[0, '#fff2a0'], [.5, '#f0b800'], [1, '#a06800']], .4, 1),
    g('win', [[0, '#e8e8e8'], [1, '#8a8a8a']], 0, 1), g('hd', [[0, '#6a80f0'], [.5, '#1a2c9e'], [1, '#0a1250']], 0, 1),
    g('disc', [[0, '#ffffff'], [.5, '#d0d8e8'], [1, '#8090b8']]), g('gear', [[0, '#d8e4f4'], [.5, '#7a96bc'], [1, '#3a5078']]),
    g('sky', [[0, '#40a0c8'], [1, '#087a94']], 0, 1), g('red', [[0, '#ff9a80'], [1, '#c01808']], 0, 1),
    rg('globe', [[0, '#8cc8ff'], [.45, '#2468e8'], [1, '#08288c']]), rg('glass', [[0, '#ffffff'], [.5, '#bfe2ff'], [1, '#5ea4e8']], .35, .3, .8),
    rg('land', [[0, '#7cf060'], [1, '#18861c']], .3, .3, 1),
  ].join('') + `<filter id="bx-3d" x="-15%" y="-15%" width="135%" height="135%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.15" result="b"/>
      <feDiffuseLighting in="b" surfaceScale="3.2" diffuseConstant="1.15" lighting-color="#ffffff" result="diff"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="diff" operator="arithmetic" k1="1.05" k2="0" k3="0" k4="0" result="lit"/>
      <feSpecularLighting in="b" surfaceScale="3.2" specularConstant=".85" specularExponent="22" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="225" elevation="48"/></feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
      <feComposite in="specIn" in2="lit" operator="arithmetic" k1="0" k2=".55" k3="1" k4="0" result="lit2"/>
      <feComposite in="lit2" in2="SourceAlpha" operator="in" result="body"/>
      <feColorMatrix in="SourceGraphic" type="matrix" values=".42 0 0 0 0  0 .42 0 0 0  0 0 .42 0 0  0 0 0 1 0" result="dark"/>
      <feOffset in="dark" dx=".7" dy=".7" result="e1"/><feOffset in="dark" dx="1.4" dy="1.4" result="e2"/><feOffset in="dark" dx="2.1" dy="2.1" result="e3"/>
      <feOffset in="SourceAlpha" dx="3" dy="3.2" result="o"/><feGaussianBlur in="o" stdDeviation=".9" result="ob"/>
      <feFlood flood-color="#000" flood-opacity=".4"/><feComposite in2="ob" operator="in" result="sh"/>
      <feMerge><feMergeNode in="sh"/><feMergeNode in="e3"/><feMergeNode in="e2"/><feMergeNode in="e1"/><feMergeNode in="body"/></feMerge></filter></defs>`;
  document.body.prepend(defs);

  const K = '#1c1c1c', U = (n) => `url(#bx-${n})`;
  const S = (b, vb = '0 0 32 32') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" overflow="visible" stroke-linejoin="round" stroke-linecap="round"><g transform="translate(.6 .6) scale(.9)"><g filter="url(#bx-3d)">${b}</g></g></svg>`;
  const st = (c = K, w = 1) => `stroke="${c}" stroke-width="${w}"`;

  // ---- building blocks ----
  const folderBack = `<path d="M2.5 6.5h9.5l2.5 3H29.5v18H2.5z" fill="${U('yd')}" ${st('#6a4c00')}/>`;
  const folderFront = (fill = 'y', line = '#6a4c00') => `<path d="M2.5 11.5h27l-.5 16H3z" fill="${U(fill)}" ${st(line)}/><path d="M4 13h24" stroke="#fffde0" stroke-width="1.2" opacity=".9"/>`;
  const folder = folderBack + folderFront();
  const globeSvg = (cx = 16, cy = 16, r = 13) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${U('globe')}" ${st('#06205f')}/>`
    + `<path d="M${cx - r * .6} ${cy - r * .5}c${r * .3}-${r * .35} ${r * .8}-${r * .3} ${r * .9} ${r * .05}s-${r * .3} ${r * .35}-${r * .35} ${r * .65}-${r * .35} ${r * .4}-${r * .55} ${r * .15}-${r * .25}-${r * .6}0-${r * .85}z" fill="${U('land')}"/><path d="M${cx + r * .25} ${cy + r * .1}c${r * .35}-${r * .1} ${r * .55} ${r * .25} ${r * .45} ${r * .5}s-${r * .4} ${r * .2}-${r * .5} 0-${r * .1}-${r * .4} ${r * .05}-${r * .5}z" fill="${U('land')}"/>`
    + `<ellipse cx="${cx - r * .35}" cy="${cy - r * .5}" rx="${r * .38}" ry="${r * .22}" fill="#fff" opacity=".55" transform="rotate(-30 ${cx - r * .35} ${cy - r * .5})"/>`;
  const crt = (x, y, w, h, sc = 'screen') => `<path d="M${x} ${y}h${w}v${h}H${x}z" fill="${U('silver')}" ${st()}/><path d="M${x + 2} ${y + 2}h${w - 4}v${h - 4}H${x + 2}z" fill="${U(sc)}" stroke="#2a2a2a" stroke-width=".8"/><path d="M${x + 2.5} ${y + 2.5}h${w * .5}l-${w * .28} ${h * .5}H${x + 2.5}z" fill="#fff" opacity=".28"/>`;
  const pcCase = (x, y, w, h) => `<path d="M${x} ${y}h${w}v${h}H${x}z" fill="${U('case')}" ${st()}/><rect x="${x + 2.5}" y="${y + h / 2 - 1}" width="${w * .42}" height="2" fill="#444"/><circle cx="${x + w - 4}" cy="${y + h / 2}" r="1" fill="#2a2a2a"/><circle cx="${x + w - 7}" cy="${y + h / 2}" r="1" fill="#2a2a2a"/>`;
  const computer = crt(6, 2.5, 20, 17) + `<path d="M11 19.5h10v2.5H11z" fill="${U('case')}" ${st()}/>` + pcCase(2.5, 22, 27, 7);
  const page = (fill = 'page') => `<path d="M7 2.5h13l6 6v21H7z" fill="${U(fill)}" ${st('#303030')}/><path d="M20 2.5v6h6" fill="#cfcfcf" ${st('#303030')}/>`;
  const textLines = (c = '#6a6a6a', y0 = 12, n = 5) => Array.from({ length: n }, (_, i) => `<path d="M10 ${y0 + i * 3.2}h${i === n - 1 ? 7 : 13}" stroke="${c}" stroke-width="1.1"/>`).join('');
  const gearPath = (cx, cy, r, teeth = 8, fill = U('gear')) => {
    let d = ''; const n = teeth * 2; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, a2 = (i + 1) / n * Math.PI * 2, rr = i % 2 ? r * .74 : r; d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}L${(cx + Math.cos((a + a2) / 2) * rr).toFixed(1)} ${(cy + Math.sin((a + a2) / 2) * rr).toFixed(1)}`; }
    return `<path d="${d}Z" fill="${fill}" ${st('#1c2a44', .9)}/><circle cx="${cx}" cy="${cy}" r="${r * .32}" fill="#e8f0ff" ${st('#1c2a44', .8)}/>`;
  };
  const magnifier = (handle = '#2d4f9c') => `<path d="M19.5 19.5L28.5 28.5" stroke="${K}" stroke-width="5.2"/><path d="M19.5 19.5L28.5 28.5" stroke="${handle}" stroke-width="3.2"/><circle cx="13" cy="13" r="9" fill="${U('glass')}" ${st('#1d4684', 1.6)}/><path d="M7.5 10a6.5 6.5 0 0 1 5.5-4" stroke="#fff" stroke-width="1.8" fill="none" opacity=".9"/>`;
  const arcArrow = (cx, cy, r, a0, a1) => {
    const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)], A0 = a0 * Math.PI / 180, A1 = a1 * Math.PI / 180; const [x0, y0] = p(A0), [x1, y1] = p(A1);
    const tx = -Math.sin(A1), ty = Math.cos(A1), nx = Math.cos(A1), ny = Math.sin(A1);
    const tip = [x1 + tx * 3.4, y1 + ty * 3.4], b1 = [x1 + nx * 2.6, y1 + ny * 2.6], b2 = [x1 - nx * 2.6, y1 - ny * 2.6];
    return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="#0e6a14" stroke-width="3"/><path d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="#3ed02a" stroke-width="1.6"/><polygon points="${tip.map(v => v.toFixed(1)).join(',')} ${b1.map(v => v.toFixed(1)).join(',')} ${b2.map(v => v.toFixed(1)).join(',')}" fill="#3ed02a" stroke="#0e6a14" stroke-width=".8"/>`;
  };
  const sparkle = (cx, cy, r, c = '#fff') => `<path d="M${cx} ${cy - r}L${cx + r * .3} ${cy - r * .3}L${cx + r} ${cy}L${cx + r * .3} ${cy + r * .3}L${cx} ${cy + r}L${cx - r * .3} ${cy + r * .3}L${cx - r} ${cy}L${cx - r * .3} ${cy - r * .3}Z" fill="${c}" stroke="#333" stroke-width=".6"/>`;
  const winCard = (x, y, w, h, tcol = 'navy') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" ${st('#303030')}/><rect x="${x}" y="${y}" width="${w}" height="${Math.max(3, h * .25)}" fill="${U(tcol)}" ${st('#101040', .6)}/>`;

  Object.assign(I, {
    computer: S(computer), mycomputer: S(computer),
    folder: S(folder), docs: S(folder),
    folderOpen: S(`<path d="M2.5 6.5h9.5l2.5 3H27v5H2.5z" fill="${U('yd')}" ${st('#6a4c00')}/><path d="M7 14h24l-4.5 14H2.5z" fill="${U('y')}" ${st('#6a4c00')}/><path d="M8 15.5h21" stroke="#fffde0" stroke-width="1.2"/>`),
    desk: S(`<rect x="2.5" y="3" width="27" height="25" fill="${U('win')}" ${st()}/><rect x="4" y="4.5" width="24" height="4" fill="${U('navy')}"/><rect x="4.5" y="10" width="23" height="16.5" fill="${U('sky')}"/><path d="M6 24c4-6 7-4 10-7s7-1 10-3v12H6z" fill="#7ac4d8" opacity=".8"/><path d="M8 14c3-2 6-1 8 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>`),
    network: S(`<rect x="15" y="2.5" width="11" height="17" fill="${U('case')}" ${st()}/><rect x="17" y="5" width="7" height="1.6" fill="#555"/>` + crt(2.5, 8, 15, 12) + `<path d="M7 20h6v2H7z" fill="${U('case')}" ${st()}/>` + pcCase(1.5, 22, 19, 6) + globeSvg(24, 22, 6.5)),
    recycle: S(`<path d="M6.5 8.5h19L23 29H9z" fill="${U('bin')}" ${st('#505860')}/><path d="M8 11l1.6 16M24 11l-1.6 16M12 10l.8 18M20 10l-.8 18M16 10v18" stroke="#b4bcc4" stroke-width=".7"/><ellipse cx="16" cy="8.5" rx="9.5" ry="3" fill="#dce6ee" ${st('#505860')}/><ellipse cx="16" cy="9" rx="7.5" ry="1.8" fill="#8896a4"/>` + [-70, 50, 170].map(a => arcArrow(16, 20, 5, a, a + 78)).join('')),
    recycleFull: S(`<path d="M6.5 11.5h19L23 29H9z" fill="${U('bin')}" ${st('#505860')}/><path d="M8 9l4-5 3 3 3-4 5 6z" fill="#fff" ${st('#505860')}/><path d="M11 12l3-5 4 3 5-4" fill="#f4f4c8" stroke="#505860" stroke-width=".8"/><ellipse cx="16" cy="11.5" rx="9.5" ry="2.6" fill="#dce6ee" ${st('#505860')}/>`),
    explorer: S(`<path d="M2.5 6.5h9.5l2.5 3H29.5v18H2.5z" fill="${U('blued')}" ${st('#101a60')}/><path d="M2.5 11.5h27l-.5 16H3z" fill="${U('bluef')}" ${st('#101a60')}/><path d="M4 13h24" stroke="#fff" stroke-width="1.2" opacity=".85"/>` + sparkle(21.5, 20, 4.4) + `<circle cx="22" cy="20.5" r="1.1" fill="#d02020"/>`),
    browse: S(globeSvg()), globe: S(globeSvg()), web: S(globeSvg()),
    link: S(globeSvg(15, 15, 12) + `<rect x="1.5" y="19" width="11" height="11" fill="#fff" ${st()}/><path d="M4 28l6-6M5.5 22h4.5v4.5" stroke="${K}" stroke-width="1.5" fill="none"/>`),
    notepad: S(page() + textLines('#3858c8', 11.5, 5) + `<path d="M16 24l2.2 2.4 5-5.8" stroke="#d01818" stroke-width="2" fill="none" opacity="0"/>`),
    props2: S(page() + textLines('#3858c8', 11, 4) + `<path d="M14 22l3 3.2 7.5-8.5" stroke="#d01818" stroke-width="2.2" fill="none"/>`),
    doc: S(page() + textLines()), textfile: S(page() + textLines()),
    cfgfile: S(page() + gearPath(14, 18, 6.2, 8) + gearPath(21, 23.5, 3.6, 6)),
    settings: S(`<rect x="2.5" y="3.5" width="17" height="23" fill="${U('page')}" ${st('#303030')}/><rect x="4.5" y="5.5" width="7" height="8" fill="${U('bluef')}" ${st('#203080', .6)}/><rect x="4.5" y="15.5" width="7" height="8" fill="#38b038" ${st('#106010', .6)}/><rect x="13" y="6" width="5" height="3" fill="#f0c020"/>` + gearPath(21.5, 20, 8, 8, U('gold')) + `<circle cx="21.5" cy="20" r="2.6" fill="#fff6c0" stroke="#7a5000" stroke-width=".8"/>`),
    app: S(`<rect x="2.5" y="4" width="27" height="24" fill="${U('win')}" ${st()}/><rect x="4" y="5.5" width="24" height="5" fill="${U('navy')}"/><path d="M21 8h1.2M24 8h1.2M27 8h0" stroke="#fff" stroke-width="1.6"/><rect x="4" y="11.5" width="24" height="15" fill="${U('gray')}"/>`),
    exe: S(`<rect x="2.5" y="4" width="27" height="24" fill="${U('win')}" ${st()}/><rect x="4" y="5.5" width="24" height="5" fill="${U('navy')}"/><path d="M21 8h1.2M24 8h1.2" stroke="#fff" stroke-width="1.6"/><rect x="4" y="11.5" width="24" height="15" fill="#fff"/><g transform="translate(9 13.5) scale(.5)"><path d="M0 4c4-3 8-3 12 0l-2 8c-4-3-8-3-12 0z" fill="#f2461e"/><path d="M13 5c3 1 5 1 7 0l-2 8c-2 1-4 1-7 0z" fill="#7ac020"/><path d="M-2 14c4-3 8-3 12 0l-2 8c-4-3-8-3-12 0z" fill="#1c9be8"/><path d="M11 15c3 1 5 1 7 0l-2 8c-2 1-4 1-7 0z" fill="#ffc400"/></g>`),
    macapp: S(`<rect x="3" y="3" width="26" height="26" rx="6" fill="${U('bluef')}" ${st('#101a60')}/><circle cx="16" cy="16" r="8.5" fill="${U('globe')}" ${st('#06205f')}/><path d="M11.5 20l4.5-9 4.5 9M13.2 17h5.6" fill="none" stroke="#fff" stroke-width="1.8"/>`),
    hd: S(`<path d="M2.5 14.5h27v10a2 2 0 0 1-2 2h-23a2 2 0 0 1-2-2z" fill="${U('gray')}" ${st()}/><path d="M2.5 14.5l3-6.5h21l3 6.5z" fill="${U('hd')}" ${st()}/><rect x="6" y="18" width="13" height="2.6" fill="${U('hd')}" ${st('#101040', .6)}/><circle cx="24.5" cy="19.3" r="1.4" fill="#58f058" stroke="#145014" stroke-width=".6"/>`),
    usb: S(`<path d="M2.5 14.5h27v10a2 2 0 0 1-2 2h-23a2 2 0 0 1-2-2z" fill="${U('gray')}" ${st()}/><path d="M2.5 14.5l3-6.5h21l3 6.5z" fill="${U('hd')}" ${st()}/><rect x="6" y="18" width="13" height="2.6" fill="${U('hd')}"/><circle cx="24.5" cy="19.3" r="1.4" fill="#58f058" stroke="#145014" stroke-width=".6"/>`),
    cd: S(`<circle cx="16" cy="16" r="13" fill="${U('disc')}" ${st('#303a58')}/><circle cx="16" cy="16" r="10" fill="none" stroke="#a8b4d8" stroke-width=".8"/><path d="M6.5 11a11 11 0 0 1 9-6" stroke="#fff" stroke-width="2.4" fill="none" opacity=".85"/><circle cx="16" cy="16" r="4.6" fill="#e8eef8" ${st('#303a58', .8)}/><path d="M16 12.6l3.2 3.4-3.2 3.4-3.2-3.4z" fill="#28c040" stroke="#106020" stroke-width=".7"/>`),
    programs: S(`<path d="M2.5 5.5h9.5l2.5 3H25v9H2.5z" fill="${U('yd')}" ${st('#6a4c00')}/><path d="M2.5 10.5h20v14h-20z" fill="${U('y')}" ${st('#6a4c00')}/>` + winCard(12, 12, 17, 15, 'navy') + `<rect x="14" y="18" width="4" height="2.4" fill="#e04030"/><rect x="20" y="18" width="6" height="2.4" fill="#4060d0"/><rect x="14" y="22" width="3" height="2.4" fill="#4060d0"/><rect x="19" y="22" width="7" height="2.4" fill="#e04030"/>`),
    search: S(magnifier()), searchGold: S(magnifier('#c08a10')),
    help: S(`<polygon points="16,3 30,13 18,29 3,18" fill="${U('pink')}" stroke="#4a0028" stroke-width="1.2"/><polygon points="16,5 27,13 17,26 6,18" fill="none" stroke="#ffb0d8" stroke-width=".8" opacity=".7"/><text x="10.5" y="22" font-family="Verdana,Arial" font-weight="900" font-size="17" fill="#fff" stroke="#4a0028" stroke-width=".7" transform="rotate(-8 16 16)">?</text>`),
    run: S(winCard(11, 3.5, 18, 15, 'navy') + `<path d="M13 10h12M13 13h8" stroke="#bbb" stroke-width="1"/>` + winCard(2.5, 13, 18, 15, 'win') .replace(/fill="url\(#bx-win\)"/, '') + `<path d="M5 20h6M5 23h10" stroke="#e04030" stroke-width="1.6"/><rect x="2.5" y="13" width="18" height="3.6" fill="${U('red')}" ${st('#601008', .6)}/>`),
    shutdown: S(pcCase(0, 0, 0, 0).slice(0, 0) + `<rect x="15.5" y="4" width="13" height="23" fill="${U('case')}" ${st()}/><path d="M18 8h8M18 11h8M18 14h8" stroke="#666" stroke-width="1"/><circle cx="22" cy="22.5" r="1.4" fill="#58f058" stroke="#145014" stroke-width=".6"/>` + crt(2.5, 7, 16, 14, 'screen') + `<g transform="translate(7.3 10) scale(.3)"><path d="M0 4c4-3 8-3 12 0l-2 8c-4-3-8-3-12 0z" fill="#f2461e"/><path d="M13 5c3 1 5 1 7 0l-2 8c-2 1-4 1-7 0z" fill="#7ac020"/><path d="M-2 14c4-3 8-3 12 0l-2 8c-4-3-8-3-12 0z" fill="#1c9be8"/><path d="M11 15c3 1 5 1 7 0l-2 8c-2 1-4 1-7 0z" fill="#ffc400"/></g><path d="M6 21h10v2.2H6z" fill="${U('case')}" ${st()}/><path d="M3 25h17v3H3z" fill="${U('case')}" ${st()}/>`),
    props: S(computer + `<circle cx="25" cy="25" r="5" fill="#fff" ${st()}/><path d="M25 22.5v3M25 27v.4" stroke="#1830a0" stroke-width="1.8"/>`),
    back: S(`<path d="M2 16L14 4v7.5h15v9H14V28z" fill="${U('green')}" stroke="#0a4a10" stroke-width="1.2"/><path d="M5 16l8.5-8.5v5h14" stroke="#d8ffc0" stroke-width="1" fill="none" opacity=".8"/>`),
    fwd: S(`<path d="M30 16L18 4v7.5H3v9h15V28z" fill="${U('silver')}" stroke="#505050" stroke-width="1.2"/><path d="M27 16l-8.5-8.5v5H5" stroke="#fff" stroke-width="1" fill="none" opacity=".9"/>`),
    up: S(folderBack + folderFront() + `<path d="M16 25V14M11.5 17.5L16 12.5l4.5 5z" stroke="#0a5c80" stroke-width="1" fill="#40d8f8"/><path d="M13.5 25V17.5h5V25z" fill="#40d8f8" stroke="#0a5c80" stroke-width="1"/>`),
    folders: S(folder),
    stop: S(`<circle cx="16" cy="16" r="13" fill="${U('red')}" ${st('#600808', 1.2)}/><path d="M10.5 10.5l11 11M21.5 10.5l-11 11" stroke="#fff" stroke-width="3.2"/>`),
    refresh: S(`<path d="M25.5 12.5A10.5 10.5 0 1 0 26.5 20" fill="none" stroke="#0a4a10" stroke-width="6.5"/><path d="M25.5 12.5A10.5 10.5 0 1 0 26.5 20" fill="none" stroke="#3ed02a" stroke-width="4"/><path d="M18 3.5l10.5 2.5-3.5 9.5z" fill="#3ed02a" stroke="#0a4a10" stroke-width="1.2"/>`),
    home: S(`<path d="M3 16L16 4l13 12h-4v12H7V16z" fill="#f4e4b8" ${st()}/><path d="M2 16.5L16 3.5l14 13z" fill="${U('red')}" ${st('#601008')}/><path d="M13 28v-9h6v9z" fill="#8a5a20" ${st()}/><rect x="21" y="6" width="3" height="6" fill="#a04030" ${st()}/>`),
    star: S(`<path d="M16 2.5l4.2 9 9.8 1.2-7.2 6.8 1.9 9.7L16 24.2l-8.7 5 1.9-9.7L2 12.7l9.8-1.2z" fill="${U('gold')}" stroke="#6a4400" stroke-width="1.1"/>`),
    views: S(`<rect x="3" y="4" width="10" height="10" fill="${U('y')}" ${st('#6a4c00')}/><rect x="17" y="4" width="10" height="10" fill="${U('y')}" ${st('#6a4c00')}/><rect x="3" y="18" width="10" height="10" fill="${U('y')}" ${st('#6a4c00')}/><rect x="17" y="18" width="10" height="10" fill="${U('y')}" ${st('#6a4c00')}/>`),
    calc: S(`<rect x="5" y="2.5" width="22" height="27" rx="2" fill="${U('case')}" ${st()}/><rect x="8" y="5.5" width="16" height="6" fill="#bff0b0" ${st('#406040', .8)}/>${[0, 1, 2, 3].map(r => [0, 1, 2].map(c => `<rect x="${8 + c * 5.5}" y="${14 + r * 3.8}" width="4.2" height="3" fill="${c === 2 ? U('red') : U('page')}" ${st('#303030', .6)}/>`).join('')).join('')}`),
    dos: S(`<rect x="2.5" y="4.5" width="27" height="23" fill="#101010" ${st('#505050')}/><rect x="2.5" y="4.5" width="27" height="4.5" fill="${U('win')}" ${st()}/><path d="M6 14l4.5 3.5L6 21M13 22h8" stroke="#40f040" stroke-width="1.8" fill="none"/>`),
    music: S(page() + `<path d="M12.5 23v-8.5l9-2v8.5" fill="none" stroke="#1830a0" stroke-width="1.6"/><ellipse cx="11" cy="23.2" rx="2.3" ry="1.8" fill="#1830a0"/><ellipse cx="20" cy="21.2" rx="2.3" ry="1.8" fill="#1830a0"/>`),
    image: S(`<rect x="2.5" y="5" width="27" height="22" fill="#fff" ${st('#303030')}/><rect x="4.5" y="7" width="23" height="18" fill="${U('sky')}"/><path d="M4.5 25l7-9.5 5 5.5 4-4.5 7 8.5z" fill="${U('green')}" stroke="#0a4a10" stroke-width=".8"/><circle cx="22" cy="12" r="2.8" fill="${U('gold')}"/>`),
    zip: S(page() + `<path d="M15.5 2.5v22" stroke="#c09000" stroke-width="3.6" stroke-dasharray="1.8 1.8"/><rect x="13" y="22" width="5" height="5" rx="1" fill="${U('gold')}" ${st('#6a4400', .8)}/>`),
    video: S(`<rect x="2.5" y="5" width="27" height="22" fill="#1a1a1a" ${st()}/><path d="M13 10.5l8.5 5.5-8.5 5.5z" fill="${U('gold')}" stroke="#6a4400" stroke-width=".8"/><path d="M5 8h2M5 12h2M5 16h2M5 20h2M5 24h2M25 8h2M25 12h2M25 16h2M25 20h2M25 24h2" stroke="#8a8a8a" stroke-width="1.5"/>`),
    tasks: S(`<rect x="3" y="4" width="26" height="24" fill="#fff" ${st()}/><rect x="3" y="4" width="26" height="5" fill="${U('navy')}"/><path d="M6 24l4-6 4 3 4-7 6 6" stroke="#28a028" fill="none" stroke-width="2"/>`),
    netTray: S(crt(5, 3, 20, 14) + `<path d="M3 20h24v6H3z" fill="${U('case')}" ${st()}/>`),
  });

  // file extension mapping for the new generic file types
  const EXT = { txt: 'textfile', md: 'textfile', log: 'textfile', json: 'textfile', js: 'textfile', css: 'textfile', html: 'globe', htm: 'globe', ini: 'cfgfile', cfg: 'cfgfile', conf: 'cfgfile', sys: 'cfgfile', dll: 'cfgfile', plist: 'cfgfile',
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', bmp: 'image', webp: 'image', svg: 'image', ico: 'image', mp3: 'music', wav: 'music', flac: 'music', ogg: 'music', m4a: 'music', mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
    zip: 'zip', rar: 'zip', '7z': 'zip', gz: 'zip', tar: 'zip', dmg: 'zip', iso: 'cd', exe: 'exe', msi: 'exe', bat: 'dos', cmd: 'dos', sh: 'dos', command: 'dos', app: 'macapp', url: 'link', webloc: 'link', lnk: 'app', desktop: 'app', elf: 'app', pdf: 'doc', doc: 'doc', docx: 'doc', xls: 'doc', xlsx: 'doc', ppt: 'doc', pptx: 'doc' };
  window.iconForExt = (ext, dir) => dir ? (ext === '.app' ? I.macapp : I.folder) : (I[EXT[(ext || '').replace('.', '')]] || I.doc);
})();
