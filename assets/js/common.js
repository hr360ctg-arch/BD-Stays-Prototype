/* ============================================================
   CBS Stays — shared prototype helpers
   Icons, toast, modal, language toggle, sidebar nav wiring.
   Each page defines its own `I18N` dict and `PAGE_STR` lookups;
   this file only provides the plumbing.
   ============================================================ */

/* ---------------- icon set (Feather-style, inline, no network) ---------------- */
const ICONS = {
  grid:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  log:'<path d="M4 6h16M4 12h16M4 18h10"/>',
  trash:'<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  map:'<path d="m1 6 7-3 8 3 7-3v15l-7 3-8-3-7 3Z"/><path d="M8 3v15M16 6v15"/>',
  home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  wallet:'<path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M18 13h.01"/>',
  shield:'<path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5Z"/>',
  star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1Z"/>',
  gift:'<rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M19 12v9H5v-9"/><path d="M12 8a2.5 2.5 0 1 1-2.5-2.5C11 5.5 12 8 12 8Zm0 0a2.5 2.5 0 1 0 2.5-2.5C13 5.5 12 8 12 8Z"/>',
  rocket:'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
  food:'<path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2M5 9v13M15 2a4 4 0 0 0-4 4v3h8V6a4 4 0 0 0-4-4ZM15 11v11"/>',
  bike:'<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-9 11.5L9 10l2.5 2.5L15 6l4 7.5h-6"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  plane:'<path d="M17.8 19.2 16 11l3.5-3.5c.6-.6.6-1.5 0-2.1s-1.5-.6-2.1 0L14 8.9 5.8 7.1c-.5-.1-1 .1-1.2.5l-.3.6c-.2.5 0 1 .4 1.3L9 13 5 17l-3-1-1 1 3 2 2 3 1-1-1-3 4-4 3.2 4.3c.3.4.8.6 1.3.4l.6-.3c.4-.2.6-.7.5-1.2Z"/>',
  tools:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>',
  layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  power:'<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
  arrowRight:'<path d="M5 12h14M12 5l7 7-7 7"/>',
  chevronRight:'<path d="m9 18 6-6-6-6"/>',
  back:'<path d="M19 12H5M12 19l-7-7 7-7"/>',
  external:'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/>',
  sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
  bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  tag:'<path d="M20.6 11.1 13 3.5a2 2 0 0 0-1.4-.6H5a2 2 0 0 0-2 2v6.6c0 .5.2 1 .6 1.4l7.6 7.6a2 2 0 0 0 2.8 0l6.6-6.6a2 2 0 0 0 0-2.8Z"/><circle cx="8" cy="8" r="1.5"/>',
  key:'<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  building:'<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/>',
  layers:'<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
};
function icon(name, cls){
  const path = ICONS[name] || '';
  return `<svg class="icon ${cls||''}" viewBox="0 0 24 24">${path}</svg>`;
}
/* replace <i data-icon="name"></i> placeholders found in static HTML */
function hydrateIcons(root){
  (root||document).querySelectorAll('[data-icon]').forEach(el=>{
    const name = el.getAttribute('data-icon');
    const cls = el.getAttribute('data-icon-cls') || '';
    el.outerHTML = icon(name, cls);
  });
}

/* ---------------- toast ---------------- */
function ensureToastWrap(){
  let w = document.getElementById('toastWrap');
  if(!w){
    w = document.createElement('div');
    w.id = 'toastWrap';
    w.className = 'toast-wrap';
    document.body.appendChild(w);
  }
  return w;
}
function toastMsg(msg, iconName){
  const wrap = ensureToastWrap();
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = (iconName ? icon(iconName) : icon('check')) + `<span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(()=>{
    t.style.opacity = '0';
    t.style.transition = 'opacity .25s ease';
    setTimeout(()=>t.remove(), 260);
  }, 2800);
}

/* ---------------- modal ---------------- */
function openModal(id){ const m = document.getElementById(id); if(m) m.classList.add('open'); }
function closeModal(id){ const m = document.getElementById(id); if(m) m.classList.remove('open'); }

/* ---------------- language ---------------- */
/* Pages set `window.I18N = {bn:{...}, en:{...}}` before calling initLang(). */
let LANG = 'bn';
function applyLang(l){
  if(!window.I18N || !window.I18N[l]) return;
  LANG = l;
  document.querySelectorAll('.lang-toggle button').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang === l);
  });
  document.querySelectorAll('[data-t]').forEach(el=>{
    const k = el.getAttribute('data-t');
    const v = window.I18N[l][k];
    if(v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll('[data-t-ph]').forEach(el=>{
    const k = el.getAttribute('data-t-ph');
    const v = window.I18N[l][k];
    if(v !== undefined) el.setAttribute('placeholder', v);
  });
  try{ localStorage.setItem('cbs_lang', l); }catch(e){}
  if(typeof window.onLangChange === 'function') window.onLangChange(l);
}
function initLang(){
  document.querySelectorAll('.lang-toggle button').forEach(b=>{
    b.addEventListener('click', ()=>applyLang(b.dataset.lang));
  });
  let saved = 'bn';
  try{ saved = localStorage.getItem('cbs_lang') || 'bn'; }catch(e){}
  applyLang(saved);
}

/* ---------------- sidebar nav / view switching ---------------- */
function initNav(defaultView){
  document.getElementById('menuBtn')?.addEventListener('click', ()=>{
    document.getElementById('sidebar')?.classList.toggle('open');
  });
  document.querySelectorAll('[data-view]').forEach(el=>{
    el.addEventListener('click', ()=>showView(el.dataset.view));
  });
  if(defaultView) showView(defaultView, true);
}
function showView(name, silent){
  document.querySelectorAll('.sb-link[data-view]').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  document.querySelectorAll('.view-section').forEach(s=>s.classList.toggle('active', s.id==='view-'+name));
  const titleEl = document.getElementById('viewTitle');
  const crumbEl = document.getElementById('viewCrumb');
  const active = document.querySelector('.sb-link[data-view="'+name+'"]');
  if(titleEl && active){
    const label = active.querySelector('[data-t]');
    if(label){
      titleEl.setAttribute('data-t', label.getAttribute('data-t'));
      titleEl.textContent = window.I18N?.[LANG]?.[label.getAttribute('data-t')] || label.textContent;
    }
  }
  if(crumbEl && window.PAGE_CRUMB) crumbEl.textContent = window.PAGE_CRUMB;
  document.getElementById('sidebar')?.classList.remove('open');
  if(!silent) window.scrollTo({top:0,behavior:'instant'});
}

/* ---------------- badge renderer (shared status map) ---------------- */
const STATUS_MAP = {
  active:['badge-ok','check'], ok:['badge-ok','check'], approved:['badge-ok','check'], published:['badge-ok','check'], done:['badge-ok','check'],
  pending:['badge-warn','bell'], review:['badge-muted','search'], warn:['badge-warn','bell'],
  suspended:['badge-danger','shield'], rejected:['badge-danger','shield'], danger:['badge-danger','shield'],
  info:['badge-info','star'],
};
function statusBadge(status, label){
  const [cls] = STATUS_MAP[status] || ['badge-muted'];
  return `<span class="badge ${cls}"><span class="dot"></span>${label}</span>`;
}

/* ---------------- boot ---------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  hydrateIcons(document);
});
