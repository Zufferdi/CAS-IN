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
  // ── v97 : Cryptologie & Réseau ──
  cidr:        {icon:'🌐', name:'CIDR & Subnetting',     sub:'Masque, broadcast, hôtes utilisables, RFC 1918 — calculs réseau'},
  aes:         {icon:'🔐', name:'AES',                   sub:'Taille de clé/bloc, tours, modes ECB/CBC/GCM, padding PKCS#7'},
  rsa:         {icon:'🔓', name:'RSA',                   sub:'Chiffrement asymétrique : taille de clé, déchiffrement (c^d mod n), composants (n/e/d/p/q)'},
  classic:     {icon:'🔤', name:'Crypto classique',       sub:'Base64 decode, César (shift inconnu), XOR 1-byte (known-plaintext)'},
  stegano:     {icon:'🎭', name:'Stéganographie',         sub:'Whitespace (tab/espace), polyglot JPEG+ZIP, LSB extraction'},
  acquisition: {icon:'🔬', name:'Acquisition & Préservation', sub:'Hash dcfldd MD5/SHA-256, intégrité avant/après, chaîne de possession'},
  llm:         {icon:'🤖', name:'LLM/IA & Deepfakes',     sub:'EXIF image IA (Stable Diffusion, Midjourney...), watermark Unicode, manifeste C2PA'},
  dorks:       {icon:'🔎', name:'Google Dorks',           sub:'Opérateurs (site:, filetype:, intitle:...), construction, analyse d\'intention'},
  cracking:    {icon:'💥', name:'Cassage de hash',       sub:'Hashcat -m, John the Ripper, dictionnaire, rainbow, bcrypt, Argon2'},
  pki:         {icon:'📜', name:'PKI & X.509',           sub:'CN, SAN, OCSP/CRL, Key Usage, 398 jours CA/B Forum'},
  // ── v98 : Artefacts OS ──
  ext4:        {icon:'🐧', name:'EXT2/3/4 — Inodes',     sub:'atime/ctime/mtime/crtime, 0xEF53, jbd2, debugfs, extundelete'},
  winev:       {icon:'📋', name:'Windows Event Logs',    sub:'Event ID 4624/4625/4688, LogonType, .evtx, Sysmon, PowerShell 4104'},
  linux:       {icon:'🐧', name:'Linux — Artefacts',     sub:'.bash_history, auth.log, last/lastb, journalctl, authorized_keys, crontab'},
  macos:       {icon:'🍎', name:'macOS — Artefacts',     sub:'Unified log, KnowledgeC.db, FSEvents, quarantine, plist, Spotlight'},
  // ── v99 : OSINT & Détection ──
  exif:        {icon:'🖼️', name:'OSINT — EXIF',          sub:'exiftool, GPS DMS, plateformes, champs OSINT, anti-forensique, PDF'},
  osintdns:    {icon:'🌐', name:'OSINT — DNS & pivots',  sub:'Types DNS, WHOIS RGPD, Shodan, amass, reverse DNS, DNSSEC, CT logs'},
  sigma:       {icon:'🛡️', name:'Sigma Rules',           sub:'YAML, detection/condition, modifiers, levels, logsources, MITRE tags'},
  c2:          {icon:'🎯', name:'C2 Frameworks',         sub:'Cobalt Strike, beaconing, msagent_*, Sliver/Mythic, LOLBAS, MITRE TA'},
};

const CAT_MAX = {
  endian:5, timestamp:5, bitmap:5, fat:5, magic:5, mismatch:5,
  runlist:5, effacement:5, timestomping:5,
  hextable:5, fsidentify:5, offset:5, bases:5, hash:5,
  email:5, network:5, ir:5, droitpenal:5, glossaire:5, examen:10,
  mbr:5, direntry:5, hexdump:5, slackspace:5,
  registry:5, prefetch:5, lnk:5,
  hfsbtree:5, ntfsindex:5,
  // v97
  cidr:5, aes:5, cracking:5, pki:5,
  // v104
  rsa:5,
  // v105
  classic:5, stegano:5,
  // v109
  acquisition:5, llm:5, dorks:5,
  // v98
  ext4:5, winev:5, linux:5, macos:5,
  // v99
  exif:5, osintdns:5, sigma:5, c2:5
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
    // Cryptologie & Réseau (v110 fix : manquaient depuis l'ajout des TP v101-v105)
    'cidr':'grp-crypto','aes':'grp-crypto','rsa':'grp-crypto',
    'cracking':'grp-crypto','pki':'grp-crypto',
    'classic':'grp-crypto','stegano':'grp-crypto',
    // Artefacts OS (v110 fix : manquaient depuis l'ajout v102)
    'ext4':'grp-artefacts','winev':'grp-artefacts',
    'linux':'grp-artefacts','macos':'grp-artefacts',
    // OSINT & Détection (v110 fix : manquaient depuis l'ajout v103)
    'exif':'grp-osintdet','osintdns':'grp-osintdet',
    'sigma':'grp-osintdet','c2':'grp-osintdet',
    // Investigation
    'email':'grp-inv','network':'grp-inv','ir':'grp-inv',
    'droitpenal':'grp-inv','glossaire':'grp-inv','examen':'grp-inv',
    'acquisition':'grp-inv','llm':'grp-inv','dorks':'grp-inv'
  };
  if (catGroup[cat]) { document.querySelectorAll('.sb-group').forEach(g=>g.classList.add('collapsed')); document.getElementById(catGroup[cat]).classList.remove('collapsed'); }
  // v106 : sync du nouveau trigger mobile (remplace l'ancien mob-pills)
  if (typeof syncMobTrigger === 'function') syncMobTrigger();
  document.querySelectorAll('.mob-cat').forEach(p => p.classList.toggle('active', p.dataset.cat === cat));
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
  document.querySelectorAll('.mob-cat').forEach(p => p.classList.remove('active'));
  // v106 : sync trigger pour refléter l'outil actif (Examen/Calculateurs)
  if (typeof syncMobTrigger === 'function') {
    const trigLabel = document.getElementById('mob-trigger-label');
    const trigIcon  = document.getElementById('mob-trigger-icon');
    const trigBadge = document.getElementById('mob-trigger-badge');
    if (trigLabel) trigLabel.textContent = which === 'exam' ? 'Examen Blanc' : 'Calculateurs';
    if (trigIcon)  trigIcon.textContent  = which === 'exam' ? '⏱' : '🔧';
    if (trigBadge) { trigBadge.className = 'mob-trigger-badge'; trigBadge.textContent = '—'; }
  }
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
    // v106 : sync du nouveau trigger mobile + badges du drawer
    if (typeof syncMobTrigger === 'function') syncMobTrigger();
    if (typeof syncMobCatBadges === 'function') syncMobCatBadges();
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

// ── Mobile drawer (v106 — remplace mob-pills) ──────────────────
//
// Architecture :
//  - Le bouton sticky #mob-trigger affiche le TP actif (icône + nom + badge).
//  - Le drawer #mob-drawer s'ouvre au tap, contient les 7 groupes pliables
//    avec leurs catégories, identiques à la sidebar desktop.
//  - La construction est faite UNE FOIS (buildMobDrawer), puis seuls badge
//    et état "actif" sont mis à jour à chaque sélection.
//
// Groupes définis dans l'ordre d'affichage souhaité :
const MOB_GROUPS = [
  { id: 'fs',        icon: '💾', name: 'Systèmes de fichiers' },
  { id: 'win',       icon: '🪟', name: 'Artefacts Windows' },
  { id: 'calc',      icon: '📐', name: 'Calculs & Identification' },
  { id: 'crypto',    icon: '🔐', name: 'Cryptologie & Réseau' },
  { id: 'artefacts', icon: '🧩', name: 'Artefacts OS' },
  { id: 'osintdet',  icon: '🎯', name: 'OSINT & Détection' },
  { id: 'inv',       icon: '🔍', name: 'Investigation' }
];

function buildMobDrawer() {
  const body = document.getElementById('mob-drawer-body');
  if (!body) return;

  // Pour chaque groupe desktop, récupérer les catégories qu'il contient
  // depuis le DOM de la sidebar (déjà rendu dans tp.html)
  const html = MOB_GROUPS.map(g => {
    const grpEl = document.getElementById('grp-' + g.id);
    if (!grpEl) return '';
    const cats = [...grpEl.querySelectorAll('.sb-cat[data-cat]')]
      .filter(b => !b.dataset.cat.startsWith('_'));
    if (cats.length === 0) return '';

    const catItems = cats.map(b => {
      const cat = b.dataset.cat;
      const m = CAT_META[cat];
      const icon = m ? m.icon : '🔧';
      const name = m ? m.name : cat;
      return `<button class="mob-cat" data-cat="${cat}" type="button" onclick="mobChooseCat('${cat}')">
        <span class="mob-cat-icon">${icon}</span>
        <span class="mob-cat-name">${name}</span>
        <span class="mob-cat-badge" id="mb-${cat}">—</span>
      </button>`;
    }).join('');

    return `<div class="mob-grp" id="mob-grp-${g.id}">
      <div class="mob-grp-header" onclick="mobToggleGrp('${g.id}')">
        <span class="mob-grp-icon">${g.icon}</span>
        <span class="mob-grp-name">${g.name}</span>
        <span class="mob-grp-count">${cats.length}</span>
        <span class="mob-grp-arrow">▾</span>
      </div>
      <div class="mob-grp-body">${catItems}</div>
    </div>`;
  }).join('');

  body.innerHTML = html;

  // Ouvrir d'office le groupe qui contient le TP actif
  mobExpandGroupOfCurrent();
}

function mobToggleGrp(id) {
  const grp = document.getElementById('mob-grp-' + id);
  if (!grp) return;
  const wasOpen = grp.classList.contains('open');
  // Fermer tous les groupes
  document.querySelectorAll('.mob-grp').forEach(g => g.classList.remove('open'));
  if (!wasOpen) grp.classList.add('open');
}

function mobExpandGroupOfCurrent() {
  // Trouver le groupe qui contient currentCat et l'ouvrir
  for (const g of MOB_GROUPS) {
    const grpEl = document.getElementById('grp-' + g.id);
    if (!grpEl) continue;
    const hasCat = !!grpEl.querySelector(`.sb-cat[data-cat="${currentCat}"]`);
    if (hasCat) {
      document.querySelectorAll('.mob-grp').forEach(x => x.classList.remove('open'));
      const mobGrp = document.getElementById('mob-grp-' + g.id);
      if (mobGrp) mobGrp.classList.add('open');
      return;
    }
  }
}

function mobChooseCat(cat) {
  go(cat); // appel existant : déclenche newExercise, etc.
  closeMobDrawer();
  syncMobTrigger();
  // Marquer le bouton actif dans le drawer (utile si on rouvre)
  document.querySelectorAll('.mob-cat').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
}

function openMobDrawer() {
  const dr = document.getElementById('mob-drawer');
  if (!dr) return;
  dr.classList.add('open');
  dr.setAttribute('aria-hidden', 'false');
  // S'assurer qu'on est sur le bon groupe
  mobExpandGroupOfCurrent();
  // Marquer la cat active
  document.querySelectorAll('.mob-cat').forEach(b => b.classList.toggle('active', b.dataset.cat === currentCat));
  // Empêcher le scroll body en arrière-plan
  document.body.style.overflow = 'hidden';
  // Focus search pour clavier rapide (mais sans forcer ouverture clavier sur mobile)
  const s = document.getElementById('mob-search');
  if (s) s.value = ''; // reset filtre
  mobSearch(''); // tout réafficher
}

function closeMobDrawer() {
  const dr = document.getElementById('mob-drawer');
  if (!dr) return;
  dr.classList.remove('open');
  dr.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function syncMobTrigger() {
  // Met à jour le bouton sticky avec le TP actif + badge progression
  const m = CAT_META[currentCat];
  const iconEl  = document.getElementById('mob-trigger-icon');
  const labelEl = document.getElementById('mob-trigger-label');
  const badgeEl = document.getElementById('mob-trigger-badge');
  if (iconEl)  iconEl.textContent  = m ? m.icon : '🔧';
  if (labelEl) labelEl.textContent = m ? m.name : currentCat;
  if (badgeEl) {
    try {
      const solved = JSON.parse(localStorage.getItem('tp_solved') || '{}');
      const n = solved[currentCat] || 0;
      const max = CAT_MAX[currentCat] || 5;
      badgeEl.className = 'mob-trigger-badge';
      if (n === 0) badgeEl.textContent = '—';
      else if (n < max) { badgeEl.className += ' has-progress'; badgeEl.textContent = n + '/' + max; }
      else { badgeEl.className += ' complete'; badgeEl.textContent = '✓ ' + n; }
    } catch(_) {}
  }
}

function syncMobCatBadges() {
  // Met à jour le badge de chaque catégorie dans le drawer
  try {
    const solved = JSON.parse(localStorage.getItem('tp_solved') || '{}');
    Object.entries(CAT_MAX).forEach(([cat, max]) => {
      const el = document.getElementById('mb-' + cat);
      if (!el) return;
      const n = solved[cat] || 0;
      el.className = 'mob-cat-badge';
      if (cat === 'examen') { el.textContent = '★'; return; }
      if (n === 0) el.textContent = '—';
      else if (n < max) { el.className += ' has-progress'; el.textContent = n + '/' + max; }
      else { el.className += ' complete'; el.textContent = '✓ ' + n; }
    });
  } catch(_) {}
}

function mobSearch(q) {
  const norm = (q || '').trim().toLowerCase();
  // Filtrer cats individuelles + masquer groupe si toutes ses cats sont masquées
  const cats = document.querySelectorAll('.mob-cat[data-cat]');
  cats.forEach(b => {
    const cat = b.dataset.cat;
    const m = CAT_META[cat];
    const hay = (cat + ' ' + (m ? (m.name + ' ' + (m.sub || '')) : '')).toLowerCase();
    b.classList.toggle('hidden', norm && !hay.includes(norm));
  });
  // Pour chaque groupe, masquer si toutes ses cats sont hidden ; ouvrir tous les groupes pertinents si recherche active
  document.querySelectorAll('.mob-grp').forEach(g => {
    const visible = [...g.querySelectorAll('.mob-cat')].filter(c => !c.classList.contains('hidden')).length;
    g.classList.toggle('hidden', visible === 0);
    if (norm) g.classList.add('open');
  });
}

// Fermer le drawer avec touche Esc
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const dr = document.getElementById('mob-drawer');
    if (dr && dr.classList.contains('open')) closeMobDrawer();
  }
});

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  newExercise();
  updateBadges();
  buildMobDrawer();
  syncMobTrigger();
  syncMobCatBadges();
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
