// ═══════════════════════════════════════════════════════════════
// profile-heatmap.js — v2.70
// Heatmap chapitres × thèmes pour profile.html
// 
// Affiche la maîtrise du candidat sur les 39 chapitres regroupés
// par 8 thèmes. Source de données :
//   - lsGet('byChapter') = { [chapter]: { ok, tot } }  (quiz)
//   - Mastery.getTier(sceneId) pour tier scène (optionnel)
// 
// Coloration cellule selon précision + nombre de questions :
//   gris      → jamais touché (tot = 0)
//   rouge     → précision < 40%
//   orange    → 40-60%
//   jaune     → 60-75%
//   vert clair→ 75-90%
//   vert vif  → 90%+
//   gris foncé→ touché mais < 5 questions (échantillon trop petit)
// 
// Format chapter→theme suit data/questions.json strictement.
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // Mapping thème → chapitres (extrait de questions.json, ordre logique)
  const THEMES_STRUCTURE = [
    {
      id: 'fs',
      label: 'Système de fichiers',
      icon: '💾',
      chapters: [
        'NTFS',
        'FAT12 / FAT16 / FAT32',
        'exFAT',
        'EXT2 / EXT3 / EXT4',
        'HFS+ et APFS',
        'Technologie des disques',
      ],
    },
    {
      id: 'acq',
      label: 'Acquisition et analyse',
      icon: '📥',
      chapters: [
        'Acquisition et préservation',
        'Logiciels et outils forensiques',
        'Méthodologie et bonnes pratiques',
        'Artefacts temporels et MAC times',
        'Analyse et recovery',
      ],
    },
    {
      id: 'os',
      label: 'Spécificité des OS',
      icon: '🖥️',
      chapters: [
        'Windows — Artefacts et exécution',
        'Windows — Registre et artefacts',
        'Windows — Journaux et Event Logs',
        'Linux — Artefacts et analyse',
        'macOS — Artefacts et analyse',
      ],
    },
    {
      id: 'base',
      label: 'Informatique de base',
      icon: '🧠',
      chapters: [
        'Réseau, protocoles et Internet',
        'Adressage IP',
        'Représentation des données',
        'Formats de fichiers et Magic Bytes',
      ],
    },
    {
      id: 'crypto',
      label: 'Cryptologie',
      icon: '🔐',
      chapters: [
        'Chiffrement symétrique',
        'Chiffrement asymétrique et RSA',
        'Hachage et intégrité',
        'PKI et certificats',
        'Cassage et attaques',
      ],
    },
    {
      id: 'osint',
      label: 'OSINT',
      icon: '🔭',
      chapters: [
        'Fondamentaux OSINT',
        'Outils et automatisation OSINT',
        'Recherche web et Google Dorks',
        'Infrastructure, DNS et pivots',
        'Métadonnées et EXIF',
      ],
    },
    {
      id: 'forensic',
      label: 'Forensique',
      icon: '🔬',
      chapters: [
        'Méthodologie forensique',
        'Techniques et méthodologie',
        'ICS / SCADA / OT Forensique',
      ],
    },
    {
      id: 'droit',
      label: 'Droit',
      icon: '⚖️',
      chapters: [
        'Droit pénal informatique',
        'Procédure pénale',
        'Perquisition de documents',
        'Séquestre informatique',
        'Entraide judiciaire internationale',
        'Expertise et rapport judiciaire',
      ],
    },
  ];

  // Mapping chapter → fiche correspondante
  // (Copie de CHAPTER_TO_THEME_FILE de quiz-data.js — embarqué ici pour
  // que profile.html n'ait pas à charger quiz-data.js juste pour les liens)
  const CHAPTER_TO_FICHE = {
    // Filesystems
    'NTFS': 'fiches/ntfs.html',
    'FAT12 / FAT16 / FAT32': 'fiches/fat32.html',
    'exFAT': 'fiches/exfat.html',
    'EXT2 / EXT3 / EXT4': 'fiches/ext.html',
    'HFS+ et APFS': 'fiches/apfs.html',
    'Technologie des disques': 'fiches/disques.html',
    // Acquisition / méthodologie
    'Acquisition et préservation': 'fiches/acquisition.html',
    'Méthodologie et bonnes pratiques': 'fiches/methodologie.html',
    'Méthodologie forensique': 'fiches/methodologie.html',
    'Techniques et méthodologie': 'fiches/methodologie.html',
    'Analyse et recovery': 'fiches/data_carving.html',
    'Artefacts temporels et MAC times': 'fiches/mac_times.html',
    'Formats de fichiers et Magic Bytes': 'fiches/formats.html',
    'Logiciels et outils forensiques': 'fiches/outils.html',
    // Crypto
    'Chiffrement asymétrique et RSA': 'fiches/crypto.html',
    'Chiffrement symétrique': 'fiches/crypto.html',
    'Hachage et intégrité': 'fiches/hash.html',
    'Cassage et attaques': 'fiches/cassage_mdp.html',
    'PKI et certificats': 'fiches/pki_certificats.html',
    // OS-spécifiques
    'Windows — Artefacts et exécution': 'fiches/windows_forensique.html',
    'Windows — Journaux et Event Logs': 'fiches/logs_windows.html',
    'Windows — Registre et artefacts': 'fiches/registre_windows.html',
    'Linux — Artefacts et analyse': 'fiches/linux_forensique.html',
    'macOS — Artefacts et analyse': 'fiches/macos_forensique.html',
    // Réseau / OSINT
    'Adressage IP': 'fiches/reseau.html',
    'Réseau, protocoles et Internet': 'fiches/reseau.html',
    'Infrastructure, DNS et pivots': 'fiches/dns_forensique.html',
    'Fondamentaux OSINT': 'fiches/osint.html',
    'Outils et automatisation OSINT': 'fiches/osint.html',
    'Recherche web et Google Dorks': 'fiches/osint.html',
    // Données
    'Représentation des données': 'fiches/encodage.html',
    'Métadonnées et EXIF': 'fiches/metadata_avancees.html',
    // Droit
    'Droit pénal informatique': 'fiches/droit.html',
    'Procédure pénale': 'fiches/preuve.html',
    'Perquisition de documents': 'fiches/preuve.html',
    'Séquestre informatique': 'fiches/preuve.html',
    'Entraide judiciaire internationale': 'fiches/eimp_entraide.html',
    'Expertise et rapport judiciaire': 'fiches/rapport_forensique.html',
    // Spécial
    'ICS / SCADA / OT Forensique': 'fiches/ics_forensique.html',
  };

  function getFichePath(chapter) {
    return CHAPTER_TO_FICHE[chapter] || null;
  }

  // Récupérer les stats par chapitre depuis localStorage
  function getChapterStats() {
    try {
      const raw = localStorage.getItem('cas_byChapter') || localStorage.getItem('byChapter');
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch (e) {
      return {};
    }
  }

  // Calculer la classe CSS d'une cellule selon stats
  function getCellClass(stats) {
    if (!stats || !stats.tot) return 'hm-untouched';
    if (stats.tot < 5) return 'hm-too-few';
    const pct = (stats.ok / stats.tot) * 100;
    if (pct >= 90) return 'hm-excellent';
    if (pct >= 75) return 'hm-good';
    if (pct >= 60) return 'hm-average';
    if (pct >= 40) return 'hm-weak';
    return 'hm-poor';
  }

  // Tooltip d'une cellule
  function getCellTooltip(chapter, stats) {
    if (!stats || !stats.tot) {
      return `${chapter} — pas encore travaillé`;
    }
    const pct = Math.round((stats.ok / stats.tot) * 100);
    let tier = '';
    if (stats.tot < 5) tier = ' (échantillon trop petit)';
    else if (pct >= 90) tier = ' · maîtrise excellente';
    else if (pct >= 75) tier = ' · bonne maîtrise';
    else if (pct >= 60) tier = ' · à consolider';
    else if (pct >= 40) tier = ' · à retravailler';
    else tier = ' · faible';
    return `${chapter} — ${stats.ok}/${stats.tot} (${pct}%)${tier}`;
  }

  // Tier global d'un thème (moyenne pondérée des chapitres)
  function getThemeTier(theme, byChapter) {
    let totQ = 0, okQ = 0;
    theme.chapters.forEach(ch => {
      const s = byChapter[ch];
      if (s && s.tot) { totQ += s.tot; okQ += s.ok; }
    });
    if (!totQ) return { pct: null, label: '—' };
    const pct = Math.round((okQ / totQ) * 100);
    return { pct, totQ, okQ };
  }

  // Rendu principal
  function renderHeatmap() {
    const container = document.getElementById('chapter-heatmap');
    if (!container) return;

    const byChapter = getChapterStats();
    const totalAttempted = Object.values(byChapter).reduce((a, s) => a + (s.tot || 0), 0);

    if (totalAttempted === 0) {
      container.innerHTML = `
        <div class="hm-empty">
          <div class="hm-empty-icon">📊</div>
          <h3>Heatmap chapitres</h3>
          <p>Aucune donnée encore. Réponds à des questions du quiz pour voir ta maîtrise par chapitre.</p>
          <a href="quiz.html" class="hm-empty-cta">→ Lancer le quiz</a>
        </div>`;
      return;
    }

    let html = '<div class="hm-header">';
    html += '<h3 class="hm-title">📊 Maîtrise par chapitre</h3>';
    html += `<p class="hm-subtitle">${totalAttempted} questions répondues · 39 chapitres</p>`;
    html += '<div class="hm-legend">';
    html += '<span class="hm-legend-item"><span class="hm-cell-mini hm-untouched"></span>Non vu</span>';
    html += '<span class="hm-legend-item"><span class="hm-cell-mini hm-too-few"></span>&lt;5 q</span>';
    html += '<span class="hm-legend-item"><span class="hm-cell-mini hm-poor"></span>&lt;40%</span>';
    html += '<span class="hm-legend-item"><span class="hm-cell-mini hm-weak"></span>40-60%</span>';
    html += '<span class="hm-legend-item"><span class="hm-cell-mini hm-average"></span>60-75%</span>';
    html += '<span class="hm-legend-item"><span class="hm-cell-mini hm-good"></span>75-90%</span>';
    html += '<span class="hm-legend-item"><span class="hm-cell-mini hm-excellent"></span>90%+</span>';
    html += '</div></div>';

    html += '<div class="hm-themes">';
    THEMES_STRUCTURE.forEach(theme => {
      const tier = getThemeTier(theme, byChapter);
      const pctLabel = tier.pct !== null ? `${tier.pct}%` : '—';
      const pctColor = tier.pct === null ? 'hm-untouched' :
                       tier.pct >= 75 ? 'hm-excellent' :
                       tier.pct >= 60 ? 'hm-good' :
                       tier.pct >= 40 ? 'hm-average' : 'hm-weak';

      html += `<div class="hm-theme-row">`;
      html += `<div class="hm-theme-label">`;
      html += `<span class="hm-theme-icon">${theme.icon}</span>`;
      html += `<span class="hm-theme-name">${theme.label}</span>`;
      html += `<span class="hm-theme-pct ${pctColor}">${pctLabel}</span>`;
      html += `</div>`;
      html += `<div class="hm-theme-cells">`;
      theme.chapters.forEach(ch => {
        const stats = byChapter[ch] || { ok: 0, tot: 0 };
        const cls = getCellClass(stats);
        const tooltip = getCellTooltip(ch, stats);
        const fiche = getFichePath(ch);
        const shortLabel = ch.length > 28 ? ch.substring(0, 26) + '…' : ch;

        if (fiche) {
          html += `<a href="${fiche}" class="hm-cell ${cls}" title="${tooltip.replace(/"/g, '&quot;')}">`;
          html += `<span class="hm-cell-label">${shortLabel}</span>`;
          if (stats.tot) html += `<span class="hm-cell-count">${stats.ok}/${stats.tot}</span>`;
          html += `</a>`;
        } else {
          html += `<div class="hm-cell ${cls}" title="${tooltip.replace(/"/g, '&quot;')}">`;
          html += `<span class="hm-cell-label">${shortLabel}</span>`;
          if (stats.tot) html += `<span class="hm-cell-count">${stats.ok}/${stats.tot}</span>`;
          html += `</div>`;
        }
      });
      html += `</div></div>`;
    });
    html += '</div>';

    // Recommandations en bas (top 3 chapitres faibles)
    const allChWithStats = [];
    THEMES_STRUCTURE.forEach(t => t.chapters.forEach(ch => {
      const s = byChapter[ch];
      if (s && s.tot >= 5) {
        const pct = (s.ok / s.tot) * 100;
        if (pct < 70) allChWithStats.push({ ch, pct: Math.round(pct), s, theme: t });
      }
    }));
    allChWithStats.sort((a, b) => a.pct - b.pct);

    if (allChWithStats.length > 0) {
      html += '<div class="hm-recos">';
      html += '<h4>🎯 À retravailler en priorité</h4>';
      html += '<ul class="hm-reco-list">';
      allChWithStats.slice(0, 3).forEach(r => {
        const fiche = getFichePath(r.ch);
        const linkOpen = fiche ? `<a href="${fiche}">` : '<span>';
        const linkClose = fiche ? '</a>' : '</span>';
        html += `<li>${linkOpen}<strong>${r.ch}</strong>${linkClose} `;
        html += `<span class="hm-reco-pct">${r.pct}%</span> · ${r.theme.label}</li>`;
      });
      html += '</ul></div>';
    }

    container.innerHTML = html;
  }

  // API publique
  window.ProfileHeatmap = {
    render: renderHeatmap,
    getChapterStats,
    THEMES_STRUCTURE,
  };

  // Auto-render si le container existe (lazy : DOMContentLoaded déjà passé)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeatmap);
  } else {
    setTimeout(renderHeatmap, 50); // léger délai pour laisser profile-page.js peupler le DOM
  }
})();
