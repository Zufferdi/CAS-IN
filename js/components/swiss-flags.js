// ═══════════════════════════════════════════════════════════════
// swiss-flags.js — v2.59
//
// Drapeaux/blasons SVG cantonaux pour CAS-IN. Unicode n'a PAS d'emoji
// pour les blasons cantonaux suisses (seulement les drapeaux nationaux),
// d'où ce module qui fournit des SVG inline simplifiés mais reconnaissables.
//
// Usage :
//   const svg = window.SwissFlags.get('VD');  // → SVG string
//   const svg = window.SwissFlags.get('CH');  // → drapeau suisse
//   const svg = window.SwissFlags.get('EU');  // → drapeau UE
//
// Cantons couverts : VD, VS, GE, NE, JU, ZH, FR, BS, BE, TI, SG, SO
// + CH (Confédération), EU, FR (France), CN (Chine), INT (International)
//
// Tailles : viewBox 100×100, à scaler par CSS (24×24 ou 32×32 typique).
// Style : aplati, lisible à petite taille, couleurs officielles.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // Helpers de génération
  // ─────────────────────────────────────────────────────────────
  function svg(content, opts = {}) {
    const cls = opts.cls ? ` class="${opts.cls}"` : '';
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"${cls} aria-hidden="true">${content}</svg>`;
  }

  // ─────────────────────────────────────────────────────────────
  // Confédération suisse — croix blanche sur fond rouge (1:1)
  // ─────────────────────────────────────────────────────────────
  const CH = svg(`
    <rect width="100" height="100" fill="#DA291C"/>
    <rect x="42" y="20" width="16" height="60" fill="#fff"/>
    <rect x="20" y="42" width="60" height="16" fill="#fff"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // VAUD — Vert (haut) / Blanc (bas), inscription "LIBERTÉ ET PATRIE"
  // (simplifiée par traits horizontaux pour lisibilité 24px)
  // ─────────────────────────────────────────────────────────────
  const VD = svg(`
    <rect width="100" height="50" fill="#0E7C3E"/>
    <rect y="50" width="100" height="50" fill="#fff"/>
    <text x="50" y="32" font-family="serif" font-size="14" font-weight="bold" fill="#fff" text-anchor="middle">LIBERTÉ</text>
    <text x="50" y="74" font-family="serif" font-size="14" font-weight="bold" fill="#0E7C3E" text-anchor="middle">PATRIE</text>
  `);

  // ─────────────────────────────────────────────────────────────
  // VALAIS — 13 étoiles blanches/rouges sur 13 bandes verticales blanches/rouges
  // Simplifié : moitié blanche / moitié rouge avec étoiles
  // ─────────────────────────────────────────────────────────────
  const VS = svg(`
    <rect width="50" height="100" fill="#fff"/>
    <rect x="50" width="50" height="100" fill="#DA291C"/>
    <g fill="#DA291C">
      <polygon points="20,15 23,22 30,22 25,27 27,34 20,30 13,34 15,27 10,22 17,22"/>
      <polygon points="20,45 23,52 30,52 25,57 27,64 20,60 13,64 15,57 10,52 17,52"/>
      <polygon points="20,75 23,82 30,82 25,87 27,94 20,90 13,94 15,87 10,82 17,82"/>
    </g>
    <g fill="#fff">
      <polygon points="75,15 78,22 85,22 80,27 82,34 75,30 68,34 70,27 65,22 72,22"/>
      <polygon points="75,45 78,52 85,52 80,57 82,64 75,60 68,64 70,57 65,52 72,52"/>
      <polygon points="75,75 78,82 85,82 80,87 82,94 75,90 68,94 70,87 65,82 72,82"/>
    </g>
  `);

  // ─────────────────────────────────────────────────────────────
  // GENÈVE — moitié dorée (aigle) + moitié rouge (clé)
  // Simplifié : carré jaune + carré rouge avec symboles
  // ─────────────────────────────────────────────────────────────
  const GE = svg(`
    <rect width="50" height="100" fill="#F5D116"/>
    <rect x="50" width="50" height="100" fill="#DA291C"/>
    <text x="25" y="65" font-family="serif" font-size="55" fill="#DA291C" text-anchor="middle" font-weight="bold">⚜</text>
    <g stroke="#F5D116" stroke-width="6" fill="none">
      <circle cx="75" cy="35" r="10"/>
      <line x1="75" y1="45" x2="75" y2="80"/>
      <line x1="75" y1="65" x2="85" y2="65"/>
      <line x1="75" y1="75" x2="83" y2="75"/>
    </g>
  `);

  // ─────────────────────────────────────────────────────────────
  // NEUCHÂTEL — vert/blanc/rouge horizontal + croix blanche en haut-gauche
  // ─────────────────────────────────────────────────────────────
  const NE = svg(`
    <rect width="100" height="33" fill="#0E7C3E"/>
    <rect y="33" width="100" height="34" fill="#fff"/>
    <rect y="67" width="100" height="33" fill="#DA291C"/>
    <rect x="5" y="5" width="30" height="20" fill="#DA291C"/>
    <rect x="17" y="9" width="6" height="12" fill="#fff"/>
    <rect x="11" y="13" width="18" height="4" fill="#fff"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // JURA — moitié gauche rouge avec crosse blanche, moitié droite blanche/rouge bandes
  // ─────────────────────────────────────────────────────────────
  const JU = svg(`
    <rect width="50" height="100" fill="#DA291C"/>
    <rect x="50" width="50" height="100" fill="#fff"/>
    <g stroke="#fff" stroke-width="6" fill="none">
      <path d="M 25 20 Q 35 28 30 50 L 25 80"/>
      <circle cx="32" cy="22" r="6"/>
    </g>
    <g fill="#DA291C">
      <rect x="55" y="10" width="40" height="8"/>
      <rect x="55" y="28" width="40" height="8"/>
      <rect x="55" y="46" width="40" height="8"/>
      <rect x="55" y="64" width="40" height="8"/>
      <rect x="55" y="82" width="40" height="8"/>
    </g>
  `);

  // ─────────────────────────────────────────────────────────────
  // ZURICH — diagonale bleu/blanc
  // ─────────────────────────────────────────────────────────────
  const ZH = svg(`
    <rect width="100" height="100" fill="#fff"/>
    <polygon points="0,0 100,0 100,100" fill="#0F4C9E"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // FRIBOURG — noir (haut) / blanc (bas)
  // ─────────────────────────────────────────────────────────────
  const FR_canton = svg(`
    <rect width="100" height="50" fill="#1A1A1A"/>
    <rect y="50" width="100" height="50" fill="#fff"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // BÂLE-VILLE — crosse noire (Baselstab) sur fond blanc
  // ─────────────────────────────────────────────────────────────
  const BS = svg(`
    <rect width="100" height="100" fill="#fff"/>
    <g fill="#1A1A1A">
      <rect x="45" y="20" width="10" height="65"/>
      <path d="M 50 20 Q 65 22 65 35 Q 65 45 50 45 Q 55 35 55 30 Q 55 22 50 20"/>
      <rect x="35" y="80" width="30" height="6"/>
      <polygon points="35,86 30,92 35,92"/>
      <polygon points="65,86 70,92 65,92"/>
      <rect x="40" y="48" width="5" height="3"/>
      <rect x="40" y="56" width="5" height="3"/>
      <rect x="40" y="64" width="5" height="3"/>
    </g>
  `);

  // ─────────────────────────────────────────────────────────────
  // BERNE — bandes diagonales rouge/jaune avec ours noir
  // ─────────────────────────────────────────────────────────────
  const BE = svg(`
    <rect width="100" height="100" fill="#DA291C"/>
    <polygon points="0,0 100,100 100,0" fill="#F5D116"/>
    <ellipse cx="50" cy="55" rx="18" ry="12" fill="#1A1A1A"/>
    <circle cx="50" cy="38" r="10" fill="#1A1A1A"/>
    <circle cx="44" cy="36" r="2" fill="#fff"/>
    <circle cx="56" cy="36" r="2" fill="#fff"/>
    <rect x="32" y="62" width="6" height="12" fill="#1A1A1A"/>
    <rect x="62" y="62" width="6" height="12" fill="#1A1A1A"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // TESSIN — moitié rouge / moitié bleue (horizontal)
  // ─────────────────────────────────────────────────────────────
  const TI = svg(`
    <rect width="100" height="50" fill="#DA291C"/>
    <rect y="50" width="100" height="50" fill="#0F4C9E"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // SAINT-GALL — fascis (faisceaux) verts sur blanc, simplifié
  // ─────────────────────────────────────────────────────────────
  const SG = svg(`
    <rect width="100" height="100" fill="#0E7C3E"/>
    <g stroke="#fff" stroke-width="3" fill="none">
      <line x1="40" y1="20" x2="40" y2="80"/>
      <line x1="50" y1="20" x2="50" y2="80"/>
      <line x1="60" y1="20" x2="60" y2="80"/>
      <line x1="30" y1="40" x2="70" y2="40"/>
      <line x1="30" y1="60" x2="70" y2="60"/>
    </g>
  `);

  // ─────────────────────────────────────────────────────────────
  // SOLEURE — rouge/blanc horizontal (50/50)
  // ─────────────────────────────────────────────────────────────
  const SO = svg(`
    <rect width="100" height="50" fill="#DA291C"/>
    <rect y="50" width="100" height="50" fill="#fff"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // ZOUG — bandes horizontales blanche/bleue (sans hampe)
  // ─────────────────────────────────────────────────────────────
  const ZG = svg(`
    <rect width="100" height="50" fill="#fff"/>
    <rect y="50" width="100" height="50" fill="#0F4C9E"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // FALLBACK SUISSE GÉNÉRIQUE (Confédération + Suisse) → CH
  // ─────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────
  // EU — étoiles dorées sur fond bleu (simplifié)
  // ─────────────────────────────────────────────────────────────
  const EU = svg(`
    <rect width="100" height="100" fill="#003399"/>
    <g fill="#FFCC00">
      <polygon points="50,18 53,26 61,26 55,31 57,39 50,34 43,39 45,31 39,26 47,26"/>
      <polygon points="78,30 81,38 89,38 83,43 85,51 78,46 71,51 73,43 67,38 75,38"/>
      <polygon points="80,55 83,63 91,63 85,68 87,76 80,71 73,76 75,68 69,63 77,63"/>
      <polygon points="65,75 68,83 76,83 70,88 72,96 65,91 58,96 60,88 54,83 62,83"/>
      <polygon points="35,75 38,83 46,83 40,88 42,96 35,91 28,96 30,88 24,83 32,83"/>
      <polygon points="20,55 23,63 31,63 25,68 27,76 20,71 13,76 15,68 9,63 17,63"/>
      <polygon points="22,30 25,38 33,38 27,43 29,51 22,46 15,51 17,43 11,38 19,38"/>
    </g>
  `);

  // ─────────────────────────────────────────────────────────────
  // FRANCE — bleu/blanc/rouge vertical
  // ─────────────────────────────────────────────────────────────
  const FR = svg(`
    <rect width="33" height="100" fill="#002395"/>
    <rect x="33" width="34" height="100" fill="#fff"/>
    <rect x="67" width="33" height="100" fill="#ED2939"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // CHINE — drapeau rouge avec étoile jaune
  // ─────────────────────────────────────────────────────────────
  const CN = svg(`
    <rect width="100" height="100" fill="#EE1C25"/>
    <polygon points="25,30 30,42 42,42 32,50 36,62 25,55 14,62 18,50 8,42 20,42" fill="#FFFF00"/>
    <polygon points="48,16 50,21 55,21 51,24 53,29 48,26 44,29 45,24 41,21 46,21" fill="#FFFF00"/>
    <polygon points="58,28 60,33 65,33 61,36 63,41 58,38 54,41 55,36 51,33 56,33" fill="#FFFF00"/>
    <polygon points="58,46 60,51 65,51 61,54 63,59 58,56 54,59 55,54 51,51 56,51" fill="#FFFF00"/>
    <polygon points="48,58 50,63 55,63 51,66 53,71 48,68 44,71 45,66 41,63 46,63" fill="#FFFF00"/>
  `);

  // ─────────────────────────────────────────────────────────────
  // INTERNATIONAL — globe stylisé
  // ─────────────────────────────────────────────────────────────
  const INT = svg(`
    <circle cx="50" cy="50" r="44" fill="#0F4C9E"/>
    <g stroke="#fff" stroke-width="2.5" fill="none">
      <ellipse cx="50" cy="50" rx="44" ry="20"/>
      <ellipse cx="50" cy="50" rx="20" ry="44"/>
      <line x1="6" y1="50" x2="94" y2="50"/>
      <line x1="50" y1="6" x2="50" y2="94"/>
      <ellipse cx="50" cy="50" rx="44" ry="35"/>
    </g>
  `);

  // ─────────────────────────────────────────────────────────────
  // MAPPING : code canton → SVG
  //
  // Note : le corpus utilise des codes spécifiques pour lever les
  // ambigüités :
  //   - 'FR'    = Fribourg (canton)
  //   - 'FR-EU' = France (pays)
  //   - 'CHF'   = Confédération (≈ CH générique)
  //   - 'INTL'  = International
  // ─────────────────────────────────────────────────────────────
  const FLAGS = {
    // Cantons utilisés dans le corpus
    'VD': VD, 'VS': VS, 'GE': GE, 'NE': NE, 'JU': JU,
    'ZH': ZH, 'FR': FR_canton, 'BS': BS, 'BE': BE, 'TI': TI,
    'SG': SG, 'SO': SO, 'ZG': ZG,
    // Confédération + équivalents (CHF est le code utilisé dans le corpus)
    'CH': CH, 'CHF': CH, 'CONFEDERATION': CH, 'SUISSE': CH,
    // International / pays étrangers
    'EU': EU, 'FR-EU': FR, 'FRANCE': FR,
    'CN': CN, 'CHINE': CN,
    'INTL': INT, 'INT': INT, 'INTERNATIONAL': INT,
  };

  // Mapping nom long (regionDetail.name) → code canton
  const NAME_TO_CODE = {
    'Vaud': 'VD', 'Valais': 'VS', 'Genève': 'GE', 'Neuchâtel': 'NE',
    'Jura': 'JU', 'Zurich': 'ZH', 'Fribourg': 'FR', 'Bâle-Ville': 'BS',
    'Bâle-Campagne': 'BS', 'Berne': 'BE', 'Tessin': 'TI',
    'Saint-Gall': 'SG', 'Soleure': 'SO', 'Zoug': 'ZG',
    'Confédération': 'CHF', 'Suisse': 'CH',
    'France': 'FR-EU', 'Chine': 'CN', 'International': 'INTL',
    'Europe': 'EU',
  };

  // ─────────────────────────────────────────────────────────────
  // API publique
  // ─────────────────────────────────────────────────────────────

  /**
   * Récupère le SVG d'un drapeau/blason.
   * @param {string} codeOrName - Code (VD, CH, EU) ou nom (Vaud, Confédération)
   * @returns {string} SVG inline, ou drapeau CH par défaut
   */
  function get(codeOrName) {
    if (!codeOrName) return CH;
    const upper = String(codeOrName).toUpperCase();
    if (FLAGS[upper]) return FLAGS[upper];
    if (NAME_TO_CODE[codeOrName]) return FLAGS[NAME_TO_CODE[codeOrName]];
    return CH; // fallback
  }

  /**
   * Détermine si un canton spécifique est représenté (pas un fallback CH).
   * Utile pour décider d'afficher le badge canton ou pas.
   * Les codes 'CH', 'CHF', 'CONFEDERATION', 'SUISSE' sont considérés comme
   * non-spécifiques (drapeau suisse générique).
   */
  function isSpecific(codeOrName) {
    if (!codeOrName) return false;
    const upper = String(codeOrName).toUpperCase();
    if (['CH', 'CHF', 'CONFEDERATION', 'SUISSE'].includes(upper)) return false;
    if (FLAGS[upper]) return true;
    if (NAME_TO_CODE[codeOrName]) {
      const code = NAME_TO_CODE[codeOrName];
      return !['CH', 'CHF'].includes(code);
    }
    return false;
  }

  /**
   * Retourne tous les codes disponibles (debug/UI).
   */
  function list() {
    return Object.keys(FLAGS);
  }

  window.SwissFlags = { get, isSpecific, list };
})();
