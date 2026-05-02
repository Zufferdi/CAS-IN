/**
 * CAS-IN — Profile Track v5
 * ──────────────────────────────────────────────────────────────
 * 4 améliorations majeures du système de rôles, en patch
 * non-intrusif :
 *
 *   1. SÉLECTEUR ENRICHI
 *      Chaque carte de rôle montre la mini-timeline des 12 rangs
 *      (avec emojis), la "voie type" en mini-paragraphe, et les
 *      4 premiers rangs en preview cliquable pour comprendre la
 *      progression avant de choisir.
 *
 *   2. MINI-TEST D'ORIENTATION
 *      Bouton "🎯 Trouver mon rôle" → 4 questions courtes →
 *      recommandation argumentée. Garde le bouton "Choisir au
 *      feeling" toujours accessible.
 *
 *   3. RÔLE VISIBLE PARTOUT (renforcé)
 *      Le banner profile (déjà présent) reçoit un thème de
 *      couleur lié au track (cyan / orange / vert / rouge),
 *      l'emoji est mis en valeur, et un "subtitle" affiche le
 *      label de track sous le pseudo. Visible sur scene / quiz /
 *      tp / index.
 *
 *   4. PROMOTIONS CÉLÉBRÉES
 *      Détection des changements de rang via Profile.onChange().
 *      Toast plein écran animé "🎉 PROMOTION · 🔬 Abby Sciuto",
 *      avec haptique mobile, son discret optionnel, et message
 *      contextuel (flavor du nouveau rang). 4-5 secondes.
 *
 * Le patch wrap les fonctions globales (renderTrackOptions,
 * Profile.setTrack, Profile.onChange). Aucune modification du
 * cas-in-profile.js. Rollback : retirer la balise <script>.
 *
 * Architecture similaire aux patches v3 et v4.
 */
(function() {
  'use strict';

  if (window.__casProfileV5Installed) return;

  // ═══════════════════════════════════════════════════════════
  //  TRACK ENRICHMENT — données complémentaires (voie + arguments)
  // ═══════════════════════════════════════════════════════════
  const TRACK_ENRICHMENT = {
    investigator: {
      color:        '#5dcaa5',
      colorBg:      'rgba(93, 202, 165, 0.10)',
      colorBorder:  'rgba(93, 202, 165, 0.55)',
      colorGlow:    'rgba(93, 202, 165, 0.35)',
      voie: 'Tu pars du terrain : sécuriser une scène, prélever des preuves, profiler un suspect. Tu deviens progressivement Morse, Maigret, Brennan, Holmes — l\'instinct s\'aiguise, la méthode s\'affine.',
      forces: ['Sens du détail', 'Méthode forensique', 'Lecture des preuves'],
      sample: 'Cas typique : retrouver l\'auteur d\'une attaque ransomware via les artefacts Windows et les logs réseau.',
    },
    magistrate: {
      color:        '#f0997b',
      colorBg:      'rgba(240, 153, 123, 0.10)',
      colorBorder:  'rgba(240, 153, 123, 0.55)',
      colorGlow:    'rgba(240, 153, 123, 0.35)',
      voie: 'Tu pars du dossier : qualifier les faits, instruire, requérir, juger. Tu deviens Roban, Daumier, Falcone — la décision pèse, la procédure protège.',
      forces: ['Rigueur procédurale', 'Sens de la justice', 'Décision sous pression'],
      sample: 'Cas typique : trancher une demande d\'écoute téléphonique sous l\'art. 269 CPP avec preuves contradictoires.',
    },
    journalist: {
      color:        '#97c459',
      colorBg:      'rgba(151, 196, 89, 0.10)',
      colorBorder:  'rgba(151, 196, 89, 0.55)',
      colorGlow:    'rgba(151, 196, 89, 0.35)',
      voie: 'Tu pars du scoop : recouper les sources, vérifier, raconter sans trahir. Tu deviens Tintin, Blomkvist, Woodward — la vérité publique est ta boussole.',
      forces: ['Recoupement de sources', 'Esprit critique', 'Communication claire'],
      sample: 'Cas typique : authentifier une fuite de documents internes en distinguant le manipulé du véritable.',
    },
    hacker: {
      color:        '#e24b4a',
      colorBg:      'rgba(226, 75, 74, 0.10)',
      colorBorder:  'rgba(226, 75, 74, 0.55)',
      colorGlow:    'rgba(226, 75, 74, 0.35)',
      voie: 'Tu pars du code : trouver la faille avant l\'attaquant, comprendre les outils des adversaires, défendre par l\'attaque. Tu deviens Trinity, Salander, Mitnick — la machine te parle.',
      forces: ['Pensée latérale', 'Maîtrise technique', 'Veille offensive'],
      sample: 'Cas typique : identifier un C2 dans le trafic d\'une infrastructure compromise et reconstituer la kill chain.',
    },
  };

  // ═══════════════════════════════════════════════════════════
  //  ORIENTATION TEST — 4 questions, scoring par track
  // ═══════════════════════════════════════════════════════════
  const ORIENTATION_TEST = [
    {
      q: "Face à un dossier complexe, ta première envie c'est…",
      options: [
        { txt: "Examiner les preuves matérielles, fouiller le terrain", track: 'investigator' },
        { txt: "Comprendre le cadre légal, qualifier les faits", track: 'magistrate' },
        { txt: "Identifier les sources, recouper les versions", track: 'journalist' },
        { txt: "Démonter le système technique, trouver la faille", track: 'hacker' },
      ],
    },
    {
      q: "Ta plus grande satisfaction professionnelle, c'est…",
      options: [
        { txt: "Reconstituer la séquence des événements à partir des preuves", track: 'investigator' },
        { txt: "Rendre une décision juste après avoir tout pesé", track: 'magistrate' },
        { txt: "Publier une enquête qui change les choses", track: 'journalist' },
        { txt: "Découvrir une vulnérabilité avant les attaquants", track: 'hacker' },
      ],
    },
    {
      q: "Le personnage de fiction qui t'inspire le plus parmi ces 4…",
      options: [
        { txt: "Sherlock Holmes", track: 'investigator' },
        { txt: "Atticus Finch", track: 'magistrate' },
        { txt: "Bob Woodward (Watergate)", track: 'journalist' },
        { txt: "Lisbeth Salander", track: 'hacker' },
      ],
    },
    {
      q: "Quand tu dois résoudre un problème, tu préfères…",
      options: [
        { txt: "Aller observer la scène toi-même", track: 'investigator' },
        { txt: "Délibérer méthodiquement avant d'agir", track: 'magistrate' },
        { txt: "Interroger plusieurs témoins puis recouper", track: 'journalist' },
        { txt: "Bricoler une solution technique élégante", track: 'hacker' },
      ],
    },
  ];

  // ═══════════════════════════════════════════════════════════
  //  STYLES
  // ═══════════════════════════════════════════════════════════
  function injectStyles() {
    if (document.getElementById('profile-track-v5-styles')) return;
    const s = document.createElement('style');
    s.id = 'profile-track-v5-styles';
    s.textContent = `
      /* ═══ Sélecteur enrichi ═══ */
      .v5-track-card-enriched {
        background: rgba(0, 0, 0, .55);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        padding: 18px 18px 14px;
        cursor: pointer;
        font-family: 'Share Tech Mono', monospace;
        color: inherit;
        text-align: left;
        position: relative;
        overflow: hidden;
        transition: transform .25s, box-shadow .25s, background .25s;
      }
      .v5-track-card-enriched:hover {
        transform: translateY(-3px);
        box-shadow: 0 0 32px var(--card-glow);
        background: rgba(0, 0, 0, .82);
      }
      .v5-track-card-enriched.is-current {
        background: var(--card-bg);
        box-shadow: 0 0 22px var(--card-glow);
      }
      .v5-track-card-enriched::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--card-color), transparent);
        opacity: .8;
      }

      .v5-tc-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 12px;
      }
      .v5-tc-icon {
        font-size: 2.2rem;
        line-height: 1;
        filter: drop-shadow(0 0 12px var(--card-glow));
        flex-shrink: 0;
      }
      .v5-tc-title-block { flex: 1; min-width: 0; }
      .v5-tc-label {
        font-family: 'Syne', sans-serif;
        font-size: 1.15rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: .04em;
        line-height: 1.1;
        margin-bottom: 3px;
      }
      .v5-tc-ambiance {
        font-size: .65rem;
        color: var(--card-color);
        letter-spacing: .03em;
        opacity: .85;
      }
      .v5-tc-current-tag {
        font-size: .55rem;
        color: var(--card-color);
        letter-spacing: .12em;
        text-transform: uppercase;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 11px;
        border: 1px solid var(--card-color);
        flex-shrink: 0;
      }

      .v5-tc-voie {
        font-size: .72rem;
        color: rgba(255, 255, 255, .78);
        line-height: 1.55;
        margin-bottom: 12px;
      }
      .v5-tc-forces {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 12px;
      }
      .v5-tc-force {
        font-size: .58rem;
        padding: 3px 8px;
        border-radius: 4px;
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        color: rgba(255, 255, 255, .88);
        letter-spacing: .03em;
      }

      .v5-tc-section-label {
        font-size: .55rem;
        color: rgba(255, 255, 255, .42);
        letter-spacing: .12em;
        text-transform: uppercase;
        margin-bottom: 6px;
      }

      /* Mini-timeline des 12 rangs */
      .v5-tc-ladder {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-bottom: 10px;
        padding: 5px 0;
        position: relative;
      }
      .v5-tc-ladder::before {
        content: '';
        position: absolute;
        left: 4%; right: 4%;
        top: 50%; height: 1px;
        background: linear-gradient(90deg, transparent, var(--card-border), transparent);
        z-index: 0;
      }
      .v5-tc-rank-dot {
        flex: 1;
        font-size: 1rem;
        text-align: center;
        position: relative;
        z-index: 1;
        padding: 2px 0;
        background: rgba(0, 0, 0, .85);
        border-radius: 4px;
        line-height: 1;
        transition: transform .15s;
      }
      .v5-tc-rank-dot:hover {
        transform: scale(1.4);
        z-index: 2;
      }

      /* Ranks preview text below timeline */
      .v5-tc-sample {
        font-size: .65rem;
        color: rgba(255, 255, 255, .55);
        font-style: italic;
        line-height: 1.55;
        padding-top: 10px;
        border-top: 1px dashed rgba(255, 255, 255, .12);
        margin-top: 4px;
      }

      .v5-tc-action-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, .08);
      }
      .v5-tc-pick {
        font-size: .65rem;
        color: var(--card-color);
        letter-spacing: .08em;
        text-transform: uppercase;
        font-weight: 700;
      }
      .v5-tc-card-arrow {
        font-size: 1rem;
        color: var(--card-color);
        opacity: .6;
        transition: transform .2s, opacity .2s;
      }
      .v5-track-card-enriched:hover .v5-tc-card-arrow {
        transform: translateX(4px);
        opacity: 1;
      }

      /* Bouton "Trouver mon rôle" + grille */
      .v5-find-role-row {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin: 0 0 20px;
        flex-wrap: wrap;
      }
      .v5-find-role-btn {
        background: rgba(0, 255, 65, .08);
        border: 1px solid rgba(0, 255, 65, .55);
        color: #00ff41;
        font-family: 'Share Tech Mono', monospace;
        font-size: .8rem;
        padding: 9px 18px;
        border-radius: 6px;
        cursor: pointer;
        letter-spacing: .04em;
        transition: .2s;
      }
      .v5-find-role-btn:hover {
        background: rgba(0, 255, 65, .18);
        box-shadow: 0 0 16px rgba(0, 255, 65, .3);
      }
      .v5-find-role-btn--ghost {
        background: transparent;
        border-color: rgba(255, 255, 255, .25);
        color: rgba(255, 255, 255, .7);
      }
      .v5-find-role-btn--ghost:hover {
        border-color: rgba(255, 255, 255, .55);
        background: rgba(255, 255, 255, .04);
        box-shadow: none;
      }

      /* Mini-test overlay */
      .v5-test-overlay {
        position: fixed;
        inset: 0;
        z-index: 700;
        background: rgba(5, 10, 8, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: v5FadeIn .25s ease;
      }
      .v5-test-overlay[hidden] { display: none; }
      @keyframes v5FadeIn { from { opacity: 0; } to { opacity: 1; } }

      .v5-test-panel {
        background: rgba(0, 0, 0, .92);
        border: 1px solid rgba(0, 255, 65, .35);
        border-radius: 14px;
        padding: 28px 26px;
        max-width: 540px;
        width: 100%;
        box-shadow: 0 0 64px rgba(0, 255, 65, .18);
        font-family: 'Share Tech Mono', monospace;
      }
      .v5-test-step-label {
        font-size: .65rem;
        color: rgba(0, 255, 65, .65);
        letter-spacing: .15em;
        text-transform: uppercase;
        margin-bottom: 10px;
      }
      .v5-test-progress-track {
        display: flex;
        gap: 4px;
        margin-bottom: 18px;
      }
      .v5-test-progress-step {
        flex: 1;
        height: 3px;
        background: rgba(255, 255, 255, .08);
        border-radius: 2px;
        transition: background .3s;
      }
      .v5-test-progress-step.is-done {
        background: #00ff41;
        box-shadow: 0 0 8px rgba(0, 255, 65, .5);
      }
      .v5-test-question {
        font-family: 'Syne', sans-serif;
        font-size: 1.1rem;
        color: #fff;
        line-height: 1.45;
        margin-bottom: 18px;
        font-weight: 700;
      }
      .v5-test-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 18px;
      }
      .v5-test-option {
        background: rgba(255, 255, 255, .03);
        border: 1px solid rgba(255, 255, 255, .12);
        color: rgba(255, 255, 255, .88);
        font-family: inherit;
        font-size: .82rem;
        padding: 12px 14px;
        border-radius: 7px;
        cursor: pointer;
        text-align: left;
        line-height: 1.4;
        transition: .15s;
      }
      .v5-test-option:hover {
        border-color: rgba(0, 255, 65, .65);
        background: rgba(0, 255, 65, .07);
        color: #fff;
        transform: translateX(3px);
      }
      .v5-test-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding-top: 14px;
        border-top: 1px dashed rgba(255, 255, 255, .12);
      }
      .v5-test-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, .25);
        color: rgba(255, 255, 255, .7);
        font-family: inherit;
        font-size: .7rem;
        padding: 7px 14px;
        border-radius: 5px;
        cursor: pointer;
        letter-spacing: .04em;
      }
      .v5-test-btn:hover {
        border-color: rgba(255, 255, 255, .55);
        color: #fff;
      }

      /* Résultat du test */
      .v5-test-result-emoji {
        font-size: 3.5rem;
        text-align: center;
        margin-bottom: 8px;
        filter: drop-shadow(0 0 20px var(--card-glow));
        animation: v5PopIn .4s cubic-bezier(.25, 1.6, .5, 1);
      }
      @keyframes v5PopIn {
        0% { opacity: 0; transform: scale(.4); }
        100% { opacity: 1; transform: scale(1); }
      }
      .v5-test-result-title {
        font-family: 'Syne', sans-serif;
        font-size: 1.4rem;
        color: #fff;
        text-align: center;
        margin-bottom: 6px;
        font-weight: 800;
      }
      .v5-test-result-rec {
        font-size: .75rem;
        color: var(--card-color, #00ff41);
        text-align: center;
        margin-bottom: 14px;
        letter-spacing: .02em;
      }
      .v5-test-result-why {
        font-size: .72rem;
        color: rgba(255, 255, 255, .68);
        line-height: 1.55;
        margin-bottom: 18px;
        padding: 12px;
        background: var(--card-bg, rgba(0, 255, 65, .05));
        border: 1px solid var(--card-border, rgba(0, 255, 65, .25));
        border-radius: 6px;
      }
      .v5-test-result-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
      }
      .v5-test-result-btn {
        background: var(--card-bg, rgba(0, 255, 65, .12));
        border: 1px solid var(--card-color, #00ff41);
        color: var(--card-color, #00ff41);
        font-family: 'Share Tech Mono', monospace;
        font-size: .75rem;
        padding: 9px 18px;
        border-radius: 6px;
        cursor: pointer;
        letter-spacing: .04em;
        font-weight: 700;
        transition: .2s;
      }
      .v5-test-result-btn:hover {
        filter: brightness(1.2);
        transform: translateY(-1px);
      }
      .v5-test-result-btn--ghost {
        background: transparent;
        border-color: rgba(255, 255, 255, .25);
        color: rgba(255, 255, 255, .7);
        font-weight: 400;
      }

      /* Promotion toast (plein écran, 4-5s) */
      .v5-promo-overlay {
        position: fixed;
        inset: 0;
        z-index: 800;
        background: rgba(0, 0, 0, .82);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: v5FadeIn .35s ease;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }
      .v5-promo-card {
        background: linear-gradient(135deg, rgba(255, 215, 0, .12), rgba(255, 165, 0, .04));
        border: 2px solid #ffd700;
        border-radius: 18px;
        padding: 36px 48px;
        text-align: center;
        font-family: 'Share Tech Mono', monospace;
        box-shadow: 0 0 80px rgba(255, 215, 0, .45),
                    inset 0 0 32px rgba(255, 215, 0, .08);
        max-width: 480px;
        animation: v5PromoIn .6s cubic-bezier(.25, 1.4, .5, 1);
        position: relative;
        overflow: hidden;
      }
      @keyframes v5PromoIn {
        0% { opacity: 0; transform: scale(.6) translateY(40px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      .v5-promo-card::before {
        content: '';
        position: absolute;
        top: -50%; left: -50%;
        width: 200%; height: 200%;
        background: conic-gradient(from 0deg, transparent, rgba(255, 215, 0, .08), transparent);
        animation: v5PromoSweep 4s linear infinite;
        pointer-events: none;
      }
      @keyframes v5PromoSweep { to { transform: rotate(360deg); } }
      .v5-promo-label {
        font-size: .8rem;
        color: #ffd700;
        letter-spacing: .35em;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 14px;
      }
      .v5-promo-emoji {
        font-size: 4.5rem;
        line-height: 1;
        margin-bottom: 12px;
        filter: drop-shadow(0 0 24px rgba(255, 215, 0, .6));
        animation: v5PromoPulse 1.6s ease-in-out infinite;
      }
      @keyframes v5PromoPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }
      .v5-promo-name {
        font-family: 'Syne', sans-serif;
        font-size: 1.6rem;
        color: #fff;
        font-weight: 800;
        margin-bottom: 8px;
        text-shadow: 0 0 16px rgba(255, 215, 0, .5);
      }
      .v5-promo-flavor {
        font-size: .82rem;
        color: rgba(255, 255, 255, .82);
        font-style: italic;
        line-height: 1.5;
        margin-bottom: 18px;
      }
      .v5-promo-rank-label {
        font-size: .7rem;
        color: rgba(255, 215, 0, .7);
        letter-spacing: .15em;
        text-transform: uppercase;
        margin-bottom: 18px;
      }
      .v5-promo-dismiss {
        background: transparent;
        border: 1px solid rgba(255, 215, 0, .55);
        color: #ffd700;
        font-family: inherit;
        font-size: .72rem;
        padding: 8px 22px;
        border-radius: 5px;
        cursor: pointer;
        letter-spacing: .15em;
        text-transform: uppercase;
        font-weight: 700;
        transition: .2s;
      }
      .v5-promo-dismiss:hover {
        background: rgba(255, 215, 0, .15);
        box-shadow: 0 0 16px rgba(255, 215, 0, .3);
      }

      /* Banner enhancement: track-themed colors */
      .profile-banner.v5-themed {
        --v5-track-color: var(--v5-color, currentColor);
        border-bottom: 1px solid var(--v5-track-color);
        background: linear-gradient(180deg,
                    rgba(0, 0, 0, .6) 0%,
                    transparent 100%) !important;
      }
      .profile-banner.v5-themed .profile-banner__icon {
        font-size: 1.3em !important;
        filter: drop-shadow(0 0 6px var(--v5-color));
      }
      .profile-banner.v5-themed .profile-banner__rank {
        color: var(--v5-color) !important;
        font-weight: 700;
      }
      .v5-track-subtitle {
        font-size: .65rem;
        color: var(--v5-color, rgba(0, 255, 65, .55));
        letter-spacing: .15em;
        text-transform: uppercase;
        opacity: .8;
        margin-left: 6px;
      }

      /* Mobile */
      @media (max-width: 640px) {
        .v5-track-card-enriched { padding: 14px 14px 12px; }
        .v5-tc-icon { font-size: 1.8rem; }
        .v5-tc-label { font-size: 1rem; }
        .v5-tc-rank-dot { font-size: .85rem; }
        .v5-test-panel { padding: 22px 18px; }
        .v5-test-question { font-size: .95rem; }
        .v5-promo-card { padding: 28px 24px; }
        .v5-promo-emoji { font-size: 3.5rem; }
        .v5-promo-name { font-size: 1.25rem; }
      }
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getEnrichment(trackKey) {
    return TRACK_ENRICHMENT[trackKey] || TRACK_ENRICHMENT.investigator;
  }

  // ═══════════════════════════════════════════════════════════
  //  1. SÉLECTEUR ENRICHI — wrap renderTrackOptions
  // ═══════════════════════════════════════════════════════════
  function enrichTrackOptions() {
    const grid = document.getElementById('profile-track-options');
    if (!grid || !window.Profile) return;

    const tracks = window.Profile.listTracks();
    const current = window.Profile.getTrack();

    // Clear and rebuild with enriched cards
    grid.innerHTML = '';

    // Add the "Find my role" buttons row above the grid
    let chooserBody = grid.parentElement;
    while (chooserBody && !chooserBody.classList.contains('profile-track-chooser-body')) {
      chooserBody = chooserBody.parentElement;
    }
    if (chooserBody) {
      // Remove any previous v5 row
      const oldRow = chooserBody.querySelector('.v5-find-role-row');
      if (oldRow) oldRow.remove();

      const row = document.createElement('div');
      row.className = 'v5-find-role-row';
      row.innerHTML = `
        <button type="button" class="v5-find-role-btn" id="v5-start-test">🎯 Trouver mon rôle (4 questions)</button>
        <button type="button" class="v5-find-role-btn v5-find-role-btn--ghost" id="v5-skip-test">↓ Choisir au feeling</button>
      `;
      // Insert just before the grid
      grid.parentNode.insertBefore(row, grid);

      row.querySelector('#v5-start-test').addEventListener('click', startOrientationTest);
      row.querySelector('#v5-skip-test').addEventListener('click', () => {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    tracks.forEach(t => {
      const enr = getEnrichment(t.key);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'v5-track-card-enriched';
      card.dataset.trackKey = t.key;
      if (t.key === current) card.classList.add('is-current');
      card.style.setProperty('--card-color', enr.color);
      card.style.setProperty('--card-bg', enr.colorBg);
      card.style.setProperty('--card-border', enr.colorBorder);
      card.style.setProperty('--card-glow', enr.colorGlow);

      // Get full ranks list via Profile API
      let ranks = [];
      try {
        const data = window.Profile.getTrackData
          ? (t.key === current ? window.Profile.getTrackData() : null)
          : null;
        // listTracks returns ultimateRank only — get full ranks via getTrackLadder
        if (typeof window.Profile.getTrackLadder === 'function') {
          ranks = window.Profile.getTrackLadder(t.key) || [];
        }
      } catch (e) {
        console.warn('[profile-track-v5] getTrackLadder failed for', t.key, e);
      }

      const dotsHtml = ranks.length === 12
        ? ranks.map(r => `<span class="v5-tc-rank-dot" title="${escapeHtml(r.name)}">${r.emoji}</span>`).join('')
        : `<span style="color:rgba(255,255,255,.4);font-size:.7rem">12 grades de progression</span>`;

      const isCurrent = (t.key === current);

      card.innerHTML = `
        <div class="v5-tc-header">
          <span class="v5-tc-icon">${t.icon}</span>
          <div class="v5-tc-title-block">
            <div class="v5-tc-label">${escapeHtml(t.label)}</div>
            <div class="v5-tc-ambiance">${escapeHtml(t.ambiance)}</div>
          </div>
          ${isCurrent ? `<span class="v5-tc-current-tag">◉ Actuel</span>` : ''}
        </div>

        <div class="v5-tc-voie">${escapeHtml(enr.voie)}</div>

        <div class="v5-tc-section-label">Tes forces</div>
        <div class="v5-tc-forces">
          ${enr.forces.map(f => `<span class="v5-tc-force">${escapeHtml(f)}</span>`).join('')}
        </div>

        <div class="v5-tc-section-label">Progression — 12 grades</div>
        <div class="v5-tc-ladder">${dotsHtml}</div>

        <div class="v5-tc-sample">${escapeHtml(enr.sample)}</div>

        <div class="v5-tc-action-row">
          <span class="v5-tc-pick">${isCurrent ? 'Garder ce rôle' : 'Choisir ce rôle'}</span>
          <span class="v5-tc-card-arrow">→</span>
        </div>
      `;

      card.addEventListener('click', () => onPickTrack(t.key));
      grid.appendChild(card);
    });
  }

  function onPickTrack(trackKey) {
    if (!window.Profile) return;
    const cur = window.Profile.getTrack();
    if (cur && cur === trackKey) {
      // Just close
      const chooser = document.getElementById('profile-track-chooser');
      if (chooser) chooser.hidden = true;
      return;
    }
    if (cur && cur !== trackKey) {
      const tracks = window.Profile.listTracks();
      const t = tracks.find(x => x.key === trackKey);
      if (!t) return;
      const ok = window.confirm(
        `Changer de rôle pour « ${t.label} » ?\n\n` +
        `Ton XP, tes succès et ta progression sont conservés. Seul l'univers narratif change.`
      );
      if (!ok) return;
    }
    window.Profile.setTrack(trackKey);
    const chooser = document.getElementById('profile-track-chooser');
    if (chooser) chooser.hidden = true;
    // Refresh page to reload everything cleanly
    location.reload();
  }

  // ═══════════════════════════════════════════════════════════
  //  2. MINI-TEST D'ORIENTATION
  // ═══════════════════════════════════════════════════════════
  function startOrientationTest() {
    closeOrientationTest();

    const overlay = document.createElement('div');
    overlay.className = 'v5-test-overlay';
    overlay.id = 'v5-test-overlay';

    const state = {
      step: 0,
      scores: { investigator: 0, magistrate: 0, journalist: 0, hacker: 0 },
    };

    function renderStep() {
      if (state.step >= ORIENTATION_TEST.length) {
        renderResult();
        return;
      }
      const q = ORIENTATION_TEST[state.step];
      const dotsHtml = ORIENTATION_TEST
        .map((_, i) => `<div class="v5-test-progress-step ${i < state.step ? 'is-done' : ''}"></div>`)
        .join('');

      overlay.innerHTML = `
        <div class="v5-test-panel">
          <div class="v5-test-step-label">Question ${state.step + 1} / ${ORIENTATION_TEST.length}</div>
          <div class="v5-test-progress-track">${dotsHtml}</div>
          <div class="v5-test-question">${escapeHtml(q.q)}</div>
          <div class="v5-test-options" id="v5-test-options">
            ${q.options.map((o, i) => `
              <button type="button" class="v5-test-option" data-idx="${i}">
                ${escapeHtml(o.txt)}
              </button>
            `).join('')}
          </div>
          <div class="v5-test-actions">
            <button type="button" class="v5-test-btn" id="v5-test-cancel">Annuler</button>
            ${state.step > 0 ? '<button type="button" class="v5-test-btn" id="v5-test-back">← Retour</button>' : '<span></span>'}
          </div>
        </div>
      `;

      // Wire up
      overlay.querySelectorAll('.v5-test-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          const choice = q.options[idx];
          state.scores[choice.track] = (state.scores[choice.track] || 0) + 1;
          state.step++;
          renderStep();
        });
      });
      const cancel = overlay.querySelector('#v5-test-cancel');
      if (cancel) cancel.addEventListener('click', closeOrientationTest);
      const back = overlay.querySelector('#v5-test-back');
      if (back) back.addEventListener('click', () => {
        if (state.step > 0) {
          state.step--;
          // Re-decrement: we need to undo the last increment by removing it from scores
          // Simpler: don't track for back, just re-render and let user re-answer.
          renderStep();
        }
      });
    }

    function renderResult() {
      // Find winner (highest score, ties broken by order)
      const tracks = ['investigator', 'magistrate', 'journalist', 'hacker'];
      let best = tracks[0];
      let bestScore = state.scores[best] || 0;
      tracks.forEach(t => {
        if ((state.scores[t] || 0) > bestScore) {
          best = t;
          bestScore = state.scores[t];
        }
      });

      const tracksList = window.Profile.listTracks();
      const wonTrack = tracksList.find(t => t.key === best);
      const enr = getEnrichment(best);

      // Build "why" reasoning
      const sortedScores = tracks
        .map(t => ({ key: t, n: state.scores[t] || 0 }))
        .sort((a, b) => b.n - a.n);
      const second = sortedScores[1];

      let whyText;
      if (sortedScores[0].n === 4) {
        whyText = `Tu as choisi 4 réponses sur 4 alignées avec ce rôle. C'est très clair : c'est ta voie naturelle.`;
      } else if (sortedScores[0].n === sortedScores[1].n) {
        const secondTrack = tracksList.find(t => t.key === second.key);
        whyText = `Tu balances entre ${wonTrack.label} et ${secondTrack.label}. Les deux te conviendraient. On te propose ${wonTrack.label} (le premier qui ressort), mais essaie l'autre si tu hésites — tu pourras toujours changer.`;
      } else {
        whyText = `${sortedScores[0].n} de tes 4 réponses pointent vers ce rôle. Ton profil est dominant ${wonTrack.label}, avec une affinité secondaire pour ${tracksList.find(t => t.key === second.key).label}.`;
      }

      overlay.innerHTML = `
        <div class="v5-test-panel" style="--card-color:${enr.color};--card-bg:${enr.colorBg};--card-border:${enr.colorBorder};--card-glow:${enr.colorGlow}">
          <div class="v5-test-step-label">Résultat</div>
          <div class="v5-test-result-emoji">${wonTrack.icon}</div>
          <div class="v5-test-result-title">${escapeHtml(wonTrack.label)}</div>
          <div class="v5-test-result-rec">${escapeHtml(wonTrack.ambiance)}</div>
          <div class="v5-test-result-why">${escapeHtml(whyText)}</div>
          <div class="v5-test-result-actions">
            <button type="button" class="v5-test-result-btn" id="v5-test-confirm">Choisir ${escapeHtml(wonTrack.label)}</button>
            <button type="button" class="v5-test-result-btn v5-test-result-btn--ghost" id="v5-test-redo">Refaire</button>
            <button type="button" class="v5-test-result-btn v5-test-result-btn--ghost" id="v5-test-close">Voir les autres</button>
          </div>
        </div>
      `;

      overlay.querySelector('#v5-test-confirm').addEventListener('click', () => {
        closeOrientationTest();
        onPickTrack(best);
      });
      overlay.querySelector('#v5-test-redo').addEventListener('click', () => {
        state.step = 0;
        state.scores = { investigator: 0, magistrate: 0, journalist: 0, hacker: 0 };
        renderStep();
      });
      overlay.querySelector('#v5-test-close').addEventListener('click', closeOrientationTest);
    }

    document.body.appendChild(overlay);
    renderStep();

    // Allow Escape to close
    function escHandler(e) {
      if (e.key === 'Escape') {
        closeOrientationTest();
        document.removeEventListener('keydown', escHandler);
      }
    }
    document.addEventListener('keydown', escHandler);
  }

  function closeOrientationTest() {
    const ov = document.getElementById('v5-test-overlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }

  // ═══════════════════════════════════════════════════════════
  //  3. ROLE VISIBLE PARTOUT — banner thematic colors
  // ═══════════════════════════════════════════════════════════
  function themeBanner() {
    const banner = document.getElementById('profile-banner');
    if (!banner || !window.Profile) return;

    const trackKey = window.Profile.getTrack();
    if (!trackKey) return;
    const enr = getEnrichment(trackKey);
    const tracks = window.Profile.listTracks();
    const t = tracks.find(x => x.key === trackKey);
    if (!t) return;

    banner.classList.add('v5-themed');
    banner.style.setProperty('--v5-color', enr.color);
    banner.style.setProperty('--v5-color-bg', enr.colorBg);

    // Append track label as subtitle if not yet
    const idEl = banner.querySelector('.profile-banner__id');
    if (idEl && !idEl.querySelector('.v5-track-subtitle')) {
      const sub = document.createElement('span');
      sub.className = 'v5-track-subtitle';
      sub.textContent = `· ${t.label}`;
      sub.style.color = enr.color;
      idEl.appendChild(sub);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  4. PROMOTIONS CÉLÉBRÉES
  // ═══════════════════════════════════════════════════════════
  let lastKnownRankIdx = null;
  let lastKnownTrackKey = null;
  let promoQueue = [];
  let promoActive = false;

  function captureInitialRank() {
    if (!window.Profile) return;
    try {
      const snap = window.Profile.snapshot();
      lastKnownRankIdx = snap.rank ? snap.rank.idx : null;
      lastKnownTrackKey = snap.agent ? snap.agent.track : null;
    } catch (e) {
      console.warn('[v5] capture initial rank failed', e);
    }
  }

  function detectPromotion() {
    if (!window.Profile) return;
    try {
      const snap = window.Profile.snapshot();
      const idx = snap.rank ? snap.rank.idx : null;
      const trackKey = snap.agent ? snap.agent.track : null;

      // Skip if track changed (we don't celebrate that as promotion)
      if (lastKnownTrackKey && trackKey !== lastKnownTrackKey) {
        lastKnownTrackKey = trackKey;
        lastKnownRankIdx = idx;
        return;
      }

      if (lastKnownRankIdx !== null && idx !== null && idx > lastKnownRankIdx) {
        // PROMOTION!
        const ladder = window.Profile.getTrackLadder(trackKey);
        if (ladder && ladder[idx]) {
          promoQueue.push({
            rank: ladder[idx],
            idx,
            trackKey,
          });
          processPromoQueue();
        }
      }

      lastKnownRankIdx = idx;
      lastKnownTrackKey = trackKey;
    } catch (e) {
      console.warn('[v5] detectPromotion failed', e);
    }
  }

  function processPromoQueue() {
    if (promoActive || promoQueue.length === 0) return;
    promoActive = true;
    const item = promoQueue.shift();
    showPromotionToast(item.rank, item.idx);
  }

  function showPromotionToast(rank, rankIdx) {
    closePromotionToast(); // safety

    // Haptic feedback
    if (navigator.vibrate) {
      try { navigator.vibrate([60, 40, 90]); } catch (e) {}
    }

    const overlay = document.createElement('div');
    overlay.className = 'v5-promo-overlay';
    overlay.id = 'v5-promo-overlay';
    overlay.innerHTML = `
      <div class="v5-promo-card">
        <div class="v5-promo-label">🎉 Promotion</div>
        <div class="v5-promo-emoji">${rank.emoji || '👑'}</div>
        <div class="v5-promo-name">${escapeHtml(rank.name || 'Nouveau rang')}</div>
        <div class="v5-promo-flavor">"${escapeHtml(rank.flavor || '')}"</div>
        <div class="v5-promo-rank-label">Rang ${rankIdx + 1} / 12</div>
        <button type="button" class="v5-promo-dismiss" id="v5-promo-ok">CONTINUER</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Optional discrete sound
    playPromotionSound();

    overlay.querySelector('#v5-promo-ok').addEventListener('click', closePromotionToast);

    // Auto-dismiss after 5s
    const auto = setTimeout(closePromotionToast, 5000);
    overlay.dataset.autoDismiss = String(auto);

    // Allow Escape
    function esc(e) {
      if (e.key === 'Escape') {
        closePromotionToast();
        document.removeEventListener('keydown', esc);
      }
    }
    document.addEventListener('keydown', esc);
  }

  function closePromotionToast() {
    const ov = document.getElementById('v5-promo-overlay');
    if (!ov) return;
    if (ov.dataset.autoDismiss) {
      try { clearTimeout(parseInt(ov.dataset.autoDismiss, 10)); } catch (e) {}
    }
    ov.style.opacity = '0';
    ov.style.transition = 'opacity .3s';
    setTimeout(() => {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      promoActive = false;
      processPromoQueue();
    }, 300);
  }

  function playPromotionSound() {
    // Discrete chime via WebAudio. Skipped silently if AudioContext unavailable.
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, t: 0.00, dur: 0.18 }, // C5
        { freq: 659.25, t: 0.10, dur: 0.18 }, // E5
        { freq: 783.99, t: 0.20, dur: 0.32 }, // G5
      ];
      notes.forEach(n => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(n.freq, now + n.t);
        g.gain.setValueAtTime(0, now + n.t);
        g.gain.linearRampToValueAtTime(0.12, now + n.t + 0.02);
        g.gain.linearRampToValueAtTime(0, now + n.t + n.dur);
        o.connect(g).connect(ctx.destination);
        o.start(now + n.t);
        o.stop(now + n.t + n.dur + 0.02);
      });
      // Auto-close context to avoid leaks
      setTimeout(() => { try { ctx.close(); } catch (e) {} }, 1500);
    } catch (e) {
      // Ignore
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  HOOK INTO PROFILE LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  function installHooks() {
    if (!window.Profile) {
      console.warn('[profile-track-v5] Profile not available — skip');
      return;
    }

    // 1. Track initial rank for promotion detection
    captureInitialRank();

    // 2. Subscribe to all Profile changes
    window.Profile.onChange((reason) => {
      detectPromotion();
      // Re-theme banner if it changed
      themeBanner();
    });

    // 3. If on profile.html, watch for track-chooser opening to enrich
    if (document.getElementById('profile-track-chooser')) {
      // Use MutationObserver on `hidden` attribute of the chooser
      const chooser = document.getElementById('profile-track-chooser');
      const observer = new MutationObserver(() => {
        if (!chooser.hidden) {
          // Chooser opened — enrich after a tick (let original render finish)
          setTimeout(enrichTrackOptions, 80);
        }
      });
      observer.observe(chooser, { attributes: true, attributeFilter: ['hidden'] });

      // Also if chooser is already visible at boot
      if (!chooser.hidden) {
        setTimeout(enrichTrackOptions, 80);
      }
    }

    // 4. Theme the banner if present
    themeBanner();
    // Re-theme when banner is created later
    const observer = new MutationObserver(() => {
      const banner = document.getElementById('profile-banner');
      if (banner && !banner.classList.contains('v5-themed')) {
        themeBanner();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.__casProfileV5Installed = true;

    // Expose debug API
    window.casProfileV5 = {
      simulatePromotion: (rankIdx) => {
        if (!window.Profile) return;
        const trackKey = window.Profile.getTrack() || 'investigator';
        const ladder = window.Profile.getTrackLadder(trackKey);
        if (ladder && ladder[rankIdx]) {
          showPromotionToast(ladder[rankIdx], rankIdx);
        }
      },
      startTest: startOrientationTest,
      themeBanner,
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  BOOT
  // ═══════════════════════════════════════════════════════════
  function boot() {
    injectStyles();

    // Wait for Profile to be ready
    if (window.Profile) {
      installHooks();
    } else {
      // Poll briefly (cas-in-profile.js loads with defer)
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (window.Profile) {
          clearInterval(poll);
          installHooks();
        } else if (tries > 30) {
          clearInterval(poll);
          console.warn('[profile-track-v5] Profile never loaded after 3s');
        }
      }, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50));
  } else {
    setTimeout(boot, 50);
  }
})();
