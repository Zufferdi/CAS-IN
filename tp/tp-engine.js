// ═══════════════════════════════════════════════════════════════════
// tp-engine.js — CAS-IN Travaux Pratiques
// Logique : STATE, générateurs, vérificateurs, UI
// Dépend de tp-data.js (chargé avant)
// ═══════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
// ÉTAT GLOBAL
// ═══════════════════════════════════════════════════
const STATE = {
  cat: 'endian',
  solved: JSON.parse(localStorage.getItem('tp_solved') || '{}'),
  // { cat: count }
  total: {
    endian:0, timestamp:0, bitmap:0, fat:0, magic:0, mismatch:0,
    runlist:0, effacement:0, timestomping:0, hextable:0, fsidentify:0,
    offset:0, bases:0, hash:0, email:0, network:0, ir:0,
    droitpenal:0, glossaire:0, examen:0, mbr:0, direntry:0, hexdump:0, slackspace:0,
    hfsbtree:0, ntfsindex:0
  },
  hintUsed: false,
  // Gamification étendue
  streak:     parseInt(localStorage.getItem('tp_streak')     || '0', 10),
  bestStreak: parseInt(localStorage.getItem('tp_bestStreak') || '0', 10),
};

function saveState() {
  localStorage.setItem('tp_solved', JSON.stringify(STATE.solved));
  localStorage.setItem('tp_streak', String(STATE.streak));
  localStorage.setItem('tp_bestStreak', String(STATE.bestStreak));
}
function getSolved(cat) { return STATE.solved[cat] || 0; }
function getTotalSolved() { return Object.values(STATE.solved).reduce((a,b)=>a+(b||0),0); }
// ─── v3.0 — XP par catégorie TP (delta v44, fix bug "TP donne 0 XP") ───
// Mapping catégorie → difficulté → XP de base. Hint penalty 0.5× déjà géré
// par incSolved (n'appelé que si !hintUsed). Cumulé sur cas_xp via Profile.
const TP_XP_BY_CAT = {
  // Easy (5 XP) — fondamentaux
  endian: 5, bases: 5, hexdump: 5, hextable: 5, glossaire: 5,
  // Medium (15 XP) — analyse intermédiaire
  timestamp: 15, bitmap: 15, magic: 15, mismatch: 15, fsidentify: 15,
  offset: 15, hash: 15, email: 15, network: 15, direntry: 15, slackspace: 15,
  // Hard (30 XP) — forensique avancée
  fat: 30, runlist: 30, effacement: 30, timestomping: 30, mbr: 30,
  ir: 30, droitpenal: 30, examen: 30, hfsbtree: 30, ntfsindex: 30,
};

// Catégorie TP de référence pour bonus de diversification (+5 XP par catégorie distincte solvée)
const TP_CAT_BONUS_XP = 5;

function incSolved(cat) {
  const wasFirstTimeInCat = !STATE.solved[cat];
  STATE.solved[cat] = (STATE.solved[cat]||0)+1;
  STATE.streak++;
  if (STATE.streak > STATE.bestStreak) STATE.bestStreak = STATE.streak;
  saveState();
  updateProgress();

  // ─── v3.0 delta v44 — Attribution XP ───
  // 1. XP de base par exercice résolu sans hint (incSolved n'est appelé que si !hintUsed)
  // 2. +5 XP one-shot si c'est la première fois qu'on résout dans cette catégorie
  try {
    if (window.Profile && typeof window.Profile.addXp === 'function') {
      const baseXp = TP_XP_BY_CAT[cat] || 10;
      const bonus = wasFirstTimeInCat ? TP_CAT_BONUS_XP : 0;
      const total = baseXp + bonus;
      window.Profile.addXp(total, 'tp', { tags: [cat] });
      // Toast discret
      if (typeof showToast === 'function') {
        showToast('✨', `+${total} XP`, cat + (bonus ? ' · 1re catégorie !' : ''));
      }
    }
  } catch (_) {}
}
function breakStreak() {
  if (STATE.streak > 0) {
    STATE.streak = 0;
    saveState();
    updateProgress();
  }
}

// ── Affichage du seuil de maîtrise (badge bronze/argent/or par catégorie)
function masteryBadge(n) {
  if (n >= 50) return '🥇';
  if (n >= 25) return '🥈';
  if (n >= 10) return '🥉';
  return '';
}

// ═══════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n, w, z='0') { return String(n).padStart(w, z); }

// ── Fix #1, #2 : Helpers d'échappement ────────────────────────
// Pour injecter du texte libre dans un attribut HTML entre doubles quotes.
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
// Pour injecter du texte dans un attribut data-* ET pouvoir le relire sans surprise.
// On stocke en base64 des données JSON — aucun problème de quotes/doubles quotes/accolades/accents.
function encData(obj) {
  try {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch (_) { return ''; }
}
function decData(s) {
  try {
    const binary = atob(s);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (_) { return null; }
}
// Normalisation des réponses textuelles (accents insensibles, casse ignorée, espaces ignorés,
// zéros de padding tolérés dans les nombres : "04" ≡ "4")
function normAns(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // enlève diacritiques
    .replace(/\s+/g,'')                                  // compresse espaces
    .toUpperCase()
    .replace(/^0X/, '')
    .replace(/\b0+(\d)/g, '$1');                         // "04" → "4"
}

// ─── Helper unifié : feedback QCM avec « pourquoi c'est faux » + bonne réponse
// Tu m'as demandé : « Seulement la mauvaise réponse choisie + la bonne »
// → wrongExplain (en rouge) + correctExplain (en vert) si !isOk
// → seulement correctExplain (en vert) si isOk
function formatChoiceFeedback(isOk, correctExplain, wrongExplain, extraNote) {
  let html = isOk
    ? `✓ ${correctExplain}`
    : `✗ <strong style="color:var(--red)">Pourquoi ce choix est faux :</strong> ${wrongExplain}
       <div style="margin-top:.5rem;padding:.45rem .65rem;background:rgba(48,232,138,.06);border-left:3px solid var(--green);border-radius:5px;font-size:.78rem;color:var(--text)">
         <strong style="color:var(--green)">Réponse correcte :</strong> ${correctExplain}
       </div>`;
  if (extraNote) {
    html += `<div style="margin-top:.5rem;padding:.45rem .65rem;background:rgba(0,229,204,.05);border-radius:5px;font-size:.74rem;color:var(--cyan)">📌 ${extraNote}</div>`;
  }
  return html;
}

// ═══════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════
function switchCat(cat, btn) {
  STATE.cat = cat;
  STATE.hintUsed = false;
  document.querySelectorAll('.tp-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  updateProgress();
  newExercise();
}

function updateProgress() {
  const cat = STATE.cat;
  const solved = getSolved(cat);
  const total  = getTotalSolved();
  const medal  = masteryBadge(solved);
  const pt = document.getElementById('tp-progress-text');
  if (pt) pt.innerHTML =
    `Catégorie : <strong>${cat}</strong> · Total global : <strong>${total}</strong>` +
    (STATE.streak > 0 ? ` · 🔥 Série en cours : <strong>${STATE.streak}</strong>` : '') +
    (STATE.bestStreak > 0 ? ` · ⭐ Meilleur : ${STATE.bestStreak}` : '');
  const badge = document.getElementById('tp-score-badge');
  if (badge) badge.innerHTML = `${medal} ${solved} résolus ✅`;

  // Mettre à jour les onglets avec un petit compteur
  document.querySelectorAll('.tp-tab').forEach(t => {
    const c = t.dataset.cat;
    if (!c) return;
    const n = getSolved(c);
    // Supprimer ancien compteur s'il existe
    const old = t.querySelector('.tab-count');
    if (old) old.remove();
    if (n > 0) {
      const span = document.createElement('span');
      span.className = 'tab-count';
      span.textContent = n;
      span.style.cssText = 'margin-left:.35rem;padding:.05rem .4rem;border-radius:999px;background:rgba(48,232,138,.15);color:var(--green);font-size:.65rem;font-weight:700';
      t.appendChild(span);
    }
  });
}

function newExercise() {
  STATE.hintUsed = false;
  const gen = GENERATORS[STATE.cat];
  if (!gen) return;
  const ex = gen();
  document.getElementById('ex-container').innerHTML = '';
  document.getElementById('ex-container').appendChild(ex);
}

// ═══════════════════════════════════════════════════
// GÉNÉRATEURS D'EXERCICES
// ═══════════════════════════════════════════════════

const GENERATORS = {
  // endian, timestamp, mbr, hexdump : enregistrés par tp-engine-disk.js (PR 4.3 Phase 4)
  // fat, bitmap, effacement, slackspace, direntry : enregistrés par tp-engine-fat.js (PR 4.1 Phase 4)
  // magic, mismatch : enregistrés par tp-engine-carving.js
  // runlist, timestomping : enregistrés par tp-engine-ntfs.js (PR 4.2 Phase 4)
  hextable:    genHexTable,
  fsidentify:  genFSIdentify,
  offset:      genOffset,
  bases:       genBases,
  hash:        genHashIdentify,
  examen:      genExamen,
  // glossaire, email, network, ir, droitpenal : enregistrés par tp-engine-meta.js
  // registry, prefetch, lnk : enregistrés par tp-engine-windows.js
};

// ───────────────────────────────────────────────────────────────
// HELPER GLOBAL : showTPHint
// ───────────────────────────────────────────────────────────────
// Affiche un indice progressif (3 niveaux) dans la zone de feedback
// d'un exercice. Centralise le pattern dupliqué dans tous les exercices
// qui utilisent un système d'indices.
//
// Convention DOM attendue dans l'exercice :
//   - Zone de feedback   : #ex-feedback-{prefix}
//   - Boutons d'indice   : #{prefix}-h1, #{prefix}-h2, #{prefix}-h3
//
// Effets :
//   1. Affiche le HTML de l'indice avec le badge "Indice N/3"
//   2. Déverrouille le bouton du niveau suivant (level+1)
//   3. Atténue visuellement le bouton du niveau courant
//   4. Marque l'indice comme utilisé (pour le scoring)
//
function showTPHint(div, prefix, level, html) {
  markHintUsed();
  const fb = div.querySelector(`#ex-feedback-${prefix}`);
  fb.style.display = 'block';
  fb.className = 'ex-feedback correct';
  fb.innerHTML = `<div style="font-size:.7rem;color:var(--dim);margin-bottom:.25rem">Indice ${level}/3</div>${html}`;
  const next = div.querySelector(`#${prefix}-h${level+1}`);
  if (next) { next.disabled = false; next.style.opacity = '1'; }
  div.querySelector(`#${prefix}-h${level}`).style.opacity = '.35';
}

// ═══════════════════════════════════════════════════════════════
// SYSTÈME D'INDICES CONTEXTUEL
// ═══════════════════════════════════════════════════════════════

const HINT_LIBRARY = {
  endian: [
    "Les octets Little Endian se lisent de droite à gauche. Le premier octet est le moins significatif (LSB).",
    "Exemple : 0A 7A 00 00 → inverser → 00 00 7A 0A → 0x00007A0A = 31242 en décimal.",
    "Sur Windows, presque toutes les valeurs multi-octets sont en Little Endian.",
  ],
  timestamp: [
    "Format FAT MS-DOS : Time (2 octets LE) puis Date (2 octets LE).",
    "Date : bits 15-9 = année (+1980), bits 8-5 = mois (1-12), bits 4-0 = jour.",
    "Heure : bits 15-11 = heures, bits 10-5 = minutes, bits 4-0 = secondes ÷ 2 (précision 2s).",
    "La précision MS-DOS est de 2 secondes — c'est pourquoi les secondes sont toujours paires.",
  ],
  bitmap: [
    "Dans une bitmap d'allocation, chaque bit représente un cluster : 0 = libre, 1 = occupé.",
    "L'ordre est LSB first : le cluster 0 correspond au bit 0 de l'octet 0 (bit de poids faible).",
    "Exemple : clusters 0, 1, 3 occupés → byte 0 = 00001011 = 0x0B (bit 0, bit 1, bit 3 à 1).",
  ],
  fat: [
    "Chaque entrée FAT16 est sur 2 octets (Little Endian). Lire : 0x07 0x00 → 0x0007 = cluster 7.",
    "Valeurs spéciales FAT16 : 0xFFFF = fin de chaîne, 0x0000 = cluster libre, 0xFFF7 = défectueux.",
    "Suivre la chaîne : cluster de départ → entrée FAT → cluster suivant → ... → 0xFFFF (EOC).",
  ],
  runlist: [
    "Header byte : nibble haut = nb octets pour le delta LCN, nibble bas = nb octets pour la longueur.",
    "Exemple 0x21 : 2 octets de delta, 1 octet de longueur. Lire ensuite 1 octet longueur puis 2 octets delta.",
    "Les valeurs longueur et delta sont en Little Endian. Le delta est relatif au fragment précédent.",
    "0x00 = terminateur de Run List (fin des fragments).",
  ],
  bases: [
    "Hex → Binaire : chaque chiffre hex = 4 bits (F = 1111, A = 1010, 0 = 0000).",
    "Décimal → Hex : diviser par 16 répétitivement, les restes donnent les chiffres hex.",
    "BCD : chaque groupe de 4 bits encode un chiffre décimal (0-9 uniquement, pas A-F).",
    "Complément à 2 : pour un nombre négatif, inverser tous les bits et ajouter 1.",
  ],
  effacement: [
    "En FAT, effacer un fichier = remplacer le premier octet du nom par 0xE5 (σ en DOS).",
    "Les entrées FAT correspondantes sont mises à 0x0000 (cluster libre).",
    "Les données sur le disque ne sont PAS effacées — elles restent jusqu'à réécriture.",
    "C'est pourquoi la récupération de fichiers FAT est souvent possible.",
  ],
  examen: [
    "Les examens CAS-IN combinent lecture hex directe, calculs LE et connaissance des structures.",
    "Commencer toujours par identifier le contexte : FAT12/16/32, exFAT, NTFS, EXT, HFS+.",
    "Pour les offsets : toujours lire en Little Endian sauf HFS+ (Big Endian).",
  ],
  timestomping: [
    "$STANDARD_INFORMATION (0x10) est modifiable par n'importe quelle application — c'est la cible de l'anti-forensique.",
    "$FILE_NAME (0x30) est mis à jour par le noyau Windows uniquement — difficile à falsifier.",
    "Si $SI.Created > $FN.Created : impossible, le fichier ne peut pas être créé après avoir été nommé → timestomping détecté.",
    "Si $SI et $FN ont exactement les mêmes dates au milliseconde près : probablement naturel (copie fraîche).",
  ],
  droitpenal: [
    "Art. 143 CP — Soustraction de données : obtenir sans droit des données protégées, dans un dessein d'enrichissement. Inclut la copie selon la jurisprudence du TF.",
    "Art. 143bis CP — Accès indu : pénétrer dans un système informatique sans autorisation, même sans intention de nuire.",
    "Art. 144bis CP — Dommages aux données : modifier, effacer, rendre inutilisable (inclut le chiffrement par ransomware).",
    "Art. 147 CP — Utilisation frauduleuse d'un ordinateur : obtenir un enrichissement illégitime par manipulation informatique (fraude CEO, virements détournés).",
  ],
  glossaire: [
    "Méthode : voir le terme, deviner la traduction, vérifier. Alterner FR→EN et EN→FR.",
    "Focus sur les termes qui trompent : 'décrypter' n'existe pas en bon français — on dit 'déchiffrer'.",
    "Les termes MAC times = Modified, Accessed, Created — trois horodatages distincts en forensique.",
  ],
};

// ═══════════════════════════════════════════════════════════════
// MNEMONIC_LIBRARY — Astuces mémo / mnémoniques par catégorie
// Affichées comme indices complémentaires (en plus des indices pas-à-pas)
// ═══════════════════════════════════════════════════════════════
const MNEMONIC_LIBRARY = {
  endian: [
    "🧠 <em>« Little = Lecture inverse »</em> — en LE, lis de droite à gauche pour reconstituer la valeur.",
    "🧠 <em>« x86 = LE, Réseau = BE »</em> — Intel est Little, IP/TCP sont Big. Apple HFS+ aussi BE.",
    "🧠 Octet faible = LSB = à <strong>gauche</strong> en LE. Octet fort = MSB = à <strong>gauche</strong> en BE.",
    "🧠 Mot de passe mémo : <strong>« BE-Bonne Écriture »</strong> (l'humain écrit 1 234 = milliers à gauche).",
  ],
  timestamp: [
    "🧠 Date FAT = <strong>YYYYYYY MMMM DDDDD</strong> (7+4+5 bits = 16). Année depuis 1980.",
    "🧠 Heure FAT = <strong>HHHHH MMMMMM SSSSS</strong> (5+6+5 bits = 16). Secondes ÷ 2 → toujours paires.",
    "🧠 FILETIME : <em>« Bill is from 1601 »</em> · 1 sec = 10<sup>7</sup> ticks (100ns).",
    "🧠 Unix epoch = 01/01/1970. FAT epoch = 01/01/1980. NTFS epoch = 01/01/1601. HFS+ = 01/01/1904.",
    "🧠 Astuce : si secondes impaires → <strong>pas un timestamp FAT</strong> (perte de précision).",
  ],
  bitmap: [
    "🧠 <em>« LSB first »</em> = bit 0 (poids faible) = cluster 0 dans l'octet 0.",
    "🧠 0xFF = 11111111 = 8 clusters occupés. 0x00 = 8 clusters libres.",
    "🧠 Pour trouver le 1<sup>er</sup> cluster libre : cherche le 1<sup>er</sup> bit à 0 en partant du bit 0 de l'octet 0.",
    "🧠 exFAT : clusters 0 et 1 sont <strong>réservés</strong> → bit 0 octet 0 = cluster 2.",
  ],
  fat: [
    "🧠 EOC FAT12 = 0xFFF · FAT16 = 0xFFFF · FAT32 = 0x0FFFFFFF (les 4 bits hauts ignorés).",
    "🧠 Cluster libre = 0x0000. Cluster défectueux FAT16 = 0xFFF7.",
    "🧠 <em>« Suivre la chaîne »</em> : chaque entrée = adresse du <strong>suivant</strong>.",
    "🧠 FAT entries en LE : 0x07 0x00 → 0x0007 = cluster 7.",
  ],
  magic: [
    "🧠 <strong>FF D8 FF</strong> = JPEG (toujours, quel que soit le 4<sup>e</sup> octet).",
    "🧠 <strong>89 50 4E 47</strong> = PNG (le 0x89 piège la corruption 7-bit).",
    "🧠 <strong>50 4B 03 04</strong> = ZIP <em>OU</em> docx/xlsx/pptx/jar/apk (toutes archives ZIP).",
    "🧠 <strong>25 50 44 46</strong> = '%PDF' en ASCII.",
    "🧠 <strong>4D 5A</strong> = MZ = exécutable Windows (PE). 'MZ' = Mark Zbikowski (dev MS-DOS).",
    "🧠 <strong>D0 CF 11 E0</strong> = OLE2 = vieux Office (.doc/.xls/.ppt 97-2003).",
  ],
  mismatch: [
    "🧠 Toujours vérifier <strong>signature ≠ extension</strong> en file carving.",
    "🧠 Un .jpg avec MZ en tête = <strong>exécutable déguisé</strong> (phishing classique).",
    "🧠 .docx/.xlsx/.pptx sont en réalité des archives ZIP — d'où `50 4B 03 04` en tête.",
    "🧠 Outil terrain : <code>file</code> (Linux/macOS) ou <code>TrID</code> (Windows) confirment le vrai type.",
  ],
  runlist: [
    "🧠 Header byte : <em>« Délai-Longueur »</em> (haut-bas) → nibble haut = nb octets delta, nibble bas = nb octets longueur.",
    "🧠 0x21 → 2 octets delta + 1 octet longueur. 0x32 → 3+2.",
    "🧠 0x00 = <strong>terminateur</strong> de Run List.",
    "🧠 Delta LCN = relatif au fragment précédent (peut être négatif → fragments « en arrière »).",
  ],
  bases: [
    "🧠 Hex ↔ Binaire : 1 chiffre hex = 4 bits. <em>« 4 bits c'est 1 doigt »</em> sur la main hex.",
    "🧠 Table à mémoriser : 0=0000, 5=0101, A=1010, F=1111. Le reste se déduit.",
    "🧠 BCD = Binary Coded Decimal : un chiffre décimal (0-9) par groupe de 4 bits. Les valeurs A-F sont <strong>invalides</strong> en BCD.",
    "🧠 Complément à 2 : pour négatifs, inverser tous les bits puis +1. MSB=1 → négatif.",
  ],
  effacement: [
    "🧠 <em>« E5 = Effacé »</em> (la lettre σ en DOS).",
    "🧠 0x00 en 1<sup>er</sup> octet d'une entrée SFN = <strong>fin du répertoire</strong>, pas effacé.",
    "🧠 Effacer en FAT ne touche PAS les données — uniquement l'entrée de répertoire et la chaîne FAT.",
    "🧠 <strong>TRIM</strong> sur SSD = effacement physique → la récupération devient impossible.",
  ],
  examen: [
    "🧠 SFN = 32 octets : 8.3 + attr + dates + cluster + taille.",
    "🧠 NTFS attributs : 10-30-80 = <strong>SI-FN-DATA</strong> (à mémoriser).",
    "🧠 Chaque enregistrement MFT = 1024 octets, commence par <strong>'FILE'</strong> (46 49 4C 45).",
    "🧠 HFS+ Volume Header @ offset 1024, signature <strong>'H+'</strong> = 0x482B en BE.",
    "🧠 EXT magic = <strong>0xEF53</strong> (53 EF en LE) à offset 0x38 du superbloc (offset 1024 du volume).",
    "🧠 exFAT : <em>« 85, C0, C1 »</em> = File / Stream / Name (3 entrées par fichier).",
  ],
  timestomping: [
    "🧠 <em>« $SI ment, $FN dit la vérité »</em> — $STANDARD_INFORMATION est modifiable, $FILE_NAME ne l'est que par le noyau.",
    "🧠 Si <strong>$SI.Created &gt; $FN.Created</strong> → physiquement impossible → timestomping.",
    "🧠 4 timestamps $SI identiques à la seconde près = écrasement en bloc (outil <code>timestomp</code>, <code>SetFileTime</code>).",
    "🧠 Précision normale : $SI sub-microseconde, jamais des dates « rondes » (ex: minuit pile).",
  ],
  hextable: [
    "🧠 BPB FAT — l'OEM démarre à 0x03, BPS à 0x0B, SPC à 0x0D, FATs à 0x10.",
    "🧠 SFN — Cluster à <strong>0x1A</strong>, Taille à <strong>0x1C</strong>.",
    "🧠 NTFS Boot — <strong>'NTFS    '</strong> à 0x03 (4 espaces), MFT LCN à 0x30.",
    "🧠 EXT Superbloc — magic <strong>0x53 0xEF</strong> à offset 0x38.",
  ],
  fsidentify: [
    "🧠 <strong>OEM ID</strong> à offset 0x03 trahit souvent le FS : <em>MSDOS5.0, MSWIN4.1, NTFS, EXFAT</em>.",
    "🧠 RootEntries (0x11) > 0 → FAT12/16. RootEntries = 0 → FAT32 ou autre.",
    "🧠 NTFS = NumFATs (0x10) à zéro — le BPB classique est ignoré.",
    "🧠 EXT4 superbloc commence à offset 1024 du volume (saute le boot).",
    "🧠 HFS+ : signature 'H+' = 0x48 0x2B en BE à offset 1024.",
  ],
  offset: [
    "🧠 NTFS — Offset $MFT = <strong>LCN × taille_cluster</strong>.",
    "🧠 FAT32 — Offset cluster N = <code>(reserved + nFATs × FATSize) × BPS + (N − 2) × cluster_size</code>.",
    "🧠 exFAT — Offset cluster N = <code>ClusterHeapOffset × BPS + (N − 2) × cluster_size</code>.",
    "🧠 EXT4 inode N : <em>groupe = (N−1) ÷ inodes_per_group</em>, puis index dans le groupe.",
    "🧠 HFS+ (et NTFS) : pas de « cluster 0 = libre » comme FAT — l'index commence à 0.",
  ],
  hash: [
    "🧠 MD5 = 128 bits = 32 hex chars. SHA-1 = 160 bits = 40. SHA-256 = 256 bits = 64. SHA-512 = 512 bits = 128.",
    "🧠 Formule : <em>n_chars_hex = bits ÷ 4</em>.",
    "🧠 Standard ISO/IEC 27037 : <strong>SHA-256 minimum</strong> en forensique (MD5/SHA-1 ont des collisions connues).",
    "🧠 Hash identique avant/après transport = chaîne de custody intacte. Hash différent = preuve compromise.",
  ],
  email: [
    "🧠 <strong>SPF</strong> vérifie l'IP émettrice. <strong>DKIM</strong> signe le message. <strong>DMARC</strong> applique une politique (none/quarantine/reject).",
    "🧠 Lire les <code>Received:</code> du <strong>bas vers le haut</strong> pour reconstituer le trajet.",
    "🧠 <em>Reply-To ≠ From</em> = drapeau rouge classique (CEO fraud / BEC).",
    "🧠 SPF PASS + DKIM PASS ne garantissent pas l'authenticité humaine — un compte compromis passe tous les contrôles.",
  ],
  network: [
    "🧠 DNS tunneling = sous-domaines aléatoires longs + requêtes TXT massives.",
    "🧠 IP <strong>185.220.x.x</strong> = nœuds de sortie Tor (fréquent en exfiltration).",
    "🧠 Beaucoup d'<strong>IPs distinctes en peu de temps</strong> + SNI aléatoires = DGA / scan / botnet.",
    "🧠 Ratio upload >> download vers IP suspecte = exfiltration probable.",
  ],
  ir: [
    "🧠 Containment (NIST) : <strong>isoler ≠ éteindre</strong>. Maintenir sous tension préserve la RAM.",
    "🧠 Ordre RFC 3227 : <em>RAM → réseau → processus → disque → backups → archives</em> (du plus volatile au plus stable).",
    "🧠 Volatility = framework RAM. Plugins phares : <code>pslist</code>, <code>malfind</code>, <code>netscan</code>, <code>pstree</code>.",
    "🧠 Ne JAMAIS prévenir un suspect avant d'avoir sécurisé les preuves.",
    "🧠 LPD CH révisée : notification PFPDT « dans les meilleurs délais » (≠ RGPD 72h).",
  ],
  droitpenal: [
    "🧠 <strong>Art. 143</strong> = soustraction (copie illicite, dessein d'enrichissement).",
    "🧠 <strong>Art. 143bis</strong> = accès indu (l'intrusion elle-même, sans intention de nuire).",
    "🧠 <strong>Art. 144bis</strong> = détérioration (chiffrer = détériorer → ransomware).",
    "🧠 <strong>Art. 147</strong> = utilisation frauduleuse d'un ordinateur (CEO fraud, virements détournés).",
    "🧠 <strong>Art. 156</strong> = extorsion (la rançon).",
    "🧠 <strong>Art. 179quater</strong> = prise de vue dans le domaine privé (RAT + webcam).",
  ],
  glossaire: [
    "🧠 <em>« Décrypter » n'existe pas en français — on dit déchiffrer.</em>",
    "🧠 MAC times = <strong>M</strong>odified · <strong>A</strong>ccessed · <strong>C</strong>reated.",
    "🧠 IoC = Indicator of Compromise (hash, IP, nom de fichier, clé registre).",
    "🧠 EIMP = Entraide internationale en matière pénale (loi suisse).",
  ],
};

let _currentHints = [];
let _currentHintIdx = 0;

function initHintSystem(cat) {
  // Indices techniques uniquement (pas-à-pas).
  // Les mnémoniques (MNEMONIC_LIBRARY) sont affichées dans l'onglet « Mémo »
  // séparé du panneau d'aide flottant — pas dans la pagination linéaire.
  _currentHints = HINT_LIBRARY[cat] || HINT_LIBRARY.endian;
  _currentHintIdx = 0;
}

function showContextHint(cat) {
  initHintSystem(cat || STATE.cat);
  const existing = document.getElementById('ctx-hint-panel');
  if (existing) { existing.remove(); return; }

  const currentCat = cat || STATE.cat;
  const mnemos = (typeof MNEMONIC_LIBRARY !== 'undefined' && MNEMONIC_LIBRARY[currentCat]) ? MNEMONIC_LIBRARY[currentCat] : [];

  const panel = document.createElement('div');
  panel.id = 'ctx-hint-panel';
  panel.style.cssText = `
    position:fixed; bottom:70px; right:16px; width:340px; max-width:92vw;
    max-height:78vh; overflow:auto;
    background:linear-gradient(135deg,#0c1422,#101c30);
    border:1px solid rgba(240,192,64,.4); border-radius:12px;
    padding:14px 16px; z-index:8000;
    box-shadow: 0 8px 32px rgba(0,0,0,.6);
    animation: slideUp .25s ease;
    font-size:.8rem; line-height:1.65;
  `;

  // Onglets : "Indices" (existant, paginé) et "Mémo" (nouveau, liste)
  let activeTab = 'hints'; // 'hints' | 'memo'

  function renderTabs() {
    const hintsActive = activeTab === 'hints';
    const memoActive  = activeTab === 'memo';
    return `
      <div style="display:flex;gap:4px;margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:8px">
        <button data-tab="hints" style="flex:1;padding:5px 8px;border-radius:6px;border:1px solid ${hintsActive?'rgba(240,192,64,.4)':'rgba(255,255,255,.08)'};background:${hintsActive?'rgba(240,192,64,.10)':'transparent'};color:${hintsActive?'var(--gold)':'var(--dim)'};cursor:pointer;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em">💡 Indices</button>
        <button data-tab="memo" style="flex:1;padding:5px 8px;border-radius:6px;border:1px solid ${memoActive?'rgba(0,229,204,.4)':'rgba(255,255,255,.08)'};background:${memoActive?'rgba(0,229,204,.10)':'transparent'};color:${memoActive?'var(--cyan)':'var(--dim)'};cursor:pointer;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em">🧠 Mémo${mnemos.length?` (${mnemos.length})`:''}</button>
      </div>`;
  }

  function renderHintsTab() {
    const hints = _currentHints;
    if (!hints || !hints.length) return `<div style="color:var(--dim);font-size:.8rem;text-align:center;padding:1rem">Aucun indice pour cette catégorie.</div>`;
    return `
      <div id="ctx-hint-text" style="color:var(--text);margin-bottom:10px;min-height:60px">${hints[_currentHintIdx]}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span id="ctx-hint-idx" style="font-size:.68rem;color:var(--dim)">${_currentHintIdx+1} / ${hints.length}</span>
        <div style="display:flex;gap:6px">
          <button id="ctx-hint-prev" style="padding:3px 10px;border-radius:5px;border:1px solid rgba(255,255,255,.15);background:transparent;color:var(--dim);cursor:pointer;font-size:.75rem;font-family:var(--mono)">←</button>
          <button id="ctx-hint-next" style="padding:3px 10px;border-radius:5px;border:1px solid rgba(255,255,255,.15);background:transparent;color:var(--dim);cursor:pointer;font-size:.75rem;font-family:var(--mono)">→</button>
        </div>
      </div>`;
  }

  function renderMemoTab() {
    if (!mnemos.length) {
      return `<div style="color:var(--dim);font-size:.78rem;text-align:center;padding:1rem;line-height:1.6">Pas encore d'astuce mémo pour cette catégorie.<br><span style="font-size:.7rem;opacity:.7">Reviens plus tard ou consulte une autre catégorie.</span></div>`;
    }
    // Les mnémoniques sont des strings HTML (déjà formatés avec balises)
    return mnemos.map(m => `
      <div style="margin-bottom:.55rem;padding:.55rem .75rem;background:rgba(0,229,204,.05);border:1px solid rgba(0,229,204,.18);border-left:3px solid var(--cyan);border-radius:6px;font-size:.76rem;color:var(--text);line-height:1.55">
        ${m}
      </div>`).join('');
  }

  function render() {
    const tabContent = activeTab === 'hints' ? renderHintsTab() : renderMemoTab();
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:.7rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.1em">Aide — ${currentCat}</span>
        <button id="ctx-hint-close" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:16px;line-height:1;padding:0">✕</button>
      </div>
      ${renderTabs()}
      <div id="ctx-tab-body">${tabContent}</div>
    `;
    // Bind handlers
    panel.querySelector('#ctx-hint-close').onclick = () => panel.remove();
    panel.querySelectorAll('button[data-tab]').forEach(b => {
      b.onclick = () => { activeTab = b.dataset.tab; render(); };
    });
    if (activeTab === 'hints') {
      const prev = panel.querySelector('#ctx-hint-prev');
      const next = panel.querySelector('#ctx-hint-next');
      if (prev) prev.onclick = () => {
        _currentHintIdx = Math.max(0, _currentHintIdx - 1);
        updateHintPanel();
      };
      if (next) next.onclick = () => {
        _currentHintIdx = Math.min(_currentHints.length - 1, _currentHintIdx + 1);
        updateHintPanel();
      };
    }
  }
  function updateHintPanel() {
    const hints = _currentHints;
    const textEl = panel.querySelector('#ctx-hint-text');
    const idxEl  = panel.querySelector('#ctx-hint-idx');
    if (textEl) textEl.innerHTML = hints[_currentHintIdx];
    if (idxEl)  idxEl.textContent = `${_currentHintIdx+1} / ${hints.length}`;
  }

  render();
  document.body.appendChild(panel);
}

// Bouton flottant d'aide
function addFloatingHelp() {
  if (document.getElementById('float-help')) return;
  const btn = document.createElement('button');
  btn.id = 'float-help';
  btn.innerHTML = '💡';
  btn.title = 'Aide contextuelle — Indices + 🧠 Astuces mémo';
  btn.style.cssText = `
    position:fixed; bottom:20px; right:16px;
    width:44px; height:44px; border-radius:50%;
    background:rgba(240,192,64,.15); border:1px solid rgba(240,192,64,.4);
    color:var(--gold); font-size:20px; cursor:pointer;
    box-shadow:0 4px 16px rgba(0,0,0,.4);
    transition:.2s; z-index:7999;
    display:flex; align-items:center; justify-content:center;
  `;
  btn.onclick = () => showContextHint(STATE.cat);
  btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseleave = () => btn.style.transform = 'scale(1)';
  document.body.appendChild(btn);
}

// CSS animation
if (!document.querySelector('#hint-anim-style')) {
  const s = document.createElement('style');
  s.id = 'hint-anim-style';
  s.textContent = `@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(s);
}

document.addEventListener('DOMContentLoaded', addFloatingHelp);


// ═══════════════════════════════════════════════════════════════
// 8. BASES & ENCODAGES (inspiré de l'examen 2022)
// ═══════════════════════════════════════════════════════════════

// [BASES_EXERCISES chargé depuis tp-data.js]
function genBases() {
  const ex = BASES_EXERCISES[rand(0, BASES_EXERCISES.length-1)];
  const data = ex.gen();
  const id = `bases-${Date.now()}`;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-bs">🔢</div>
      <div class="ex-title">Bases & Encodages — Examen CAS-IN</div>
      <span class="ex-badge easy">calcul</span>
    </div>
    <div class="ex-scenario">${data.question}</div>
    <div class="ex-input-row">
      <span class="ex-input-label">${data.label}</span>
      <input class="ex-input" id="inp-bases" placeholder="${data.placeholder}" autocomplete="off" style="max-width:200px">
      <button class="btn-hint" id="btn-hint-bs">💡 Méthode</button>
      <button class="btn-validate" id="btn-validate-bs">Valider ✓</button>
      <button class="btn-next" id="btn-next-bs" onclick="newExercise()">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="ex-feedback-bs"></div>
  `;
  setTimeout(() => {
    const inp = div.querySelector('#inp-bases');
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') div.querySelector('#btn-validate-bs').click(); });
    const hintBtn = div.querySelector('#btn-hint-bs');
    if (hintBtn) hintBtn.addEventListener('click', () => showBasesHint(data.hint));
    const validateBtn = div.querySelector('#btn-validate-bs');
    if (validateBtn) validateBtn.addEventListener('click', () => checkBases(validateBtn, data.answer, data.explain));
  }, 50);
  return div;
}

function showBasesHint(hint) {
  markHintUsed();
  const fb = document.getElementById('ex-feedback-bs');
  if (!fb) return;
  fb.className = 'ex-feedback correct';
  fb.innerHTML = `💡 Méthode : ${hint}`;
}

function checkBases(btn, expected, explain) {
  const inp = document.getElementById('inp-bases');
  const fb  = document.getElementById('ex-feedback-bs');
  const val = inp.value.trim();
  const ok  = val.toUpperCase().replace(/\s/g,'') === expected.toUpperCase().replace(/\s/g,'') || val === expected;

  if (ok) {
    inp.className = 'ex-input correct';
    btn.disabled = true;
    document.getElementById('btn-next-bs').style.display = 'block';
    document.querySelector('.ex-card').className = 'ex-card solved';
    document.getElementById('ex-num-bs').className = 'ex-num solved';
    fb.className = 'ex-feedback correct';
    fb.innerHTML = `✓ Correct ! ${explain}`;
    if (!STATE.hintUsed) incSolved(STATE.cat);
  } else {
    inp.className = 'ex-input wrong';
    fb.className = 'ex-feedback wrong';
    fb.innerHTML = `✗ "${val}" incorrect. Réponse attendue : <strong>${expected}</strong>. Utilise 💡 Méthode pour voir les étapes.`;
    breakStreak();
    setTimeout(() => inp.className = 'ex-input', 700);
  }
}


// ═══════════════════════════════════════════════════════════════
// 10. SÉRIE EXAMEN (questions inspirées des vrais examens CAS-IN)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// SÉRIE EXAMEN — Questions originales avec tables hex et indices
// ═══════════════════════════════════════════════════════════════

// renderHexDump — version refondue (avril 2026)
// Signature : renderHexDump(rows, highlights, opts)
//   rows       : [{offset:'00000010', bytes:[...] }] — TOUTE découpe est acceptée
//                (4, 16, 32, 80 octets…) ; la fonction ré-aplatit puis re-découpe.
//   highlights : [{from, to, color, label}]  — offsets ABSOLUS dans le buffer
//   opts.cols  : 16 (défaut) ou 32 — largeur de ligne
//   opts.title : titre optionnel au-dessus du dump
//
// Améliorations :
//   • En-tête de colonnes (00 01 … 0F) parfaitement aligné via colspan d'une <th>
//     par octet (chaque cellule = 2.4ch, monospace) — ASCII en colonne dédiée.
//   • Séparateur visuel toutes les 8 colonnes (groupes de 8 octets).
//   • Highlights par span coloré + tooltip (title=).
//   • Mode 32 colonnes : idéal pour SFN/exFAT/MFT (1 entrée = 1 ligne).
function renderHexDump(rows, highlights=[], opts={}) {
  const COLS = (opts.cols === 32) ? 32 : 16;
  const HALF = COLS / 2;

  // Aplatir tous les bytes en gardant l'offset de base
  const baseOff = rows.length ? parseInt(rows[0].offset, 16) : 0;
  const allBytes = rows.flatMap(r => r.bytes);

  // Re-découper en lignes de COLS octets
  const newRows = [];
  for (let i = 0; i < allBytes.length; i += COLS) {
    newRows.push({
      offset: (baseOff + i).toString(16).toUpperCase().padStart(8, '0'),
      bytes:  allBytes.slice(i, i + COLS),
      _start: baseOff + i,
    });
  }

  // En-tête : générer les indices de colonne 00 01 … (COLS-1)
  const colHeaders = [];
  for (let c = 0; c < COLS; c++) {
    const sep = (c === HALF) ? 'border-left:1px solid rgba(255,255,255,.08);padding-left:.45rem' : '';
    colHeaders.push(
      `<th style="padding:.25rem .15rem;color:var(--dim);font-size:.6rem;font-weight:600;text-align:center;border-bottom:1px solid var(--border);${sep}">${c.toString(16).toUpperCase().padStart(2,'0')}</th>`
    );
  }

  // Construction des lignes de bytes
  const bodyRows = newRows.map(r => {
    const tds = [];
    for (let i = 0; i < COLS; i++) {
      const b = r.bytes[i];
      const sep = (i === HALF) ? 'border-left:1px solid rgba(255,255,255,.08);padding-left:.45rem' : '';
      if (b === undefined) {
        tds.push(`<td style="padding:.25rem .15rem;color:var(--dim);text-align:center;${sep}">  </td>`);
        continue;
      }
      const abs = r._start + i;
      const hl  = highlights.find(h => h.from <= abs && abs <= h.to);
      const baseStyle = hl
        ? `color:var(${hl.color||'--cyan'});font-weight:700;background:rgba(255,255,255,.04);border-radius:3px`
        : `color:var(--text)`;
      const title = hl ? ` title="${escAttr(hl.label || '')}"` : '';
      tds.push(`<td style="padding:.25rem .15rem;text-align:center;${sep};${baseStyle}"${title}>${b.toString(16).toUpperCase().padStart(2,'0')}</td>`);
    }
    const ascii = r.bytes.map(b => (b!==undefined && b>=0x20 && b<0x7F) ? String.fromCharCode(b) : '.').join('');
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.025)">
      <td style="padding:.3rem .6rem;color:var(--dim);font-size:.7rem;border-right:1px solid rgba(255,255,255,.05)">${r.offset}</td>
      ${tds.join('')}
      <td style="padding:.3rem .6rem;color:var(--dim);font-size:.7rem;border-left:1px solid rgba(255,255,255,.05);text-align:left">${escAttr(ascii)}</td>
    </tr>`;
  }).join('');

  const titleHTML = opts.title
    ? `<div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">${escAttr(opts.title)}</div>`
    : '';

  return `<div style="background:rgba(0,0,0,.45);border:1px solid var(--border);border-radius:8px;overflow:auto;margin:.6rem 0;font-family:var(--mono);font-size:.74rem">
    ${titleHTML}
    <table style="border-collapse:collapse;min-width:100%">
      <thead><tr style="background:var(--surface2)">
        <th style="padding:.25rem .6rem;color:var(--dim);font-size:.6rem;text-align:left;border-bottom:1px solid var(--border);border-right:1px solid rgba(255,255,255,.05)">Offset</th>
        ${colHeaders.join('')}
        <th style="padding:.25rem .6rem;color:var(--dim);font-size:.6rem;border-bottom:1px solid var(--border);border-left:1px solid rgba(255,255,255,.05);text-align:left">ASCII</th>
      </tr></thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  </div>`;
}

// ── Exercice type FAT Boot Sector ──
function makeBootSectorExercise() {
  // Paramètres réalistes aléatoires
  const bps   = [512, 1024, 2048][rand(0,2)];
  const spc   = [1,2,4,8,16][rand(0,4)];
  const rsvd  = rand(2, 8);
  const nFATs = 2;
  const sectPerFAT = rand(2, 16);
  const rootEntries = 512;
  
  // Encoder en Little Endian
  const le16 = v => [v & 0xFF, (v >> 8) & 0xFF];
  const le32 = v => [v & 0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];

  const bytes = new Array(64).fill(0);
  // OEM at 0x03
  "MSDOS5.0".split('').forEach((c,i) => bytes[3+i] = c.charCodeAt(0));
  // BPB
  le16(bps).forEach((b,i)   => bytes[0x0B+i] = b);  // BytesPerSector
  bytes[0x0D] = spc;                                  // SectorsPerCluster
  le16(rsvd).forEach((b,i)  => bytes[0x0E+i] = b);  // ReservedSectors
  bytes[0x10] = nFATs;                                // NumFATs
  le16(rootEntries).forEach((b,i) => bytes[0x11+i] = b); // RootEntryCount
  le16(sectPerFAT).forEach((b,i) => bytes[0x16+i] = b); // SectorsPerFAT

  const question = rand(0,2);
  let qText, answer, hints, explain;

  if (question === 0) {
    answer = sectPerFAT;
    qText = `Combien de secteurs occupe <strong>chacune des FAT</strong> de ce volume ?`;
    hints = [
      `L'offset de SectorsPerFAT (FAT16) est <strong>0x16</strong> sur 2 octets en Little Endian.`,
      `Localise l'offset 0x16 dans le dump. Lis 2 octets, inverse (Little Endian), convertis en décimal.`,
      `Offset 0x16 = octets <span style="color:var(--cyan);font-weight:700">${bytes[0x16].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x17].toString(16).toUpperCase().padStart(2,'0')}</span> → LE → ${sectPerFAT} secteurs`,
    ];
    explain = `SectorsPerFAT @ 0x16 = ${bytes[0x16].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x17].toString(16).toUpperCase().padStart(2,'0')} en LE = ${sectPerFAT} secteurs par FAT.`;
  } else if (question === 1) {
    answer = bps;
    qText = `Quelle est la taille d'un <strong>secteur</strong> (en octets) sur ce volume ?`;
    hints = [
      `BytesPerSector se trouve à l'offset <strong>0x0B</strong> sur 2 octets Little Endian dans le BPB.`,
      `Offset 0x0B dans le dump : lis 2 octets consécutifs, inverse l'ordre des octets (LE).`,
      `0x0B = octets <span style="color:var(--cyan);font-weight:700">${bytes[0x0B].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x0C].toString(16).toUpperCase().padStart(2,'0')}</span> → LE → ${bps} octets/secteur`,
    ];
    explain = `BytesPerSector @ 0x0B = ${bytes[0x0B].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x0C].toString(16).toUpperCase().padStart(2,'0')} → LE → ${bps} octets.`;
  } else {
    answer = spc;
    qText = `Combien de secteurs contient <strong>chaque cluster</strong> sur ce volume ?`;
    hints = [
      `SectorsPerCluster est à l'offset <strong>0x0D</strong> sur 1 seul octet — pas de Little Endian sur 1 octet.`,
      `Offset 0x0D → lire directement 1 octet et convertir en décimal.`,
      `0x0D = octet <span style="color:var(--cyan);font-weight:700">${bytes[0x0D].toString(16).toUpperCase().padStart(2,'0')}</span> = ${spc} secteurs/cluster`,
    ];
    explain = `SectorsPerCluster @ 0x0D = 0x${bytes[0x0D].toString(16).toUpperCase().padStart(2,'0')} = ${spc} secteur(s) par cluster.`;
  }

  const row0 = { offset: '00000000', bytes: bytes.slice(0, 16) };
  const row1 = { offset: '00000010', bytes: bytes.slice(16, 32) };
  const row2 = { offset: '00000020', bytes: bytes.slice(32, 48) };
  const rows = [row0, row1, row2];

  const hlTarget = question === 0 ? {from:0x16,to:0x17,color:'--gold',label:'SectorsPerFAT'}
                 : question === 1 ? {from:0x0B,to:0x0C,color:'--cyan',label:'BytesPerSector'}
                 : {from:0x0D,to:0x0D,color:'--green',label:'SectorsPerCluster'};

  return {
    title: "FAT — Lecture du Boot Sector (BPB)",
    category: "Système de fichiers",
    difficulty: "medium",
    scenario: `Tu examines le <strong>secteur de boot</strong> d'une clé USB FAT16.`,
    hexDump: renderHexDump(rows, [
      {from:0x03,to:0x0A,color:'--dim',label:'OEM ID'},
      hlTarget
    ], {cols: 16, title: 'Boot sector FAT — premiers 48 octets (BPB)'}),
    question: qText,
    type: "number",
    answer: String(answer),
    hints,
    explain,
  };
}

// ── Exercice type Run List NTFS ──
function makeRunListExercise() {
  // Générer 2-4 fragments réalistes
  const n = rand(2,4);
  const fragments = [];
  let lcn = 0;

  for (let i = 0; i < n; i++) {
    const len   = rand(1, 30);
    const delta = rand(1, 100);
    lcn += delta;
    const lenOcts  = len  <= 0xFF ? 1 : 2;
    const delOcts  = delta <= 0xFF ? 1 : 2;
    const header   = (delOcts << 4) | lenOcts;
    const lenBytes = lenOcts === 1 ? [len] : [len & 0xFF, (len >> 8) & 0xFF];
    const delBytes = delOcts === 1 ? [delta] : [delta & 0xFF, (delta >> 8) & 0xFF];
    fragments.push({ len, delta, lcn, header, lenBytes, delBytes });
  }

  const allBytes = [
    ...fragments.flatMap(f => [f.header, ...f.lenBytes, ...f.delBytes]),
    0x00
  ];

  const hexStr = allBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0'));

  const question = rand(0,2);
  let qText, answer, hints, explain;

  if (question === 0) {
    answer = String(n);
    qText = "Sur combien de <strong>fragments</strong> (runs) ce fichier est-il réparti ?";
    hints = [
      `Chaque fragment commence par un <strong>octet header</strong>. L'octet <span style="color:var(--gold)">0x00</span> est le terminateur — il marque la fin de la Run List.`,
      `Header : nibble haut (bits 7-4) = nb octets pour le delta LCN, nibble bas (bits 3-0) = nb octets pour la longueur. Un header ≠ 0x00 = un fragment.`,
      `Lis chaque header, saute ses octets longueur + delta, puis passe au header suivant. Compte les headers jusqu'au 0x00.`,
    ];
    explain = `${n} headers non-nuls avant le 0x00 terminateur = ${n} fragments.`;
  } else if (question === 1) {
    answer = String(fragments[0].len);
    qText = `Combien de clusters contient le <strong>premier fragment</strong> ?`;
    hints = [
      `Le premier octet est le header : <span style="color:var(--gold)">${fragments[0].header.toString(16).toUpperCase().padStart(2,'0')}</span>. Nibble bas = nombre d'octets pour la longueur (Run Length).`,
      `Nibble bas de 0x${fragments[0].header.toString(16).toUpperCase().padStart(2,'0')} = ${fragments[0].header & 0xF}. Lis ${fragments[0].header & 0xF} octet(s) en Little Endian après le header.`,
      `Octet(s) longueur : ${fragments[0].lenBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} → LE → <strong>${fragments[0].len} clusters</strong>`,
    ];
    explain = `Header 0x${fragments[0].header.toString(16).toUpperCase().padStart(2,'0')} → nibble bas=${fragments[0].header&0xF} → ${fragments[0].header&0xF} octet(s) longueur = ${fragments[0].lenBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} (LE) = ${fragments[0].len} clusters.`;
  } else {
    answer = String(fragments[0].lcn);
    qText = `À quel <strong>LCN (Logical Cluster Number)</strong> débute le premier fragment ?`;
    hints = [
      `Après le header et les octets longueur, les octets delta indiquent le LCN de départ (relatif au début pour le premier fragment).`,
      `Header 0x${fragments[0].header.toString(16).toUpperCase().padStart(2,'0')} → nibble haut=${fragments[0].header>>4} → ${fragments[0].header>>4} octet(s) de delta après les ${fragments[0].header&0xF} octet(s) de longueur.`,
      `Octets delta : ${fragments[0].delBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} → LE → <strong>${fragments[0].lcn}</strong>`,
    ];
    explain = `Octets delta du fragment 1 : ${fragments[0].delBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} (LE) = ${fragments[0].lcn}. (Delta relatif : premier fragment → LCN absolu.)`;
  }

  // Colorier les bytes par fragment
  const rows = [];
  for (let i = 0; i < allBytes.length; i += 16) {
    const slice = allBytes.slice(i, i+16);
    rows.push({ offset: i.toString(16).toUpperCase().padStart(8,'0'), bytes: slice });
  }

  // Build highlights
  const highlights = [];
  let pos = 0;
  fragments.forEach((f, fi) => {
    const colors = ['--cyan','--green','--gold','--purple'];
    highlights.push({from:pos, to:pos, color:'--gold', label:`Header F${fi+1}`});
    pos++;
    highlights.push({from:pos, to:pos+f.lenBytes.length-1, color:colors[fi%4], label:`Longueur F${fi+1}`});
    pos += f.lenBytes.length;
    highlights.push({from:pos, to:pos+f.delBytes.length-1, color:'--orange', label:`Delta F${fi+1}`});
    pos += f.delBytes.length;
  });
  highlights.push({from:pos, to:pos, color:'--dim', label:'Terminateur 0x00'});

  return {
    title: "NTFS — Décodage d'une Run List",
    category: "Système de fichiers",
    difficulty: "hard",
    scenario: `Dans un attribut <strong>$DATA</strong> non-résident d'un enregistrement MFT, tu trouves cette Run List.`,
    hexDump: renderHexDump(rows, highlights, {cols: 16, title: 'Run List dans attribut $DATA non-résident'}),
    question: qText,
    type: "number",
    answer,
    hints,
    explain,
    legend: `<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:.7rem;margin-top:.4rem">
      <span><span style="color:var(--gold)">■</span> Header</span>
      <span><span style="color:var(--cyan)">■</span> Longueur</span>
      <span><span style="color:var(--orange)">■</span> Delta LCN</span>
      <span><span style="color:var(--dim)">■</span> Terminateur</span>
    </div>`,
  };
}

// ── Exercice Bitmap exFAT ──
function makeBitmapExercise() {
  // Générer des octets bitmap réalistes avec des clusters occupés
  const bitmapOctets = Array.from({length:24}, () => rand(0,255));
  // Assurer qu'il y a au moins un octet non-FF
  let firstFreeOctetIdx = -1;
  for (let i = 0; i < bitmapOctets.length; i++) {
    if (bitmapOctets[i] !== 0xFF) { firstFreeOctetIdx = i; break; }
  }
  if (firstFreeOctetIdx === -1) {
    bitmapOctets[rand(4,12)] = rand(0, 254);
    for (let i = 0; i < bitmapOctets.length; i++) {
      if (bitmapOctets[i] !== 0xFF) { firstFreeOctetIdx = i; break; }
    }
  }

  // Trouver le premier bit libre
  let firstFreeCluster = -1;
  for (let i = 0; i < bitmapOctets.length; i++) {
    const b = bitmapOctets[i];
    for (let bit = 0; bit < 8; bit++) {
      if (!((b >> bit) & 1)) {
        firstFreeCluster = 2 + i * 8 + bit; // exFAT commence à 2
        break;
      }
    }
    if (firstFreeCluster >= 0) break;
  }

  const question = rand(0,1);
  let qText, answer, hints, explain;

  const firstFreeOctet = bitmapOctets[firstFreeOctetIdx];
  const firstFreeBit   = [...Array(8)].findIndex((_,b) => !((firstFreeOctet >> b) & 1));

  if (question === 0) {
    answer = String(firstFreeCluster);
    qText = `Quel est le numéro du <strong>premier cluster libre</strong> sur ce volume exFAT ?`;
    hints = [
      `En exFAT, la bitmap d'allocation est <strong>LSB first</strong> : le bit 0 de l'octet 0 correspond au cluster 2 (les clusters 0 et 1 sont réservés).`,
      `Un bit à <strong>1</strong> = cluster occupé. Un bit à <strong>0</strong> = cluster libre. Cherche le premier bit 0 en lisant de gauche à droite, bit 0 à bit 7 dans chaque octet.`,
      `Offset 0x${(firstFreeOctetIdx).toString(16).padStart(2,'0')} = <span style="color:var(--gold);font-weight:700">0x${firstFreeOctet.toString(16).toUpperCase().padStart(2,'0')}</span> = ${firstFreeOctet.toString(2).padStart(8,'0')}b. Le bit ${firstFreeBit} est à 0 → cluster ${2 + firstFreeOctetIdx*8 + firstFreeBit}.`,
    ];
    explain = `Octet ${firstFreeOctetIdx} = 0x${firstFreeOctet.toString(16).toUpperCase().padStart(2,'0')} = ${firstFreeOctet.toString(2).padStart(8,'0')}. Bit ${firstFreeBit} = 0 → cluster 2 + ${firstFreeOctetIdx}×8 + ${firstFreeBit} = <strong>${firstFreeCluster}</strong>.`;
  } else {
    const targetOctet = firstFreeOctetIdx;
    const hexVal = bitmapOctets[targetOctet].toString(16).toUpperCase().padStart(2,'0');
    answer = `0x${hexVal}`;
    qText = `L'offset <strong>0x${targetOctet.toString(16).toUpperCase().padStart(2,'0').padStart(4,'0')}</strong> de la bitmap correspond à quels clusters ? Donne la valeur hex de cet octet.`;
    hints = [
      `Chaque octet représente 8 clusters consécutifs. L'octet à l'offset N représente les clusters 2+N×8 à 2+N×8+7.`,
      `Offset 0x${targetOctet.toString(16)} → clusters ${2+targetOctet*8} à ${2+targetOctet*8+7}. Lis directement la valeur hex à cet offset.`,
      `L'octet est <span style="color:var(--gold);font-weight:700">0x${hexVal}</span> = ${bitmapOctets[targetOctet].toString(2).padStart(8,'0')}b. Les bits à 0 indiquent les clusters libres dans cette plage.`,
    ];
    explain = `Offset 0x${targetOctet.toString(16).padStart(4,'0')} = 0x${hexVal}. Représente les clusters ${2+targetOctet*8}-${2+targetOctet*8+7}.`;
    answer = hexVal;
  }

  const rows = [];
  for (let i = 0; i < bitmapOctets.length; i += 16) {
    const slice = bitmapOctets.slice(i, i+16);
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: slice,
    });
  }

  return {
    title: "exFAT — Analyse de la $Bitmap",
    category: "Système de fichiers",
    difficulty: "hard",
    scenario: `Tu examines la <strong>bitmap d'allocation</strong> ($Bitmap) d'un volume exFAT.`,
    hexDump: renderHexDump(rows, [
      {from: firstFreeOctetIdx, to: firstFreeOctetIdx, color:'--gold', label:'Premier octet avec cluster libre'},
    ], {cols: 16, title: '$Bitmap exFAT — chaque octet = 8 clusters (LSB first)'}),
    question: qText,
    type: "text",
    answer,
    hints,
    explain,
  };
}

// ── Exercice Entier signé Little Endian ──
function makeSignedLEExercise() {
  const bits = [16,24,32][rand(0,2)];
  const nBytes = bits / 8;
  const isNeg  = Math.random() > 0.4;
  const maxAbs = Math.min(Math.pow(2, bits-1)-1, 0xFFFFFF);
  const absVal = rand(256, maxAbs);
  const val    = isNeg ? -absVal : absVal;
  let raw = isNeg ? (Math.pow(2, bits) + val) : val;
  const leBytes = [];
  for (let i = 0; i < nBytes; i++) { leBytes.push(raw & 0xFF); raw >>= 8; }

  const context = rand(0,2);
  const scenarios = [
    `À l'offset <strong>0x1A</strong> d'un enregistrement MFT, tu trouves un entier <strong>signé ${bits} bits</strong> en Little Endian.`,
    `Dans un header de volume FAT, l'offset <strong>0x2C</strong> contient un entier <strong>signé ${bits} bits</strong> LE.`,
    `Lors d'une analyse de RAM dump, tu repères ces ${nBytes} octets correspondant à une valeur <strong>signée ${bits} bits</strong> LE.`,
  ];

  const row0 = { offset: '00000000', bytes: [...new Array(nBytes>1?rand(0,4):0).fill(0), ...leBytes, ...new Array(16-nBytes).fill(0)].slice(0,16) };

  return {
    title: `Entier signé ${bits} bits — Little Endian`,
    category: "Représentation des données",
    difficulty: bits === 16 ? "easy" : bits === 24 ? "medium" : "hard",
    scenario: scenarios[context],
    hexDump: `<div class="hex-display" style="gap:6px;margin:.5rem 0">
      ${leBytes.map(b => `<span class="hex-byte highlight">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`).join('')}
      <span class="hex-sep" style="margin-left:4px">(${nBytes} octets, LE)</span>
    </div>`,
    question: `Quelle est la <strong>valeur décimale signée</strong> de cet entier ${bits} bits ?`,
    type: "number",
    answer: String(val),
    hints: [
      `Inverser les octets (Little Endian) : ${[...leBytes].reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} → 0x${[...leBytes].reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join('')}`,
      isNeg
        ? `Le bit de poids fort est à 1 → nombre négatif. Appliquer le complément à 2 : complément de 0x${[...leBytes].reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join('')} sur ${bits} bits.`
        : `Le bit de poids fort est à 0 → nombre positif. Convertir directement en décimal.`,
      `Résultat : <strong>${val.toLocaleString('fr-CH')}</strong>`,
    ],
    explain: `Octets LE inversés : 0x${[...leBytes].reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join('')}${isNeg ? ` → négatif (complément à 2) → ${val}` : ` = ${val}`}`,
  };
}

// ── Exercice Représentation binaire ──
function makeBinaryExercise() {
  const mode = rand(0,3);
  let qText, answer, hints, explain, display;

  if (mode === 0) {
    // Hex → Binaire
    const val = rand(16, 255);
    const hex = val.toString(16).toUpperCase().padStart(2,'0');
    const bin = val.toString(2).padStart(8,'0');
    answer = bin;
    display = `<span class="hex-byte" style="font-size:1.1rem;padding:.4rem .8rem">0x${hex}</span>`;
    qText = `Donner la <strong>représentation binaire sur 8 bits</strong> de <span class="hex-byte">0x${hex}</span>`;
    hints = [
      `Chaque chiffre hexadécimal = 4 bits. ${hex[0]} (0x${hex[0]}) = ${parseInt(hex[0],16).toString(2).padStart(4,'0')} · ${hex[1]} (0x${hex[1]}) = ${parseInt(hex[1],16).toString(2).padStart(4,'0')}`,
      `${hex} = ${parseInt(hex[0],16)} × 16 + ${parseInt(hex[1],16)} = ${val}. ${val} en binaire = ?`,
      `Réponse : <strong>${bin}</strong> (vérif : ${bin.split('').map((b,i)=>b==='1'?Math.pow(2,7-i):0).reduce((a,b)=>a+b)} = ${val})`,
    ];
    explain = `0x${hex} = ${val} = <strong>${bin}</strong>. Méthode : ${hex[0]}→${parseInt(hex[0],16).toString(2).padStart(4,'0')}, ${hex[1]}→${parseInt(hex[1],16).toString(2).padStart(4,'0')}`;
  } else if (mode === 1) {
    // Binaire → Hex
    const val = rand(16, 255);
    const hex = val.toString(16).toUpperCase().padStart(2,'0');
    const bin = val.toString(2).padStart(8,'0');
    answer = hex;
    display = `<div class="bits-row" style="margin:.5rem 0">${bin.split('').map(b=>`<span class="bit bit-${b}">${b}</span>`).join('')}</div>`;
    qText = `Convertir ce nombre binaire 8 bits en <strong>hexadécimal</strong> :`;
    hints = [
      `Diviser en 2 groupes de 4 bits : ${bin.slice(0,4)} | ${bin.slice(4,8)}`,
      `${bin.slice(0,4)} = ${parseInt(bin.slice(0,4),2)} = 0x${parseInt(bin.slice(0,4),2).toString(16).toUpperCase()} · ${bin.slice(4,8)} = ${parseInt(bin.slice(4,8),2)} = 0x${parseInt(bin.slice(4,8),2).toString(16).toUpperCase()}`,
      `→ <strong>0x${hex}</strong>`,
    ];
    explain = `${bin} → ${bin.slice(0,4)}=${parseInt(bin.slice(0,4),2)} (0x${parseInt(bin.slice(0,4),2).toString(16).toUpperCase()}) | ${bin.slice(4,8)}=${parseInt(bin.slice(4,8),2)} (0x${parseInt(bin.slice(4,8),2).toString(16).toUpperCase()}) → <strong>0x${hex}</strong>`;
  } else if (mode === 2) {
    // Bits minimum pour N caractères
    const n = rand(3, 200);
    const bits = Math.ceil(Math.log2(n));
    answer = String(bits);
    display = `<div style="font-size:1.2rem;font-weight:700;color:var(--cyan);margin:.5rem 0">${n} caractères</div>`;
    qText = `Combien de <strong>bits minimum</strong> faut-il pour représenter <strong>${n} caractères distincts</strong> ?`;
    hints = [
      `Avec N bits, on peut représenter 2ᴺ combinaisons différentes. Il faut 2ᴺ ≥ ${n}.`,
      `2^${bits-1} = ${Math.pow(2,bits-1)} ${Math.pow(2,bits-1) < n ? `< ${n}` : `≥ ${n}`}. 2^${bits} = ${Math.pow(2,bits)} ${Math.pow(2,bits) >= n ? `≥ ${n}` : ``}. Donc ${bits} bits.`,
      `⌈log₂(${n})⌉ = <strong>${bits} bits</strong>`,
    ];
    explain = `2^${bits-1}=${Math.pow(2,bits-1)} < ${n} ≤ ${Math.pow(2,bits)}=2^${bits} → <strong>${bits} bits</strong> minimum.`;
  } else {
    // BCD
    const digits = [rand(0,9), rand(0,9), rand(0,9)];
    const bcd = digits.map(d => d.toString(2).padStart(4,'0')).join(' ');
    const dec = digits[0]*100 + digits[1]*10 + digits[2];
    answer = String(dec);
    display = `<code style="font-size:1rem;color:var(--cyan);letter-spacing:.12em">${bcd}</code>`;
    qText = `Quelle est la valeur en <strong>base 10</strong> de ce nombre en <strong>BCD</strong> ?`;
    hints = [
      `BCD (Binary Coded Decimal) : chaque groupe de 4 bits encode UN chiffre décimal (0–9).`,
      `${digits[0].toString(2).padStart(4,'0')} → ${digits[0]} · ${digits[1].toString(2).padStart(4,'0')} → ${digits[1]} · ${digits[2].toString(2).padStart(4,'0')} → ${digits[2]}`,
      `→ <strong>${dec}</strong>`,
    ];
    explain = `${bcd} → chiffres ${digits.join(', ')} → <strong>${dec}</strong>`;
  }

  return {
    title: "Représentation — Bases & Encodages",
    category: "Représentation des données",
    difficulty: "easy",
    scenario: "Exercice de représentation des données, fondamental en forensique numérique.",
    hexDump: display,
    question: qText,
    type: "text",
    answer,
    hints,
    explain,
  };
}

// ── Registre des générateurs ──
// ═══════════════════════════════════════════════════════════════
// EXERCICES D'EXAMEN — NOUVEAUX
// ═══════════════════════════════════════════════════════════════

// ── EX-EXAM-1 : FAT16 — Lire cluster + date dans une entrée SFN ──
function makeFAT16SFNExercise() {
  const le16 = v => [v & 0xFF, (v >> 8) & 0xFF];
  const le32 = v => [v & 0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  // Générer un cluster de départ réaliste pour FAT16
  const cluster = rand16(2, 255);
  // Générer une date FAT16 : bits 15-9=années depuis 1980, 8-5=mois, 4-0=jour
  const year  = rand16(10, 43); // 1990-2023
  const month = rand16(1, 12);
  const day   = rand16(1, 28);
  const dateWord = (year << 9) | (month << 5) | day;

  // Générer une taille de fichier
  const filesize = rand16(1024, 500000);

  // Construire les 32 octets SFN
  const sfn = new Array(32).fill(0);
  // Nom + extension
  const names = ['RAPPORT ', 'IMAGES  ', 'RAPPORT ', 'PHOTOS  ', 'DONNEES '];
  const exts  = ['TXT', 'JPG', 'PDF', 'DOC', 'XLS'];
  const ni = rand16(0, names.length-1);
  names[ni].split('').forEach((c,i) => sfn[i] = c.charCodeAt(0));
  exts[ni].split('').forEach((c,i) => sfn[8+i] = c.charCodeAt(0));
  sfn[0x0B] = 0x20; // archive
  // Date écriture at 0x18-0x19
  le16(dateWord).forEach((b,i) => sfn[0x18+i] = b);
  // Date création at 0x10-0x11 (même)
  le16(dateWord).forEach((b,i) => sfn[0x10+i] = b);
  // Cluster de départ at 0x1A-0x1B
  le16(cluster).forEach((b,i) => sfn[0x1A+i] = b);
  // Taille at 0x1C-0x1F
  le32(filesize).forEach((b,i) => sfn[0x1C+i] = b);

  const row0 = { offset: '00000000', bytes: sfn.slice(0,16) };
  const row1 = { offset: '00000010', bytes: sfn.slice(16,32) };

  const questionType = rand16(0,1);
  let qText, answer, hints, explain;

  const clusterHex = cluster.toString(16).toUpperCase().padStart(4,'0');
  const dateHex    = dateWord.toString(16).toUpperCase().padStart(4,'0');

  const monthNames = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

  if (questionType === 0) {
    // Demander le cluster de départ
    answer = clusterHex;
    qText = `Quel est le <strong>numéro de cluster de départ</strong> du fichier (en hexadécimal) ?`;
    hints = [
      `Le cluster de départ est aux offsets <strong>0x1A–0x1B</strong> sur 2 octets en Little Endian.`,
      `Lis les octets aux positions 0x1A et 0x1B (bytes 26-27 de l'entrée).`,
      `Octets = <span style="color:var(--cyan);font-weight:700">${sfn[0x1A].toString(16).toUpperCase().padStart(2,'0')} ${sfn[0x1B].toString(16).toUpperCase().padStart(2,'0')}</span> → Little Endian → inverse les deux octets.`,
      `Cluster = <strong>${clusterHex}</strong> (0x${sfn[0x1B].toString(16).toUpperCase()}${sfn[0x1A].toString(16).toUpperCase().padStart(2,'0')})`
    ];
    explain = `Offset 0x1A-0x1B = <code>${sfn[0x1A].toString(16).toUpperCase().padStart(2,'0')} ${sfn[0x1B].toString(16).toUpperCase().padStart(2,'0')}</code> → Little Endian → cluster <strong>0x${clusterHex}</strong> = ${cluster} déc.`;
  } else {
    // Demander la date
    answer = `${String(day).padStart(2,'0')} ${monthNames[month-1]} ${1980+year}`;
    qText = `Quelle est la <strong>date de création</strong> du fichier (jj mois aaaa) ? <em>Offset 0x10–0x11</em>`;
    hints = [
      `La date est encodée sur 2 octets à l'offset <strong>0x10–0x11</strong> en Little Endian.`,
      `Lis les 2 octets, inverse (LE), tu obtiens le mot de date (16 bits).`,
      `Mot de date = <span style="color:var(--gold);font-weight:700">0x${dateHex}</span> = ${dateWord} en décimal = ${dateWord.toString(2).padStart(16,'0')} en binaire.`,
      `Bits 15-9 = années depuis 1980 (${year} → ${1980+year}), bits 8-5 = mois (${month} = ${monthNames[month-1]}), bits 4-0 = jour (${day}).`,
      `Réponse : <strong>${String(day).padStart(2,'0')} ${monthNames[month-1]} ${1980+year}</strong>`
    ];
    explain = `0x${sfn[0x10].toString(16).toUpperCase().padStart(2,'0')} ${sfn[0x11].toString(16).toUpperCase().padStart(2,'0')} → LE → 0x${dateHex} = ${dateWord.toString(2).padStart(16,'0')} → année=${1980+year}, mois=${monthNames[month-1]}, jour=${day}.`;
  }

  return {
    title: 'FAT16 — Lecture d\'une entrée SFN',
    category: 'Système de fichiers FAT',
    difficulty: 'medium',
    scenario: `Tu analyses une entrée SFN (Short File Name) de 32 octets issue du répertoire racine d'une clé USB FAT16.`,
    hexDump: renderHexDump([row0, row1], [
      questionType === 0
        ? {from:0x1A,to:0x1B,color:'--cyan',label:'Cluster départ'}
        : {from:0x10,to:0x11,color:'--gold',label:'Date création'},
    ], {cols: 32, title: 'Entrée SFN (32 octets) — répertoire racine FAT16'}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">Layout SFN : <code>0x00–07</code> Nom · <code>0x08–0A</code> Ext · <code>0x0B</code> Attr · <code>0x10–11</code> Date créa · <code>0x18–19</code> Date écrit · <code>0x1A–1B</code> Cluster · <code>0x1C–1F</code> Taille</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-2 : FAT16 — Diagnostic Root Directory plein ──
function makeFAT16RootFullExercise() {
  // Générer un nombre d'entrées root aléatoire
  const rootCount = [64, 128, 224, 512][Math.floor(Math.random()*4)];

  // Simuler une entrée SFN normale au début du root dir
  const sfn = new Array(32).fill(0);
  'FICHIER '.split('').forEach((c,i) => sfn[i] = c.charCodeAt(0));
  'TXT'.split('').forEach((c,i) => sfn[8+i] = c.charCodeAt(0));
  sfn[0x0B] = 0x20;
  // Date quelconque
  [0x24, 0x58].forEach((b,i) => sfn[0x10+i] = b);
  // Taille 2 Ko
  [0x00, 0x08, 0x00, 0x00].forEach((b,i) => sfn[0x1C+i] = b);
  // Cluster
  [0x03, 0x00].forEach((b,i) => sfn[0x1A+i] = b);

  // Entrée qui semble vide (0xE5 = effacée, pas libre)
  const sfnDel = new Array(32).fill(0);
  sfnDel[0] = 0xE5; // effacée
  'ANCIEN  '.slice(1).split('').forEach((c,i) => sfnDel[i+1] = c.charCodeAt(0));
  'DOC'.split('').forEach((c,i) => sfnDel[8+i] = c.charCodeAt(0));
  sfnDel[0x0B] = 0x20;
  [0x02, 0x00].forEach((b,i) => sfnDel[0x1A+i] = b);
  [0x00, 0x10, 0x00, 0x00].forEach((b,i) => sfnDel[0x1C+i] = b);

  const row0 = { offset: '00000000', bytes: sfn.slice(0,16) };
  const row1 = { offset: '00000010', bytes: sfn.slice(16,32) };
  const row2 = { offset: '00000020', bytes: sfnDel.slice(0,16) };
  const row3 = { offset: '00000030', bytes: sfnDel.slice(16,32) };

  const q = Math.floor(Math.random()*2);
  let qText, answer, hints, explain;
  // Bug fix : la 2ème question (RootEntryCount) ne nécessite pas le dump SFN
  // → on affiche un dump différent (BPB) ou pas de dump du tout selon la question
  let useDump = true;

  if (q === 0) {
    // Fix #4 : la question demande maintenant la valeur hex du marqueur,
    // ce qui est cohérent avec la réponse "0xE5"
    answer = '0xe5';
    qText = `Dans le répertoire racine FAT16, quel est le <strong>code hexadécimal</strong> qui marque une entrée SFN comme <em>supprimée</em> (l'entrée visible à l'offset 0x20 a justement ce marqueur) ?`;
    hints = [
      `L'octet 0 d'une entrée SFN indique son état. Regarde le 1er octet à l'offset 0x20.`,
      `0x00 = fin du répertoire (aucune entrée valide après). Il existe un autre marqueur pour "supprimé".`,
      `Le marqueur est <strong>0xE5</strong> — entrée marquée comme supprimée (les données peuvent encore être récupérées par carving).`,
    ];
    explain = `<strong>0xE5</strong> = entrée supprimée. Les clusters et la taille sont souvent encore présents → récupération possible par file carving.`;
  } else {
    answer = String(rootCount);
    qText = `Un volume FAT16 a <strong>RootEntryCount = ${rootCount}</strong> (offset BPB 0x11). Combien d'entrées de fichiers/dossiers au maximum peut contenir ce répertoire racine ?`;
    hints = [
      `En FAT16, le Root Directory est de <strong>taille fixe</strong>. Il contient exactement RootEntryCount entrées de 32 octets chacune.`,
      `Taille total root dir = ${rootCount} × 32 = ${rootCount*32} octets.`,
      `Le nombre max d'entrées (fichiers + dossiers + LFN) = <strong>${rootCount}</strong>.`,
      `En FAT32, ce problème n'existe plus : le Root Dir est dynamique dans la zone de données.`,
    ];
    explain = `FAT16 Root Entry Count = ${rootCount} → maximum ${rootCount} entrées. Chaque LFN utilise 1 entrée supplémentaire par tranche de 13 caractères.`;
    useDump = false; // pas de dump SFN pour cette question — le sujet est le BPB
  }

  return {
    title: 'FAT16 — Répertoire Racine',
    category: 'Système de fichiers FAT',
    difficulty: 'easy',
    scenario: useDump
      ? `Extrait du répertoire racine d'une clé USB FAT16. Le 1er octet de l'entrée indique son statut. Le 2ème offset commence une entrée supprimée (0xE5).`
      : `Tu analyses le BPB d'un volume FAT16. Le champ <code>RootEntryCount</code> à l'offset 0x11 (LE 2 octets) vaut <strong>${rootCount}</strong>.`,
    hexDump: useDump
      ? renderHexDump([row0, row1, row2, row3], [
          {from:0x00, to:0x00, color:'--cyan', label:'État 1ère entrée'},
          {from:0x20, to:0x20, color:'--red',  label:'0xE5 = supprimée'},
        ], {cols: 32, title: 'Répertoire racine — 2 entrées SFN consécutives'})
      : '',
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-3 : NTFS — Identifier les attributs dans une entrée MFT ──
function makeNTFSMFTAttributeExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  // Attributs NTFS courants
  const ATTRS = {
    0x10: '$STANDARD_INFORMATION',
    0x30: '$FILE_NAME',
    0x40: '$OBJECT_ID',
    0x80: '$DATA',
    0x90: '$INDEX_ROOT',
    0xA0: '$INDEX_ALLOCATION',
    0xB0: '$BITMAP',
  };

  // Générer 3-4 attributs pour cet enregistrement MFT
  const attrSet = [0x10, 0x30, 0x80]; // standard, filename, data (toujours présents)
  if (Math.random() > 0.5) attrSet.push(0x40); // object id

  // Construire une représentation simplifiée de la MFT entry
  // Header MFT (16 octets simplifiés)
  const mft = [];

  // FILE signature
  [0x46,0x49,0x4C,0x45, 0x30,0x00, 0x03,0x00, 0x00,0x00,0x00,0x00,0x00,0x00, 0x01,0x00].forEach(b => mft.push(b));
  // Record flags + size
  [0x01,0x00, 0x00,0x01, 0x00,0x04, 0x00,0x00].forEach(b => mft.push(b));

  // Offset vers 1er attribut (0x38 typique)
  const attrStart = 0x38;
  [attrStart,0x00].forEach(b => mft.push(b));
  [0x00,0x00,0x00,0x00,0x00,0x00].forEach(b => mft.push(b));

  // Numéro d'entrée MFT
  const mftNum = rand16(100,9999);
  [mftNum & 0xFF, (mftNum>>8)&0xFF, 0x00, 0x00, 0x01, 0x00].forEach(b => mft.push(b));

  // Padding jusqu'à attrStart
  while (mft.length < attrStart) mft.push(0);

  // Encoder les attributs
  const attrOffsets = {};
  for (const aType of attrSet) {
    attrOffsets[aType] = mft.length;
    mft.push(aType); mft.push(0x00); mft.push(0x00); mft.push(0x00); // type
    const aLen = aType === 0x80 ? 0x48 : 0x38; // DATA plus long
    [aLen, 0x00, 0x00, 0x00].forEach(b => mft.push(b)); // length
    mft.push(aType === 0x80 ? 0x01 : 0x00); // non-resident flag (0x80 = non-résidant)
    mft.push(0x00); // name length
    [0x18, 0x00].forEach(b => mft.push(b)); // attr offset
    [0x00, 0x00].forEach(b => mft.push(b)); // flags
    [0x00, 0x00].forEach(b => mft.push(b)); // ID
    // Body simplifié
    const bodyLen = aLen - 0x10;
    for (let i=0; i<bodyLen; i++) mft.push(Math.floor(Math.random()*256));
  }
  // END marker
  [0xFF, 0xFF, 0xFF, 0xFF].forEach(b => mft.push(b));

  // Construire les rows pour affichage (max 6 rows = 96 octets)
  const rows = [];
  for (let i=0; i < Math.min(mft.length, 96); i+=16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: mft.slice(i, i+16).map(b => b || 0)
    });
  }

  // Question sur le type d'attribut
  const qAttrType = attrSet[rand16(0, attrSet.length-1)];
  const qOffset = attrOffsets[qAttrType];
  const attrTypeHex = qAttrType.toString(16).toUpperCase().padStart(2,'0');

  let qText, answer, hints, explain;
  const q = rand16(0,2);

  if (q === 0) {
    answer = ATTRS[qAttrType];
    qText = `À l'offset <strong>0x${qOffset.toString(16).toUpperCase()}</strong>, le type d'attribut commence par l'octet <span style="color:var(--cyan);font-weight:700">0x${attrTypeHex} 00 00 00</span>. Quel est le <strong>nom de cet attribut NTFS</strong> ?`;
    hints = [
      `Les attributs NTFS ont un type encodé sur 4 octets en Little Endian au début de chaque attribut.`,
      `0x10 = $STANDARD_INFORMATION · 0x30 = $FILE_NAME · 0x80 = $DATA · 0x90 = $INDEX_ROOT`,
      `Type 0x${attrTypeHex} = <strong>${ATTRS[qAttrType]}</strong>`,
    ];
    explain = `Type 0x${attrTypeHex} → <strong>${ATTRS[qAttrType]}</strong>. Chaque attribut commence par son type sur 4 octets LE.`;
  } else if (q === 1) {
    answer = 'FILE';
    qText = `Quels sont les <strong>4 premiers octets</strong> (signature) d'un enregistrement MFT valide ? (répondre en ASCII)`;
    hints = [
      `La signature MFT est visible aux offsets 0x00–0x03.`,
      `0x46 = 'F', 0x49 = 'I', 0x4C = 'L', 0x45 = 'E'`,
      `Signature = <strong>"FILE"</strong>`,
    ];
    explain = `Tout enregistrement MFT valide commence par la signature ASCII <strong>"FILE"</strong> (0x46 0x49 0x4C 0x45).`;
  } else {
    answer = 'NON RESIDENT';
    qText = `L'attribut <strong>$DATA</strong> (type 0x80) a son flag Non-Résident (offset 0x08 dans l'attribut) mis à <strong>0x01</strong>. Que signifie cela ?`;
    hints = [
      `Le flag Non-Résident est à l'offset 0x08 de chaque header d'attribut.`,
      `0x00 = Résident → les données sont <strong>dans l'enregistrement MFT lui-même</strong>.`,
      `0x01 = Non-Résident → les données sont dans la <strong>zone de données</strong>, pointées par une runlist.`,
      `Réponse : le contenu de l'attribut est stocké <strong>hors du MFT</strong> dans la zone de données.`,
    ];
    explain = `Non-Résident (flag=1) = les données de l'attribut sont trop grandes pour tenir dans le MFT. Une runlist (Data Runs) pointe vers les clusters de la zone de données.`;
  }

  return {
    title: 'NTFS — Enregistrement MFT',
    category: 'Système de fichiers NTFS',
    difficulty: 'hard',
    scenario: `Tu examines un enregistrement MFT de 1024 octets (extrait simplifié). La signature "FILE" confirme un enregistrement valide. Les attributs s'enchaînent après l'offset 0x38.`,
    hexDump: renderHexDump(rows, [
      {from:0x00, to:0x03, color:'--green',  label:'Signature FILE'},
      {from:attrOffsets[qAttrType], to:attrOffsets[qAttrType]+3, color:'--cyan', label:'Type attribut'},
    ], {cols: 16, title: `Enregistrement MFT (FILE record) — entrée n°${mftNum}`}),
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-4 : EXT3 — Lire l'inode d'une entrée de répertoire ──
function makeEXT3InodeExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;
  const le32   = v => [v & 0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];
  const le16   = v => [v & 0xFF, (v >> 8) & 0xFF];

  // Fichiers avec leurs inodes aléatoires
  const files = [
    { name: 'rapport_final.pdf', inode: rand16(10, 99), type: 0x01 },
    { name: 'image.jpg',          inode: rand16(100,999), type: 0x01 },
    { name: 'script.sh',          inode: rand16(10, 99), type: 0x01 },
  ];

  // Target = le 3ème fichier (fichier de vrai type)
  const target = files[rand16(0, files.length-1)];
  const targetInode = target.inode;

  // Construire le dump hex du répertoire EXT3
  // Structure ext3 dir_entry_2 : inode(4) + rec_len(2) + name_len(1) + file_type(1) + name(name_len)
  const buildEntry = (entry, isLast) => {
    const nameBytes = entry.name.split('').map(c => c.charCodeAt(0));
    const nameLen = nameBytes.length;
    // rec_len aligné sur 4 : minimum 8 + nameLen, padded to multiple of 4
    const minLen = 8 + nameLen;
    const recLen = isLast ? 128 : (Math.ceil(minLen/4)*4);
    const bytes = [
      ...le32(entry.inode),
      ...le16(recLen),
      nameLen,
      entry.type,
      ...nameBytes,
      ...new Array(recLen - 8 - nameLen).fill(0)
    ];
    return bytes;
  };

  // Construire un bloc de ~128 octets avec 2-3 entrées
  const entryBytes = [];
  const displayEntries = [
    { name: '.', inode: 2, type: 0x02 },
    { name: '..', inode: 2, type: 0x02 },
    target
  ];
  displayEntries.forEach((e, i) => {
    const isLast = i === displayEntries.length-1;
    entryBytes.push(...buildEntry(e, isLast));
  });

  // Rows hex (max 128 octets = 8 rows)
  const rows = [];
  for (let i=0; i < Math.min(entryBytes.length, 96); i+=16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: entryBytes.slice(i, i+16).map(b => b||0)
    });
  }

  // Trouver l'offset de l'inode du target dans le dump
  let targetOffset = 0;
  let pos = 0;
  for (let e of displayEntries) {
    if (e === target) { targetOffset = pos; break; }
    const nameLen = e.name.length;
    const minLen = 8 + nameLen;
    const recLen = Math.ceil(minLen/4)*4;
    pos += recLen;
  }

  const answer = String(targetInode);
  const qText = `Dans ce contenu de répertoire EXT3, à quel <strong>numéro d'inode</strong> dois-tu aller pour trouver les informations du fichier <strong>"${target.name}"</strong> ?`;
  const hints = [
    `En EXT3, le répertoire stocke pour chaque fichier : inode (4 octets LE) + rec_len (2 octets) + name_len (1 octet) + file_type (1 octet) + nom.`,
    `Les entrées "." et ".." viennent en premier. L'entrée "<strong>${target.name}</strong>" suit.`,
    `Les 4 premiers octets de l'entrée target sont <span style="color:var(--cyan);font-weight:700">${le32(targetInode).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</span> → LE → inode = <strong>${targetInode}</strong>.`,
    `Réponse : numéro d'inode = <strong>${targetInode}</strong>`,
  ];
  const explain = `Structure EXT3 dir_entry : 4 octets inode (LE) → ${le32(targetInode).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} → inode <strong>${targetInode}</strong> pour "${target.name}".`;

  return {
    title: 'EXT3 — Répertoire et Inodes',
    category: 'Système de fichiers EXT',
    difficulty: 'hard',
    scenario: `Tu examines un bloc de répertoire EXT3 en liste chaînée. Chaque entrée contient : inode (4 o LE), rec_len (2 o), name_len (1 o), file_type (1 o), puis le nom.`,
    hexDump: renderHexDump(rows, [
      {from: targetOffset, to: targetOffset+3, color:'--cyan', label:'Inode du fichier cible'},
    ], {cols: 16, title: 'Bloc de répertoire EXT3 — entrées en liste chaînée'}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">Structure dir_entry_2 EXT3 : [Inode 4o LE] [rec_len 2o] [name_len 1o] [type 1o] [nom]<br>file_type : 0x01 = fichier ordinaire · 0x02 = répertoire · 0x07 = symlink (spec ext2/3/4)</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-5 : HFS+ — Trouver le cluster de début (Extents Overflow) ──
function makeHFSPlusClusterExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  // Générer un numéro de cluster de départ pour un fichier HFS+
  const startBlock = rand16(0x100, 0xFFFF);
  const blockCount = rand16(10, 200); // nombre de blocs contigus
  const startBlockHex = startBlock.toString(16).toUpperCase().padStart(8,'0');
  // logicalSize = blocCount × blockSize (on simule blockSize = 4096 = 0x1000)
  const logicalSize = blockCount * 4096;
  // clumpSize typique : 0 (hint à l'implémentation, souvent 0)
  const clumpSize = 0;

  // HFS+ HFSPlusForkData (Apple TN1150) — Big Endian, 80 octets total :
  //   0x00-0x07 : logicalSize (UInt64 BE)
  //   0x08-0x0B : clumpSize   (UInt32 BE)
  //   0x0C-0x0F : totalBlocks (UInt32 BE)
  //   0x10-0x6F : 8 × HFSPlusExtentDescriptor (8 octets : startBlock + blockCount, tous 2 en BE)
  const forkBytes = [];

  // logicalSize UInt64 BE (8 octets) — valeur assez grande pour tenir dans 64 bits
  // On divise en 2 UInt32 pour gérer la taille côté JS (limite 32 bits sur shift)
  const logicalHi = Math.floor(logicalSize / 0x100000000); // partie haute
  const logicalLo = logicalSize % 0x100000000;              // partie basse
  forkBytes.push(
    (logicalHi>>>24)&0xFF, (logicalHi>>>16)&0xFF, (logicalHi>>>8)&0xFF, logicalHi&0xFF,
    (logicalLo>>>24)&0xFF, (logicalLo>>>16)&0xFF, (logicalLo>>>8)&0xFF, logicalLo&0xFF
  );
  // clumpSize UInt32 BE (4 octets)
  forkBytes.push(
    (clumpSize>>>24)&0xFF, (clumpSize>>>16)&0xFF, (clumpSize>>>8)&0xFF, clumpSize&0xFF
  );
  // totalBlocks UInt32 BE (4 octets)
  forkBytes.push(
    (blockCount>>>24)&0xFF, (blockCount>>>16)&0xFF, (blockCount>>>8)&0xFF, blockCount&0xFF
  );

  // Extent 0 (premier et seul) à l'offset 0x10
  forkBytes.push(
    (startBlock>>>24)&0xFF, (startBlock>>>16)&0xFF, (startBlock>>>8)&0xFF, startBlock&0xFF, // startBlock BE
    (blockCount>>>24)&0xFF, (blockCount>>>16)&0xFF, (blockCount>>>8)&0xFF, blockCount&0xFF  // blockCount BE
  );

  // 7 extents vides
  for (let i=0; i<7; i++) {
    forkBytes.push(0,0,0,0, 0,0,0,0);
  }

  // Padding jusqu'à 80 octets (5 × 16)
  while (forkBytes.length < 80) forkBytes.push(0);

  const rows = [];
  for (let i=0; i<80; i+=16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: forkBytes.slice(i, i+16)
    });
  }

  const answer = startBlockHex;
  const qText = `Ce HFSPlusForkData décrit un fichier occupant <strong>${blockCount} blocs dans un seul extent</strong>. À quel <strong>numéro de bloc de départ</strong> (startBlock du premier extent) se trouvent les données ? (en hexadécimal, 8 chiffres)`;
  const hints = [
    `En HFS+, les données sont organisées en "forks" (data fork + resource fork). Chaque fork est décrit par un HFSPlusForkData de 80 octets.`,
    `Structure HFSPlusForkData (Apple TN1150) : logicalSize (UInt64 BE, 8 o) + clumpSize (UInt32 BE, 4 o) + totalBlocks (UInt32 BE, 4 o) + 8 extents × 8 o.`,
    `Le premier extent commence à l'offset <strong>0x10</strong> (après les 16 octets d'en-tête). Il contient startBlock (4 o BE) puis blockCount (4 o BE).`,
    `Octets 0x10–0x13 = <span style="color:var(--cyan);font-weight:700">${[((startBlock>>>24)&0xFF),((startBlock>>>16)&0xFF),((startBlock>>>8)&0xFF),(startBlock&0xFF)].map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</span> → Big Endian → startBlock = <strong>0x${startBlockHex}</strong>`,
  ];
  const explain = `HFS+ utilise le Big Endian (contrairement à FAT/NTFS). Offset 0x10–0x13 = startBlock du premier extent = <strong>0x${startBlockHex}</strong> = ${startBlock} décimal.`;

  return {
    title: 'HFS+ — HFSPlusForkData (Catalog)',
    category: 'Système de fichiers HFS+',
    difficulty: 'hard',
    scenario: `Tu analyses un <strong>HFSPlusForkData</strong> issu du fichier Catalog (Apple TN1150). Ce format est en <strong>Big Endian</strong> (contrairement à FAT/NTFS). Le fichier tient dans un seul extent.`,
    hexDump: renderHexDump(rows, [
      {from:0x00, to:0x07, color:'--dim',  label:'logicalSize (UInt64 BE)'},
      {from:0x08, to:0x0B, color:'--dim',  label:'clumpSize (UInt32 BE)'},
      {from:0x0C, to:0x0F, color:'--gold', label:'totalBlocks (UInt32 BE)'},
      {from:0x10, to:0x13, color:'--cyan', label:'startBlock extent 0 (BE)'},
      {from:0x14, to:0x17, color:'--green',label:'blockCount extent 0 (BE)'},
    ], {cols: 16, title: 'HFSPlusForkData (80 octets, Big Endian) — Apple TN1150'}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">⚠️ HFS+ = <strong>Big Endian</strong> · Structure HFSPlusForkData (Apple TN1150) :<br>[logicalSize 8o BE][clumpSize 4o BE][totalBlocks 4o BE][extent0: startBlock 4o + blockCount 4o][extents 1-7…]</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-6 : FAT16 — Reconstruction d'un Long File Name (LFN) ──
// Inspiré de l'examen rattrapage 2023-2024 Q2a (fichier "Bear").
// Structure LFN : chaque entrée LFN (32 octets) porte l'attribut 0x0F à l'offset 0x0B.
//   - Offset 0x00 : numéro de séquence (bit 6 = 0x40 pour la DERNIÈRE entrée logique).
//   - Offsets 0x01–0x0A : 5 caractères UTF-16 LE (10 octets)
//   - Offsets 0x0E–0x19 : 6 caractères UTF-16 LE (12 octets)
//   - Offsets 0x1C–0x1F : 2 caractères UTF-16 LE (4 octets)
// Les entrées sont stockées à l'envers : la dernière entrée (bit 0x40) est en tête,
// puis #N-1, ... jusqu'à #1 juste avant le SFN.
function makeFAT16LFNExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  // Choisir un nom de fichier réaliste avec extension
  const names = [
    'Ma petite présentation finale.pptx',
    'Vacances été 2023 - Italie.jpg',
    'Rapport annuel intermédiaire.docx',
    'Photo famille Noël 2022.png',
    'Document confidentiel secret.pdf',
    'Sauvegarde clients janvier.xlsx',
    'Reçu dîner anniversaire Anne.pdf',
    'Mon super projet forensique.txt',
  ];
  const longName = names[rand16(0, names.length-1)];
  // Le LFN est terminé par 0x0000 et padde avec 0xFFFF
  // Chaque entrée LFN porte 13 caractères UTF-16
  const charsPerEntry = 13;
  const numEntries = Math.ceil((longName.length + 1) / charsPerEntry); // +1 pour le \0 terminal

  // Construire la séquence complète de caractères UTF-16 (code points ASCII simplifiés)
  const utf16 = [];
  for (const c of longName) utf16.push(c.charCodeAt(0));
  utf16.push(0x0000); // terminateur
  // Padder avec 0xFFFF jusqu'à numEntries * 13 caractères
  while (utf16.length < numEntries * charsPerEntry) utf16.push(0xFFFF);

  // Construire les entrées LFN (stockées du haut vers le bas : #N en premier, #1 en dernier)
  const lfnEntries = []; // tableau d'arrays de 32 octets
  for (let e = numEntries; e >= 1; e--) {
    const entry = new Array(32).fill(0x00);
    // Octet 0 : numéro de séquence, bit 6 (0x40) pour la dernière logique = #N
    entry[0] = (e === numEntries) ? (0x40 | e) : e;
    entry[0x0B] = 0x0F; // Attribut LFN
    entry[0x0C] = 0x00; // reserved
    entry[0x0D] = 0x00; // checksum (simplifié à 0 pour l'exo)
    entry[0x1A] = 0x00; entry[0x1B] = 0x00; // cluster first always 0 pour LFN

    // Les 13 caractères de cette entrée dans l'ordre logique
    // Entrée #e contient les chars [ (e-1)*13 .. e*13 [
    const charBase = (e - 1) * charsPerEntry;
    // 5 chars UTF-16 LE à l'offset 0x01-0x0A
    for (let i = 0; i < 5; i++) {
      const c = utf16[charBase + i];
      entry[0x01 + 2*i]     = c & 0xFF;
      entry[0x01 + 2*i + 1] = (c >> 8) & 0xFF;
    }
    // 6 chars UTF-16 LE à l'offset 0x0E-0x19
    for (let i = 0; i < 6; i++) {
      const c = utf16[charBase + 5 + i];
      entry[0x0E + 2*i]     = c & 0xFF;
      entry[0x0E + 2*i + 1] = (c >> 8) & 0xFF;
    }
    // 2 chars UTF-16 LE à l'offset 0x1C-0x1F
    for (let i = 0; i < 2; i++) {
      const c = utf16[charBase + 11 + i];
      entry[0x1C + 2*i]     = c & 0xFF;
      entry[0x1C + 2*i + 1] = (c >> 8) & 0xFF;
    }
    lfnEntries.push(entry);
  }

  // Construire une entrée SFN minimaliste qui suit les LFN
  const sfn = new Array(32).fill(0x00);
  // Short name = "BEAR    TXT" style (simplifié à partir du vrai nom)
  const base = longName.split('.')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) + '~1';
  const ext = (longName.split('.').pop() || 'TXT').toUpperCase().slice(0, 3).padEnd(3, ' ');
  for (let i = 0; i < 8; i++) sfn[i] = (base.charAt(i) || ' ').charCodeAt(0);
  for (let i = 0; i < 3; i++) sfn[8+i] = ext.charCodeAt(i);
  sfn[0x0B] = 0x20; // archive
  // Cluster + taille quelconques
  sfn[0x1A] = 0x08; sfn[0x1B] = 0x00;
  sfn[0x1C] = 0x00; sfn[0x1D] = 0x20; sfn[0x1E] = 0x00; sfn[0x1F] = 0x00;

  // Assembler les rows hex (toutes les LFN + le SFN, 32 octets = 2 rows de 16)
  const allBytes = [];
  lfnEntries.forEach(e => e.forEach(b => allBytes.push(b)));
  sfn.forEach(b => allBytes.push(b));

  const rows = [];
  for (let i = 0; i < allBytes.length; i += 16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: allBytes.slice(i, i+16)
    });
  }

  // Question : reconstituer le long nom du fichier
  const answer = longName;
  const qText = `Cette entrée de répertoire FAT contient un <strong>Long File Name (LFN)</strong> réparti sur <strong>${numEntries} entrée(s)</strong> de 32 octets, suivi d'une entrée SFN. Reconstitue le <strong>nom complet du fichier</strong> (extension comprise — accents, casse et espaces sont tolérés à la validation).`;
  const hints = [
    `Les entrées LFN ont l'attribut <strong>0x0F</strong> à l'offset 0x0B (facile à repérer).`,
    `Chaque entrée LFN porte 13 caractères en UTF-16 LE aux offsets : 0x01–0x0A (5 chars) + 0x0E–0x19 (6 chars) + 0x1C–0x1F (2 chars).`,
    `L'ordre physique est <strong>inverse</strong> de l'ordre logique : la 1ère entrée en mémoire porte le bit 0x40 sur son premier octet → c'est la <strong>dernière</strong> entrée logique (contient la fin du nom).`,
    `Lis les entrées à l'envers : assemble les caractères dans l'ordre #1, #2, …, #${numEntries}. Les octets <code>FF FF</code> = padding, <code>00 00</code> = terminateur.`,
    `Réponse : <strong>${longName}</strong>`,
  ];
  const explain = `LFN reconstruit : <strong>${longName}</strong>. Chaque entrée LFN se reconnaît à l'attribut 0x0F @ offset 0x0B. Ordre logique : entrée portant le bit 0x40 = dernière du nom ; les entrées précédentes contiennent le début. Encodage UTF-16 LE aux offsets 0x01 (5 chars), 0x0E (6 chars), 0x1C (2 chars).`;

  return {
    title: 'FAT16 — Reconstruction d\'un Long File Name (LFN)',
    category: 'Système de fichiers FAT',
    difficulty: 'hard',
    scenario: `Extrait du répertoire racine d'une clé USB FAT16. Le fichier porte un nom long (> 8.3), réparti sur plusieurs entrées LFN (attribut 0x0F) suivies d'une entrée SFN classique.`,
    hexDump: renderHexDump(rows, [
      {from:0x00, to:0x00, color:'--gold', label:'Seq # + bit 0x40 (dernière)'},
      {from:0x0B, to:0x0B, color:'--cyan', label:'Attr 0x0F = LFN'},
    ], {cols: 32, title: `LFN (${numEntries} entrée${numEntries>1?'s':''}) + SFN — 1 ligne = 1 entrée de 32 octets`}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">Structure entrée LFN (32 o) : [seq 1o][chars UTF-16 LE : 5 @ 0x01, 6 @ 0x0E, 2 @ 0x1C][attr=0x0F @ 0x0B]. Ordre physique inverse de l'ordre logique. Padding 0xFFFF, terminateur 0x0000.</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-7 : NTFS Run List — Total de clusters occupés ──
// Inspiré de l'examen Q8 (runlist "12 11 01 30 00" → combien de clusters ?).
// On génère une Run List à 2-4 fragments et on demande la SOMME des length.
function makeNTFSRunListTotalExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;
  const encodeVar = (val) => {
    if (val <= 0xFF)     return [val & 0xFF];
    if (val <= 0xFFFF)   return [val & 0xFF, (val >> 8) & 0xFF];
    if (val <= 0xFFFFFF) return [val & 0xFF, (val >> 8) & 0xFF, (val >> 16) & 0xFF];
    return [val & 0xFF, (val >> 8) & 0xFF, (val >> 16) & 0xFF, (val >> 24) & 0xFF];
  };

  // Générer 2 à 4 fragments
  const numFragments = rand16(2, 4);
  const fragments = [];
  let prevLCN = 0;
  for (let i = 0; i < numFragments; i++) {
    const length = rand16(1, 50);
    const delta  = rand16(1, 200);
    const lcn    = prevLCN + delta;
    prevLCN = lcn;
    fragments.push({ length, delta, lcn });
  }

  const totalClusters = fragments.reduce((s, f) => s + f.length, 0);

  // Encoder la Run List
  const allBytes = [];
  const fragBytes = fragments.map(f => {
    const lenBytes   = encodeVar(f.length);
    const deltaBytes = encodeVar(f.delta);
    const header     = (deltaBytes.length << 4) | lenBytes.length;
    return { header, lenBytes, deltaBytes, ...f };
  });
  fragBytes.forEach(f => {
    allBytes.push(f.header);
    f.lenBytes.forEach(b => allBytes.push(b));
    f.deltaBytes.forEach(b => allBytes.push(b));
  });
  allBytes.push(0x00); // terminator

  const hexStr = allBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');

  // Construction HTML : séquence hex colorée avec chaque fragment distinctivement coloré
  const colors = ['--cyan', '--green', '--gold', '--purple'];
  let hexDump = `<div class="hex-display" style="flex-wrap:wrap;gap:4px">`;
  let idx = 0;
  fragBytes.forEach((f, fi) => {
    const col = colors[fi % colors.length];
    // Header byte
    hexDump += `<span class="hex-byte" style="color:var(${col});font-weight:700" title="Header fragment ${fi+1}">${f.header.toString(16).toUpperCase().padStart(2,'0')}</span>`;
    idx++;
    // Length bytes
    f.lenBytes.forEach((b, j) => {
      hexDump += `<span class="hex-byte" style="color:var(${col});border:1px dashed rgba(255,255,255,.2)" title="Length fragment ${fi+1}, octet ${j+1}">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
      idx++;
    });
    // Delta bytes
    f.deltaBytes.forEach((b, j) => {
      hexDump += `<span class="hex-byte" style="color:var(${col});opacity:.6" title="Delta fragment ${fi+1}, octet ${j+1}">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
      idx++;
    });
    if (fi < fragBytes.length - 1) hexDump += `<span style="color:var(--dim);padding:0 4px">·</span>`;
  });
  hexDump += `<span class="hex-byte dim-byte" title="Terminator">00</span>`;
  hexDump += `</div>`;

  const answer = String(totalClusters);
  const fragDesc = fragBytes.map((f, i) => `fragment ${i+1} : ${f.length} clusters`).join(' · ');
  const calc = fragBytes.map(f => f.length).join(' + ');

  const qText = `Quel est le <strong>nombre total de clusters</strong> occupés par ce fichier ? (somme des longueurs de tous les fragments)`;
  const hints = [
    `Chaque fragment a un header : nibble haut = nb d'octets du delta LCN, nibble bas = nb d'octets de la longueur.`,
    `On se moque des deltas LCN pour ce calcul — ce qui compte, c'est la <strong>longueur</strong> (run length) de chaque fragment.`,
    `Les fragments détectés : ${fragDesc}.`,
    `Total = ${calc} = <strong>${totalClusters} clusters</strong>.`,
  ];
  const explain = `Total = ${calc} = <strong>${totalClusters} clusters</strong>. La Run List décrit ${numFragments} fragments, chacun avec sa propre longueur. Pour le total, on ignore les deltas LCN et on additionne uniquement les longueurs.`;

  return {
    title: 'NTFS Run List — Total de clusters du fichier',
    category: 'Système de fichiers NTFS',
    difficulty: 'medium',
    scenario: `Dans l'attribut <code>$DATA</code> non-résident d'une entrée MFT, tu trouves cette Run List. Le fichier est fragmenté sur ${numFragments} fragments.`,
    hexDump,
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">Run List : [header][length bytes][delta bytes] · 0x00 = fin. Header : nibble haut = taille delta, nibble bas = taille length. Les couleurs distinguent les fragments.</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-8 : exFAT — FirstCluster d'un fichier depuis son Stream Extension ──
// Inspiré de l'examen Q11 (cluster du fichier aBoire.txt).
// En exFAT, un fichier = 1 File Directory Entry (type 0x85) + 1 Stream Extension (type 0xC0)
// + 1+ File Name (type 0xC1). Le FirstCluster est dans le Stream Extension à l'offset 0x14 (4 octets LE).
function makeExFATDirentExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  const fileNames = ['rapport.txt', 'photo.jpg', 'notes.md', 'secret.pdf', 'archive.zip', 'config.ini', 'donnees.csv'];
  const fileName = fileNames[rand16(0, fileNames.length-1)];
  const firstCluster = rand16(0x04, 0xFFF); // cluster entre 4 et 4095 (valeurs lisibles)
  const fileSize     = rand16(100, 10000);
  const firstClusterHex = firstCluster.toString(16).toUpperCase().padStart(8,'0');

  // Construire les 3 entrées (3 × 32 octets = 96 octets)
  const bytes = new Array(96).fill(0x00);

  // === Entrée 1 : File Directory Entry (0x85) @ offset 0x00 ===
  bytes[0x00] = 0x85; // EntryType = File
  bytes[0x01] = 0x02; // SecondaryCount = 2 (stream + name)
  // Checksum (simplifié)
  bytes[0x02] = 0xC8; bytes[0x03] = 0x7D;
  // FileAttributes (0x20 = Archive, LE 2 octets)
  bytes[0x04] = 0x20; bytes[0x05] = 0x00;
  // Reserved1 (2 octets)
  // CreateTimestamp (4 octets LE)
  bytes[0x08] = 0x48; bytes[0x09] = 0x7B; bytes[0x0A] = 0x66; bytes[0x0B] = 0x2F;
  // LastModifiedTimestamp (4 octets LE)
  bytes[0x0C] = 0x48; bytes[0x0D] = 0x7B; bytes[0x0E] = 0x66; bytes[0x0F] = 0x2F;
  // LastAccessedTimestamp (4 octets LE)
  bytes[0x10] = 0x48; bytes[0x11] = 0x7B; bytes[0x12] = 0x66; bytes[0x13] = 0x2F;

  // === Entrée 2 : Stream Extension (0xC0) @ offset 0x20 ===
  bytes[0x20] = 0xC0; // EntryType = Stream Extension
  bytes[0x21] = 0x03; // GeneralSecondaryFlags
  // Reserved (1 byte) @ 0x22
  bytes[0x23] = fileName.length; // NameLength (nombre de chars UTF-16)
  // NameHash (2 octets)
  bytes[0x24] = 0xD9; bytes[0x25] = 0x7D;
  // Reserved (2 octets)
  // ValidDataLength (8 octets LE) @ 0x28
  bytes[0x28] = fileSize & 0xFF;
  bytes[0x29] = (fileSize >> 8) & 0xFF;
  bytes[0x2A] = (fileSize >> 16) & 0xFF;
  bytes[0x2B] = (fileSize >> 24) & 0xFF;
  // Reserved (4 octets) @ 0x30
  // FirstCluster (4 octets LE) @ 0x34  ← L'INFO CRITIQUE
  bytes[0x34] = firstCluster & 0xFF;
  bytes[0x35] = (firstCluster >> 8) & 0xFF;
  bytes[0x36] = (firstCluster >> 16) & 0xFF;
  bytes[0x37] = (firstCluster >> 24) & 0xFF;
  // DataLength (8 octets LE) @ 0x38
  bytes[0x38] = fileSize & 0xFF;
  bytes[0x39] = (fileSize >> 8) & 0xFF;
  bytes[0x3A] = (fileSize >> 16) & 0xFF;
  bytes[0x3B] = (fileSize >> 24) & 0xFF;

  // === Entrée 3 : File Name Extension (0xC1) @ offset 0x40 ===
  bytes[0x40] = 0xC1;
  bytes[0x41] = 0x00;
  // Nom en UTF-16 LE à partir de 0x42 (max 15 chars par entrée)
  for (let i = 0; i < fileName.length && i < 15; i++) {
    bytes[0x42 + 2*i]     = fileName.charCodeAt(i) & 0xFF;
    bytes[0x42 + 2*i + 1] = (fileName.charCodeAt(i) >> 8) & 0xFF;
  }

  // Rows pour affichage
  const rows = [];
  for (let i = 0; i < 96; i += 16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: bytes.slice(i, i+16)
    });
  }

  const answer = firstClusterHex;
  const hexBytes = `${bytes[0x34].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x35].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x36].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x37].toString(16).toUpperCase().padStart(2,'0')}`;

  const qText = `Dans quelle cluster se trouve le <strong>début des données</strong> du fichier <strong>"${fileName}"</strong> ? (numéro de cluster en hexadécimal, 8 chiffres)`;
  const hints = [
    `En exFAT, un fichier = 3 entrées : File (0x85) + Stream Extension (0xC0) + File Name (0xC1). Le FirstCluster est dans le Stream Extension.`,
    `Le type d'entrée est le 1er octet : 0x85 à l'offset 0x00 → File · 0xC0 à l'offset 0x20 → Stream Extension · 0xC1 à 0x40 → File Name.`,
    `Dans le Stream Extension, <strong>FirstCluster est à l'offset relatif 0x14</strong> (donc 0x20 + 0x14 = <strong>0x34 absolu</strong>) sur 4 octets en Little Endian.`,
    `Octets 0x34–0x37 = <span style="color:var(--cyan);font-weight:700">${hexBytes}</span> → Little Endian → inverse → <strong>0x${firstClusterHex}</strong> = ${firstCluster} décimal.`,
  ];
  const explain = `FirstCluster @ offset 0x34 (= 0x20 + 0x14 dans le Stream Extension) = <code>${hexBytes}</code> LE → <strong>0x${firstClusterHex}</strong> = ${firstCluster} décimal.`;

  return {
    title: 'exFAT — Cluster de départ d\'un fichier',
    category: 'Système de fichiers exFAT',
    difficulty: 'hard',
    scenario: `Tu analyses le répertoire racine d'une clé USB exFAT. Ces 3 entrées consécutives (96 octets) décrivent le fichier <strong>"${fileName}"</strong>. Retrouve son cluster de départ.`,
    hexDump: renderHexDump(rows, [
      {from:0x00, to:0x00, color:'--gold',  label:'0x85 = File Entry'},
      {from:0x20, to:0x20, color:'--green', label:'0xC0 = Stream Ext'},
      {from:0x34, to:0x37, color:'--cyan',  label:'FirstCluster (LE)'},
      {from:0x40, to:0x40, color:'--purple',label:'0xC1 = File Name'},
    ], {cols: 32, title: '3 entrées exFAT consécutives — 1 ligne = 1 entrée de 32 octets'}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">exFAT dirent : File (0x85) + Stream Extension (0xC0) + File Name (0xC1). FirstCluster @ Stream+0x14 = abs 0x34 (4 o LE). Nom à partir de 0x42 en UTF-16 LE.</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── Registre des générateurs ──
const EXAM_GENERATORS = [
  makeBootSectorExercise,
  makeRunListExercise,
  makeBitmapExercise,
  makeSignedLEExercise,
  makeBinaryExercise,
  makeFAT16SFNExercise,
  makeFAT16RootFullExercise,
  makeFAT16LFNExercise,              // ← NOUVEAU : LFN reconstruction (examen Q2a)
  makeNTFSMFTAttributeExercise,
  makeNTFSRunListTotalExercise,      // ← NOUVEAU : total clusters Run List (examen Q8)
  makeEXT3InodeExercise,
  makeExFATDirentExercise,           // ← NOUVEAU : FirstCluster exFAT (examen Q11)
  makeHFSPlusClusterExercise,
];

// État multi-indices
let _examHintIdx = 0;
let _examHints   = [];
let _examData    = null;

function genExamen() {
  _examHintIdx = 0;
  const gen = EXAM_GENERATORS[rand(0, EXAM_GENERATORS.length - 1)];
  _examData = gen();

  const d = _examData;
  _examHints = d.hints || [];

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-ex">📋</div>
      <div class="ex-title">${d.title}</div>
      <span class="ex-badge ${d.difficulty}">${d.difficulty}</span>
    </div>
    <div style="margin-bottom:.5rem;font-size:.7rem;color:var(--dim);font-family:var(--mono);background:rgba(48,232,138,.05);border:1px solid rgba(48,232,138,.15);border-radius:5px;padding:.3rem .7rem;display:inline-block">
      🧩 ${d.category}
    </div>
    <div class="ex-scenario">${d.scenario}</div>

    ${d.hexDump}
    ${d.legend || ''}

    <div class="sec-title" style="margin-top:.75rem">Question</div>
    <div style="font-size:.85rem;color:var(--text);line-height:1.6;margin-bottom:.75rem">${d.question}</div>

    <div class="ex-input-row">
      <input class="ex-input" id="inp-exam" placeholder="Votre réponse" autocomplete="off"
             style="max-width:200px" type="text">
      <button class="btn-hint" id="exam-hint-btn" onclick="nextExamHint()">💡 Indice (${_examHints.length})</button>
      <button class="btn-validate" onclick="checkExamen()">Valider ✓</button>
      <button class="btn-next" id="btn-next-ex" onclick="newExercise()" style="display:none">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="ex-feedback-ex"></div>
    <div id="exam-hint-display" style="margin-top:.5rem;display:none;padding:.65rem .9rem;background:rgba(240,192,64,.06);border:1px solid rgba(240,192,64,.2);border-radius:7px;font-size:.8rem;color:var(--text);line-height:1.6"></div>
  `;
  setTimeout(() => {
    const inp = div.querySelector('#inp-exam');
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') checkExamen(); });
  }, 50);
  return div;
}

function nextExamHint() {
  if (!_examHints.length) return;
  markHintUsed();
  const hdisplay = document.getElementById('exam-hint-display');
  const hbtn     = document.getElementById('exam-hint-btn');
  if (!hdisplay) return;

  const hint = _examHints[_examHintIdx];
  _examHintIdx = Math.min(_examHintIdx + 1, _examHints.length - 1);

  hdisplay.style.display = 'block';
  hdisplay.innerHTML = `<strong style="color:var(--gold)">Indice ${_examHintIdx} / ${_examHints.length} :</strong> ${hint}`;
  if (hbtn) hbtn.textContent = _examHintIdx < _examHints.length
    ? `💡 Indice suivant (${_examHints.length - _examHintIdx} restants)`
    : `💡 Tous les indices affichés`;
}

function checkExamen() {
  if (!_examData) return;
  const inp = document.getElementById('inp-exam');
  const fb  = document.getElementById('ex-feedback-ex');
  // Normalisation : insensible aux accents, à la casse, aux espaces, et au préfixe 0x
  const val = normAns(inp.value);
  const exp = normAns(_examData.answer);
  const ok  = val === exp;

  if (ok) {
    inp.className = 'ex-input correct';
    document.querySelector('.btn-validate').disabled = true;
    document.getElementById('btn-next-ex').style.display = 'block';
    document.querySelector('.ex-card').className = 'ex-card solved';
    document.getElementById('ex-num-ex').className = 'ex-num solved';
    fb.className = 'ex-feedback correct';
    fb.innerHTML = `✓ Correct ! ${_examData.explain}`;
    if (!STATE.hintUsed) incSolved(STATE.cat);
  } else {
    inp.className = 'ex-input wrong';
    fb.className  = 'ex-feedback wrong';
    fb.innerHTML  = `✗ Réponse incorrecte. Utilise 💡 Indice pour progresser étape par étape.`;
    breakStreak();
    setTimeout(() => inp.className='ex-input', 700);
  }
}



// ═══════════════════════════════════════════════════
// 17. CALCUL OFFSET FS (NTFS, FAT32, exFAT, EXT4, HFS+)
// ═══════════════════════════════════════════════════
function genOffset() {
  const fsType = rand(0, 4);

  const configs = [
    { // 0 — NTFS : offset de la $MFT
      name: 'NTFS', badge: 'MFT Offset',
      bps:     [512, 512, 4096][rand(0,2)],
      spc:     [4, 8, 16][rand(0,2)],
      mft_lcn: rand(2, 8),           // LCN petit pour des résultats lisibles
      color: 'var(--purple)',
      compute(bps, spc, mft_lcn) {
        const cs = bps * spc;
        const answer = mft_lcn * cs;
        return {
          answer,
          cs,
          question: `BPB NTFS — BytesPerSector = <strong>${bps}</strong>, SectorsPerCluster = <strong>${spc}</strong>, MFT LCN = <strong>${mft_lcn}</strong>.<br>Calculer l'offset de la <code>$MFT</code> en octets.`,
          steps: [
            `Taille cluster = ${bps} × ${spc} = ${cs} o`,
            `Offset $MFT = LCN × taille_cluster = ${mft_lcn} × ${cs} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    },
    { // 1 — FAT32 : offset d'un cluster dans la zone données
      name: 'FAT32', badge: 'Cluster Offset',
      bps:      512,
      spc:      [4, 8, 16][rand(0,2)],
      reserved: [32, 64][rand(0,1)],
      fat_size: rand(16, 64),        // FAT size petite pour des nombres raisonnables
      cluster_n: rand(3, 12),
      color: 'var(--green)',
      compute(bps, spc, reserved, fat_size, cluster_n) {
        const cs = bps * spc;
        const data_start = (reserved + 2 * fat_size) * bps;
        const answer = data_start + (cluster_n - 2) * cs;
        return {
          answer,
          cs,
          question: `FAT32 BPB — BPS=${bps}, SPC=${spc}, Réservés=${reserved} sect., FAT size=${fat_size} sect. (×2 FATs).<br>Calculer l'offset du cluster <strong>${cluster_n}</strong> en octets.`,
          steps: [
            `Taille cluster = ${bps} × ${spc} = ${cs} o`,
            `Début zone données = (${reserved} + 2×${fat_size}) × ${bps} = ${data_start} o`,
            `Offset cluster ${cluster_n} = ${data_start} + (${cluster_n}−2) × ${cs} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    },
    { // 2 — exFAT : offset d'un cluster
      name: 'exFAT', badge: 'Cluster Offset',
      bpss: [9, 9, 12][rand(0,2)],   // 512 ou 4096 o/sect
      spcs: [0, 3, 4][rand(0,2)],    // 1, 8, ou 16 sect/cluster
      heap_offset: rand(128, 512),   // plus petit que l'original
      cluster_n: rand(3, 10),
      color: 'var(--orange)',
      compute(bpss, spcs, heap_offset, cluster_n) {
        const bps = Math.pow(2, bpss);
        const cs  = Math.pow(2, spcs) * bps;
        const answer = heap_offset * bps + (cluster_n - 2) * cs;
        return {
          answer,
          cs,
          question: `exFAT BPB — BytesPerSectorShift=<strong>${bpss}</strong> (→${bps} o/sect), SectorsPerClusterShift=<strong>${spcs}</strong> (→${Math.pow(2,spcs)} sect/cluster), ClusterHeapOffset=<strong>${heap_offset}</strong> secteurs.<br>Calculer l'offset du cluster <strong>${cluster_n}</strong> en octets.`,
          steps: [
            `BPS = 2^${bpss} = ${bps} o`,
            `Taille cluster = 2^${spcs} × ${bps} = ${cs} o`,
            `Offset cluster ${cluster_n} = ${heap_offset}×${bps} + (${cluster_n}−2)×${cs} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    },
    { // 3 — EXT4 : offset d'un inode (cas simple : groupe 0)
      name: 'EXT4', badge: 'Inode Offset',
      blockSize:      [1024, 4096][rand(0,1)],
      inodesPerGroup: [512, 1024][rand(0,1)],  // plus petit = résultats lisibles
      inodeSize:      256,
      inode_n:        rand(2, 50),              // inodes petits → groupe 0 certain
      color: 'var(--blue)',
      compute(blockSize, inodesPerGroup, inodeSize, inode_n) {
        const group = Math.floor((inode_n - 1) / inodesPerGroup); // = 0 vu les petites valeurs
        const indexInGroup = (inode_n - 1) % inodesPerGroup;
        // En EXT4 : superbloc (1 bloc) + descripteurs (1 bloc) = 2 blocs avant l'inode table
        const inodeTableOffset = (group === 0 ? 2 : group * 8 + 2) * blockSize;
        const answer = inodeTableOffset + indexInGroup * inodeSize;
        return {
          answer,
          cs: blockSize,
          question: `EXT4 Superblock — blockSize=<strong>${blockSize}</strong> o, inodesPerGroup=<strong>${inodesPerGroup}</strong>, inodeSize=<strong>${inodeSize}</strong> o.<br>Calculer l'offset de l'inode <strong>${inode_n}</strong> en octets (groupe 0, inode table après 2 blocs de métadonnées).`,
          steps: [
            `Groupe = (${inode_n}−1) ÷ ${inodesPerGroup} = ${group}`,
            `Index dans groupe = (${inode_n}−1) mod ${inodesPerGroup} = ${indexInGroup}`,
            `Inode table = ${group===0?2:group*8+2} blocs × ${blockSize} = ${inodeTableOffset} o`,
            `Offset inode ${inode_n} = ${inodeTableOffset} + ${indexInGroup}×${inodeSize} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    },
    { // 4 — HFS+ : offset d'un allocation block
      name: 'HFS+', badge: 'Allocation Block Offset',
      blockSize: [4096, 8192][rand(0,1)],
      block_n:   rand(2, 30),          // petit → résultat lisible
      color: 'var(--gold)',
      compute(blockSize, block_n) {
        const answer = block_n * blockSize;
        return {
          answer,
          cs: blockSize,
          question: `HFS+ Volume Header — blockSize=<strong>${blockSize}</strong> o (allocation block).<br>Calculer l'offset du bloc <strong>${block_n}</strong> en octets.<br><span style="font-size:.75rem;color:var(--dim)">Note : en HFS+ les blocs commencent à 0, contrairement à FAT qui commence à 2.</span>`,
          steps: [
            `HFS+ : les blocs commencent à l\'index 0`,
            `Offset = ${block_n} × ${blockSize} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    }
  ];

  const cfg = configs[fsType];
  let data;
  if      (fsType === 0) data = cfg.compute(cfg.bps, cfg.spc, cfg.mft_lcn);
  else if (fsType === 1) data = cfg.compute(cfg.bps, cfg.spc, cfg.reserved, cfg.fat_size, cfg.cluster_n);
  else if (fsType === 2) data = cfg.compute(cfg.bpss, cfg.spcs, cfg.heap_offset, cfg.cluster_n);
  else if (fsType === 3) data = cfg.compute(cfg.blockSize, cfg.inodesPerGroup, cfg.inodeSize, cfg.inode_n);
  else                   data = cfg.compute(cfg.blockSize, cfg.block_n);

  const answer = data.answer;
  const cs     = data.cs || 512; // fallback safe

  // Distracteurs plausibles (jamais négatifs, jamais égaux à la bonne réponse)
  const rawDistractors = [
    answer + cs,
    answer - cs,
    Math.round(answer * 2),
    answer + 512,
  ].filter(d => d !== answer && d > 0);
  const distractors = [...new Set(rawDistractors)].sort(() => Math.random() - .5).slice(0, 3);
  const choices = [answer, ...distractors].sort(() => Math.random() - .5);
  const correctIdx = choices.indexOf(answer);

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.id = 'offset-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">📐</div>
      <div class="ex-title">Calcul d'offset — ${cfg.name}</div>
      <span class="ex-badge hard" style="color:${cfg.color}">${cfg.badge}</span>
    </div>
    <div class="ex-scenario">${data.question}</div>
    <div class="sec-title">Choisir l'offset correct</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.75rem" id="offset-choices">
      ${choices.map((c, i) => `
        <button class="tp-choice" data-correct="${i === correctIdx}" data-idx="${i}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${c.toLocaleString('fr-CH')} ${data.unit}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-offset"></div>
    <button class="btn-next" id="btn-next-offset" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  div.querySelectorAll('#offset-choices .tp-choice').forEach((b, i) => {
    b.addEventListener('click', () => {
      const isCorrect = b.dataset.correct === 'true';
      checkOffset(b, isCorrect, data.steps, answer);
    });
  });
  return div;
}

function checkOffset(btn, isCorrect, steps, answer) {
  document.querySelectorAll('#offset-choices .tp-choice').forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (isCorrect) { if (!STATE.hintUsed) incSolved('offset'); }
  else breakStreak();
  const fb = document.getElementById('ex-feedback-offset');
  if (fb) {
    fb.className = 'ex-feedback ' + (isCorrect ? 'correct' : 'wrong');
    const stepsHtml = steps.map(s => `<div style="font-size:.78rem;margin:.15rem 0;opacity:.9">→ ${s}</div>`).join('');
    fb.innerHTML = (isCorrect ? '✅ Correct !' : `❌ Réponse : ${answer.toLocaleString()} octets`) + stepsHtml;
    fb.style.display = 'block';
  }
  const next = document.getElementById('btn-next-offset');
  if (next) next.style.display = 'inline-block';
}

// ── Helper générique pour erreur de chargement ──
function genFallback(msg) {
  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `<div class="ex-header"><div class="ex-num">⚠️</div><div class="ex-title">${msg}</div></div>`;
  return div;
}

// ═══════════════════════════════════════════════════
// 18. TABLE HEX — "À quel offset se trouve X ?"
// ═══════════════════════════════════════════════════
const HEX_TABLE_EXERCISES = [
  {
    name: 'BPB FAT — SectorsPerCluster',
    scenario: 'Secteur de boot FAT32. Retrouve le champ SectorsPerCluster dans le BPB.',
    build: () => {
      const spc = [4,8,16][rand(0,2)];
      const bps = 512;
      const rsvd = [32,64][rand(0,1)];
      const bytes = new Array(64).fill(0);
      'MSDOS5.0'.split('').forEach((c,i) => bytes[3+i] = c.charCodeAt(0));
      bytes[0x0B] = bps & 0xFF; bytes[0x0C] = (bps>>8) & 0xFF;
      bytes[0x0D] = spc;
      bytes[0x0E] = rsvd & 0xFF; bytes[0x0F] = (rsvd>>8) & 0xFF;
      bytes[0x10] = 2; bytes[0x11] = 0x00; bytes[0x12] = 0x02;
      return { bytes, answer: '0D', answer_val: spc,
        hint1: 'Le BPB commence à 0x0B. BytesPerSector occupe 0x0B–0x0C (2 octets).',
        hint2: 'SectorsPerCluster est à 0x0B + 2 = <strong>0x0D</strong> (1 octet).',
        explain: `Offset <strong>0x0D</strong> = SectorsPerCluster = <strong>${spc}</strong>.` };
    }
  },
  {
    name: 'NTFS Boot — MFT LCN',
    scenario: 'Secteur de boot NTFS (64 octets). Retrouve le LCN de la $MFT.',
    build: () => {
      const mftLcn = rand(0x100, 0x4000);
      const bytes = new Array(64).fill(0);
      bytes[0]=0xEB; bytes[1]=0x52; bytes[2]=0x90;
      'NTFS    '.split('').forEach((c,i) => bytes[3+i] = c.charCodeAt(0));
      bytes[0x0B]=0x00; bytes[0x0C]=0x02; bytes[0x0D]=8;
      bytes[0x30] = mftLcn & 0xFF; bytes[0x31] = (mftLcn>>8) & 0xFF;
      bytes[0x32] = (mftLcn>>16) & 0xFF; bytes[0x33] = (mftLcn>>24) & 0xFF;
      return { bytes, answer: '30', answer_val: mftLcn,
        hint1: 'Le BPB NTFS a des champs spécifiques à partir de 0x28. 0x28 = TotalSectors (8 o).',
        hint2: 'MFT LCN est à 0x28 + 8 = <strong>0x30</strong> (8 octets Little Endian).',
        explain: `Offset <strong>0x30</strong> = MFT LCN = <strong>0x${mftLcn.toString(16).toUpperCase()}</strong> (${mftLcn}). Offset $MFT = LCN × TailleCluster.` };
    }
  },
  {
    name: 'SFN FAT — Cluster de départ',
    scenario: 'Entrée SFN (Short File Name) FAT, 32 octets. Retrouve le cluster de départ du fichier.',
    build: () => {
      const cluster = rand(3, 0x3FFF);
      const size = rand(512, 400000);
      const bytes = new Array(32).fill(0);
      'RAPPORT '.split('').forEach((c,i) => bytes[i] = c.charCodeAt(0));
      'TXT'.split('').forEach((c,i) => bytes[8+i] = c.charCodeAt(0));
      bytes[0x0B] = 0x20;
      bytes[0x1A] = cluster & 0xFF; bytes[0x1B] = (cluster>>8) & 0xFF;
      bytes[0x1C] = size & 0xFF; bytes[0x1D] = (size>>8) & 0xFF;
      bytes[0x1E] = (size>>16) & 0xFF; bytes[0x1F] = (size>>24) & 0xFF;
      return { bytes, answer: '1A', answer_val: cluster,
        hint1: 'Layout SFN : 0x00 nom(8) · 0x08 ext(3) · 0x0B attr · 0x0E–0x19 timestamps · 0x1A cluster · 0x1C taille.',
        hint2: 'Le cluster de départ est à l\'offset <strong>0x1A–0x1B</strong> (2 octets Little Endian).',
        explain: `Offset <strong>0x1A</strong> = cluster de départ = <strong>${cluster}</strong> (0x${cluster.toString(16).toUpperCase()}).` };
    }
  },
  {
    name: 'exFAT Boot — ClusterHeapOffset',
    scenario: 'Secteur de boot exFAT (64 premiers octets). Retrouve le champ ClusterHeapOffset.',
    build: () => {
      const heapOff = rand(300, 700);
      const bytes = new Array(64).fill(0);
      bytes[0]=0xEB; bytes[1]=0x76; bytes[2]=0x90;
      'EXFAT   '.split('').forEach((c,i) => bytes[3+i] = c.charCodeAt(0));
      bytes[0x6C % 64] = 9; bytes[0x6D % 64] = 3;
      bytes[0x58 % 64] = heapOff & 0xFF; bytes[0x59 % 64] = (heapOff>>8) & 0xFF;
      return { bytes, answer: '18', answer_val: heapOff,
        hint1: 'En exFAT, les champs du BPB sont différents de FAT32. Cherche "EXFAT" à l\'offset 0x03.',
        hint2: 'ClusterHeapOffset est à l\'offset <strong>0x58</strong> (absolu dans le secteur). Dans nos 64 octets affichés : 0x18.',
        explain: `Offset <strong>0x58</strong> (0x18 dans cet extrait) = ClusterHeapOffset = <strong>${heapOff}</strong> secteurs.` };
    }
  },
  {
    name: 'EXT4 Superbloc — s_inodes_per_group',
    scenario: 'Début du superbloc EXT4 (offset 1024 du volume). Retrouve s_inodes_per_group.',
    build: () => {
      const ipg = [1024,2048,4096,8192][rand(0,3)];
      const bytes = new Array(64).fill(0);
      const total = ipg * rand(10,50);
      bytes[0]=total&0xFF; bytes[1]=(total>>8)&0xFF; bytes[2]=(total>>16)&0xFF; bytes[3]=(total>>24)&0xFF;
      bytes[0x28%64]=ipg&0xFF; bytes[0x29%64]=(ipg>>8)&0xFF;
      bytes[0x38%64]=0xEF; bytes[0x39%64]=0x53;
      return { bytes, answer: '28', answer_val: ipg,
        hint1: 'Le superbloc EXT est à l\'offset 1024. s_magic (EF 53) est à 0x38. Les compteurs sont en début de structure.',
        hint2: 's_inodes_per_group est à l\'offset <strong>0x28</strong> (4 octets Little Endian).',
        explain: `Offset <strong>0x28</strong> = s_inodes_per_group = <strong>${ipg}</strong>. Formule groupe : (inode-1) ÷ ${ipg}.` };
    }
  }
];

let _hexTableIdx = 0;
let _hexTableHintStep = 0;

function genHexTable() {
  const cfg = HEX_TABLE_EXERCISES[_hexTableIdx % HEX_TABLE_EXERCISES.length];
  _hexTableIdx++;
  _hexTableHintStep = 0;
  const ex = cfg.build();
  const bytes = ex.bytes;

  // Utiliser renderHexDump (avec en-tête de colonnes) — 16 colonnes pour BPB
  const dumpRows = [{ offset: '00000000', bytes: bytes }];
  // Highlight de l'octet correct (sera révélé après réponse)
  const dumpHTML = renderHexDump(dumpRows, [], {cols: 16, title: cfg.name});

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🗺</div>
      <div class="ex-title">Table Hex — ${cfg.name}</div>
      <span class="ex-badge hard">Offset</span>
    </div>
    <div class="ex-scenario">${cfg.scenario}</div>
    ${dumpHTML}
    <div class="sec-title" style="margin-top:.75rem">À quel offset (hex) se trouve le champ demandé ?</div>
    <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin-bottom:.5rem">
      <span style="font-size:.8rem;color:var(--muted)">0x</span>
      <input class="ex-input" id="inp-hextable" placeholder="ex: 0D" maxlength="4" style="width:90px;text-transform:uppercase" autocomplete="off">
      <button class="btn-hint" id="ht-hint-btn">💡 Indice</button>
      <button class="btn-validate" id="ht-validate-btn">Valider ✓</button>
      <button class="btn-next" id="btn-next-ht" onclick="newExercise()" style="display:none">Exercice suivant →</button>
    </div>
    <div class="hint-box" id="hint-ht" style="display:none"></div>
    <div class="ex-feedback" id="ex-feedback-ht" style="display:none"></div>
  `;
  setTimeout(() => {
    const inp = div.querySelector('#inp-hextable');
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') div.querySelector('#ht-validate-btn').click(); });
    const hintBtn = div.querySelector('#ht-hint-btn');
    if (hintBtn) hintBtn.addEventListener('click', () => showHexTableHint(ex.hint1, ex.hint2));
    const validateBtn = div.querySelector('#ht-validate-btn');
    if (validateBtn) validateBtn.addEventListener('click', () => checkHexTable(ex.answer, ex.explain, ex.answer_val));
  }, 50);
  return div;
}

function showHexTableHint(h1, h2) {
  _hexTableHintStep++;
  const box = document.getElementById('hint-ht');
  if (!box) return;
  box.innerHTML = `💡 <strong>Indice ${_hexTableHintStep} :</strong> ${_hexTableHintStep===1?h1:h2}`;
  box.style.display = 'block';
  if (_hexTableHintStep >= 2) {
    const btn = document.getElementById('ht-hint-btn');
    if (btn) { btn.disabled = true; btn.textContent = '✅ Indices épuisés'; }
  }
}

function checkHexTable(correctOff, explain, val) {
  const inp = document.getElementById('inp-hextable');
  const fb  = document.getElementById('ex-feedback-ht');
  const nx  = document.getElementById('btn-next-ht');
  if (!inp) return;
  const raw = inp.value.trim().replace(/^0x/i,'').toUpperCase().padStart(2,'0');
  const isOk = raw === correctOff.toUpperCase().padStart(2,'0');
  inp.className = 'ex-input ' + (isOk ? 'correct' : 'wrong');
  if (isOk) {
    if (!STATE.hintUsed) incSolved('hextable');
  } else {
    breakStreak();
  }
  if (fb) {
    fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
    fb.innerHTML = isOk ? `✅ ${explain}` : `❌ L'offset correct est <strong>0x${correctOff}</strong> (valeur = ${val}) — ${explain}`;
    fb.style.display = 'block';
  }
  if (nx) nx.style.display = 'inline-block';
}

// ═══════════════════════════════════════════════════
// 19. IDENTIFIER LE SYSTÈME DE FICHIERS
// ═══════════════════════════════════════════════════
function genFSIdentify() {
  const ALL_FS = ['FAT12','FAT16','FAT32','NTFS','exFAT','EXT4','HFS+'];

  const fsOptions = [
    {
      fs: 'FAT12',
      context: 'Secteur de boot — disquette ou très petite partition',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x3C; bytes[2]=0x90;
        'MSDOS5.0'.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0));
        bytes[0x0B]=0x00; bytes[0x0C]=0x02; // BPS=512
        bytes[0x0D]=0x01;                    // SPC=1
        bytes[0x0E]=0x01; bytes[0x0F]=0x00; // Reserved=1
        bytes[0x10]=0x02;                    // NumFATs=2
        bytes[0x11]=0xE0; bytes[0x12]=0x00; // RootEntries=224
        bytes[0x13]=0x40; bytes[0x14]=0x0B; // TotalSectors16=2880
        bytes[0x15]=0xF0;                    // Media=0xF0 (removable)
        bytes[0x16]=0x09; bytes[0x17]=0x00; // FATsize=9
        // FS type label à 0x36
        if (0x36+8 <= 64) 'FAT12   '.split('').forEach((c,i)=>bytes[0x36+i]=c.charCodeAt(0));
        return { bytes, key: 'OEM "MSDOS5.0" + RootEntries=224 + MediaType=0xF0 (amovible) + label "FAT12   " à 0x36 → FAT12 (disquette 1.44 Mo).' };
      }
    },
    {
      fs: 'FAT16',
      context: 'Secteur de boot — partition entre 32 Mo et 2 Go',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x58; bytes[2]=0x90;
        'MSDOS5.0'.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0));
        bytes[0x0B]=0x00; bytes[0x0C]=0x02; // BPS=512
        bytes[0x0D]=0x04;                    // SPC=4
        bytes[0x0E]=0x04; bytes[0x0F]=0x00; // Reserved=4
        bytes[0x10]=0x02;                    // NumFATs=2
        bytes[0x11]=0x00; bytes[0x12]=0x02; // RootEntries=512
        bytes[0x13]=0x00; bytes[0x14]=0x00; // TotalSectors16=0 → utiliser TotalSectors32
        bytes[0x15]=0xF8;                    // Media=0xF8 (fixe)
        bytes[0x16]=0xFA; bytes[0x17]=0x00; // FATsize=250
        if (0x36+8 <= 64) 'FAT16   '.split('').forEach((c,i)=>bytes[0x36+i]=c.charCodeAt(0));
        return { bytes, key: 'RootEntries=512 (0x0200) aux offsets 0x11-0x12 ≠ 0, label "FAT16   " à 0x36 → FAT16. MediaType=0xF8 = partition fixe.' };
      }
    },
    {
      fs: 'FAT32',
      context: 'Secteur de boot — partition > 2 Go (carte SD, USB, HDD)',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x58; bytes[2]=0x90;
        'MSWIN4.1'.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0));
        bytes[0x0B]=0x00; bytes[0x0C]=0x02; // BPS=512
        bytes[0x0D]=0x08;                    // SPC=8
        bytes[0x0E]=0x20; bytes[0x0F]=0x00; // Reserved=32
        bytes[0x10]=0x02;                    // NumFATs=2
        bytes[0x11]=0x00; bytes[0x12]=0x00; // RootEntries=0 → FAT32 !
        bytes[0x13]=0x00; bytes[0x14]=0x00; // TotalSectors16=0
        bytes[0x15]=0xF8;                    // Media=0xF8
        bytes[0x16]=0x00; bytes[0x17]=0x00; // FATSz16=0 → voir FAT32 BPB étendu
        return { bytes, key: 'OEM "MSWIN4.1" + RootEntryCount=0 (offsets 0x11-0x12) + FATSz16=0 → FAT32. Le répertoire racine est dans la zone données (cluster 2+).' };
      }
    },
    {
      fs: 'NTFS',
      context: 'Boot sector NTFS — partition Windows moderne',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x52; bytes[2]=0x90;
        'NTFS    '.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0)); // 4 espaces !
        bytes[0x0B]=0x00; bytes[0x0C]=0x02; // BPS=512
        bytes[0x0D]=0x08;                    // SPC=8
        bytes[0x0E]=0x00; bytes[0x0F]=0x00; // Reserved=0 (NTFS n'utilise pas ce champ)
        bytes[0x10]=0x00;                    // NumFATs=0
        bytes[0x11]=0x00; bytes[0x12]=0x00; // RootEntries=0
        bytes[0x13]=0x00; bytes[0x14]=0x00; // TotalSectors16=0
        bytes[0x15]=0xF8;
        return { bytes, key: 'OEM ID "NTFS    " (exactement 4 espaces) à l\'offset 0x03 identifie NTFS. NumFATs=0 et Reserved=0 confirment (NTFS ignore le BPB standard).' };
      }
    },
    {
      fs: 'exFAT',
      context: 'Boot sector exFAT — clés USB/SDXC > 32 Go',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x76; bytes[2]=0x90;
        'EXFAT   '.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0)); // 3 espaces
        // offsets 0x0B à 0x3F DOIVENT être à zéro en exFAT
        // (déjà à 0 grâce à fill(0))
        bytes[0x40]=0x00; bytes[0x41]=0x00; // VolumeSerialNumber lo
        bytes[0x42]=0x01; bytes[0x43]=0x00; // (simulé)
        return { bytes, key: '"EXFAT   " (3 espaces) à l\'offset 0x03 + octets 0x0B–0x3F tous à zéro = signature exFAT. BPS et SPC utilisent des champs décalés (0x6C+).' };
      }
    },
    {
      fs: 'EXT4',
      context: 'Superbloc EXT4 — commence à l\'offset 1024 du volume',
      build: () => {
        const bytes = new Array(128).fill(0x00);
        // s_inodes_count (LE32) à 0x00
        bytes[0]=0x00; bytes[1]=0x80; bytes[2]=0x00; bytes[3]=0x00; // 32768 inodes
        // s_blocks_count (LE32) à 0x04
        bytes[4]=0x00; bytes[5]=0x00; bytes[6]=0x04; bytes[7]=0x00; // 262144 blocs
        // s_log_block_size (LE32) à 0x18 : 2 → blocksize=4096
        bytes[0x18]=0x02; bytes[0x19]=0x00; bytes[0x1A]=0x00; bytes[0x1B]=0x00;
        // s_magic (LE16) à 0x38 : 0xEF53 → 53 EF en mémoire
        bytes[0x38]=0x53; bytes[0x39]=0xEF;
        // s_rev_level à 0x3C : 1 = dynamic (EXT3/4)
        bytes[0x3C]=0x01; bytes[0x3D]=0x00; bytes[0x3E]=0x00; bytes[0x3F]=0x00;
        // s_uuid (16 octets) à 0x68 — UUID unique du système de fichiers
        // Permet d'identifier ce volume précis (utilisé dans /etc/fstab)
        // On génère un UUID v4 simulé : 4 octets random pour le rendre déterministe par boot
        const uuidBytes = [0xA3, 0xF8, 0x12, 0x6E, 0x4B, 0x1C, 0x4D, 0x9A,
                           0xB7, 0x55, 0xE2, 0x91, 0x44, 0x8F, 0x2C, 0x6D];
        uuidBytes.forEach((u, i) => bytes[0x68 + i] = u);
        return {
          bytes,
          key: 'Magic 0xEF53 (53 EF en Little Endian) à l\'offset 0x38 du superbloc (offset 1024 du volume) identifie EXT2/3/4. s_log_block_size=2 → taille bloc = 4096 o. L\'UUID à 0x68 (16 octets) identifie ce volume précis — utilisé par /etc/fstab et blkid.'
        };
      }
    },
    {
      fs: 'HFS+',
      context: 'Volume Header HFS+ — commence à l\'offset 1024 du volume (Big Endian)',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        // signature 0x482B = 'H+' en Big Endian
        bytes[0]=0x48; bytes[1]=0x2B;
        // version = 4 (HFS+) en Big Endian
        bytes[2]=0x00; bytes[3]=0x04;
        // attributes (Big Endian) à 0x04
        bytes[4]=0x00; bytes[5]=0x00; bytes[6]=0x80; bytes[7]=0x00;
        // blockSize (Big Endian) à 0x14 = 4096 = 0x00001000
        bytes[0x14]=0x00; bytes[0x15]=0x00; bytes[0x16]=0x10; bytes[0x17]=0x00;
        // totalBlocks (Big Endian) à 0x18
        bytes[0x18]=0x00; bytes[0x19]=0x10; bytes[0x1A]=0x00; bytes[0x1B]=0x00;
        return { bytes, key: 'Signature 0x482B ("H+") en Big Endian à l\'offset 0 du Volume Header (= offset 1024 du volume). Tout HFS+ est Big Endian, contrairement aux FS Windows. Version=4.' };
      }
    }
  ];

  const cfg = fsOptions[rand(0, fsOptions.length - 1)];
  const ex = cfg.build();
  const bytes = ex.bytes;

  // Garantir que la bonne réponse est toujours dans les choix
  const others = ALL_FS.filter(f => f !== cfg.fs).sort(() => Math.random() - .5).slice(0, 4);
  const choices = [...others, cfg.fs].sort(() => Math.random() - .5);

  // Pourquoi chaque mauvais choix est faux dans ce contexte particulier
  const WRONG_REASONS = {
    'FAT12': "FAT12 a un MediaType 0xF0 (amovible), RootEntries=224 (typique disquette 1.44 Mo), et un label 'FAT12' à 0x36. Aucune de ces signatures n'est ici.",
    'FAT16': "FAT16 a RootEntries entre 1 et 65535 (≠ 0) à 0x11–0x12 et un label 'FAT16' à 0x36. Manquant ici.",
    'FAT32': "FAT32 a RootEntryCount=0 (signature distinctive) à 0x11–0x12 et FATSz16=0 à 0x16. Le BPB étendu commence à 0x24.",
    'NTFS':  "NTFS a OEM ID 'NTFS    ' (avec 4 espaces) à 0x03 et NumFATs=0 à 0x10. Le boot n'utilise pas le BPB FAT classique.",
    'exFAT': "exFAT a OEM ID 'EXFAT   ' (3 espaces) à 0x03 et tous les octets de 0x0B à 0x3F sont à 0 (champs déplacés à 0x6C+).",
    'EXT4':  "EXT4 commence à offset 1024 du volume (superbloc), magic 0xEF53 à offset 0x38. Pas de BPB classique en début.",
    'HFS+':  "HFS+ commence à offset 1024 du volume, signature 0x482B ('H+') en Big Endian à offset 0x00 du Volume Header.",
  };

  // Utilise le nouveau renderer 16 cols avec en-tête
  const dumpRows = [{ offset: '00000000', bytes: bytes }];
  const dumpHTML = renderHexDump(dumpRows, [], {cols: 16, title: '64 premiers octets — secteur de boot ou superbloc'});

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🔍</div>
      <div class="ex-title">Identifier le système de fichiers</div>
      <span class="ex-badge medium">OEM ID · Magic · BPB</span>
    </div>
    <div class="ex-scenario">
      <strong>Contexte :</strong> ${cfg.context}<br>
      Analyse les 64 premiers octets ci-dessous et identifie le système de fichiers.
    </div>
    ${dumpHTML}
    <div class="sec-title" style="margin-top:.75rem">Système de fichiers</div>
    <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="fsid-choices">
      ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:90px"
        data-correct="${c === cfg.fs}"
        data-fs="${escAttr(c)}"
        data-wrong-reason="${encData(WRONG_REASONS[c] || '')}"
        data-correct-explain="${encData(ex.key)}">${c}</button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-fsid" style="display:none"></div>
    <button class="btn-next" id="btn-next-fsid" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#fsid-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        const wrongReason = decData(b.dataset.wrongReason) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        checkFSIdentify(b, isOk, correctEx, wrongReason, cfg.fs);
      });
    });
  }, 0);
  return div;
}

function checkFSIdentify(btn, isOk, correctExplain, wrongReason, correctFs) {
  document.querySelectorAll('#fsid-choices .tp-choice').forEach(b => { b.disabled = true; });
  btn.classList.add(isOk ? 'correct' : 'wrong');
  if (isOk) {
    if (!STATE.hintUsed) incSolved('fsidentify');
  } else {
    breakStreak();
    document.querySelectorAll('#fsid-choices .tp-choice').forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
      else if (b !== btn) b.classList.add('dim');
    });
  }
  const fb = document.getElementById('ex-feedback-fsid');
  if (fb) {
    fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
    const wrongFull = isOk
      ? ''
      : `${wrongReason ? wrongReason + ' ' : ''}La bonne réponse est <strong>${correctFs}</strong>.`;
    fb.innerHTML = formatChoiceFeedback(isOk, correctExplain, wrongFull);
    fb.style.display = 'block';
  }
  document.getElementById('btn-next-fsid').style.display = 'inline-block';
}

// ═══════════════════════════════════════════════════
// 20. HASH & INTÉGRITÉ
// ═══════════════════════════════════════════════════
const HASH_SAMPLES = {
  'MD5':     { bits:128, len:32,  note:'128 bits → 32 hex chars. Collisions connues — insuffisant seul en forensique (RFC 6151).' },
  'SHA-1':   { bits:160, len:40,  note:'160 bits → 40 hex chars. Collisions SHAttered (2017) — ne pas utiliser seul.' },
  'SHA-256': { bits:256, len:64,  note:'256 bits → 64 hex chars. Standard forensique actuel — requis par ISO/IEC 27037.' },
  'SHA-512': { bits:512, len:128, note:'512 bits → 128 hex chars. Utilisé pour les images très critiques.' },
};

function genHashIdentify() {
  const types = Object.keys(HASH_SAMPLES);
  const target = types[rand(0, types.length-1)];
  const qType = rand(0, 6);
  let scenario, choices;

  if (qType === 0) {
    const hash = Array.from({length: HASH_SAMPLES[target].len}, ()=>'0123456789abcdef'[rand(0,15)]).join('');
    scenario = `Quel algorithme a produit ce hash ?<br><code style="color:var(--cyan);word-break:break-all;font-size:.7rem;display:block;margin-top:.4rem;padding:.4rem;background:var(--bg);border-radius:4px">${hash}</code>`;
    choices = types.map(t=>({text:`${t} — ${HASH_SAMPLES[t].len} caractères (${HASH_SAMPLES[t].bits} bits)`, correct:t===target, explain:HASH_SAMPLES[t].note}));
  } else if (qType === 1) {
    scenario = `Combien de <strong>caractères hexadécimaux</strong> contient un hash <strong>${target}</strong> ?`;
    const info = HASH_SAMPLES[target];
    const wrongs = types.filter(t=>t!==target).map(t=>HASH_SAMPLES[t].len);
    const allLens = [...new Set([info.len,...wrongs])].sort(()=>Math.random()-.5);
    choices = allLens.map(l=>({text:`${l} caractères`,correct:l===info.len,explain:`${target} = ${info.bits} bits ÷ 4 bits/hex = <strong>${info.len} caractères</strong>. ${info.note}`}));
  } else if (qType === 2) {
    scenario = 'Lequel de ces scénarios <strong>invalide</strong> une chaîne de custody basée sur le hash ?';
    choices = [
      {text:'Hash SHA-256 identique avant et après transport', correct:false, explain:'Hashes identiques = intégrité prouvée. Chaîne de custody valide.'},
      {text:'Hash recalculé après copie : résultat différent de l\'original', correct:true, explain:'Hash différent = altération détectée. Preuve potentiellement irrecevable (art. 141 CPP). Toute divergence doit être documentée.'},
      {text:'Deux analystes obtiennent le même hash sur la même image', correct:false, explain:'Reproductibilité confirmée — l\'un des 4 critères ISO/IEC 27037.'},
      {text:'Hash calculé immédiatement après acquisition avec write-blocker', correct:false, explain:'Procédure correcte selon RFC 3227 et ISO/IEC 27037 §8.3.'},
    ];
    choices = choices.sort(()=>Math.random()-.5);
  } else if (qType === 3) {
    // ── Sous-type 3 : NTLM vs LM hash (Windows password hashes) ──
    // LM : 32 hex (16 bytes) — case-insensitive, max 14 chars, padding 0
    // NTLM : 32 hex (16 bytes) — Unicode MD4 du password
    // Format Windows : LM:NTLM (séparés par ':')
    const isNTLM = Math.random() < 0.5;
    const hash = Array.from({length: 32}, () => '0123456789abcdef'[rand(0,15)]).join('');
    // LM connu pour mot de passe vide : "aad3b435b51404eeaad3b435b51404ee"
    const LM_EMPTY = 'aad3b435b51404eeaad3b435b51404ee';
    const displayHash = isNTLM ? `${LM_EMPTY}:${hash}` : `${hash}:${LM_EMPTY}`;
    scenario = `Tu extrais ce hash du fichier <code>SAM</code> de Windows :<br>
      <code style="color:var(--cyan);word-break:break-all;font-size:.7rem;display:block;margin-top:.4rem;padding:.4rem;background:var(--bg);border-radius:4px">${displayHash}</code>
      Le format Windows est <code>LM:NTLM</code>. Sachant que <code>${LM_EMPTY}</code> est le hash LM d'un mot de passe vide, lequel des deux algorithmes contient l'<strong>information utile</strong> ici ?`;
    choices = [
      {text: isNTLM ? 'NTLM (le 2ème champ)' : 'LM (le 1er champ)', correct: true,
       explain: `${isNTLM ? 'NTLM' : 'LM'} contient le vrai hash. ${isNTLM ? 'LM est désactivé/vide depuis Vista — c\'est la situation moderne (NoLMHash=1).' : 'LM était utilisé sur les systèmes XP et antérieurs. Vulnérable : insensible à la casse, padding, divisé en 2×7 chars, brute-force facile.'}`},
      {text: isNTLM ? 'LM (le 1er champ)' : 'NTLM (le 2ème champ)', correct: false,
       explain: `Ce champ vaut ${LM_EMPTY} = hash d'un mot de passe vide. Aucune info utile.`},
      {text: 'Les deux contiennent la même information', correct: false,
       explain: 'Faux. LM et NTLM utilisent des algorithmes différents (DES vs MD4) et tronquent/transforment différemment.'},
      {text: 'C\'est un hash MD5 corrompu', correct: false,
       explain: 'Le format <code>X:Y</code> avec deux champs hex de 32 chars est caractéristique des hashes Windows SAM/NTDS, pas MD5.'},
    ].sort(()=>Math.random()-.5);
  } else if (qType === 4) {
    // ── Sous-type 4 : Comparaison hash avant/après transport ──
    const original = Array.from({length: 64}, () => '0123456789abcdef'[rand(0,15)]).join('');
    // Modifier 1 caractère pour le "tampered"
    const tampered = original.substring(0, 30) + ('0123456789abcdef'[rand(0,15)] === original[30] ? 'f' : '0123456789abcdef'[(rand(0,15)+1)%16]) + original.substring(31);
    const isAltered = Math.random() < 0.5;
    const after = isAltered ? tampered : original;
    scenario = `Tu compares les hashes SHA-256 d'une image disque <strong>avant</strong> et <strong>après</strong> transport vers le laboratoire :<br>
      <div style="font-size:.7rem;margin-top:.4rem;padding:.4rem;background:var(--bg);border-radius:4px;font-family:var(--mono)">
        <span style="color:var(--dim)">Avant : </span><span style="color:var(--cyan)">${original}</span><br>
        <span style="color:var(--dim)">Après : </span><span style="color:${isAltered ? 'var(--red)' : 'var(--cyan)'}">${after}</span>
      </div>
      Que conclus-tu ?`;
    choices = [
      {text: isAltered ? 'L\'intégrité est compromise — ne pas analyser' : 'L\'intégrité est préservée — l\'analyse peut commencer',
       correct: true,
       explain: isAltered
         ? 'Hashes différents = altération. La preuve doit être considérée comme potentiellement compromise. Documenter, alerter, et déterminer si l\'image originale est encore intacte (art. 141 al. 2 CPP — exploitabilité contestable).'
         : 'Hashes identiques caractère par caractère = intégrité confirmée selon ISO/IEC 27037. Chain of custody validée pour cette étape.'},
      {text: isAltered ? 'L\'intégrité est préservée — l\'analyse peut commencer' : 'L\'intégrité est compromise — ne pas analyser',
       correct: false,
       explain: isAltered
         ? 'Faux. Comparer caractère par caractère : un seul bit différent = hash totalement différent (effet avalanche). Ces hashes diffèrent.'
         : 'Faux. Les hashes sont identiques caractère par caractère.'},
      {text: 'Recommencer l\'acquisition pour vérifier',
       correct: false,
       explain: 'Procédure inutile : si le hash est différent, c\'est documenté ; s\'il est identique, l\'intégrité est prouvée. Une 2e acquisition ne change rien et risque d\'altérer la source.'},
      {text: 'Calculer aussi le MD5 pour confirmer',
       correct: false,
       explain: 'SHA-256 seul est suffisant selon ISO/IEC 27037. Ajouter MD5 (vulnérable aux collisions) n\'apporte rien de plus à un SHA-256 identique. Pratique acceptable mais non requise.'},
    ].sort(()=>Math.random()-.5);
  } else if (qType === 5) {
    // ── Sous-type 5 : Identifier algorithme depuis sortie d'outil (hashid) ──
    const algos = [
      { name: 'NTLM',         len: 32, sample: 'b4b9b02e6f09a9bd760f388b67351e2b', hashidOutput: '[+] NTLM\n[+] Domain Cached Credentials' },
      { name: 'bcrypt',       len: 60, sample: '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', hashidOutput: '[+] Blowfish(OpenBSD)\n[+] Woltlab Burning Board 4.x\n[+] bcrypt' },
      { name: 'SHA-256 crypt', len: 88, sample: '$5$rounds=535000$XSALTXSALTXSALT$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY', hashidOutput: '[+] SHA-256 Crypt' },
      { name: 'MD5 crypt',    len: 34, sample: '$1$saltsalt$abcdefghijklmnopqrstuv', hashidOutput: '[+] MD5(Unix)\n[+] FreeBSD MD5\n[+] Cisco-IOS(MD5)' },
      { name: 'Argon2',       len: 96, sample: '$argon2id$v=19$m=65536,t=3,p=4$saltsaltsalt$hashbase64hashbase64hashbase64hashbase64==', hashidOutput: '[+] Argon2' },
    ];
    const choice = algos[rand(0, algos.length-1)];
    scenario = `L'outil <code>hashid</code> donne le résultat suivant pour un hash extrait :<br>
      <code style="color:var(--cyan);word-break:break-all;font-size:.7rem;display:block;margin-top:.4rem;padding:.4rem;background:var(--bg);border-radius:4px">$ hashid '${choice.sample.length > 60 ? choice.sample.substring(0, 50) + '…' : choice.sample}'<br>${choice.hashidOutput.split('\n').join('<br>')}</code>
      De quel algorithme s'agit-il ?`;
    const distractors = algos.filter(a => a.name !== choice.name).slice(0, 3);
    choices = [
      { text: choice.name, correct: true,
        explain: `<strong>${choice.name}</strong> — reconnaissable au préfixe et à la longueur (${choice.len} chars typiques). ${
          choice.name === 'NTLM' ? 'Windows SAM/NTDS, format hex 32 chars sans préfixe.'
          : choice.name === 'bcrypt' ? 'Préfixe <code>$2y$</code>, $2a$, ou $2b$. Cost factor configurable. Standard pour stockage de mots de passe modernes.'
          : choice.name === 'SHA-256 crypt' ? 'Préfixe <code>$5$</code>. Linux /etc/shadow moderne (Glibc 2.7+).'
          : choice.name === 'MD5 crypt' ? 'Préfixe <code>$1$</code>. Linux /etc/shadow legacy. Aussi Cisco IOS type 5.'
          : 'Préfixe <code>$argon2id$</code> ou <code>$argon2i$</code>. Gagnant Password Hashing Competition 2015. Recommandé OWASP.'}`},
      ...distractors.map(d => ({
        text: d.name, correct: false,
        explain: `${d.name} aurait un format différent : préfixe ${d.sample.substring(0, 6)}…`
      }))
    ].sort(()=>Math.random()-.5);
  } else {
    // ── Sous-type 6 : Détecter une collision MD5 (cas pédagogique réel) ──
    // Les attaques de collision sur MD5 (chosen-prefix) permettent de produire
    // 2 fichiers DIFFÉRENTS avec le MÊME hash MD5 mais MD5 ≠ SHA-256 différents.
    // Ce sous-type apprend à reconnaître ce piège forensique.
    // Référence : Wang & Yu 2005, MD5 considered harmful today (Stevens et al. 2008)

    // 4 paires possibles (pédagogiques, valeurs fictives mais structurellement réalistes)
    const pairs = [
      {
        title: 'Document Word "Contrat_v1.docx" vs "Contrat_v2.docx"',
        details: 'Deux contrats avec clauses différentes mais MD5 identique',
      },
      {
        title: 'Image "evidence_orig.jpg" vs "evidence_modified.jpg"',
        details: 'Photo d\'origine et version retouchée',
      },
      {
        title: 'Binaire "installer.exe" légitime vs "installer.exe" troyenné',
        details: 'Le malware se fait passer pour le légitime via collision',
      },
    ];
    const pair = pairs[rand(0, pairs.length - 1)];

    // Génération de hashes : MD5 identique pour les 2, SHA-256 différents
    const md5Same = Array.from({length: 32}, () => '0123456789abcdef'[rand(0, 15)]).join('');
    const sha1A = Array.from({length: 40}, () => '0123456789abcdef'[rand(0, 15)]).join('');
    const sha1B = Array.from({length: 40}, () => '0123456789abcdef'[rand(0, 15)]).join('');
    const sha256A = Array.from({length: 64}, () => '0123456789abcdef'[rand(0, 15)]).join('');
    const sha256B = Array.from({length: 64}, () => '0123456789abcdef'[rand(0, 15)]).join('');

    scenario = `Un suspect prétend que deux fichiers sont identiques car leur MD5 correspond.<br>
      <strong>${pair.title}</strong>
      <div style="font-size:.65rem;margin-top:.4rem;padding:.4rem;background:var(--bg);border-radius:4px;font-family:var(--mono);line-height:1.55">
        <span style="color:var(--dim)">Fichier A :</span><br>
        &nbsp;&nbsp;MD5    : <span style="color:var(--gold)">${md5Same}</span><br>
        &nbsp;&nbsp;SHA-1  : <span style="color:var(--cyan)">${sha1A}</span><br>
        &nbsp;&nbsp;SHA-256: <span style="color:var(--green)">${sha256A}</span><br>
        <span style="color:var(--dim)">Fichier B :</span><br>
        &nbsp;&nbsp;MD5    : <span style="color:var(--gold)">${md5Same}</span><br>
        &nbsp;&nbsp;SHA-1  : <span style="color:var(--cyan)">${sha1B}</span><br>
        &nbsp;&nbsp;SHA-256: <span style="color:var(--green)">${sha256B}</span>
      </div>
      <strong>Quelle est la conclusion correcte ?</strong>`;

    choices = [
      {
        text: 'Les fichiers sont DIFFÉRENTS — c\'est une collision MD5 forgée',
        correct: true,
        explain: `<strong>Bonne réponse — c'est exactement le piège.</strong> MD5 identique mais SHA-1 et SHA-256 différents = <strong>collision MD5 délibérée</strong>. Possibles depuis Wang & Yu 2005 (collision en quelques heures sur PC standard depuis 2008). Cas réel : Flame malware (2012) avait un certificat Microsoft signé via collision MD5. ${pair.details}. <strong>Ne jamais utiliser MD5 seul</strong> — toujours croiser avec SHA-256 (RFC 6151, ISO/IEC 27037).`,
      },
      {
        text: 'Les fichiers sont identiques — MD5 confirme l\'égalité',
        correct: false,
        explain: 'Faux. Si MD5 est identique mais SHA-1 et SHA-256 diffèrent, les fichiers sont DIFFÉRENTS. MD5 a une attaque de collision pratique depuis 2005. Conséquence forensique : un MD5 identique ne PROUVE PAS l\'identité de 2 fichiers. Toujours utiliser SHA-256.',
      },
      {
        text: 'Erreur de calcul — un même fichier ne peut avoir 2 SHA-256 différents',
        correct: false,
        explain: 'Faux. Les 2 SHA-256 différents ne sont pas une erreur — ils prouvent justement que les fichiers sont différents. C\'est la collision MD5 qui crée l\'illusion d\'égalité.',
      },
      {
        text: 'Les fichiers sont identiques mais l\'un est corrompu',
        correct: false,
        explain: 'Une corruption changerait TOUS les hashes (MD5 + SHA-1 + SHA-256), pas juste 2 sur 3. Le pattern "MD5= mais SHA-1≠ et SHA-256≠" est la signature classique d\'une collision MD5 intentionnelle.',
      },
    ].sort(() => Math.random() - .5);
  }

  const shuffled = choices.sort(()=>Math.random()-.5);
  const correctIdx = shuffled.findIndex(c => c.correct);
  const correctExplain = shuffled[correctIdx].explain;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🔑</div>
      <div class="ex-title">Hash &amp; Intégrité forensique</div>
      <span class="ex-badge easy">MD5 · SHA-1 · SHA-256 · SHA-512</span>
    </div>
    <div class="ex-scenario">${scenario}</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="hash-choices">
      ${shuffled.map((c,i)=>`<button class="tp-choice"
        data-correct="${c.correct}"
        data-explain="${encData(c.explain)}"
        data-correct-explain="${encData(correctExplain)}">
        <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span><span>${c.text}</span></button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-hash" style="display:none"></div>
    <button class="btn-next" id="btn-next-hash" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#hash-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        checkHashIdentify(b, isOk, explain, correctEx);
      });
    });
  }, 0);
  return div;
}

function checkHashIdentify(btn, isOk, wrongExplain, correctExplain) {
  document.querySelectorAll('#hash-choices .tp-choice').forEach(b=>{ b.disabled=true; });
  btn.classList.add(isOk ? 'correct' : 'wrong');
  if (isOk) { if (!STATE.hintUsed) incSolved('hash'); }
  else {
    breakStreak();
    document.querySelectorAll('#hash-choices .tp-choice').forEach(b=>{
      if(b.dataset.correct==='true') b.classList.add('correct');
      else if(b!==btn) b.classList.add('dim');
    });
  }
  const fb=document.getElementById('ex-feedback-hash');
  if(fb){
    fb.className='ex-feedback '+(isOk?'correct':'wrong');
    fb.innerHTML = formatChoiceFeedback(isOk, correctExplain || wrongExplain, wrongExplain);
    fb.style.display='block';
  }
  document.getElementById('btn-next-hash').style.display='inline-block';
}


// ═══════════════════════════════════════════════════════════════
