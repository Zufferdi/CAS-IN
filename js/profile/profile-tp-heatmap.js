// ═══════════════════════════════════════════════════════════════
// profile-tp-heatmap.js — v3.1 (Phase 6)
//
// Heatmap des 29 catégories TP pour profile.html.
// Pattern miroir de js/profile/profile-heatmap.js (quiz × chapitres) mais
// adapté à TP × groupes (5 groupes thématiques, 29 cats).
//
// Source de données :
//   localStorage.tp_solved = { endian: 5, fat: 3, runlist: 0, ... }
//
// Coloration cellule (basée sur tp_solved[cat] / CAT_MAX[cat]) :
//   gris       → jamais résolu (0)
//   rouge      → 1-20% (1/5)
//   orange     → 20-40% (2/5)
//   jaune      → 40-60% (3/5)
//   vert clair → 60-80% (4/5)
//   vert vif   → 100% (5/5 ou 10/10 pour examen)
//
// API publique :
//   window.ProfileTPHeatmap.render() — appelée par profile.html boot
//
// Charge APRÈS profile.html ait inséré <div id="tp-heatmap"></div>.
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Structure des 29 cats groupées en 5 familles ──
  // Mapping volontairement non symétrique avec tools.html (4 familles) :
  // TP a 29 catégories qui se groupent plus naturellement en 5
  // (FS / Win / Calc / Inv / Carving), reflétant la pédagogie DFIR.
  const TP_GROUPS = [
    {
      id: 'fs',
      label: 'Systèmes de fichiers',
      icon: '💾',
      cats: [
        { id: 'endian',      label: 'Endianness',         icon: '🔄', max: 5 },
        { id: 'timestamp',   label: 'Timestamps FAT',     icon: '⏱', max: 5 },
        { id: 'bitmap',      label: 'Bitmap exFAT',       icon: '🗺', max: 5 },
        { id: 'fat',         label: 'Chaîne FAT',         icon: '⛓', max: 5 },
        { id: 'effacement',  label: 'Effacement FAT',     icon: '🗑', max: 5 },
        { id: 'runlist',     label: 'Run List NTFS',      icon: '🧩', max: 5 },
        { id: 'timestomping',label: 'Timestomping',       icon: '🕰', max: 5 },
        { id: 'mbr',         label: 'MBR / GPT',          icon: '💽', max: 5 },
        { id: 'direntry',    label: 'Directory Entry',    icon: '📁', max: 5 },
        { id: 'hexdump',     label: 'Dump Hex',           icon: '🔬', max: 5 },
        { id: 'slackspace',  label: 'Slack Space',        icon: '🪣', max: 5 },
        { id: 'hfsbtree',    label: 'B-Tree HFS+',        icon: '🌳', max: 5 },
        { id: 'ntfsindex',   label: '$INDEX NTFS',        icon: '📇', max: 5 },
      ],
    },
    {
      id: 'win',
      label: 'Artefacts Windows',
      icon: '🪟',
      cats: [
        { id: 'registry',    label: 'Registry NK/VK',     icon: '📂', max: 5 },
        { id: 'prefetch',    label: 'Prefetch (.pf)',     icon: '⏱️', max: 5 },
        { id: 'lnk',         label: 'LNK',                icon: '🔗', max: 5 },
      ],
    },
    {
      id: 'calc',
      label: 'Calculs & Identification',
      icon: '🔢',
      cats: [
        { id: 'hextable',    label: 'Table Hex',          icon: '🗺', max: 5 },
        { id: 'fsidentify',  label: 'Identifier FS',      icon: '🔍', max: 5 },
        { id: 'offset',      label: 'Calcul offset',      icon: '📐', max: 5 },
        { id: 'bases',       label: 'Bases & Encodages',  icon: '🔢', max: 5 },
        { id: 'hash',        label: 'Hash & Intégrité',   icon: '🔑', max: 5 },
      ],
    },
    {
      id: 'carve',
      label: 'Carving & Signatures',
      icon: '✨',
      cats: [
        { id: 'magic',       label: 'Magic Bytes',        icon: '✨', max: 5 },
        { id: 'mismatch',    label: 'Mismatch',           icon: '🎭', max: 5 },
      ],
    },
    {
      id: 'inv',
      label: 'Investigation & Droit',
      icon: '⚖️',
      cats: [
        { id: 'email',       label: 'Email Forensics',    icon: '✉️', max: 5 },
        { id: 'network',     label: 'Réseau & PCAP',      icon: '📡', max: 5 },
        { id: 'ir',          label: 'Incident Response',  icon: '🚨', max: 5 },
        { id: 'droitpenal',  label: 'Droit pénal',        icon: '⚖️', max: 5 },
        { id: 'glossaire',   label: 'Glossaire',          icon: '🗂', max: 5 },
        { id: 'examen',      label: 'Série Examen',       icon: '📋', max: 10 }, // double seuil
      ],
    },
  ];

  // Vérif interne au chargement (debug-friendly)
  const totalCats = TP_GROUPS.reduce((a, g) => a + g.cats.length, 0);
  if (totalCats !== 29) {
    console.warn('[profile-tp-heatmap] Expected 29 cats, found', totalCats);
  }

  function lsGet(k, fb) {
    try { const r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); }
    catch (_) { return fb; }
  }

  function getCellClass(solved, max) {
    if (!solved || solved <= 0) return 'tphm-untouched';
    const pct = (solved / max) * 100;
    if (pct >= 100) return 'tphm-complete';
    if (pct >= 80)  return 'tphm-excellent';
    if (pct >= 60)  return 'tphm-good';
    if (pct >= 40)  return 'tphm-average';
    if (pct >= 20)  return 'tphm-weak';
    return 'tphm-poor';
  }

  function getCellTooltip(cat, solved) {
    if (!solved || solved <= 0) return cat.label + ' — pas encore résolu';
    if (solved >= cat.max) return cat.label + ' — terminé (' + solved + '/' + cat.max + ')';
    return cat.label + ' — ' + solved + '/' + cat.max + ' réussis';
  }

  function getGroupStats(group, tpSolved) {
    let totalDone = 0;
    let totalMax = 0;
    let catsCompleted = 0;
    group.cats.forEach(c => {
      const n = Math.min(parseInt(tpSolved[c.id], 10) || 0, c.max);
      totalDone += n;
      totalMax += c.max;
      if (n >= c.max) catsCompleted++;
    });
    return {
      pct: totalMax > 0 ? Math.round((totalDone / totalMax) * 100) : 0,
      catsCompleted,
      catsTotal: group.cats.length,
      done: totalDone,
      max: totalMax,
    };
  }

  function renderTPHeatmap() {
    const container = document.getElementById('tp-heatmap');
    if (!container) return;

    const tpSolved = lsGet('tp_solved', {}) || {};
    const totalSolved = Object.values(tpSolved).reduce((a, n) => a + (parseInt(n, 10) || 0), 0);

    if (totalSolved === 0) {
      container.innerHTML = '<div class="tphm-empty">'
        + '<div class="tphm-empty-icon">🧩</div>'
        + '<h3>Heatmap TP</h3>'
        + '<p>Aucun exercice résolu encore. Lance des TP pour voir ta maîtrise par catégorie.</p>'
        + '<a href="tp.html" class="tphm-empty-cta">→ Lancer les TP</a>'
        + '</div>';
      return;
    }

    let html = '<div class="tphm-header">';
    html += '<h3 class="tphm-title">🧩 Maîtrise TP par catégorie</h3>';
    html += '<p class="tphm-subtitle">' + totalSolved + ' exercice' + (totalSolved !== 1 ? 's' : '') + ' résolu' + (totalSolved !== 1 ? 's' : '') + ' · 29 catégories</p>';
    html += '<div class="tphm-legend">';
    html += '<span class="tphm-legend-item"><span class="tphm-cell-mini tphm-untouched"></span>Non vu</span>';
    html += '<span class="tphm-legend-item"><span class="tphm-cell-mini tphm-poor"></span>&lt;20%</span>';
    html += '<span class="tphm-legend-item"><span class="tphm-cell-mini tphm-weak"></span>20-40%</span>';
    html += '<span class="tphm-legend-item"><span class="tphm-cell-mini tphm-average"></span>40-60%</span>';
    html += '<span class="tphm-legend-item"><span class="tphm-cell-mini tphm-good"></span>60-80%</span>';
    html += '<span class="tphm-legend-item"><span class="tphm-cell-mini tphm-excellent"></span>80-99%</span>';
    html += '<span class="tphm-legend-item"><span class="tphm-cell-mini tphm-complete"></span>100% ✓</span>';
    html += '</div></div>';

    html += '<div class="tphm-groups">';
    TP_GROUPS.forEach(group => {
      const stats = getGroupStats(group, tpSolved);
      const colorClass = stats.pct === 0 ? 'tphm-untouched' :
                         stats.pct >= 80 ? 'tphm-excellent' :
                         stats.pct >= 60 ? 'tphm-good' :
                         stats.pct >= 40 ? 'tphm-average' : 'tphm-weak';
      html += '<div class="tphm-group-row">';
      html += '<div class="tphm-group-label">';
      html += '<span class="tphm-group-icon">' + group.icon + '</span>';
      html += '<span class="tphm-group-name">' + group.label + '</span>';
      html += '<span class="tphm-group-pct ' + colorClass + '">' + stats.pct + '%</span>';
      html += '<span class="tphm-group-count">' + stats.catsCompleted + '/' + stats.catsTotal + '</span>';
      html += '</div>';
      html += '<div class="tphm-group-cells">';
      group.cats.forEach(c => {
        const solved = Math.min(parseInt(tpSolved[c.id], 10) || 0, c.max);
        const cls = getCellClass(solved, c.max);
        const tooltip = getCellTooltip(c, solved).replace(/"/g, '&quot;');
        html += '<a href="tp.html#' + c.id + '" class="tphm-cell ' + cls + '" title="' + tooltip + '">';
        html += '<span class="tphm-cell-icon">' + c.icon + '</span>';
        html += '<span class="tphm-cell-name">' + c.label + '</span>';
        if (solved > 0) html += '<span class="tphm-cell-count">' + solved + '/' + c.max + '</span>';
        html += '</a>';
      });
      html += '</div></div>';
    });
    html += '</div>';

    // Recommandations : top 3 cats partiellement faites mais pas terminées
    const inProgress = [];
    TP_GROUPS.forEach(g => g.cats.forEach(c => {
      const n = parseInt(tpSolved[c.id], 10) || 0;
      if (n > 0 && n < c.max) inProgress.push({ ...c, solved: n, group: g });
    }));
    inProgress.sort((a, b) => b.solved - a.solved); // les plus avancés en premier

    if (inProgress.length > 0) {
      html = container.innerHTML = html + '<div class="tphm-recos">'
        + '<h4>🎯 À terminer en priorité</h4>'
        + '<ul class="tphm-reco-list">'
        + inProgress.slice(0, 3).map(r =>
            '<li><a href="tp.html#' + r.id + '"><strong>' + r.label + '</strong></a> '
            + '<span class="tphm-reco-pct">' + r.solved + '/' + r.max + '</span> · ' + r.group.label + '</li>'
          ).join('')
        + '</ul></div>';
      return;
    }

    container.innerHTML = html;
  }

  // API publique
  window.ProfileTPHeatmap = {
    render: renderTPHeatmap,
    TP_GROUPS,
  };

  // Auto-init au DOMContentLoaded SI le container existe
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('tp-heatmap')) renderTPHeatmap();
  });
})();
