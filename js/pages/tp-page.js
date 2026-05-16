// ═══════════════════════════════════════════════════════════════════
// tp-page.js — Chrome de la page tp.html
//
// Extrait depuis le <script> inline de tp.html en Phase 2 v3.1 →
// fichier séparé pour :
//   • Cache navigateur séparé du HTML (281 lignes auparavant inline)
//   • Versioning indépendant via le Service Worker
//   • Permettre `defer` sur les scripts tp/* (les globaux du moteur sont
//     disponibles dans l'ordre de défer, donc plus de blocage parser)
//
// Bit-pour-bit identique au bloc inline d'origine, à 2 nettoyages près :
//   1. Suppression du fallback mort `if (typeof currentCategory !== 'undefined')`
//      — la variable `currentCategory` n'existe nulle part dans le moteur
//      (qui utilise `STATE.cat`). Code mort depuis au moins v2.5.
//   2. Header structuré ajouté en tête.
//
// Toutes les fonctions appelées par onclick/oninput inline du HTML
// (go, showTool, toggleGrp, sbSearch, doReset, newExercise…) restent
// globales (déclarations function/const au top-level d'un script non-module).
//
// Ordre de chargement attendu (tous defer dans tp.html v3.1+) :
//   1. cas-in-profile.js  (window.Profile)
//   2. profile-track-v5, achievements, profile-titles, tp-profile-bridge
//   3. tp-data.js, tp-engine.js, tp-engine-*.js
//   4. tp-page.js  ← ce fichier (utilise les globaux ci-dessus)
//   5. fiche-search, search-modal, theme-toggle, navbar, celebrations, toasts
// ═══════════════════════════════════════════════════════════════════

// ── Catégorie metadata ────────────────────────────────────────
const CAT_META = {
  endian:      {icon:'🔄', name:'Endianness',           sub:'Little Endian / Big Endian — lecture hex'},
  timestamp:   {icon:'⏱', name:'Timestamps FAT',        sub:'Décoder les dates FAT sur 2 octets'},
  bitmap:      {icon:'🗺', name:'Bitmap exFAT',          sub:'Lecture de la bitmap d\'allocation de clusters'},
  fat:         {icon:'⛓', name:'Chaîne FAT',             sub:'Parcourir les entrées de la table FAT'},
  magic:       {icon:'✨', name:'Magic Bytes',            sub:'Identifier les fichiers par leur signature hex'},
  mismatch:    {icon:'🎭', name:'Mismatch',              sub:'Détecter les extensions et types qui ne correspondent pas'},
  runlist:     {icon:'🧩', name:'Run List NTFS',         sub:'Décoder les runs nibble par nibble'},
  effacement:  {icon:'🗑', name:'Effacement FAT',        sub:'Repérer les entrées 0xE5 — fichiers supprimés'},
  timestomping:{icon:'🕰', name:'Timestomping',          sub:'Détecter la manipulation $SI vs $FN NTFS'},
  hextable:    {icon:'🗺', name:'Table Hex',             sub:'Lire et écrire directement en hexadécimal'},
  fsidentify:  {icon:'🔍', name:'Identifier le FS',      sub:'Reconnaître un système de fichiers sur image'},
  offset:      {icon:'📐', name:'Calcul d\'offset',      sub:'Offset cluster, secteur, partition — calcul manuel'},
  bases:       {icon:'🔢', name:'Bases & Encodages',     sub:'Binaire, hex, décimal, ASCII, UTF-8, Base64'},
  hash:        {icon:'🔑', name:'Hash & Intégrité',      sub:'MD5, SHA-256, SSDEEP — chaîne de possession'},
  email:       {icon:'✉️', name:'Email Forensics',       sub:'En-têtes SMTP, SPF, DKIM, DMARC — phishing'},
  network:     {icon:'📡', name:'Réseau & PCAP',         sub:'Filtres BPF, lecture de traces réseau'},
  ir:          {icon:'🚨', name:'Incident Response',     sub:'6 phases NIST, triage, confinement, notification'},
  droitpenal:  {icon:'⚖️', name:'Droit pénal',          sub:'CPP suisse, LSCPT, nLPD — procédure et articles'},
  glossaire:   {icon:'🗂', name:'Glossaire',             sub:'Termes forensiques essentiels — définitions'},
  examen:      {icon:'📋', name:'Série Examen',          sub:'Questions typiques de l\'examen CAS-IN final'},
  mbr:         {icon:'💽', name:'MBR / GPT',             sub:'Table de partitions — partition entry, type, offset absolu'},
  direntry:    {icon:'📁', name:'Directory Entry FAT',   sub:'Entrée de répertoire 32 octets — nom, attributs, cluster, timestamps'},
  hexdump:     {icon:'🔬', name:'Dump Hex en contexte',  sub:'Localiser + décoder un champ dans un secteur brut — 3 niveaux d\'indices'},
  slackspace:  {icon:'🪣', name:'Slack Space',           sub:'File slack, RAM slack, calcul direct et inverse — FAT'},
  registry:    {icon:'📂', name:'Registry NK/VK',        sub:'Cellules NTUSER.DAT — type, nom, REG_DWORD inline'},
  prefetch:    {icon:'⏱️', name:'Prefetch (.pf)',         sub:'Format Win XP/7/8/10/11 — run count, last run FILETIME'},
  lnk:         {icon:'🔗', name:'LNK (raccourcis)',      sub:'Header 0x4C, CLSID, LinkFlags, FileAttributes, FileSize'},
  hfsbtree:    {icon:'🌳', name:'B-Tree HFS+',           sub:'BTNodeDescriptor, CNID parent, fLink, récupération forensique — Big Endian'},
  ntfsindex:   {icon:'📇', name:'$INDEX NTFS',           sub:'INDX magic, Index Entry flags, MFT ref, VCN sub-node — B+Tree de répertoires'},
};

const CAT_MAX = {
  endian:5, timestamp:5, bitmap:5, fat:5, magic:5, mismatch:5,
  runlist:5, effacement:5, timestomping:5,
  hextable:5, fsidentify:5, offset:5, bases:5, hash:5,
  email:5, network:5, ir:5, droitpenal:5, glossaire:5, examen:10,
  mbr:5, direntry:5, hexdump:5, slackspace:5,
  registry:5, prefetch:5, lnk:5,
  hfsbtree:5, ntfsindex:5
};

let currentCat = 'endian';
let toastTimer = null;

// ── Category switching ────────────────────────────────────────
function go(cat, btn) {
  currentCat = cat;
  // Update sidebar active state
  document.querySelectorAll('.sb-cat').forEach(b => b.classList.remove('active','active-exam','active-tool'));
  if (btn) btn.classList.add(cat === 'examen' ? 'active-exam' : 'active');
  // Open the group containing this category
  // Fix Phase 1 : registry/prefetch/lnk étaient absents → #grp-win ne se dépliait
  // pas lors d'une nav depuis #registry, #prefetch ou #lnk.
  const catGroup = {
    // Systèmes de fichiers
    'endian':'grp-fs','timestamp':'grp-fs','bitmap':'grp-fs','fat':'grp-fs',
    'magic':'grp-fs','mismatch':'grp-fs','runlist':'grp-fs','effacement':'grp-fs',
    'timestomping':'grp-fs','mbr':'grp-fs','direntry':'grp-fs','hexdump':'grp-fs',
    'slackspace':'grp-fs','hfsbtree':'grp-fs','ntfsindex':'grp-fs',
    // Artefacts Windows
    'registry':'grp-win','prefetch':'grp-win','lnk':'grp-win',
    // Calculs & Identification
    'hextable':'grp-calc','fsidentify':'grp-calc','offset':'grp-calc',
    'bases':'grp-calc','hash':'grp-calc',
    // Investigation
    'email':'grp-inv','network':'grp-inv','ir':'grp-inv',
    'droitpenal':'grp-inv','glossaire':'grp-inv','examen':'grp-inv'
  };
  if (catGroup[cat]) { document.querySelectorAll('.sb-group').forEach(g=>g.classList.add('collapsed')); document.getElementById(catGroup[cat]).classList.remove('collapsed'); }
  // Update mobile pills
  document.querySelectorAll('.mob-pill').forEach(p => p.classList.toggle('active', p.dataset.cat === cat));
  // Update context header
  const m = CAT_META[cat] || {icon:'📋', name:cat, sub:''};
  document.getElementById('ctx-icon').textContent = m.icon;
  document.getElementById('ctx-name').textContent = m.name;
  document.getElementById('ctx-sub').textContent = m.sub;
  // Show exercise area
  document.getElementById('tp-content').style.display = 'block';
  document.getElementById('tp-ctx').style.display = 'flex';
  document.getElementById('tool-frame').style.display = 'none';
  // Load exercise — switchCat est défini par tp-engine.js et toujours présent
  // depuis v2.5. Phase 2 : nettoyage du fallback `currentCategory` qui n'a
  // jamais existé dans le moteur (utilise STATE.cat).
  if (typeof switchCat === 'function') {
    switchCat(cat, btn || document.querySelector('[data-cat="'+cat+'"]'));
  } else {
    newExercise();
  }
  updateBadges();
}

// ── Tool iframe ───────────────────────────────────────────────
function showTool(tool, btn) {
  document.querySelectorAll('.sb-cat').forEach(b => b.classList.remove('active','active-exam','active-tool'));
  if (btn) btn.classList.add('active-tool');
  document.getElementById('tp-content').style.display = 'none';
  document.getElementById('tp-ctx').style.display = 'none';
  const frame = document.getElementById('tool-frame');
  frame.style.display = 'flex';
  const iframe = document.getElementById('tool-iframe');
  const link   = document.getElementById('frame-link');
  const title  = document.getElementById('frame-title');
  if (tool === 'exam') {
    iframe.src = 'exam.html'; link.href = 'exam.html';
    title.textContent = '⏱ Examen Blanc';
  } else {
    iframe.src = 'tools.html'; link.href = 'tools.html';
    title.textContent = '🔧 Calculateurs Forensiques';
  }
  document.querySelectorAll('.mob-pill').forEach(p => p.classList.remove('active'));
}

// ── Groups collapse ────────────────────────────────────────────
function toggleGrp(id) {
  const grp = document.getElementById(id);
  const wasCollapsed = grp.classList.contains('collapsed');
  // Close all groups
  document.querySelectorAll('.sb-group').forEach(g => g.classList.add('collapsed'));
  // Open clicked one if it was closed
  if (wasCollapsed) grp.classList.remove('collapsed');
  updateGroupProgress();
}

function updateGroupProgress() {
  // Mise à jour barres de progression dans les headers des groupes.
  // Fix Phase 1 :
  //   • Ajout du groupe `win` (registry/prefetch/lnk) — sa barre #gp-win
  //     restait figée à 0% car non listé ici.
  //   • Ajout de `hfsbtree` et `ntfsindex` dans `fs` — présents dans le HTML
  //     du groupe FS mais omis du calcul de pourcentage.
  const groups = {
    fs:   ['endian','timestamp','bitmap','fat','magic','mismatch','runlist',
           'effacement','timestomping','mbr','direntry','hexdump','slackspace',
           'hfsbtree','ntfsindex'],
    win:  ['registry','prefetch','lnk'],
    calc: ['hextable','fsidentify','offset','bases','hash'],
    inv:  ['email','network','ir','droitpenal','glossaire','examen'],
  };
  try {
    const solved = JSON.parse(localStorage.getItem('tp_solved')||'{}');
    Object.entries(groups).forEach(([grp, cats]) => {
      const total = cats.reduce((a,c) => a + (CAT_MAX[c]||5), 0);
      const done  = cats.reduce((a,c) => a + Math.min(solved[c]||0, CAT_MAX[c]||5), 0);
      const pct   = Math.round(done / total * 100);
      // Barre dans le header
      const fill = document.getElementById('gp-' + grp);
      const lbl  = document.getElementById('gl-' + grp);
      if (fill) fill.style.width = pct + '%';
      if (lbl)  lbl.textContent  = pct + '%';
      // Compteur dans le header (badge)
      const cnt = document.getElementById('gc-' + grp);
      if (cnt && pct > 0) {
        cnt.textContent      = pct + '%';
        cnt.style.color       = pct === 100 ? 'var(--green)' : 'var(--gold)';
        cnt.style.borderColor = pct === 100 ? 'rgba(48,232,138,.4)' : 'rgba(240,192,64,.3)';
        cnt.style.background  = pct === 100 ? 'rgba(48,232,138,.1)' : 'rgba(240,192,64,.08)';
      }
    });
  } catch(e) {}
}

// ── Sidebar search ─────────────────────────────────────────────
function sbSearch(q) {
  const low = q.toLowerCase();
  document.querySelectorAll('.sb-cat').forEach(btn => {
    const match = !q || btn.textContent.toLowerCase().includes(low) || btn.dataset.cat?.includes(low);
    btn.style.display = match ? '' : 'none';
  });
  document.querySelectorAll('.sb-group').forEach(grp => {
    const hasVis = [...grp.querySelectorAll('.sb-cat')].some(b => b.style.display !== 'none');
    grp.style.display = hasVis ? '' : 'none';
    if (q && hasVis) grp.classList.remove('collapsed');
  });
}

// ── Badges per category ────────────────────────────────────────
function updateBadges() {
  let totalSolved = 0;
  let totalStreak = 0;
  try {
    const solved = JSON.parse(localStorage.getItem('tp_solved') || '{}');
    const streak = parseInt(localStorage.getItem('tp_streak') || '0');
    totalStreak = streak;
    Object.entries(CAT_MAX).forEach(([cat, max]) => {
      const n = solved[cat] || 0;
      totalSolved += n;
      const el = document.getElementById('bd-' + cat);
      if (!el) return;
      el.className = 'sb-badge';
      if (cat === 'examen') { el.className += ' sb-badge-star'; el.textContent = '★'; return; }
      if (n === 0)    { el.className += ' sb-badge-none'; el.textContent = '—'; }
      else if (n < max) { el.className += ' sb-badge-part'; el.textContent = n+'/'+max; }
      else            { el.className += ' sb-badge-done'; el.textContent = '✓ '+n; }
    });
    // Footer
    document.getElementById('sbf-label').textContent = totalSolved + ' exercice' + (totalSolved !== 1 ? 's' : '') + ' résolus';
    document.getElementById('ctx-badge').textContent = (solved[currentCat] || 0) + ' résolus';
    if (streak > 1) document.getElementById('sbf-streak').textContent = '🔥 ' + streak;
    else document.getElementById('sbf-streak').textContent = '';
    const fill = Math.min(100, (totalSolved / (Object.values(CAT_MAX).reduce((a,b)=>a+b,0))) * 100);
    document.getElementById('sbf-fill').style.width = fill + '%';
    updateGroupProgress();
  } catch(e) {}
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(icon, title, sub) {
  clearTimeout(toastTimer);
  const t = document.getElementById('tp-toast');
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-sub').textContent = sub;
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Reset ──────────────────────────────────────────────────────
function doReset() {
  if (!confirm('Remettre tous les scores TP à zéro ?')) return;
  ['tp_solved','tp_streak','tp_bestStreak','tp_droitIdx','tp_glossIdx'].forEach(k => { try { localStorage.removeItem(k); } catch(_) {} });
  if (typeof STATE !== 'undefined') { STATE.solved = {}; STATE.streak = 0; STATE.bestStreak = 0; }
  updateBadges();
  newExercise();
}

// ── Mobile pill bar ────────────────────────────────────────────
function buildMobBar() {
  const bar = document.getElementById('mob-pills');
  // Fix Phase 1 : exclure les cats _exam et _tools de l'itération — elles
  // sont gérées séparément ci-dessous via showTool(). Sinon le map() émettait
  // une pill brute (label = "_exam") avec onclick=go() au lieu de showTool().
  const cats = [...document.querySelectorAll('.sb-cat[data-cat]')]
    .filter(b => !b.dataset.cat.startsWith('_'));
  bar.innerHTML = cats.map(b => {
    const cat = b.dataset.cat;
    if (!cat) return '';
    const m = CAT_META[cat];
    const label = m ? m.icon + ' ' + m.name : cat;
    return `<div class="mob-pill${cat === currentCat ? ' active' : ''}" data-cat="${cat}" onclick="go('${cat}',this)">${label}</div>`;
  }).join('');
  // Add tool pills (la seule source de pills pour _exam/_tools)
  bar.innerHTML += `<div class="mob-pill" data-cat="_exam" onclick="showTool('exam',this)">⏱ Examen</div>`;
  bar.innerHTML += `<div class="mob-pill" data-cat="_tools" onclick="showTool('tools',this)">🔧 Calculateurs</div>`;
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  newExercise();
  updateBadges();
  buildMobBar();
  updateGroupProgress();

  // Patch progress updates to also refresh badges
  const origUpdateProgress = typeof updateProgress === 'function' ? updateProgress : null;
  if (origUpdateProgress) {
    window.updateProgress = function() {
      origUpdateProgress();
      updateBadges();
      // Check milestones
      try {
        const solved = JSON.parse(localStorage.getItem('tp_solved') || '{}');
        const streak = parseInt(localStorage.getItem('tp_streak') || '0');
        const catN = solved[currentCat] || 0;
        const catMax = CAT_MAX[currentCat] || 5;
        if (catN === catMax) {
          const m = CAT_META[currentCat];
          showToast('🥇', 'Catégorie complète !', (m ? m.name : currentCat) + ' — ' + catN + '/' + catMax + ' réussis');
        } else if (streak === 3)  showToast('🔥', 'Série de 3 !', 'C\'est parti, garde le rythme.');
        else if (streak === 5) showToast('🔥', 'Série de 5 !', 'Continue comme ça !');
        else if (streak === 10) showToast('🚀', 'Série de 10 !', 'Incroyable — série parfaite !');
      } catch(e) {}

      // Phase 6 v3.1 — Évalue les quêtes du jour après chaque résolution TP.
      // Pattern : copie 1:1 de ce que scene-app.js et quiz-app.js font déjà.
      if (window.Quests && typeof window.Quests.evalAndComplete === 'function') {
        try { window.Quests.evalAndComplete(); } catch (_) {}
      }
    };
  }

  // Handle hash navigation (from landing page links)
  const hash = location.hash.replace('#', '');
  if (hash === 'exam')   { showTool('exam', document.querySelector('[data-cat="_exam"]')); }
  else if (hash === 'tools') { showTool('tools', document.querySelector('[data-cat="_tools"]')); }
  else if (hash && CAT_META[hash]) { go(hash, document.querySelector('[data-cat="'+hash+'"]')); }
});
