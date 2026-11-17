(() => {
 'use strict';


 // ───────────── helpers ─────────────
 const $ = (s, el = document) => el.querySelector(s);
 const h = (tag, attrs = {}, ...kids) => {
   const el = document.createElement(tag);
   for (const [k, v] of Object.entries(attrs)) {
     if (k === 'class') el.className = v;
     else if (k === 'html') el.innerHTML = v;
     else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
     else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
   }
   for (const kid of kids.flat()) {
     if (kid == null || kid === false) continue;
     el.append(kid.nodeType ? kid : document.createTextNode(kid));
   }
   return el;
 };
 const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
 const isTouch = matchMedia('(pointer: coarse)').matches;
 const isMobile = () => innerWidth <= 640;
 const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
 const KBD = { hidden: isMac ? '⌘⇧.' : 'ctrl+shift+.', terminal: isMac ? '⌘K' : 'ctrl+k' };
 const MENUBAR = 28;
 const DOCK_SPACE = 84;


 const state = { showHidden: false, z: 10, windows: new Set(), focused: null, cascade: 0, iconPos: {}, openMenu: null };


 // ───────────── file system ─────────────
 function getNode(segs) {
   let n = FS;
   for (const s of segs) {
     if (!n || n.type !== 'dir' || !Object.hasOwn(n.children, s)) return null;
     n = n.children[s];
   }
   return n;
 }
 function normalize(cwd, input) {
   const abs = input.startsWith('/') || input.startsWith('~');
   const segs = abs ? [] : [...cwd];
   const rest = input.replace(/^~\/?/, '').replace(/^\/+/, '');
   for (const part of rest.split('/')) {
     if (!part || part === '.') continue;
     if (part === '..') segs.pop();
     else segs.push(part);
   }
   return segs;
 }
 const pathStr = (segs) => '~' + (segs.length ? '/' + segs.join('/') : '');
 const visible = (name) => state.showHidden || !name.startsWith('.');
 const sameSegs = (a, b) => a && b && a.length === b.length && a.every((s, i) => s === b[i]);


 function kindOf(name, node) {
   if (node.type === 'dir') return node.meta ? 'project' : 'folder';
   if (node.type === 'link') return 'link';
   if (node.type === 'app') return 'app';
   const ext = name.split('.').pop().toLowerCase();
   return { md: 'md', txt: 'txt', json: 'json', gif: 'image', png: 'image', jpg: 'image', jpeg: 'image', pdf: 'pdf' }[ext] || 'txt';
 }
 const KIND_LABEL = {
   folder: 'folder', project: 'project folder', md: 'markdown document', txt: 'plain text',
   json: 'json', image: 'image', pdf: 'pdf document', link: 'alias → web', app: 'application',
 };


 // ───────────── icons (thin black line) ─────────────
 const svg = (inner) =>
   `<svg viewBox="0 0 48 48" fill="var(--paper)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${inner}</svg>`;
 const FOLDER = '<path d="M5 13.5a2 2 0 0 1 2-2h11l4 4h19a2 2 0 0 1 2 2V37a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M5 19.5h38" fill="none"/>';
 const DOC = '<path d="M12 5h17l9 9v29H12z"/><path d="M29 5v9h9" fill="none"/>';
 const label = (t) => `<text x="25" y="33" text-anchor="middle" font-size="8.5" font-family="IBM Plex Mono, monospace" font-weight="600" stroke="none" fill="currentColor">${t}</text>`;
 const ICONS = {
   folder: svg(FOLDER),
   project: svg(FOLDER + '<path d="M20 25.5l-3.5 3.5 3.5 3.5M28 25.5l3.5 3.5-3.5 3.5" fill="none"/>'),
   txt: svg(DOC + '<path d="M17 22h15M17 27h15M17 32h10" fill="none"/>'),
   md: svg(DOC + label('MD')),
   json: svg(DOC + label('{ }')),
   pdf: svg(DOC + label('PDF')),
   image: svg('<rect x="6" y="10" width="36" height="28" rx="2"/><circle cx="16" cy="19" r="3" fill="none"/><path d="M6 33l10-9 8 7 6-5 12 9" fill="none"/>'),
   app: svg('<rect x="5" y="9" width="38" height="30" rx="3"/><path d="M5 15h38" fill="none"/><path d="M12 22l5 4-5 4M21 32h9" fill="none"/>'),
   link: svg(FOLDER + '<path d="M20 32l8-8M22 24h6v6" fill="none"/>'),
 };
 const dockSvg = (inner) => `<svg viewBox="0 0 48 48" aria-hidden="true">${inner}</svg>`;
 const DOCK_ICONS = {
   finder: dockSvg('<path d="M6 14a2 2 0 0 1 2-2h10l4 4h18a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M6 20h36"/>'),
   terminal: dockSvg('<path d="M11 17l8 7-8 7M24 33h13"/>'),
   mail: dockSvg('<rect x="7" y="12" width="34" height="24" rx="3"/><path d="M8 14l16 12 16-12"/>'),
   window: dockSvg('<rect x="8" y="10" width="32" height="28" rx="4"/><path d="M8 17h32"/><path d="M12.5 13.5h.01M16 13.5h.01M19.5 13.5h.01" stroke-width="2.4"/>'),
 };
 const LIGHT_GLYPHS = {
   close: '<svg viewBox="0 0 12 12"><path d="M3.8 3.8l4.4 4.4M8.2 3.8l-4.4 4.4"/></svg>',
   min: '<svg viewBox="0 0 12 12"><path d="M3 6h6"/></svg>',
   max: '<svg viewBox="0 0 12 12"><path d="M6 3v6M3 6h6"/></svg>',
 };


 // ───────────── icons as elements ─────────────
 function select(el) {
   el.parentElement.querySelectorAll('.icon.selected').forEach((n) => n.classList.remove('selected'));
   el.classList.add('selected');
 }


 function makeIcon(name, node, segs, onOpen = () => openPath(segs)) {
   const el = h('div', { class: 'icon' + (name.startsWith('.') ? ' hidden-file' : ''), tabindex: 0, 'data-name': name, html: ICONS[kindOf(name, node)] });
   el.append(h('span', { class: 'label' }, name));
   el.addEventListener('dblclick', onOpen);
   el.addEventListener('click', () => {
     if (el.dataset.dragged) return;
     select(el);
     if (isTouch) onOpen();
   });
   el.addEventListener('keydown', (e) => { if (e.key === 'Enter') onOpen(); });
   el.addEventListener('contextmenu', (e) => {
     e.preventDefault();
     e.stopPropagation();
     select(el);
     showMenu(e.clientX, e.clientY, [['open', onOpen], ['get info', () => openInfo(segs)]]);
   });
   return el;
 }


 function enableIconDrag(el, name) {
   el.addEventListener('pointerdown', (e) => {
     if (e.button !== 0 || isMobile() || isTouch) return;
     const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
     let moved = false;
     const move = (ev) => {
       const dx = ev.clientX - sx, dy = ev.clientY - sy;
       if (!moved && Math.hypot(dx, dy) < 4) return;
       moved = true;
       el.style.left = Math.max(0, Math.min(innerWidth - el.offsetWidth, ox + dx)) + 'px';
       el.style.top = Math.max(0, oy + dy) + 'px';
     };
     const up = () => {
       removeEventListener('pointermove', move);
       removeEventListener('pointerup', up);
       if (moved) {
         state.iconPos[name] = { x: el.offsetLeft, y: el.offsetTop };
         el.dataset.dragged = '1';
         setTimeout(() => delete el.dataset.dragged, 0);
       }
     };
     addEventListener('pointermove', move);
     addEventListener('pointerup', up);
   });
 }


 // desktop icons line up along the left edge
 function renderDesktop() {
   const box = $('#icons');
   box.innerHTML = '';
   const perCol = Math.max(3, Math.floor((innerHeight - MENUBAR - DOCK_SPACE - 20) / 100));
   let i = 0;
   for (const [name, node] of Object.entries(FS.children)) {
     if (!visible(name)) continue;
     const pos = state.iconPos[name] || {
       x: 18 + Math.floor(i / perCol) * 122,
       y: 16 + (i % perCol) * 100,
     };
     const el = makeIcon(name, node, [name]);
     el.style.left = pos.x + 'px';
     el.style.top = pos.y + 'px';
     enableIconDrag(el, name);
     box.append(el);
     i++;
   }
 }


 // ───────────── routing (#/projects/this-website) ─────────────
 function setHash(segs) {
   const url = segs && segs.length
     ? '#/' + segs.map(encodeURIComponent).join('/')
     : location.pathname + location.search;
   history.replaceState(null, '', url);
 }
 const parseHash = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);


 // ───────────── window manager ─────────────
 const APP_NAME = { finder: 'finder', terminal: 'terminal', file: 'preview', info: 'finder' };


 function focusWin(el) {
   el.style.zIndex = ++state.z;
   state.windows.forEach((w) => w.classList.toggle('focused', w === el));
   state.focused = el;
   $('#app-name').textContent = APP_NAME[el._api.kind] || 'finder';
   setHash(el._api.route);
 }


 function topWindow(filter = () => true, includeMinimized = false) {
   return [...state.windows]
     .filter((w) => (includeMinimized || !w._api.minimized) && filter(w))
     .sort((a, b) => (a._api.minimized - b._api.minimized) || (b.style.zIndex - a.style.zIndex))[0];
 }


 function focusNext() {
   const next = topWindow();
   if (next) focusWin(next);
   else {
     state.focused = null;
     state.windows.forEach((w) => w.classList.remove('focused'));
     $('#app-name').textContent = 'finder';
     setHash(null);
   }
 }


 function closeWindow(el) {
   if (!state.windows.has(el)) return;
   state.windows.delete(el);
   el.classList.add('closing');
   setTimeout(() => el.remove(), 150);
   focusNext();
   renderDock();
 }


 function minimizeWin(el) {
   el._api.minimized = true;
   el.classList.add('minimizing');
   setTimeout(() => { el.classList.remove('minimizing'); if (el._api.minimized) el.classList.add('minimized'); }, 260);
   focusNext();
   renderDock();
 }


 function bringUp(el) {
   if (el._api.minimized) {
     el._api.minimized = false;
     el.classList.remove('minimized', 'minimizing');
     void el.offsetWidth; // restart the pop-in animation
     el.style.animation = 'none';
     void el.offsetWidth;
     el.style.animation = '';
     renderDock();
   }
   focusWin(el);
 }


 function toggleMax(el) {
   if (isMobile()) return;
   el.classList.add('animating');
   setTimeout(() => el.classList.remove('animating'), 240);
   if (el.dataset.prev) {
     Object.assign(el.style, JSON.parse(el.dataset.prev));
     delete el.dataset.prev;
   } else {
     const { left, top, width, height } = el.style;
     el.dataset.prev = JSON.stringify({ left, top, width, height });
     Object.assign(el.style, { left: '10px', top: '10px', width: innerWidth - 20 + 'px', height: innerHeight - MENUBAR - DOCK_SPACE - 14 + 'px' });
   }
 }


 function createWindow({ title, width = 520, height = 380, className = '', id, route = null, kind = 'file' }) {
   if (id) {
     const ex = [...state.windows].find((w) => w.dataset.id === id);
     if (ex) { bringUp(ex); return { ...ex._api, existing: true }; }
   }
   const titleEl = h('span', { class: 'title' }, title);
   const closeBtn = h('button', { class: 'light close', 'aria-label': 'close window', html: LIGHT_GLYPHS.close });
   const minBtn = h('button', { class: 'light min', 'aria-label': 'minimize window', html: LIGHT_GLYPHS.min });
   const maxBtn = h('button', { class: 'light max', 'aria-label': 'maximize window', html: LIGHT_GLYPHS.max });
   const lights = h('div', { class: 'lights' }, closeBtn, minBtn, maxBtn);
   const bar = h('div', { class: 'titlebar' }, lights, titleEl, h('span'));
   const body = h('div', { class: 'body' });
   const el = h('section', { class: 'window ' + className, role: 'dialog', 'aria-label': title }, bar, body);
   if (id) el.dataset.id = id;


   const dw = innerWidth, dh = innerHeight - MENUBAR - DOCK_SPACE;
   const w = Math.min(width, dw - 24), hh = Math.min(height, dh - 24);
   const off = (state.cascade++ % 8) * 26;
   el.style.width = w + 'px';
   el.style.height = hh + 'px';
   el.style.left = Math.max(12, Math.min(dw - w - 12, (dw - w) / 2 + 50 + off)) + 'px';
   el.style.top = Math.max(12, Math.min(dh - hh - 12, (dh - hh) / 2 - 30 + off)) + 'px';


   const api = { el, body, route, kind, title, minimized: false, setTitle: (t) => { api.title = t; titleEl.textContent = t; el.setAttribute('aria-label', t); } };
   el._api = api;
   $('#desktop').append(el);
   state.windows.add(el);
   focusWin(el);


   el.addEventListener('pointerdown', () => { if (state.focused !== el) focusWin(el); });
   lights.addEventListener('pointerdown', (e) => e.stopPropagation());
   closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeWindow(el); });
   minBtn.addEventListener('click', (e) => { e.stopPropagation(); minimizeWin(el); });
   maxBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMax(el); });


   bar.addEventListener('pointerdown', (e) => {
     if (isMobile() || e.button !== 0) return;
     if (state.focused !== el) focusWin(el);
     const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
     bar.setPointerCapture(e.pointerId);
     const move = (ev) => {
       el.style.left = Math.min(innerWidth - 80, Math.max(80 - el.offsetWidth, ox + ev.clientX - sx)) + 'px';
       el.style.top = Math.min(innerHeight - MENUBAR - 60, Math.max(0, oy + ev.clientY - sy)) + 'px';
     };
     const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
     bar.addEventListener('pointermove', move);
     bar.addEventListener('pointerup', up);
   });
   bar.addEventListener('dblclick', (e) => { if (!e.target.closest('.lights')) toggleMax(el); });


   renderDock();
   return api;
 }


 // ───────────── dock ─────────────
 function renderDock() {
   const dock = $('#dock');
   dock.innerHTML = '';
   const has = (kind) => [...state.windows].some((w) => w._api.kind === kind);
   const focusOr = (kind, fallback) => () => {
     const w = topWindow((x) => x._api.kind === kind, true);
     w ? bringUp(w) : fallback();
   };
   const apps = [
     { label: 'finder', icon: DOCK_ICONS.finder, running: has('finder'), onclick: focusOr('finder', () => openPath([])) },
     { label: 'terminal', icon: DOCK_ICONS.terminal, running: has('terminal'), onclick: focusOr('terminal', openTerminal) },
   ];
   if (getNode(['contact.txt'])) apps.push({ label: 'say hi', icon: DOCK_ICONS.mail, running: false, onclick: () => openPath(['contact.txt']) });


   const item = ({ label, icon, running, onclick, mini }) => {
     const b = h('button', { class: 'dock-item' + (mini ? ' mini' : ''), 'aria-label': label, html: icon, onclick });
     b.append(h('span', { class: 'tip' }, label));
     if (running) b.append(h('span', { class: 'dot' }));
     return b;
   };
   apps.forEach((a) => dock.append(item(a)));


   const minimized = [...state.windows].filter((w) => w._api.minimized);
   if (minimized.length) {
     dock.append(h('span', { class: 'dock-sep' }));
     for (const w of minimized) dock.append(item({ label: w._api.title, icon: DOCK_ICONS.window, mini: true, onclick: () => bringUp(w) }));
   }
 }


 // ───────────── openers ─────────────
 function openPath(segs) {
   const node = getNode(segs);
   if (!node) return false;
   if (node.type === 'dir') {
     const ex = topWindow((w) => w._api.kind === 'finder' && sameSegs(w._api.route, segs), true);
     if (ex) bringUp(ex);
     else openFinder(segs);
   } else if (node.type === 'link') window.open(node.href, '_blank', 'noopener');
   else if (node.type === 'app') openTerminal();
   else openFile(segs);
   return true;
 }


 function openFinder(segs) {
   const win = createWindow({ title: pathStr(segs), width: 840, height: 420, className: 'finder', route: [...segs], kind: 'finder' });
   const f = { segs: [...segs], back: [], fwd: [] };
   const backBtn = h('button', { class: 'nav', 'aria-label': 'back' }, '‹');
   const fwdBtn = h('button', { class: 'nav', 'aria-label': 'forward' }, '›');
   const crumbs = h('div', { class: 'crumbs' });
   const grid = h('div', { class: 'grid' });
   const status = h('div', { class: 'statusbar' });
   const side = h('nav', { class: 'sidebar' });
   win.body.append(side, h('div', { class: 'main' }, h('div', { class: 'toolbar' }, backBtn, fwdBtn, crumbs), grid, status));


   function go(next, push = true) {
     if (sameSegs(next, f.segs)) return;
     if (push) { f.back.push(f.segs); f.fwd = []; }
     f.segs = [...next];
     render();
   }
   backBtn.onclick = () => { if (f.back.length) { f.fwd.push(f.segs); f.segs = f.back.pop(); render(); } };
   fwdBtn.onclick = () => { if (f.fwd.length) { f.back.push(f.segs); f.segs = f.fwd.pop(); render(); } };


   function renderSide() {
     side.innerHTML = '';
     const section = (title, entries) => {
       if (!entries.length) return;
       side.append(h('div', { class: 'side-h' }, title));
       for (const [name, segs, kind] of entries) {
         const b = h('button', { class: 'side-item' + (sameSegs(segs, f.segs) ? ' active' : ''), html: ICONS[kind], onclick: () => go(segs) });
         b.append(h('span', {}, name));
         side.append(b);
       }
     };
     const rootDirs = Object.entries(FS.children).filter(([n, c]) => c.type === 'dir' && visible(n));
     section('favorites', [['home', [], 'folder'], ...rootDirs.map(([n, c]) => [n, [n], kindOf(n, c)])]);
     const projects = FS.children.projects;
     if (projects?.type === 'dir') {
       section('projects', Object.entries(projects.children)
         .filter(([n, c]) => c.type === 'dir' && visible(n))
         .map(([n, c]) => [n, ['projects', n], kindOf(n, c)]));
     }
   }


   function render() {
     const node = getNode(f.segs);
     if (!node || node.type !== 'dir') { closeWindow(win.el); return; }
     win.setTitle(f.segs.length ? f.segs[f.segs.length - 1] : 'home');
     win.route = [...f.segs];
     if (state.focused === win.el) setHash(win.route);
     backBtn.disabled = !f.back.length;
     fwdBtn.disabled = !f.fwd.length;
     renderSide();


     crumbs.innerHTML = '';
     ['~', ...f.segs].forEach((p, i) => {
       if (i) crumbs.append(h('span', { class: 'sep' }, '/'));
       crumbs.append(h('button', { onclick: () => go(f.segs.slice(0, i)) }, p));
     });


     grid.innerHTML = '';
     const entries = Object.entries(node.children).filter(([n]) => visible(n));
     for (const [name, child] of entries) {
       const childSegs = [...f.segs, name];
       grid.append(makeIcon(name, child, childSegs, child.type === 'dir' ? () => go(childSegs) : () => openPath(childSegs)));
     }
     if (!entries.length) grid.append(h('p', { class: 'empty' }, 'this folder is empty'));
     status.textContent = `${entries.length} item${entries.length === 1 ? '' : 's'}` + (node.meta ? ` · ${node.meta.kind} · ${node.meta.status}` : '');
     renderDock();
   }


   win.navigate = (segs) => go(segs);
   win.render = render;
   render();
   return win;
 }


 function renderMarkdown(src) {
   const inline = (s) => s
     .replace(/`([^`]+)`/g, '<code>$1</code>')
     .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
     .replace(/\*([^*]+)\*/g, '<em>$1</em>')
     .replace(/\[([^\]]+)\]\((https?:[^)\s]+|[^)\s:]+)\)/g, '<a href="2"target="blank"rel="noopener">1</a>');
   let out = '', inList = false, inCode = false, para = [];
   const flushP = () => { if (para.length) { out += `<p>${inline(para.join(' '))}</p>`; para = []; } };
   const closeList = () => { if (inList) { out += '</ul>'; inList = false; } };
   for (const line of esc(src).split('\n')) {
     if (line.startsWith('```')) {
       if (inCode) { out += '</code></pre>'; inCode = false; }
       else { flushP(); closeList(); out += '<pre><code>'; inCode = true; }
       continue;
     }
     if (inCode) { out += line + '\n'; continue; }
     let m;
     if ((m = line.match(/^(#{1,3})\s+(.*)/))) { flushP(); closeList(); out += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; }
     else if ((m = line.match(/^\s*[-*]\s+(.*)/))) { flushP(); if (!inList) { out += '<ul>'; inList = true; } out += `<li>${inline(m[1])}</li>`; }
     else if (/^-{3,}$/.test(line.trim())) { flushP(); closeList(); out += '<hr>'; }
     else if (!line.trim()) { flushP(); closeList(); }
     else { closeList(); para.push(line); }
   }
   flushP(); closeList();
   if (inCode) out += '</code></pre>';
   return out;
 }


 function renderJSON(obj) {
   const pre = h('pre', { class: 'json' });
   pre.innerHTML = esc(JSON.stringify(obj, null, 2)).replace(
     /(&quot;(?:(?!&quot;).)*&quot;)(\s*:)?/g,
     (_, s, colon) => (colon ? `<span class="k">${s}</span>${colon}` : `<span class="s">${s}</span>`),
   );
   return pre;
 }


 function openFile(segs) {
   const node = getNode(segs), name = segs[segs.length - 1], kind = kindOf(name, node);
   const isPdf = kind === 'pdf';
   const win = createWindow({
     title: name, width: isPdf ? 850 : 540, height: isPdf ? 600 : 440,
     className: isPdf ? 'pdf' : '', id: 'file:' + segs.join('/'), route: segs, kind: 'file',
   });
   if (win.existing) return;
   const doc = h('div', { class: 'doc' });
   if (kind === 'md') doc.innerHTML = renderMarkdown(node.content);
   else if (kind === 'json') doc.append(renderJSON(node.content));
   else if (kind === 'image') doc.append(node.src ? h('img', { src: node.src, alt: node.alt || name }) : h('div', { class: 'placeholder' }, node.alt || 'demo goes here'));
   else if (isPdf) { doc.classList.add('paper'); doc.innerHTML = renderMarkdown(node.content); }
   else doc.append(h('pre', { class: 'txt' }, node.content));
   win.body.append(doc);
   if (isPdf && node.href) win.body.append(h('a', { class: 'download', href: node.href, download: '' }, '↓ download pdf'));
 }


 function openText(id, title, content) {
   const win = createWindow({ title, width: 460, height: 360, id: 'text:' + id, kind: 'file' });
   if (win.existing) return;
   win.body.append(h('div', { class: 'doc' }, h('pre', { class: 'txt' }, content)));
 }


 function openInfo(segs) {
   const node = getNode(segs);
   if (!node) return;
   const name = segs[segs.length - 1] || 'home', kind = kindOf(name, node);
   const win = createWindow({ title: `${name} info`, width: 360, height: 400, className: 'info', id: 'info:' + segs.join('/'), kind: 'info' });
   if (win.existing) return;
   const rows = [['kind', node.meta?.kind || KIND_LABEL[kind]], ['where', pathStr(segs.slice(0, -1))]];
   if (node.meta) {
     rows.push(['created', node.meta.created], ['size', node.meta.size], ['status', node.meta.status]);
     const stack = node.children['stack.json']?.content;
     if (stack) {
       const tags = Object.values(stack).flat().filter((v) => typeof v === 'string' && v);
       rows.push(['stack', h('div', { class: 'tags' }, tags.map((t) => h('span', {}, t)))]);
     }
   }
   if (node.type === 'dir') rows.push(['contains', `${Object.keys(node.children).filter(visible).length} items`]);
   if (node.type === 'file' && node.content) {
     const text = typeof node.content === 'string' ? node.content : JSON.stringify(node.content);
     rows.push(['size', `${new Blob([text]).size.toLocaleString()} bytes`]);
   }
   if (node.type === 'link') rows.push(['points to', node.href]);


   const header = h('header', { html: ICONS[kind] });
   header.append(h('strong', {}, name));
   win.body.append(header, h('table', {}, h('tbody', {}, rows.map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', {}, v))))));
 }


 // ───────────── terminal ─────────────
 function openTerminal() {
   const win = createWindow({ title: `${SITE.user} — zsh`, width: 640, height: 400, className: 'terminal', route: ['terminal.app'], kind: 'terminal' });
   const t = { cwd: [], hist: [], hi: 0 };
   const out = h('div', { class: 'term-out' });
   const promptEl = h('span', { class: 'prompt' });
   const input = h('input', { class: 'term-input', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'terminal input' });
   const term = h('div', { class: 'term' }, out, h('div', { class: 'term-line' }, promptEl, input));
   win.body.append(term);
   term.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });


   const prompt = () => `${SITE.user}@${SITE.host} ${pathStr(t.cwd)} %`;
   const updatePrompt = () => { promptEl.textContent = prompt() + ' '; };
   const print = (text, cls) => out.append(h('div', { class: 'term-row' + (cls ? ' ' + cls : '') }, text));
   const scroll = () => { win.body.scrollTop = win.body.scrollHeight; };
   const target = (p) => normalize(t.cwd, p);


   function lsRow(segs, node, all) {
     const row = h('div', { class: 'term-row ls' });
     for (const [n, c] of Object.entries(node.children)) {
       if (!all && n.startsWith('.')) continue;
       const cls = (c.type === 'dir' ? 'd' : 'f') + (n.startsWith('.') ? ' hid' : '');
       const suffix = c.type === 'dir' ? '/' : c.type === 'link' ? '@' : c.type === 'app' ? '*' : '';
       row.append(h('button', { class: cls, title: 'open ' + n, onclick: () => openPath([...segs, n]) }, n + suffix));
     }
     return row;
   }


   function treeLines(node, prefix, lines, all) {
     const ents = Object.entries(node.children).filter(([n]) => all || !n.startsWith('.'));
     ents.forEach(([n, c], i) => {
       const last = i === ents.length - 1;
       lines.push(prefix + (last ? '└── ' : '├── ') + n + (c.type === 'dir' ? '/' : ''));
       if (c.type === 'dir') treeLines(c, prefix + (last ? '    ' : '│   '), lines, all);
     });
     return lines;
   }


   const commands = {
     help() {
       print([
         'commands:',
         '  ls [-a] [dir]    list files (-a shows hidden ones)',
         '  cd <dir>         change directory (moves your finder window too)',
         '  cat <file>       print a file',
         '  open <path>      open it in a window',
         '  tree [-a]        show everything',
         '  whoami, neofetch, pwd, history, date, echo, clear, exit',
         '',
         'tab completes · ↑/↓ for history · ctrl+l clears',
       ].join('\n'));
     },
     ls(args) {
       const all = args.some((a) => /^-\w*a/.test(a));
       const p = args.find((a) => !a.startsWith('-')) || '.';
       const segs = target(p), node = getNode(segs);
       if (!node) return print(`ls: ${p}: No such file or directory`);
       if (node.type !== 'dir') return print(segs[segs.length - 1]);
       out.append(lsRow(segs, node, all));
     },
     cd(args) {
       const p = args[0] || '~';
       const segs = target(p), node = getNode(segs);
       if (!node) return print(`cd: no such file or directory: ${p}`);
       if (node.type !== 'dir') return print(`cd: not a directory: ${p}`);
       t.cwd = segs;
       const finder = topWindow((w) => w._api.kind === 'finder');
       if (finder) finder._api.navigate(segs);
     },
     pwd() { print('/home/' + SITE.user + (t.cwd.length ? '/' + t.cwd.join('/') : '')); },
     cat(args) {
       if (!args.length) return print('usage: cat <file>');
       for (const p of args) {
         const segs = target(p), node = getNode(segs);
         if (!node) print(`cat: ${p}: No such file or directory`);
         else if (node.type === 'dir') print(`cat: ${p}: Is a directory`);
         else if (node.type === 'link') print(`${p} -> ${node.href}`);
         else if (node.type === 'app') print(`cat: ${p}: that's a binary. try \`open ${p}\``);
         else if (!node.content) print(`[binary data] try \`open ${p}\``);
         else print(typeof node.content === 'string' ? node.content : JSON.stringify(node.content, null, 2));
       }
     },
     open(args) {
       const p = args[0] || '.';
       if (!openPath(target(p))) print(`open: ${p}: No such file or directory`);
     },
     tree(args) {
       const all = args.includes('-a');
       const p = args.find((a) => !a.startsWith('-')) || '.';
       const node = getNode(target(p));
       if (!node || node.type !== 'dir') return print(`tree: ${p}: not a directory`);
       print(['.', ...treeLines(node, '', [], all)].join('\n'));
     },
     whoami() { print(SITE.whoami); },
     neofetch() {
       const art = ['   ________', '  /        \\_____', ' |               |', ' |    ◐     ◐    |', ' |       ‿       |', ' |_______________|', ''];
       const head = `${SITE.user}@${SITE.host}`;
       const info = [head, '-'.repeat(head.length), ...SITE.neofetch.map(([k, v]) => `${k}: ${v}`)];
       const n = Math.max(art.length, info.length);
       const lines = [];
       for (let i = 0; i < n; i++) lines.push((art[i] || '').padEnd(22) + (info[i] || ''));
       print(lines.join('\n'));
     },
     history() { print(t.hist.map((c, i) => `${String(i + 1).padStart(4)}  ${c}`).join('\n')); },
     date() { print(new Date().toString()); },
     echo(args) { print(args.join(' ')); },
     clear() { out.innerHTML = ''; },
     exit() { closeWindow(win.el); },
     sudo() { print('nice try. this incident will be reported.'); },
     rm() { print('rm: permission denied (this computer is read-only, but i respect the energy)'); },
     vim() { print("you're stuck in vim forever now. (jk. try `cat` instead)"); },
     ssh() { print('ssh: you are already inside my computer'); },
   };
   commands.dir = commands.ls;
   commands.emacs = commands.nano = commands.vi = commands.vim;


   function run(raw) {
     const [cmd, ...args] = raw.trim().split(/\s+/);
     if (!cmd) return;
     const fn = Object.hasOwn(commands, cmd) ? commands[cmd] : null;
     if (fn) fn(args);
     else if (getNode(target(cmd))?.type === 'app') openTerminal();
     else print(`zsh: command not found: ${cmd}`);
   }


   function complete() {
     const parts = input.value.split(' ');
     const last = parts.pop();
     if (!parts.length) {
       const m = Object.keys(commands).filter((c) => c.startsWith(last));
       if (m.length === 1) input.value = m[0] + ' ';
       else if (m.length > 1) print(m.join('  '), 'dim');
       return;
     }
     const slash = last.lastIndexOf('/');
     const dirPart = slash >= 0 ? last.slice(0, slash + 1) : '';
     const prefix = last.slice(slash + 1);
     const dir = getNode(target(dirPart || '.'));
     if (!dir || dir.type !== 'dir') return;
     const m = Object.keys(dir.children).filter((n) => n.startsWith(prefix) && (!n.startsWith('.') || prefix.startsWith('.') || state.showHidden));
     if (m.length === 1) {
       const isDir = dir.children[m[0]].type === 'dir';
       input.value = [...parts, dirPart + m[0] + (isDir ? '/' : ' ')].join(' ');
     } else if (m.length > 1) {
       let common = m[0];
       for (const s of m) while (!s.startsWith(common)) common = common.slice(0, -1);
       if (common.length > prefix.length) input.value = [...parts, dirPart + common].join(' ');
       else print(m.join('  '), 'dim');
     }
   }


   input.addEventListener('keydown', (e) => {
     if (e.key === 'Enter') {
       const raw = input.value;
       input.value = '';
       print(prompt() + ' ' + raw, 'echo');
       if (raw.trim()) t.hist.push(raw);
       t.hi = t.hist.length;
       run(raw);
       if (state.windows.has(win.el)) { updatePrompt(); scroll(); }
     } else if (e.key === 'ArrowUp') {
       e.preventDefault();
       if (t.hi > 0) input.value = t.hist[--t.hi];
     } else if (e.key === 'ArrowDown') {
       e.preventDefault();
       if (t.hi < t.hist.length - 1) input.value = t.hist[++t.hi];
       else { t.hi = t.hist.length; input.value = ''; }
     } else if (e.key === 'Tab') {
       e.preventDefault();
       complete();
       scroll();
     } else if (e.ctrlKey && e.key === 'l') {
       e.preventDefault();
       out.innerHTML = '';
     } else if (e.ctrlKey && e.key === 'c') {
       print(prompt() + ' ' + input.value + '^C', 'echo');
       input.value = '';
       scroll();
     }
   });


   print(`welcome to kaelyn-os. type \`help\` to see what you can do.`, 'dim');
   updatePrompt();
   setTimeout(() => input.focus(), 60);
   return win;
 }


 // ───────────── menus ─────────────
 // items: [label, fn, shortcut?]  ·  '-' is a divider  ·  fn = null → disabled
 function showMenu(x, y, items, fromBtn = null) {
   const m = $('#ctx');
   m.innerHTML = '';
   for (const it of items) {
     if (it === '-') { m.append(h('hr')); continue; }
     const [text, fn, kbd] = it;
     const b = h('button', { disabled: !fn, onclick: () => { hideMenus(); fn(); } }, h('span', {}, text), kbd ? h('kbd', {}, kbd) : null);
     m.append(b);
   }
   m.hidden = false;
   m.style.animation = 'none';
   void m.offsetWidth;
   m.style.animation = '';
   const r = m.getBoundingClientRect();
   m.style.left = Math.max(6, Math.min(x, innerWidth - r.width - 6)) + 'px';
   m.style.top = Math.max(6, Math.min(y, innerHeight - r.height - 6)) + 'px';
   document.querySelectorAll('[data-menu].open').forEach((b) => b.classList.remove('open'));
   state.openMenu = fromBtn ? fromBtn.dataset.menu : null;
   if (fromBtn) fromBtn.classList.add('open');
 }


 function hideMenus() {
   $('#ctx').hidden = true;
   state.openMenu = null;
   document.querySelectorAll('[data-menu].open').forEach((b) => b.classList.remove('open'));
 }


 function restart() {
   try { sessionStorage.removeItem('booted'); } catch {}
   location.href = location.pathname;
 }


 const SHORTCUTS = `keyboard shortcuts


 ${KBD.terminal.padEnd(14)}new terminal
 ${KBD.hidden.padEnd(14)}show / hide hidden files
 esc           close the front window
 double-click  open things (or the title bar to maximize)
 right-click   get info


in the terminal
 tab           autocomplete
 ↑ / ↓         command history
 ctrl+l        clear`;


 function menuItems(name) {
   const front = state.focused;
   const frontRoute = front?._api.route;
   switch (name) {
     case 'os': return [
       ['about this computer', () => openPath(['about.txt'])],
       '-',
       ['restart…', restart],
     ];
     case 'file': return [
       ['new finder window', () => openFinder([])],
       ['new terminal', openTerminal, KBD.terminal],
       '-',
       ['get info', frontRoute && front._api.kind !== 'terminal' ? () => openInfo(frontRoute) : null],
       ['minimize window', front ? () => minimizeWin(front) : null],
       ['close window', front ? () => closeWindow(front) : null, 'esc'],
     ];
     case 'view': return [
       [state.showHidden ? 'hide hidden files' : 'show hidden files', toggleHidden, KBD.hidden],
       ['clean up desktop', () => { state.iconPos = {}; renderDesktop(); }],
       '-',
       ['wallpaper', null],
       ...wallpaperItems(),
       '-',
       ['close all windows', state.windows.size ? () => [...state.windows].forEach(closeWindow) : null],
     ];
     case 'go': return [
       ['home', () => openPath([])],
       ...Object.entries(FS.children)
         .filter(([n]) => visible(n))
         .map(([n]) => [n, () => openPath([n])]),
     ];
     case 'help': return [
       ['keyboard shortcuts', () => openText('shortcuts', 'shortcuts.txt', SHORTCUTS)],
       ['what is this?', () => openPath(['projects', 'personal_website', 'README.md'])],
     ];
     default: return [];
   }
 }


 function openMenuFrom(btn) {
   const r = btn.getBoundingClientRect();
   showMenu(r.left, r.bottom + 4, menuItems(btn.dataset.menu), btn);
 }


 let toastTimer;
 function toast(msg) {
   const el = $('#toast');
   el.textContent = msg;
   el.classList.add('show');
   clearTimeout(toastTimer);
   toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
 }


 function toggleHidden() {
   state.showHidden = !state.showHidden;
   renderDesktop();
   state.windows.forEach((w) => w._api.render?.());
   toast(state.showHidden ? 'hidden files: visible' : 'hidden files: hidden');
 }


 function bindUI() {
   document.querySelectorAll('#menubar [data-menu]').forEach((btn) => {
     btn.addEventListener('click', () => {
       if (state.openMenu === btn.dataset.menu) hideMenus();
       else openMenuFrom(btn);
     });
     // like a real menu bar: once one is open, hovering switches menus
     btn.addEventListener('mouseenter', () => {
       if (state.openMenu && state.openMenu !== btn.dataset.menu) openMenuFrom(btn);
     });
   });


   document.addEventListener('pointerdown', (e) => {
     if (!e.target.closest('.dropdown, #menubar [data-menu]')) hideMenus();
     if (e.target.id === 'icons' || e.target.id === 'desktop') {
       $('#icons').querySelectorAll('.selected').forEach((n) => n.classList.remove('selected'));
     }
   });


   $('#desktop').addEventListener('contextmenu', (e) => {
     if (e.target.id !== 'icons' && e.target.id !== 'desktop') return;
     e.preventDefault();
     showMenu(e.clientX, e.clientY, [
       ['new finder window', () => openFinder([])],
       ['new terminal', openTerminal, KBD.terminal],
       '-',
       [state.showHidden ? 'hide hidden files' : 'show hidden files', toggleHidden, KBD.hidden],
       ['clean up desktop', () => { state.iconPos = {}; renderDesktop(); }],
       '-',
       ['wallpaper', null],
       ...wallpaperItems(),
     ]);
   });


   addEventListener('keydown', (e) => {
     const mod = e.metaKey || e.ctrlKey;
     if (mod && e.shiftKey && (e.code === 'Period' || e.key === '.' || e.key === '>')) { e.preventDefault(); toggleHidden(); }
     else if (mod && !e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); openTerminal(); }
     else if (e.key === 'Escape') {
       if (!$('#ctx').hidden) hideMenus();
       else if (state.focused && !e.target.closest?.('.term-input')) closeWindow(state.focused);
     }
   });


   addEventListener('hashchange', () => { const segs = parseHash(); if (segs.length) openPath(segs); });


   let resizeTimer;
   addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderDesktop, 150); });
 }


 function startClock() {
   const el = $('#clock');
   const tick = () => {
     const d = new Date();
     const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase();
     el.textContent = isMobile()
       ? time
       : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toLowerCase().replace(',', '') + '  ' + time;
   };
   tick();
   setInterval(tick, 15000);
 }


 // ───────────── wallpapers ─────────────
 const svgUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
 const GRAIN = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .11 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`) + ' 0 0 / 180px 180px';
 const HILLS = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
   <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe6ec"/><stop offset=".7" stop-color="#f1ebe2"/></linearGradient></defs>
   <rect width="1600" height="1000" fill="url(#sky)"/>
   <circle cx="1160" cy="330" r="86" fill="#f6e7d2" stroke="#1d1b18" stroke-width="1.5"/>
   <path d="M-10 600 C 200 500 380 545 560 460 S 900 370 1100 440 S 1400 520 1610 420 V1010 H-10Z" fill="#dbe0d6" stroke="#1d1b18" stroke-width="1.5"/>
   <path d="M-10 710 C 240 630 420 690 640 620 S 1000 550 1240 640 S 1480 690 1610 650 V1010 H-10Z" fill="#c9d2c3" stroke="#1d1b18" stroke-width="1.5"/>
   <path d="M-10 830 C 260 780 520 850 800 800 S 1300 750 1610 815 V1010 H-10Z" fill="#b8c3b1" stroke="#1d1b18" stroke-width="1.5"/>
 </svg>`);
 // a tiny seeded random so the trees land in the same place every visit
 const seeded = (seed) => () => {
   seed = (seed + 0x6d2b79f5) | 0;
   let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
   t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
   return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
 };
 const INK = '#1d1b18';


 // whimsical tufted trees on striped, slightly wobbly trunks
 function groveSvg() {
   const rand = seeded(7);
   const TUFTS = ['#efcfc8', '#f1e2b6', '#c9ddd4', '#dcd2e6', '#f3d9bd'];
   const tree = (x, base, height, r) => {
     const bend = (rand() - 0.5) * 70;
     const tx = x + bend * 0.6, ty = base - height;
     const trunk = `M${x} ${base} C ${x + bend} ${base - height * 0.35}, ${tx - bend} ${base - height * 0.7}, ${tx} ${ty}`;
     // tuft = a cluster of circles; draw thick-stroked copies first, then fills on top,
     // so only the outer outline of the cluster shows
     const circles = [[tx, ty, r * 0.78]];
     const n = 6 + Math.floor(rand() * 3);
     for (let i = 0; i < n; i++) {
       const a = (i / n) * Math.PI * 2 + rand() * 0.5;
       circles.push([tx + Math.cos(a) * r * 0.55, ty + Math.sin(a) * r * 0.42, r * (0.42 + rand() * 0.14)]);
     }
     const fill = TUFTS[Math.floor(rand() * TUFTS.length)];
     const c = (attrs) => circles.map(([cx, cy, cr]) => `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${cr.toFixed(1)}" ${attrs}/>`).join('');
     return `<path d="${trunk}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
       <path d="${trunk}" fill="none" stroke="#f7f1e6" stroke-width="4" stroke-linecap="round"/>
       <path d="${trunk}" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="2.5 9"/>
       ${c(`fill="${INK}" stroke="${INK}" stroke-width="3"`)}${c(`fill="${fill}"`)}`;
   };
   const row = (count, baseY, hMin, hMax, rMin, rMax) => {
     let out = '';
     for (let i = 0; i < count; i++) {
       // keep the left edge clear so trees don't sit behind the desktop icons
       const x = 220 + (i + 0.2 + rand() * 0.6) * (1380 / count);
       out += tree(x, baseY, hMin + rand() * (hMax - hMin), rMin + rand() * (rMax - rMin));
     }
     return out;
   };
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
     <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e7ea"/><stop offset=".7" stop-color="#f3ece1"/></linearGradient></defs>
     <rect width="1600" height="1000" fill="url(#sky)"/>
     <circle cx="1240" cy="250" r="70" fill="#f6e7d2" stroke="${INK}" stroke-width="1.5"/>
     <path d="M-10 610 C 260 540 520 600 800 545 S 1300 520 1610 570 V1010 H-10Z" fill="#dfe3d5" stroke="${INK}" stroke-width="1.5"/>
     ${row(9, 760, 230, 320, 30, 40)}
     <path d="M-10 700 C 300 640 600 720 900 660 S 1400 640 1610 690 V1010 H-10Z" fill="#cdd6c4" stroke="${INK}" stroke-width="1.5"/>
     ${row(6, 900, 290, 400, 44, 58)}
     <path d="M-10 835 C 300 790 650 860 1000 810 S 1450 800 1610 830 V1010 H-10Z" fill="#bcc7b2" stroke="${INK}" stroke-width="1.5"/>
   </svg>`;
 }


 // layered wave bands, low sun, a reflection and one very small boat
 function waterSvg() {
   const band = (y, amp, wl, fill) => {
     let d = `M-20 ${y} Q ${-20 + wl / 4} ${y - amp} ${-20 + wl / 2} ${y}`;
     for (let x = -20 + wl / 2; x < 1620; x += wl / 2) d += ` T ${x + wl / 2} ${y}`;
     return `<path d="${d} V1010 H-20Z" fill="${fill}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
   };
   const glints = [[1040, 1160, 560], [1060, 1140, 590], [1010, 1190, 650], [1050, 1150, 690], [990, 1210, 780]]
     .map(([x1, x2, y]) => `<path d="M${x1} ${y} H${x2}" stroke="#f6e7d2" stroke-width="3" stroke-linecap="round" stroke-dasharray="26 14"/>`).join('');
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
     <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dde5ec"/><stop offset=".55" stop-color="#f2e9de"/></linearGradient></defs>
     <rect width="1600" height="1000" fill="url(#sky)"/>
     <circle cx="1100" cy="505" r="88" fill="#f6e3cb" stroke="${INK}" stroke-width="1.5"/>
     <path d="M330 300 q 9 -9 18 0 q 9 -9 18 0 M400 270 q 7 -7 14 0 q 7 -7 14 0" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
     ${band(525, 3, 46, '#dbe5e8')}
     <g fill="#f7f1e6" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round">
       <path d="M455 516 h44 l-6 9 h-32z"/><path d="M477 514 V472 l17 38z"/><path d="M473 514 l-14 -4 14 -30z"/>
     </g>
     ${band(600, 6, 90, '#cddbe0')}
     ${band(700, 9, 150, '#bccfd6')}
     ${band(830, 13, 230, '#aac2cb')}
     ${glints}
   </svg>`;
 }


 const WALLPAPERS = {
   hills: { label: 'hills', bg: `${GRAIN}, ${HILLS} center / cover no-repeat, #eef0ea` },
   grove: { label: 'grove', bg: `${GRAIN}, ${svgUrl(groveSvg())} center / cover no-repeat, #eef0ea` },
   water: { label: 'water', bg: `${GRAIN}, ${svgUrl(waterSvg())} center / cover no-repeat, #e6edef` },
   paper: {
     label: 'paper',
     bg: `radial-gradient(circle, rgba(29, 27, 24, .085) 1px, transparent 1.3px) 0 0 / 24px 24px, #f3ede1`,
   },
 };
 let wallpaper = 'water';
 function setWallpaper(name, remember = false) {
   if (!WALLPAPERS[name]) name = 'water';
   wallpaper = name;
   document.body.style.background = WALLPAPERS[name].bg;
   if (remember) { try { localStorage.setItem('wallpaper-choice', name); } catch {} }
 }
 const wallpaperItems = () => Object.entries(WALLPAPERS).map(([k, w]) => [(k === wallpaper ? '✓ ' : '   ') + w.label, () => setWallpaper(k, true)]);


 // ───────────── boot ─────────────
 const BOOT = [
   ['kaelyn-os v1.0.0', null],
   ['', null],
   ['starting desktop', '...'],
 ];


 function boot(onDone) {
   const el = $('#boot'), log = $('#boot-log');
   let text = '', i = 0, finished = false;
   const cursor = '<span class="cursor"></span>';
   const show = () => { log.innerHTML = esc(text) + cursor; };
   const finish = () => {
     if (finished) return;
     finished = true;
     removeEventListener('keydown', finish);
     el.classList.add('done');
     setTimeout(() => el.remove(), 600);
     onDone();
   };
   addEventListener('keydown', finish);
   el.addEventListener('pointerdown', finish);


   const step = () => {
     if (finished) return;
     if (i >= BOOT.length) return setTimeout(finish, 450);
     const [lbl, status] = BOOT[i++];
     if (status === null) { text += lbl + '\n'; show(); return setTimeout(step, 220); }
     text += (lbl + ' ').padEnd(30, '.');
     show();
     setTimeout(() => {
       if (finished) return;
       text += ' ' + status + '\n';
       show();
       setTimeout(step, 90);
     }, 160 + Math.random() * 260);
   };
   show();
   setTimeout(step, 300);
 }


 // ───────────── go ─────────────
 function init() {
   let saved = null;
   try { saved = localStorage.getItem('wallpaper-choice'); } catch {}
   setWallpaper(new URLSearchParams(location.search).get('wallpaper') || saved || 'water');
   renderDesktop();
   renderDock();
   startClock();
   bindUI();
   const deep = parseHash();
   let booted = false;
   try { booted = sessionStorage.getItem('booted') === '1'; } catch {}
   const after = () => {
     try { sessionStorage.setItem('booted', '1'); } catch {}
     if (deep.length) openPath(deep);
   };
   if (booted || deep.length) { $('#boot').remove(); after(); }
   else boot(after);
 }


 init();
})();