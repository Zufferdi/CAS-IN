/**
 * CAS-IN — Scene Lobby UX v3
 * ──────────────────────────────────────────────────────────────
 * Améliorations non-intrusives au lobby des scénarios :
 *  1. Carte « Continuer » si un scénario est en cours
 *  2. Parcours pédagogiques (13 collections curated)
 *  3. Tri (recommandé / difficulté / récent / à reprendre)
 *  4. Filtres avancés : par atmosphère et canton
 *  5. Achievements de découverte (8 nouveaux badges)
 *
 * Le patch s'auto-attache après l'init du lobby existant.
 * Il n'écrase rien : il enveloppe les fonctions globales et étend
 * GLOBAL_BADGES en ajoutant ses badges via push().
 *
 * Compatible avec scene-app.js v2.8+ et fonctionne par-dessus
 * scene-ux-patch.js sans conflit.
 */
(function() {
  'use strict';

  // ──────────────────────────────────────────────────────────
  //  PARCOURS — collections pédagogiques curated
  // ──────────────────────────────────────────────────────────
  const PARCOURS = [
    {
      id: 'fondamentaux', icon: '🎓', title: 'Fondamentaux DFIR',
      desc: 'Les bases : chaîne de custody, premiers gestes, métadonnées, mail suspect. Idéal pour démarrer.',
      level: 'easy',
      scenes: ['custody','premier_appel','phishing','metadata','trois_artefacts','smartphone','frontieres','conclusion','ip_accusatrice','bitlocker']
    },
    {
      id: 'procedure_penale', icon: '⚖️', title: 'Procédure pénale suisse',
      desc: 'CPP, perquisition, TMC, secret de fonction, mineurs. Le cœur du droit pénal numérique.',
      level: 'medium',
      scenes: ['premier_appel','frontieres','telephone-scelles','perquisition-conjugale','tmc-refus-surveillance','competence-mpc-vs','specialite-eimp','osint-licite','secret-fonction-parlementaire','mineur-etranger-garde-a-vue']
    },
    {
      id: 'ransomware_a_z', icon: '💀', title: 'Ransomware A→Z',
      desc: 'Du premier réflexe au démantèlement, en passant par hôpitaux, supply chain et conflits CH-USA.',
      level: 'medium',
      scenes: ['ransomware','lockbit-victime','ransomware_raid','vetroz-akira','comparis_2021','stadler_2020','unine_2022','saxon-curatelle','supply_chain_sante','ransomware-hopital-doj-conflit','swissport_2022']
    },
    {
      id: 'ia_deepfakes', icon: '🤖', title: 'IA, deepfakes & droit',
      desc: 'Voice clones, deepfakes électoraux, IA générative en faux titres, audio en garde à vue.',
      level: 'hard',
      scenes: ['clone-vocal','kks-deepfake','rajeunissement-ia','deepfake-electoral','deepfake-audio-garde-a-vue','ia-generative-faux-titres']
    },
    {
      id: 'cooperation_internationale', icon: '🌐', title: 'Coopération internationale',
      desc: 'EIMP, MLAT, Eurojust, conflits de juridiction CH-USA et CH-Émirats.',
      level: 'hard',
      scenes: ['specialite-eimp','mros-banquier','banque-privee-mlat','ransomware-hopital-doj-conflit','crypto-stalking-airtag-emirats','coup-de-filet-europol-27-pays','eu-revil-attribution','eu-traite-roumain','eu-livestream-philippines','eu-endgame-botnets','eu-kidflix-stream']
    },
    {
      id: 'darknet_pj', icon: '🥷', title: 'Darknet & enquête couverte',
      desc: 'Infiltrations, agents sous identité fictive, démantèlements coordonnés.',
      level: 'hard',
      scenes: ['darkmarket_2021','operation-alice','xplain-play','stgall-infiltration','infostealer-magnus','agent-infiltre-darknet-14-mois','coup-de-filet-europol-27-pays','poweroff-ddos','ncmec-cypertip']
    },
    {
      id: 'infrastructures_critiques', icon: '🏥', title: 'Infrastructures critiques',
      desc: 'Hôpitaux, OT/ICS, e-voting, barrages, supply chain fédérale.',
      level: 'hard',
      scenes: ['ransomware','supply_chain_sante','swatch-2020-ot','cistec-2025-sante','hydro-valais','evoting-cantonal','xplain','xplain-lmp','palais_federal','cicr_2022','eu-ghgo-ddos']
    },
    {
      id: 'cas_2024_2026', icon: '📰', title: 'Affaires récentes 2024-2026',
      desc: 'Les cas qui ont marqué la Suisse romande ces 24 derniers mois.',
      level: 'medium',
      scenes: ['vetroz-akira','saxon-curatelle','sati-bec','jura-vishing-1m','sms-blasters','rajeunissement-ia','cistec-2025-sante','faux-policiers','banquier-fantome','boutique-fantome']
    },
    {
      id: 'forensique_avancee', icon: '🔬', title: 'Forensique avancée',
      desc: 'Memory, IoT, cloud, ADN généalogique, attribution APT — les techniques pointues.',
      level: 'hard',
      scenes: ['attribution','fileless','timeline','bitlocker_froid','veracrypt','memory-forensics-volatility','iot-camera-compromise','cloud-aws-s3-leak','adn-genealogique-cold-case','ruag_2016','noname_2023']
    },
    {
      id: 'social_engineering', icon: '🎭', title: 'Social engineering & fraude',
      desc: 'Vishing, BEC, fraude au CEO, faux policiers, escroqueries au retraité.',
      level: 'medium',
      scenes: ['phishing','virement','sati-bec','clone-vocal','faux-policiers','jura-vishing-1m','banquier-fantome','eu-cyber-trading-fraud','mros-banquier','eu-crypto-kidnapping','dab-villaz']
    },
    {
      id: 'fuites_donnees', icon: '🩹', title: 'Fuites de données',
      desc: 'Xplain, France Travail, Free, sous-traitants, RGPD vs LPD.',
      level: 'medium',
      scenes: ['xplain','xplain-lmp','xplain-play','swisscom_2018','eu-france-travail','eu-free-leak','cloud-aws-s3-leak','whistleblower-ddps']
    },
    {
      id: 'sensibles_humain', icon: '💔', title: 'Cas sensibles & humains',
      desc: 'Mineur étranger, suicide assisté, harcèlement, violence conjugale, pédocriminalité.',
      level: 'hard',
      scenes: ['mineur-etranger-garde-a-vue','exit-suicide-assiste-conteste','crypto-stalking-airtag-emirats','harcelement-ne','rajeunissement-ia','ncmec-cypertip','operation-alice','eu-livestream-philippines','eu-traite-roumain','delemont-forum']
    },
    {
      id: 'diplomatique_securite', icon: '🏛', title: 'Sécurité d\'État & diplomatie',
      desc: 'Bürgenstock, RUAG, Palais fédéral, lanceurs d\'alerte, secret de fonction.',
      level: 'hard',
      scenes: ['ruag_2016','palais_federal','noname_2023','burgenstock-neutralite','whistleblower-ddps','secret-fonction-parlementaire','cicr_2022']
    },
    // ─────────────────────────────────────────────────────────
    // v2.88 — Campagnes centrées PNJ (storytelling renforcé)
    // ─────────────────────────────────────────────────────────
    {
      id: 'bureau_nicolet', icon: '⚖️', title: 'Sur le bureau du procureur Nicolet',
      desc: 'Suivez les dossiers du procureur fédéral Yves Nicolet (MPC). De la compétence à l\'entraide internationale, 7 affaires traversent ses mains.',
      level: 'medium',
      scenes: ['conclusion','competence-mpc-vs','clone-vocal','comparis_2021','attribution','coup-de-filet-europol-27-pays','attentat-deja-couteau-mineur']
    },
    {
      id: 'labo_bachmann', icon: '🔬', title: 'Les expertises du labo Bachmann (KAPO ZH)',
      desc: 'M. Bachmann, chef du labo cyber-forensics zurichois, vous accompagne sur 7 expertises techniques : custody, mémoire, BitLocker, attribution.',
      level: 'medium',
      scenes: ['custody','bitlocker','conclusion','bitlocker_froid','attribution','memory-forensics-volatility','adn-genealogique-cold-case']
    },
    // ─────────────────────────────────────────────────────────
    // v2.89 — Affaire Sarine : campagne narrative complète
    // 5 scènes nouvelles + 6 scènes existantes liées au canton FR
    // ─────────────────────────────────────────────────────────
    {
      id: 'affaire_sarine', icon: '🏰', title: 'L\'Affaire Sarine — Fil rouge fribourgeois',
      desc: 'Une PME, une coopérative, un club de hockey. Tous frappés par le même groupe. Suivez la procureure Genoud, le Cap. Schmid, Dr Jendly et Me Bersier sur 11 scènes entremêlées : du premier appel à l\'audience.',
      level: 'medium',
      scenes: [
        'fr-affaire-sarine-1-premier-appel',
        'easy-mobile-perdu-train',
        'gruyere-coop-affinage-stuxnet',
        'fr-affaire-sarine-2-eimp-stuttgart',
        'fr-affaire-sarine-3-coordination-cantons',
        'hcfr-bec-transfer-deepfake',
        'fr-affaire-sarine-4-expertise-unifr',
        'flubot-bec-cascade',
        'dab-villaz',
        'cyber-justicier-vigilante-fr',
        'fr-affaire-sarine-5-audience-recevabilite'
      ]
    },

    // ─────────────────────────────────────────────────────────
    //  PARCOURS « L'AFFAIRE DE LA VIÈGE » — Fil rouge valaisan (v2.91)
    //  7 scènes nouvelles + 5 scènes existantes liées (BTP/SCADA/EIMP/MPC)
    //  Avalanche Saas-Almagell · OSINT Bricolage Brig · Mercure Lonza Visp ·
    //  SCADA Mattmark · EIMP Milano · Perquisition Brig · Audience Sion
    // ─────────────────────────────────────────────────────────
    {
      id: 'affaire_viege', icon: '🏔', title: 'L\'Affaire de la Viège — Fil rouge valaisan',
      desc: 'Une avalanche, du mercure, un barrage. Trois enquêtes, un seul réseau — entre Saas Fee et Reggio Calabria. Avec l\'Insp. Salamin, M. Crittin (MP-VS), la lanceuse d\'alerte Imseng et Me Schnyder en face. 12 scènes, du premier sondage RECCO à l\'audience cantonale.',
      level: 'hard',
      scenes: [
        'vs-affaire-viege-1-avalanche-saas',
        'osint-licite',
        'vs-affaire-viege-2-osint-bricolage',
        'vs-affaire-viege-3-mercure-lonza',
        'hydro-valais',
        'vs-affaire-viege-4-scada-mattmark',
        'valais-cascade-12-communes',
        'specialite-eimp',
        'vs-affaire-viege-5-eimp-milano',
        'competence-mpc-vs',
        'vs-affaire-viege-6-perquisition-brig',
        'vs-affaire-viege-7-audience-tribunal'
      ]
    },
  ];

  // Export pour scene-lobby-pitch-v1.js (panneau pitch enrichi)
  if (typeof window !== 'undefined') {
    window.CAS_IN_PARCOURS = PARCOURS;
  }

  // ──────────────────────────────────────────────────────────
  //  ATMOSPHÈRES — labels FR
  // ──────────────────────────────────────────────────────────
  const ATMOSPHERE_LABELS = {
    'legal':      { label: 'Légal',       color: 'var(--purple)', icon: '⚖️' },
    'network':    { label: 'Réseau',      color: 'var(--cyan)',   icon: '🌐' },
    'ransomware': { label: 'Ransomware',  color: 'var(--red)',    icon: '💀' },
    'crypto':     { label: 'Crypto',      color: 'var(--gold)',   icon: '🔐' },
    'hospital':   { label: 'Hôpital',     color: 'var(--blue)',   icon: '🏥' },
    'state':      { label: 'État',        color: 'var(--gold)',   icon: '🏛' },
    'raid':       { label: 'Terrain',     color: 'var(--orange)', icon: '🚓' },
  };

  // ──────────────────────────────────────────────────────────
  //  STATE
  // ──────────────────────────────────────────────────────────
  let activeParcoursId = null;        // null = tous, sinon id du parcours filtré
  let activeAtmosphere = null;
  let activeCanton = null;
  let activeSort = 'recommended';     // recommended | difficulty | recent | worst-score
  let parcoursPanelOpen = (() => {
    // v2.80 — ouvert par défaut au premier load, persistance ensuite
    try {
      const v = localStorage.getItem('casIn_parcoursPanelOpen');
      return v === null ? true : v === 'true';
    } catch { return true; }
  })();

  // ──────────────────────────────────────────────────────────
  //  STORAGE — bouton Continuer
  // ──────────────────────────────────────────────────────────
  // On track l'« en cours » via localStorage. Mis à jour quand
  // le joueur abandonne (retour lobby pendant une scène) et
  // effacé quand il termine (showReport sauve scene_results).
  const INFLIGHT_KEY = 'cas_inflight';

  function getInflight() {
    try {
      const j = localStorage.getItem(INFLIGHT_KEY);
      return j ? JSON.parse(j) : null;
    } catch (e) { return null; }
  }
  function setInflight(data) {
    try { localStorage.setItem(INFLIGHT_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function clearInflight() {
    try { localStorage.removeItem(INFLIGHT_KEY); } catch (e) {}
  }

  // ──────────────────────────────────────────────────────────
  //  STYLES (injectés une fois)
  // ──────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('lobby-v3-styles')) return;
    const s = document.createElement('style');
    s.id = 'lobby-v3-styles';
    s.textContent = `
      /* ── Continuer ── v2.88 enrichie ── */
      .continue-card{
        background:linear-gradient(135deg, rgba(0,229,204,.14), rgba(106,184,255,.08));
        border:1.5px solid var(--cyan);
        border-radius:var(--r);
        padding:16px 18px;
        margin-bottom:14px;
        display:flex;align-items:center;gap:14px;
        cursor:pointer;
        transition:.2s;
        position:relative;
        box-shadow:0 0 28px rgba(0,229,204,.18), inset 0 1px 0 rgba(255,255,255,.05);
        overflow:hidden;
      }
      /* Halo pulsant subtil pour attirer l'œil */
      .continue-card::before{
        content:'';
        position:absolute;
        inset:0;
        border-radius:var(--r);
        box-shadow:0 0 0 0 rgba(0,229,204,.45);
        animation:continue-pulse 2.4s ease-in-out infinite;
        pointer-events:none;
      }
      @keyframes continue-pulse{
        0%,100%{box-shadow:0 0 0 0 rgba(0,229,204,.0)}
        50%{box-shadow:0 0 0 6px rgba(0,229,204,.10)}
      }
      .continue-card:hover{transform:translateY(-2px);box-shadow:0 4px 36px rgba(0,229,204,.30)}
      .continue-card:hover::before{animation:none}
      .continue-card-icon{font-size:36px;flex-shrink:0;line-height:1;filter:drop-shadow(0 0 10px rgba(0,229,204,.6))}
      .continue-card-body{flex:1;min-width:0}
      .continue-card-label{
        display:inline-flex;align-items:center;gap:4px;
        font-size:10px;font-weight:800;color:var(--cyan);letter-spacing:1.6px;
        font-family:var(--font-mono);margin-bottom:4px;
        background:rgba(0,229,204,.15);padding:3px 8px;border-radius:3px;
        text-transform:uppercase;
      }
      .continue-card-title{font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .continue-card-meta{font-size:11px;color:var(--dim);font-family:var(--font-mono);margin-bottom:6px}
      /* Barre de progression visuelle */
      .continue-card-progress{
        height:4px;background:rgba(255,255,255,.06);
        border-radius:2px;overflow:hidden;margin-top:4px;max-width:300px;
      }
      .continue-card-progress-fill{
        height:100%;background:linear-gradient(90deg,var(--cyan),#6fd2ff);
        border-radius:2px;
        transition:width .6s cubic-bezier(.34,1.56,.64,1);
      }
      .continue-card-action{
        font-size:12px;color:#fff;font-weight:800;letter-spacing:.5px;
        flex-shrink:0;font-family:var(--font-mono);
        background:var(--cyan);padding:8px 14px;border-radius:6px;
        box-shadow:0 4px 14px rgba(0,229,204,.4);
        transition:transform .2s;
      }
      .continue-card:hover .continue-card-action{transform:scale(1.05)}
      .continue-card-dismiss{
        position:absolute;top:10px;right:10px;
        font-size:14px;color:var(--dim);
        background:transparent;border:1px solid var(--border);
        width:22px;height:22px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;line-height:1;
        transition:.15s;
        z-index:2;
      }
      .continue-card-dismiss:hover{color:var(--red);border-color:var(--red)}

      /* ── Parcours panel ── */
      .parcours-section{
        background:linear-gradient(135deg, rgba(74, 158, 255, 0.06) 0%, rgba(255, 208, 112, 0.04) 100%);
        border:1px solid rgba(74, 158, 255, 0.25);
        border-radius:var(--r);
        margin-bottom:14px;
        overflow:hidden;
        position:relative;
      }
      .parcours-section::before{
        content:'';position:absolute;top:0;left:0;right:0;height:2px;
        background:linear-gradient(90deg,transparent,rgba(74,158,255,0.6),transparent);
      }
      .parcours-header{
        display:flex;align-items:center;justify-content:space-between;
        padding:14px 18px;cursor:pointer;
        user-select:none;
      }
      .parcours-header:hover{background:rgba(74,158,255,0.06)}
      .parcours-title{
        font-family:var(--font-mono),'JetBrains Mono',monospace;
        font-size:13px;font-weight:700;letter-spacing:0.08em;
        text-transform:uppercase;color:#4a9eff;
        display:flex;align-items:center;gap:8px;
      }
      .parcours-count{font-size:10px;color:var(--dim);font-family:var(--font-mono);font-weight:700;background:rgba(74,158,255,0.1);padding:2px 8px;border-radius:3px}
      .parcours-chevron{font-size:11px;color:var(--dim);transition:.2s}
      .parcours-section.open .parcours-chevron{transform:rotate(180deg)}
      .parcours-grid{
        display:none;
        padding:0 14px 14px;
        gap:10px;
        grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));
      }
      .parcours-section.open .parcours-grid{display:grid}
      .parcours-card{
        background:rgba(8, 14, 26, 0.5);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:8px;
        padding:12px 14px;
        cursor:pointer;
        transition:.18s;
        position:relative;
        overflow:hidden;
      }
      .parcours-card:hover{border-color:var(--cyan);transform:translateY(-2px);background:rgba(0,229,204,.06);box-shadow:0 4px 16px rgba(0,229,204,.1)}
      .parcours-card.active{border-color:var(--cyan);background:rgba(0,229,204,.1);box-shadow:0 0 0 1px var(--cyan), 0 4px 20px rgba(0,229,204,0.15)}
      .parcours-card.in-progress{border-color:rgba(255,208,112,.4);background:rgba(255,208,112,0.04)}
      .parcours-card.completed{border-color:var(--green);background:rgba(50,180,100,0.06)}

      /* v2.88 — Bandeau d'état en haut de la carte */
      .parcours-card-state{
        display:flex;align-items:center;gap:6px;
        margin:-12px -14px 10px;
        padding:5px 12px;
        background:rgba(255,255,255,0.03);
        border-bottom:1px solid rgba(255,255,255,0.06);
        font-family:var(--font-mono);
        font-size:9.5px;
        font-weight:700;
        letter-spacing:0.06em;
      }
      .parcours-card.in-progress .parcours-card-state{
        background:rgba(255,208,112,0.08);
        border-bottom-color:rgba(255,208,112,0.2);
      }
      .parcours-card.completed .parcours-card-state{
        background:rgba(50,180,100,0.08);
        border-bottom-color:rgba(50,180,100,0.25);
      }
      .parcours-card-state-icon{font-size:11px;line-height:1}
      .parcours-card-state-label{
        color:rgba(255,255,255,0.55);
        text-transform:uppercase;
        letter-spacing:0.12em;
      }
      .parcours-card.in-progress .parcours-card-state-label{color:#ffd070}
      .parcours-card.completed .parcours-card-state-label{color:#6fd29c}
      .parcours-card-state-xp{
        margin-left:auto;
        color:#6fd29c;
        font-weight:800;
        font-size:9.5px;
        letter-spacing:0.04em;
      }

      /* v2.88 — Badge trophée pour campagnes complétées */
      .parcours-card-badge{
        position:absolute;
        top:6px;
        right:8px;
        font-size:18px;
        line-height:1;
        animation:parcours-badge-shine 3s ease-in-out infinite;
        z-index:2;
        text-shadow:0 2px 6px rgba(255,208,112,0.5);
      }
      @keyframes parcours-badge-shine{
        0%,100%{transform:scale(1) rotate(0deg);filter:drop-shadow(0 0 4px rgba(255,208,112,0.4))}
        50%{transform:scale(1.1) rotate(-3deg);filter:drop-shadow(0 0 10px rgba(255,208,112,0.7))}
      }
      /* v2.88 — Cacher le ✓ legacy quand on a le badge */
      .parcours-card.completed::after{display:none}

      .parcours-card-icon{font-size:24px;margin-bottom:8px;line-height:1}
      .parcours-card-title{font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px;line-height:1.3}
      .parcours-card-desc{font-size:11px;color:var(--dim);line-height:1.45;margin-bottom:10px;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .parcours-card-progress{
        display:flex;align-items:center;gap:8px;
        font-size:10px;color:var(--dim);font-family:var(--font-mono);font-weight:700
      }
      .parcours-progress-bar{flex:1;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden}
      .parcours-progress-fill{height:100%;background:linear-gradient(90deg,var(--cyan) 0%,#7affea 100%);transition:width .4s}
      .parcours-card.in-progress .parcours-progress-fill{background:linear-gradient(90deg,#ffd070 0%,#ffac3a 100%)}
      .parcours-card.completed .parcours-progress-fill{background:var(--green)}

      /* Active parcours banner */
      .parcours-active-banner{
        background:linear-gradient(90deg, rgba(0,229,204,.10), rgba(0,229,204,.02));
        border:1px solid var(--cyan);
        border-radius:var(--r);
        padding:9px 14px;
        margin-bottom:10px;
        display:flex;align-items:center;justify-content:space-between;gap:10px;
      }
      .parcours-active-info{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);min-width:0}
      .parcours-active-icon{font-size:18px;flex-shrink:0}
      .parcours-active-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .parcours-active-text strong{color:var(--cyan)}
      .parcours-clear-btn{
        background:transparent;border:1px solid var(--border);
        color:var(--dim);font-size:10px;padding:4px 10px;border-radius:4px;
        cursor:pointer;font-family:var(--font-mono);font-weight:700;
        transition:.15s;flex-shrink:0;
      }
      .parcours-clear-btn:hover{color:var(--text);border-color:var(--text)}

      /* ── Sort + Atmosphere chips (extension de la barre filtres) ── */
      .lobby-advanced-row{
        display:flex;flex-wrap:wrap;gap:6px;align-items:center;
        padding-top:6px;border-top:1px dashed var(--border);
      }
      .lobby-adv-label{
        font-size:10px;color:var(--dim);font-family:var(--font-mono);
        font-weight:700;letter-spacing:.5px;margin-right:4px;flex-shrink:0;
      }
      .sort-select{
        background:var(--surface2);border:1px solid var(--border);
        color:var(--text);font-family:var(--font-mono);
        font-size:11px;padding:4px 8px;border-radius:4px;
        cursor:pointer;outline:none;font-weight:700;
      }
      .sort-select:hover{border-color:var(--cyan)}
      .atm-chip{
        padding:3px 9px;border-radius:14px;font-size:10px;font-weight:700;
        border:1px solid var(--border);background:transparent;color:var(--dim);
        cursor:pointer;transition:.15s;font-family:var(--font-mono);
        display:inline-flex;align-items:center;gap:4px;
      }
      .atm-chip:hover{filter:brightness(1.4)}
      .atm-chip.active{box-shadow:0 0 0 1px currentColor}

      /* ── Improvement: scene-grid header counter pinned right ── */
      .grid-header{display:flex;justify-content:space-between;align-items:center;
        margin-top:14px;margin-bottom:8px;padding:0 2px;
      }
      .grid-header-label{font-size:11px;color:var(--dim);font-family:var(--font-mono);
        font-weight:700;letter-spacing:1px}
      .grid-header-progress{font-size:11px;color:var(--cyan);font-family:var(--font-mono);font-weight:700}

      /* Mobile tweaks */
      @media (max-width:640px){
        .parcours-grid{grid-template-columns:1fr 1fr;gap:6px;padding:0 10px 10px}
        .parcours-card{padding:9px 10px}
        .parcours-card-icon{font-size:18px}
        .continue-card{padding:11px 12px;gap:10px}
        .continue-card-icon{font-size:26px}
        .continue-card-title{font-size:13px}
        .lobby-advanced-row{gap:4px}
        .atm-chip{padding:2px 7px;font-size:9px}
      }
    `;
    document.head.appendChild(s);
  }

  // ──────────────────────────────────────────────────────────
  //  ENRICH FILTER BAR — adds atm chips + sort + adv-row
  // ──────────────────────────────────────────────────────────
  function enrichFilterBar() {
    const bar = document.getElementById('lobby-filter-bar');
    if (!bar || bar.dataset.v3enriched) return;
    bar.dataset.v3enriched = '1';

    const advRow = document.createElement('div');
    advRow.className = 'lobby-advanced-row';

    // Sort selector
    const sortLabel = document.createElement('span');
    sortLabel.className = 'lobby-adv-label';
    sortLabel.textContent = 'Tri';
    const sortSelect = document.createElement('select');
    sortSelect.className = 'sort-select';
    sortSelect.id = 'lobby-sort';
    sortSelect.innerHTML = `
      <option value="recommended">Recommandé</option>
      <option value="difficulty">Difficulté ↑</option>
      <option value="difficulty-desc">Difficulté ↓</option>
      <option value="recent">Récents d'abord</option>
      <option value="worst-score">À reprendre (≤80%)</option>
    `;
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      sortAndRedraw();
    });

    advRow.appendChild(sortLabel);
    advRow.appendChild(sortSelect);

    // Spacer
    const spacer = document.createElement('span');
    spacer.style.cssText = 'width:6px;height:1px';
    advRow.appendChild(spacer);

    // Atmosphere chips
    const atmLabel = document.createElement('span');
    atmLabel.className = 'lobby-adv-label';
    atmLabel.textContent = 'Atmosphère';
    advRow.appendChild(atmLabel);

    Object.entries(ATMOSPHERE_LABELS).forEach(([key, def]) => {
      const chip = document.createElement('button');
      chip.className = 'atm-chip';
      chip.dataset.atm = key;
      chip.style.cssText = `--c:${def.color}`;
      chip.innerHTML = `<span style="filter:none">${def.icon}</span> ${def.label}`;
      chip.addEventListener('click', () => {
        if (activeAtmosphere === key) {
          activeAtmosphere = null;
          chip.classList.remove('active');
          chip.style.color = '';
          chip.style.borderColor = '';
        } else {
          activeAtmosphere = key;
          document.querySelectorAll('.atm-chip').forEach(c => {
            c.classList.remove('active');
            c.style.color = '';
            c.style.borderColor = '';
          });
          chip.classList.add('active');
          chip.style.color = def.color;
          chip.style.borderColor = def.color;
          chip.style.background = `${def.color}1a`;
        }
        applyAllFilters();
      });
      advRow.appendChild(chip);
    });

    bar.appendChild(advRow);

    // v2.60 — Rangée filtre canton (drapeaux SVG)
    addCantonFilterRow(bar);
  }

  // ──────────────────────────────────────────────────────────
  //  CANTON FILTER ROW (v2.60)
  //  Affiche une rangée de drapeaux SVG des cantons utilisés.
  //  Cliquer un drapeau filtre les scènes par regionDetail.code.
  //  Cliquer à nouveau le même → désactive.
  // ──────────────────────────────────────────────────────────
  function addCantonFilterRow(bar) {
    if (typeof SCENES === 'undefined') return;

    // Dénombrer scènes par code canton
    const counts = {};
    SCENES.forEach(s => {
      const code = s.regionDetail && s.regionDetail.code;
      if (!code) return;
      // v2.62 — Regrouper CHF (Confédération) + CH (Suisse) sous 'CHF' (52+19 = 71 scènes)
      // pour libérer de la place visuelle aux cantons précis dans le lobby
      const grouped = (code === 'CH') ? 'CHF' : code;
      counts[grouped] = (counts[grouped] || 0) + 1;
    });

    if (Object.keys(counts).length < 2) return; // Pas assez de variation

    // Ordre privilégié : les cantons précis d'abord, puis CHF/CH, puis étrangers
    const PRIORITY = ['VD','VS','GE','NE','JU','ZH','FR','BS','BE','TI','SG','SO','ZG',
                      'AG','LU','TG','SZ','GR','UR',
                      'CHF','CH','EU','FR-EU','CN','INTL'];
    const sortedCodes = Object.keys(counts).sort((a, b) => {
      const ia = PRIORITY.indexOf(a);
      const ib = PRIORITY.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    const cantonRow = document.createElement('div');
    cantonRow.className = 'lobby-advanced-row lobby-canton-row';

    const label = document.createElement('span');
    label.className = 'lobby-adv-label';
    label.textContent = 'Région';
    cantonRow.appendChild(label);

    // Mapping code → nom lisible (pour tooltip)
    const NAMES = {
      'VD': 'Vaud', 'VS': 'Valais', 'GE': 'Genève', 'NE': 'Neuchâtel',
      'JU': 'Jura', 'ZH': 'Zurich', 'FR': 'Fribourg', 'BS': 'Bâle-Ville',
      'BE': 'Berne', 'TI': 'Tessin', 'SG': 'Saint-Gall', 'SO': 'Soleure',
      'ZG': 'Zoug', 'AG': 'Argovie', 'LU': 'Lucerne', 'TG': 'Thurgovie',
      'SZ': 'Schwyz', 'GR': 'Grisons', 'UR': 'Uri',
      'CHF': 'Confédération / Suisse', 'CH': 'Suisse',
      'EU': 'Europe', 'FR-EU': 'France', 'CN': 'Chine', 'INTL': 'International',
    };

    sortedCodes.forEach(code => {
      const chip = document.createElement('button');
      chip.className = 'canton-chip';
      chip.dataset.canton = code;
      const name = NAMES[code] || code;
      chip.title = `${name} — ${counts[code]} scénario${counts[code] > 1 ? 's' : ''}`;

      // Icône : SVG si SwissFlags dispo, sinon emoji fallback
      let icon = '';
      if (window.SwissFlags && typeof window.SwissFlags.get === 'function') {
        icon = window.SwissFlags.get(code);
      } else {
        icon = code === 'EU' ? '🇪🇺' : code === 'FR-EU' ? '🇫🇷' :
               code === 'CN' ? '🇨🇳' : code === 'INTL' ? '🌍' : '🇨🇭';
      }
      chip.innerHTML = `<span class="canton-chip-flag">${icon}</span><span class="canton-chip-count">${counts[code]}</span>`;

      chip.addEventListener('click', () => {
        if (activeCanton === code) {
          activeCanton = null;
          chip.classList.remove('active');
        } else {
          activeCanton = code;
          document.querySelectorAll('.canton-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        }
        applyAllFilters();
      });
      cantonRow.appendChild(chip);
    });

    bar.appendChild(cantonRow);
  }

  // ──────────────────────────────────────────────────────────
  //  CONTINUE CARD
  // ──────────────────────────────────────────────────────────
  function renderContinueCard() {
    const inflight = getInflight();
    if (!inflight || !inflight.sceneId || typeof SCENES === 'undefined') return;

    const scene = SCENES.find(s => s.id === inflight.sceneId);
    if (!scene) { clearInflight(); return; }

    // Already complete?
    const saved = lsGet('scene_results', {});
    if (saved[inflight.sceneId]) { clearInflight(); return; }

    // Don't show if older than 7 days
    const ageDays = (Date.now() - (inflight.lastSeen || 0)) / 86400000;
    if (ageDays > 7) { clearInflight(); return; }

    const sceneGrid = document.getElementById('scene-grid');
    if (!sceneGrid) return;

    // Remove any existing
    document.querySelectorAll('.continue-card').forEach(c => c.remove());

    const total = scene.stepCount || (scene.steps && scene.steps.length) || 5;
    const stepReached = (inflight.stepIdx || 0) + 1;
    const pct = Math.round((stepReached / total) * 100);

    const card = document.createElement('div');
    card.className = 'continue-card';
    card.innerHTML = `
      <button class="continue-card-dismiss" title="Effacer la progression" aria-label="Effacer">×</button>
      <div class="continue-card-icon">${scene.icon || '⏯️'}</div>
      <div class="continue-card-body">
        <div class="continue-card-label">▶ REPRENDRE</div>
        <div class="continue-card-title">${scene.title}</div>
        <div class="continue-card-meta">Étape ${stepReached}/${total} · ${pct}% · ${formatRelativeTime(inflight.lastSeen)}</div>
        <div class="continue-card-progress"><div class="continue-card-progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="continue-card-action">REPRENDRE →</div>
    `;

    card.querySelector('.continue-card-dismiss').addEventListener('click', e => {
      e.stopPropagation();
      clearInflight();
      card.remove();
    });

    card.addEventListener('click', () => {
      if (typeof hydrateScene === 'function' && typeof startScene === 'function') {
        hydrateScene(scene).then(startScene).catch(err => {
          console.error('[lobby-v3] continue failed', err);
        });
      }
    });

    // Insert at the very top of scene-grid
    sceneGrid.insertBefore(card, sceneGrid.firstChild);
  }

  function formatRelativeTime(ts) {
    if (!ts) return 'récemment';
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'à l\'instant';
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    return `il y a ${d}j`;
  }

  // ──────────────────────────────────────────────────────────
  //  PARCOURS PANEL
  // ──────────────────────────────────────────────────────────
  function renderParcoursSection() {
    // v3.X — Panneau Campagnes retiré du lobby : la vue dédiée
    // screen-campaigns (scene-campaigns-v1.js) remplit ce rôle.
    // On retire l'éventuel panneau résiduel (rendu avant ce patch) et on sort.
    const _prev = document.getElementById('parcours-section');
    if (_prev) _prev.remove();
    return;
    // ───── code original ci-dessous, conservé pour historique ─────
    if (typeof SCENES === 'undefined') return;

    // Remove any previous
    const prev = document.getElementById('parcours-section');
    if (prev) prev.remove();

    const saved = lsGet('scene_results', {});
    const filterBar = document.getElementById('lobby-filter-bar');
    if (!filterBar) return;

    const section = document.createElement('div');
    section.className = 'parcours-section' + (parcoursPanelOpen ? ' open' : '');
    section.id = 'parcours-section';

    const validIds = new Set(SCENES.map(s => s.id));
    const totalScenes = PARCOURS.reduce((sum, p) => {
      return sum + p.scenes.filter(id => validIds.has(id)).length;
    }, 0);

    const completedParcours = PARCOURS.filter(p =>
      p.scenes.filter(id => validIds.has(id)).every(id => saved[id])
    ).length;

    // v2.88 — Détection de complétion fraîche d'une campagne
    // (compare avec liste persistée)
    try {
      let alreadyCelebrated = [];
      try { alreadyCelebrated = JSON.parse(localStorage.getItem('casIn_campaignsCelebrated') || '[]'); } catch {}
      const alreadySet = new Set(alreadyCelebrated);

      const newlyCompleted = PARCOURS.filter(p => {
        const validScenes = p.scenes.filter(id => validIds.has(id));
        const allDone = validScenes.length > 0 && validScenes.every(id => saved[id]);
        return allDone && !alreadySet.has(p.id);
      });

      if (newlyCompleted.length > 0) {
        // Persister + déclencher célébration
        const updated = [...alreadyCelebrated];
        newlyCompleted.forEach(p => {
          if (!updated.includes(p.id)) updated.push(p.id);

          // Bonus XP : 100 XP par campagne complétée
          if (window.Profile && typeof window.Profile.addXp === 'function') {
            try { window.Profile.addXp(100, 'scene', { campaign: p.id, milestone: 'complete' }); } catch (_) {}
          }

          // Célébration plein écran
          if (window.Celebration && typeof window.Celebration.show === 'function') {
            window.Celebration.show({
              icon: p.icon,
              title: 'Campagne terminée !',
              subtitle: p.title + ' · +100 XP bonus',
            });
          }
        });
        try { localStorage.setItem('casIn_campaignsCelebrated', JSON.stringify(updated)); } catch {}
      }
    } catch (_) {}

    section.innerHTML = `
      <div class="parcours-header" id="parcours-header">
        <span class="parcours-title">🎯 Campagnes d'enquête</span>
        <span style="display:flex;align-items:center;gap:10px">
          <span class="parcours-count">${completedParcours} / ${PARCOURS.length} complétées</span>
          <span class="parcours-chevron">▼</span>
        </span>
      </div>
      <div class="parcours-grid" id="parcours-grid"></div>
    `;

    // Insert *before* lobby-filter-bar
    filterBar.parentNode.insertBefore(section, filterBar);

    section.querySelector('#parcours-header').addEventListener('click', () => {
      parcoursPanelOpen = !parcoursPanelOpen;
      section.classList.toggle('open', parcoursPanelOpen);
      try { localStorage.setItem('casIn_parcoursPanelOpen', parcoursPanelOpen); } catch {}
    });

    const grid = section.querySelector('#parcours-grid');
    PARCOURS.forEach(p => {
      const validScenes = p.scenes.filter(id => validIds.has(id));
      const done = validScenes.filter(id => saved[id]).length;
      const total = validScenes.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const isComplete = done === total && total > 0;
      const inProgress = done > 0 && !isComplete;

      // v2.88 — Récompense XP estimée (50 XP par scène + bonus 100 XP à 100%)
      const xpReward = (total * 50) + (isComplete ? 100 : 0);

      // État visuel
      let stateLabel = '';
      let stateIcon = '';
      if (isComplete) {
        stateLabel = 'TERMINÉE';
        stateIcon = '🏆';
      } else if (inProgress) {
        stateLabel = 'EN COURS';
        stateIcon = '⏯';
      } else {
        stateLabel = 'NOUVELLE';
        stateIcon = '🎯';
      }

      const card = document.createElement('div');
      card.className = 'parcours-card' +
        (activeParcoursId === p.id ? ' active' : '') +
        (isComplete ? ' completed' : '') +
        (inProgress ? ' in-progress' : '');
      card.dataset.parcoursId = p.id;
      card.innerHTML = `
        <div class="parcours-card-state">
          <span class="parcours-card-state-icon">${stateIcon}</span>
          <span class="parcours-card-state-label">${stateLabel}</span>
          <span class="parcours-card-state-xp">+${xpReward} XP</span>
        </div>
        <div class="parcours-card-icon">${p.icon}</div>
        <div class="parcours-card-title">${p.title}</div>
        <div class="parcours-card-desc">${p.desc}</div>
        <div class="parcours-card-progress">
          <span>${done}/${total}</span>
          <div class="parcours-progress-bar"><div class="parcours-progress-fill" style="width:${pct}%"></div></div>
          <span>${pct}%</span>
        </div>
        ${isComplete ? '<div class="parcours-card-badge">🏆 ✓</div>' : ''}
      `;
      card.addEventListener('click', e => {
        e.stopPropagation();
        if (activeParcoursId === p.id) {
          activeParcoursId = null;
        } else {
          activeParcoursId = p.id;
        }
        renderParcoursSection();
        renderActiveParcoursBanner();
        applyAllFilters();
      });
      grid.appendChild(card);
    });
  }

  function renderActiveParcoursBanner() {
    document.querySelectorAll('.parcours-active-banner').forEach(b => b.remove());

    if (!activeParcoursId) return;
    const p = PARCOURS.find(x => x.id === activeParcoursId);
    if (!p) return;

    const banner = document.createElement('div');
    banner.className = 'parcours-active-banner';
    banner.innerHTML = `
      <div class="parcours-active-info">
        <span class="parcours-active-icon">${p.icon}</span>
        <span class="parcours-active-text">Campagne active : <strong>${p.title}</strong></span>
      </div>
      <button class="parcours-clear-btn">Tout afficher</button>
    `;
    banner.querySelector('.parcours-clear-btn').addEventListener('click', () => {
      activeParcoursId = null;
      renderParcoursSection();
      renderActiveParcoursBanner();
      applyAllFilters();
    });

    const sceneGrid = document.getElementById('scene-grid');
    if (sceneGrid && sceneGrid.parentNode) {
      sceneGrid.parentNode.insertBefore(banner, sceneGrid);
    }
  }

  // ──────────────────────────────────────────────────────────
  //  COMBINED FILTERS — extends applyLobbyFilters
  // ──────────────────────────────────────────────────────────
  function applyAllFilters() {
    // Run the original filter pass first to handle search + difficulty
    if (typeof applyLobbyFilters === 'function') {
      applyLobbyFilters();
    }

    // Now apply our additional filters: parcours + atmosphere
    const cards = document.querySelectorAll('#scene-grid .scene-card[data-scene-id]');
    let activeIds = null;
    if (activeParcoursId) {
      const p = PARCOURS.find(x => x.id === activeParcoursId);
      if (p) activeIds = new Set(p.scenes);
    }

    let visible = 0;
    cards.forEach(card => {
      // If hidden by base filter, leave hidden
      if (card.style.display === 'none') return;

      const id = card.dataset.sceneId;
      let show = true;
      if (activeIds && !activeIds.has(id)) show = false;
      if (show && activeAtmosphere) {
        const atm = card.dataset.atmosphere || '';
        if (atm !== activeAtmosphere) show = false;
      }
      // v2.60 — filtre canton
      if (show && activeCanton) {
        const cantonOnCard = card.dataset.canton || '';
        // v2.62 — CHF (groupé) matche aussi les scènes avec code 'CH'
        if (activeCanton === 'CHF') {
          if (cantonOnCard !== 'CHF' && cantonOnCard !== 'CH') show = false;
        } else if (cantonOnCard !== activeCanton) {
          show = false;
        }
      }
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // Update count label
    const lbl = document.getElementById('lobby-filter-count');
    if (lbl && (activeParcoursId || activeAtmosphere || activeCanton)) {
      lbl.textContent = `${visible} scénario${visible !== 1 ? 's' : ''} affiché${visible !== 1 ? 's' : ''}`;
    }

    // Hide section header if all EU/CH scenes are hidden in that section
    document.querySelectorAll('.eu-section-header').forEach(h => {
      let next = h.nextElementSibling;
      let hasAny = false;
      while (next && next.classList.contains('scene-card')) {
        if (next.style.display !== 'none') { hasAny = true; break; }
        next = next.nextElementSibling;
      }
      h.style.display = hasAny ? '' : 'none';
    });
  }

  // ──────────────────────────────────────────────────────────
  //  ENRICH SCENE CARDS — add atmosphere data attribute
  // ──────────────────────────────────────────────────────────
  function enrichSceneCards() {
    if (typeof SCENES === 'undefined') return;
    const byId = {};
    SCENES.forEach(s => { byId[s.id] = s; });
    document.querySelectorAll('#scene-grid .scene-card[data-scene-id]').forEach(card => {
      const id = card.dataset.sceneId;
      const s = byId[id];
      if (s) {
        card.dataset.atmosphere = s.atmosphere || '';
        card.dataset.completedAt = (lsGet('scene_results', {})[id] || {}).savedAt || 0;
        card.dataset.score = (lsGet('scene_results', {})[id] || {}).pct || -1;
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  //  SORT — reorders cards in scene-grid by activeSort
  // ──────────────────────────────────────────────────────────
  function sortAndRedraw() {
    const grid = document.getElementById('scene-grid');
    if (!grid) return;
    if (activeSort === 'recommended') {
      // Reset: re-render the lobby (the original order)
      if (typeof renderLobby === 'function') renderLobby();
      // After re-render, re-apply filters
      setTimeout(() => {
        enrichSceneCards();
        renderContinueCard();
        renderActiveParcoursBanner();
        applyAllFilters();
      }, 30);
      return;
    }

    const cards = [...grid.querySelectorAll('.scene-card[data-scene-id]')];
    const headers = [...grid.querySelectorAll('.eu-section-header')];

    const diffOrder = { easy: 1, medium: 2, hard: 3, expert: 4 };
    const saved = lsGet('scene_results', {});

    let sorted;
    if (activeSort === 'difficulty' || activeSort === 'difficulty-desc') {
      sorted = cards.sort((a, b) => {
        const da = diffOrder[a.dataset.diff] || 0;
        const db = diffOrder[b.dataset.diff] || 0;
        return activeSort === 'difficulty' ? da - db : db - da;
      });
    } else if (activeSort === 'recent') {
      sorted = cards.sort((a, b) => {
        const ta = parseInt(a.dataset.completedAt || '0', 10);
        const tb = parseInt(b.dataset.completedAt || '0', 10);
        return tb - ta;
      });
    } else if (activeSort === 'worst-score') {
      // Show only completed with score <= 80, worst first; hide rest
      sorted = cards.sort((a, b) => {
        const sa = parseInt(a.dataset.score || '-1', 10);
        const sb = parseInt(b.dataset.score || '-1', 10);
        return sa - sb;
      });
      cards.forEach(c => {
        const sc = parseInt(c.dataset.score || '-1', 10);
        c.dataset.worstSortHidden = (sc < 0 || sc > 80) ? '1' : '0';
      });
    } else {
      sorted = cards;
    }

    // Hide all section headers in alt sorts (they don't make sense)
    headers.forEach(h => h.style.display = 'none');

    // Detach + reappend
    sorted.forEach(c => {
      grid.appendChild(c);
      if (activeSort === 'worst-score' && c.dataset.worstSortHidden === '1') {
        c.style.display = 'none';
      }
    });

    applyAllFilters();
  }

  // ──────────────────────────────────────────────────────────
  //  INFLIGHT TRACKING
  // ──────────────────────────────────────────────────────────
  function installInflightTracking() {
    if (window.__casLobbyV3InflightInstalled) return;
    window.__casLobbyV3InflightInstalled = true;

    // Track when scene starts
    const origStartScene = window.startScene;
    if (typeof origStartScene === 'function') {
      window.startScene = function(scene) {
        const r = origStartScene.apply(this, arguments);
        try {
          if (scene && scene.id && typeof G !== 'undefined') {
            setInflight({ sceneId: scene.id, stepIdx: G.stepIdx || 0, lastSeen: Date.now() });
          }
        } catch (e) {}
        return r;
      };
    }

    // Track when step changes — hook the renderStep call indirectly
    // by polling G.stepIdx whenever screen-scene is active.
    let lastSavedStep = -1;
    setInterval(() => {
      try {
        const sceneScreen = document.getElementById('screen-scene');
        if (!sceneScreen || !sceneScreen.classList.contains('active')) return;
        if (typeof G === 'undefined' || !G || !G.scene) return;
        if (G.stepIdx === lastSavedStep) return;
        lastSavedStep = G.stepIdx;
        setInflight({ sceneId: G.scene.id, stepIdx: G.stepIdx, lastSeen: Date.now() });
      } catch (e) {}
    }, 2000);

    // Clear when scene completes — hook showReport
    const origShowReport = window.showReport;
    if (typeof origShowReport === 'function') {
      window.showReport = function() {
        const r = origShowReport.apply(this, arguments);
        clearInflight();
        return r;
      };
    }
  }

  // ──────────────────────────────────────────────────────────
  //  ACHIEVEMENTS — extend GLOBAL_BADGES + getStatsSnapshot
  // ──────────────────────────────────────────────────────────
  const NEW_BADGES = [
    {
      id: 'atmosphere_explorer', icon: '🎨', title: 'Explorateur d\'atmosphères',
      desc: 'Au moins 1 scénario complété dans 5 atmosphères différentes',
      check: s => (s.atmospheres_visited || 0) >= 5
    },
    {
      id: 'atmosphere_master', icon: '🌈', title: 'Maître des atmosphères',
      desc: 'Au moins 1 scénario complété dans les 7 atmosphères',
      check: s => (s.atmospheres_visited || 0) >= 7
    },
    {
      id: 'parcours_starter', icon: '📖', title: 'Premier Parcours',
      desc: 'Premier parcours pédagogique terminé entièrement',
      check: s => (s.parcours_completed || 0) >= 1
    },
    {
      id: 'parcours_scholar', icon: '📚', title: 'Érudit DFIR',
      desc: '5 parcours pédagogiques terminés entièrement',
      check: s => (s.parcours_completed || 0) >= 5
    },
    {
      id: 'parcours_master', icon: '🎓', title: 'Maître des Parcours',
      desc: 'Tous les parcours pédagogiques terminés',
      check: s => (s.parcours_completed || 0) >= (s.parcours_total || 99)
    },
    {
      id: 'romand_specialist', icon: '🏔', title: 'Spécialiste romand',
      desc: 'Tous les scénarios des cantons romands (GE, VD, VS, FR, NE, JU) joués',
      check: s => (s.romand_complete || false) === true
    },
    {
      id: 'real_case_hunter', icon: '🕵️', title: 'Chasseur d\'affaires réelles',
      desc: '10 affaires réelles complétées avec ≥80%',
      check: s => (s.real_cases_won_80 || 0) >= 10
    },
    {
      id: 'difficulty_climber', icon: '⛰️', title: 'Grimpeur',
      desc: 'Au moins 1 scénario complété dans chaque difficulté (easy/medium/hard/expert)',
      check: s => (s.difficulties_won || 0) >= 4
    },
  ];

  function installBadgeExtension() {
    if (window.__casLobbyV3BadgesInstalled) return;
    window.__casLobbyV3BadgesInstalled = true;

    if (typeof GLOBAL_BADGES === 'undefined') return;

    // Add new badges
    NEW_BADGES.forEach(b => {
      if (!GLOBAL_BADGES.find(x => x.id === b.id)) {
        GLOBAL_BADGES.push(b);
      }
    });

    // Extend getStatsSnapshot to compute new metrics
    const origSnapshot = window.getStatsSnapshot;
    if (typeof origSnapshot === 'function') {
      window.getStatsSnapshot = function() {
        const snap = origSnapshot.apply(this, arguments);
        try {
          const results = lsGet('scene_results', {});
          const completedIds = Object.keys(results);
          const completedScenes = completedIds.map(id => SCENES.find(s => s.id === id)).filter(Boolean);

          // atmospheres visited
          const atms = new Set();
          completedScenes.forEach(s => { if (s.atmosphere) atms.add(s.atmosphere); });
          snap.atmospheres_visited = atms.size;

          // parcours
          const validIds = new Set(SCENES.map(s => s.id));
          const compl = PARCOURS.filter(p =>
            p.scenes.filter(id => validIds.has(id)).every(id => results[id])
          ).length;
          snap.parcours_completed = compl;
          snap.parcours_total = PARCOURS.length;

          // romand cantons (GE, VD, VS, FR, NE, JU)
          if (typeof CANTON_DATA !== 'undefined') {
            const romandKeys = ['GE','VD','VS','FR','NE','JU'];
            let romandComplete = true;
            for (const k of romandKeys) {
              const c = CANTON_DATA[k];
              if (!c || !c.scenarios.length) continue;
              if (!c.scenarios.some(sid => results[sid])) { romandComplete = false; break; }
            }
            snap.romand_complete = romandComplete;
          }

          // real cases ≥80
          let real80 = 0;
          completedScenes.forEach(s => {
            if (s.realCase && results[s.id] && results[s.id].pct >= 80) real80++;
          });
          snap.real_cases_won_80 = real80;

          // difficulty coverage
          const diffs = new Set();
          completedScenes.forEach(s => { if (s.difficulty) diffs.add(s.difficulty); });
          snap.difficulties_won = diffs.size;
        } catch (e) {
          console.warn('[lobby-v3] snapshot extension error', e);
        }
        return snap;
      };
    }
  }

  // ──────────────────────────────────────────────────────────
  //  HOOK INTO RENDERLOBBY
  // ──────────────────────────────────────────────────────────
  function installLobbyHook() {
    if (window.__casLobbyV3RenderHooked) return;
    window.__casLobbyV3RenderHooked = true;

    const origRender = window.renderLobby;
    if (typeof origRender !== 'function') {
      // Maybe it's named differently in this version - try initLobby
      const origInit = window.initLobby;
      if (typeof origInit === 'function') {
        window.initLobby = function() {
          const r = origInit.apply(this, arguments);
          setTimeout(applyV3Layer, 50);
          return r;
        };
      }
      return;
    }

    window.renderLobby = function() {
      const r = origRender.apply(this, arguments);
      setTimeout(applyV3Layer, 50);
      return r;
    };
  }

  function applyV3Layer() {
    enrichFilterBar();
    renderParcoursSection();
    enrichSceneCards();
    renderContinueCard();
    renderActiveParcoursBanner();
    // v2.90 — Pack K : nouveaux composants UX
    renderActiveCampaignCard();   // B3 — campagne en cours
    renderOnboardingBanner();     // A1 — bannière débutant
    renderLevelIndicator();       // A3 — niveau personnel
    enrichSceneCardsWithPrereqs(); // B1 — tags prérequis
    if (activeSort !== 'recommended') {
      sortAndRedraw();
    } else {
      applyAllFilters();
    }

    // Re-render badges grid to include new badges
    if (typeof renderBadgesGrid === 'function') {
      try { renderBadgesGrid(); } catch (e) {}
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  v2.90 — PACK K : Parcours guidé sans verrous
  //  A1 onboarding banner + A3 level indicator
  //  B1 prereq tags + B3 active campaign card
  //  (B2 suggestion-next vit dans scene-app.js)
  // ═══════════════════════════════════════════════════════════

  // ── Map des prérequis pédagogiques ──
  // Pour les scènes narratives (campagne Sarine), prérequis explicites.
  // Pour les autres scènes hard/expert, prérequis génériques calculés.
  const SCENE_PREREQUISITES = {
    // Affaire Sarine — ordre narratif strict
    'fr-affaire-sarine-2-eimp-stuttgart':         ['fr-affaire-sarine-1-premier-appel'],
    'fr-affaire-sarine-3-coordination-cantons':   ['fr-affaire-sarine-1-premier-appel', 'fr-affaire-sarine-2-eimp-stuttgart'],
    'fr-affaire-sarine-4-expertise-unifr':        ['fr-affaire-sarine-2-eimp-stuttgart', 'fr-affaire-sarine-3-coordination-cantons'],
    'fr-affaire-sarine-5-audience-recevabilite':  ['fr-affaire-sarine-1-premier-appel', 'fr-affaire-sarine-2-eimp-stuttgart', 'fr-affaire-sarine-3-coordination-cantons', 'fr-affaire-sarine-4-expertise-unifr'],

    // Affaire de la Viège — ordre narratif strict
    'vs-affaire-viege-2-osint-bricolage':   ['vs-affaire-viege-1-avalanche-saas'],
    'vs-affaire-viege-3-mercure-lonza':     ['vs-affaire-viege-2-osint-bricolage'],
    'vs-affaire-viege-4-scada-mattmark':    ['vs-affaire-viege-3-mercure-lonza'],
    'vs-affaire-viege-5-eimp-milano':       ['vs-affaire-viege-2-osint-bricolage', 'vs-affaire-viege-4-scada-mattmark'],
    'vs-affaire-viege-6-perquisition-brig': ['vs-affaire-viege-5-eimp-milano'],
    'vs-affaire-viege-7-audience-tribunal': ['vs-affaire-viege-1-avalanche-saas', 'vs-affaire-viege-3-mercure-lonza', 'vs-affaire-viege-5-eimp-milano', 'vs-affaire-viege-6-perquisition-brig'],
  };

  // ── Fondamentaux DFIR (5 scènes pour l'onboarding) ──
  // v2.96 — Étendu de 5 à 7 fondamentaux : ajout OSINT licite + premier réflexe ransomware
  // pour mieux préparer aux 72 hard et 26 expert qui suivent.
  const ONBOARDING_FUNDAMENTALS = [
    { id: 'custody',           label: 'Chaîne de possession',    icon: '📋' },
    { id: 'premier_appel',     label: 'Premier appel',           icon: '📞' },
    { id: 'phishing',          label: 'Phishing',                icon: '📧' },
    { id: 'metadata',          label: 'Métadonnées',             icon: '🗂' },
    { id: 'trois_artefacts',   label: 'Trois artefacts',         icon: '📂' },
    { id: 'osint-licite',      label: 'OSINT légal vs illégal',  icon: '🔍' },
    { id: 'lockbit-victime',   label: 'Premier ransomware',      icon: '🦠' },
  ];

  // ──────────────────────────────────────────────────────────
  //  B3 — Carte "Reprendre la campagne"
  // ──────────────────────────────────────────────────────────
  function renderActiveCampaignCard() {
    document.querySelectorAll('.active-campaign-card').forEach(c => c.remove());
    if (typeof SCENES === 'undefined') return;

    const saved = lsGet('scene_results', {});
    const validIds = new Set(SCENES.map(s => s.id));

    // Trouver la campagne avec le plus de progression sans être complète
    let bestCampaign = null;
    let bestScore = -1;
    PARCOURS.forEach(p => {
      const validScenes = p.scenes.filter(id => validIds.has(id));
      const done = validScenes.filter(id => saved[id]).length;
      const total = validScenes.length;
      if (done === 0 || done === total) return; // ni vierge ni complète
      const score = done / total; // ratio progression
      if (score > bestScore) {
        bestScore = score;
        bestCampaign = { p, done, total, validScenes };
      }
    });

    if (!bestCampaign) return;

    // Trouver la prochaine scène recommandée (1ère non faite dans l'ordre)
    const nextSceneId = bestCampaign.validScenes.find(id => !saved[id]);
    if (!nextSceneId) return;
    const nextScene = SCENES.find(s => s.id === nextSceneId);
    if (!nextScene) return;

    const sceneGrid = document.getElementById('scene-grid');
    if (!sceneGrid) return;

    const card = document.createElement('div');
    card.className = 'active-campaign-card';
    const pct = Math.round((bestCampaign.done / bestCampaign.total) * 100);
    card.innerHTML = `
      <div class="active-campaign-icon">${bestCampaign.p.icon}</div>
      <div class="active-campaign-body">
        <div class="active-campaign-label">⏯ CAMPAGNE EN COURS</div>
        <div class="active-campaign-title">${bestCampaign.p.title}</div>
        <div class="active-campaign-progress">
          ${bestCampaign.done}/${bestCampaign.total} scènes · ${pct}% · prochaine : <strong>${nextScene.icon || ''} ${nextScene.title}</strong>
        </div>
        <div class="active-campaign-progress-bar"><div class="active-campaign-progress-fill" style="width:${pct}%"></div></div>
      </div>
      <button class="active-campaign-action" data-next-id="${nextSceneId}">CONTINUER →</button>
    `;
    card.querySelector('.active-campaign-action').addEventListener('click', e => {
      e.stopPropagation();
      const targetCard = document.querySelector(`.scene-card[data-scene-id="${nextSceneId}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({behavior: 'smooth', block: 'center'});
        targetCard.classList.add('scene-card-flash');
        setTimeout(() => targetCard.classList.remove('scene-card-flash'), 1800);
      }
    });

    // Insert au début, mais après .continue-card si présente
    const continueCard = sceneGrid.querySelector('.continue-card');
    if (continueCard && continueCard.nextSibling) {
      sceneGrid.insertBefore(card, continueCard.nextSibling);
    } else {
      sceneGrid.insertBefore(card, sceneGrid.firstChild);
    }
  }

  // ──────────────────────────────────────────────────────────
  //  A1 — Bannière "Pour démarrer" (auto-hide après 5 scènes)
  // ──────────────────────────────────────────────────────────
  function renderOnboardingBanner() {
    document.querySelectorAll('.onboarding-banner').forEach(b => b.remove());
    if (typeof SCENES === 'undefined') return;

    const saved = lsGet('scene_results', {});
    const completedCount = Object.keys(saved).length;

    // Auto-hide si déjà 5 scènes faites
    if (completedCount >= 5) return;

    // Vérifier si l'utilisateur a explicitement masqué la bannière
    let dismissed = false;
    try { dismissed = localStorage.getItem('casIn_onboardingDismissed') === '1'; } catch {}
    if (dismissed) return;

    const sceneGrid = document.getElementById('scene-grid');
    if (!sceneGrid) return;

    const validIds = new Set(SCENES.map(s => s.id));

    const banner = document.createElement('div');
    banner.className = 'onboarding-banner';
    banner.innerHTML = `
      <button class="onboarding-dismiss" title="Masquer définitivement" aria-label="Masquer">×</button>
      <div class="onboarding-header">
        <span class="onboarding-icon">🌱</span>
        <div>
          <div class="onboarding-title">Nouveau sur CAS-IN ?</div>
          <div class="onboarding-sub">Voici les 7 fondamentaux DFIR — environ 45 minutes au total</div>
        </div>
      </div>
      <div class="onboarding-grid">
        ${ONBOARDING_FUNDAMENTALS.map(f => {
          const isDone = !!saved[f.id];
          const exists = validIds.has(f.id);
          if (!exists) return ''; // skip si scène absente
          return `
            <div class="onboarding-chip ${isDone ? 'done' : ''}" data-scene-id="${f.id}">
              <span class="onboarding-chip-icon">${f.icon}</span>
              <span class="onboarding-chip-label">${f.label}</span>
              ${isDone ? '<span class="onboarding-chip-check">✓</span>' : ''}
            </div>
          `;
        }).join('')}
      </div>
      <div class="onboarding-footer">↓ ou explorez librement ci-dessous · cette bannière disparaîtra après 5 scènes complétées</div>
    `;

    banner.querySelectorAll('.onboarding-chip[data-scene-id]').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        const sid = chip.dataset.sceneId;
        const targetCard = document.querySelector(`.scene-card[data-scene-id="${sid}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({behavior: 'smooth', block: 'center'});
          targetCard.classList.add('scene-card-flash');
          setTimeout(() => targetCard.classList.remove('scene-card-flash'), 1800);
        }
      });
    });

    banner.querySelector('.onboarding-dismiss').addEventListener('click', e => {
      e.stopPropagation();
      try { localStorage.setItem('casIn_onboardingDismissed', '1'); } catch {}
      banner.remove();
    });

    sceneGrid.insertBefore(banner, sceneGrid.firstChild);
  }

  // ──────────────────────────────────────────────────────────
  //  A3 — Indicateur de niveau personnel
  // ──────────────────────────────────────────────────────────
  function renderLevelIndicator() {
    document.querySelectorAll('.level-indicator').forEach(b => b.remove());
    if (typeof SCENES === 'undefined') return;

    const saved = lsGet('scene_results', {});
    const completedCount = Object.keys(saved).length;
    if (completedCount === 0) return; // pas d'indicateur tant que rien fait

    // Calculer le niveau atteint et "prêt pour"
    const validIds = new Set(SCENES.map(s => s.id));
    const completedScenes = SCENES.filter(s => saved[s.id]);
    const byDiff = { easy: [], medium: [], hard: [], expert: [] };
    completedScenes.forEach(s => {
      if (byDiff[s.difficulty]) byDiff[s.difficulty].push(saved[s.id].pct || 0);
    });

    const totalScenes = SCENES.length;
    const completedAvg = completedScenes.length > 0
      ? Math.round(completedScenes.reduce((sum, s) => sum + (saved[s.id].pct || 0), 0) / completedScenes.length)
      : 0;

    // Définition niveau actuel : la difficulté la plus haute où l'utilisateur a >= 3 scènes complétées avec moy >= 70%
    function levelMastered(diff) {
      const arr = byDiff[diff] || [];
      if (arr.length < 3) return false;
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      return avg >= 70;
    }
    let currentLevel = null;
    let nextLevel = 'easy';
    if (levelMastered('easy')) { currentLevel = 'easy'; nextLevel = 'medium'; }
    if (levelMastered('medium')) { currentLevel = 'medium'; nextLevel = 'hard'; }
    if (levelMastered('hard')) { currentLevel = 'hard'; nextLevel = 'expert'; }
    if (levelMastered('expert')) { currentLevel = 'expert'; nextLevel = null; }

    const sceneGrid = document.getElementById('scene-grid');
    if (!sceneGrid) return;

    const labels = { easy: 'Débutant', medium: 'Intermédiaire', hard: 'Avancé', expert: 'Expert' };
    const colors = { easy: '#7ed957', medium: '#ffc94d', hard: '#ff7849', expert: '#ff4d6d' };
    const dispLevel = currentLevel ? labels[currentLevel] : 'En découverte';
    const dispColor = currentLevel ? colors[currentLevel] : '#9aa5b1';
    const readyFor = nextLevel ? `prêt pour ${labels[nextLevel]}` : 'tous niveaux maîtrisés !';

    const indicator = document.createElement('div');
    indicator.className = 'level-indicator';
    indicator.innerHTML = `
      <div class="level-indicator-row">
        <span class="level-indicator-icon">📊</span>
        <span class="level-indicator-text">
          Votre niveau : <strong style="color:${dispColor}">${dispLevel}</strong>
          · ${completedScenes.length} / ${totalScenes} scènes
          · score moyen ${completedAvg}%
          · <em>${readyFor}</em>
        </span>
      </div>
    `;

    // Insert après la onboarding-banner / continue-card / active-campaign-card
    const after = sceneGrid.querySelector('.active-campaign-card')
              || sceneGrid.querySelector('.continue-card')
              || sceneGrid.querySelector('.onboarding-banner');
    if (after && after.nextSibling) {
      sceneGrid.insertBefore(indicator, after.nextSibling);
    } else {
      sceneGrid.insertBefore(indicator, sceneGrid.firstChild);
    }
  }

  // ──────────────────────────────────────────────────────────
  //  B1 — Tags prérequis sur les cartes
  // ──────────────────────────────────────────────────────────
  function enrichSceneCardsWithPrereqs() {
    if (typeof SCENES === 'undefined') return;
    const saved = lsGet('scene_results', {});
    const cards = document.querySelectorAll('.scene-card[data-scene-id]');

    cards.forEach(card => {
      // Nettoyer un éventuel ancien tag
      card.querySelectorAll('.scene-prereq-tag').forEach(t => t.remove());

      const sid = card.dataset.sceneId;
      const scene = SCENES.find(s => s.id === sid);
      if (!scene) return;

      const explicit = SCENE_PREREQUISITES[sid];
      let prereqIds = [];
      let prereqLabel = '';

      if (explicit) {
        // Prérequis explicites (campagnes narratives)
        prereqIds = explicit;
        const prereqTitles = explicit.map(pid => {
          const ps = SCENES.find(x => x.id === pid);
          return ps ? (ps.title || pid) : pid;
        });
        prereqLabel = `Recommandé après : ${prereqTitles.slice(0, 2).join(', ')}${prereqTitles.length > 2 ? '...' : ''}`;
      } else {
        // Pour hard/expert sans prérequis explicite : recommandation générique
        if (scene.difficulty === 'hard') {
          // Recommander d'avoir fait ≥ 5 medium
          const mediumDone = Object.keys(saved).filter(id => {
            const s = SCENES.find(x => x.id === id);
            return s && s.difficulty === 'medium';
          }).length;
          if (mediumDone < 5) {
            prereqIds = ['__generic_medium__'];
            prereqLabel = `Recommandé après ≥ 5 medium · ${mediumDone}/5 fait`;
          }
        } else if (scene.difficulty === 'expert') {
          const hardDone = Object.keys(saved).filter(id => {
            const s = SCENES.find(x => x.id === id);
            return s && s.difficulty === 'hard';
          }).length;
          if (hardDone < 5) {
            prereqIds = ['__generic_hard__'];
            prereqLabel = `Recommandé après ≥ 5 hard · ${hardDone}/5 fait`;
          }
        }
      }

      if (prereqIds.length === 0) return;

      // Évaluer si les prérequis sont satisfaits
      let allMet = true;
      if (explicit) {
        allMet = prereqIds.every(pid => !!saved[pid]);
      } else {
        // Pour génériques on est ici uniquement quand non satisfaits
        allMet = false;
      }

      const tag = document.createElement('div');
      tag.className = 'scene-prereq-tag ' + (allMet ? 'prereq-ok' : 'prereq-warn');
      tag.innerHTML = allMet
        ? `<span class="scene-prereq-icon">✓</span><span class="scene-prereq-text">Prêt — prérequis OK</span>`
        : `<span class="scene-prereq-icon">⚠</span><span class="scene-prereq-text">${prereqLabel}</span>`;
      card.appendChild(tag);
    });
  }

  // ──────────────────────────────────────────────────────────
  //  STYLES PACK K
  // ──────────────────────────────────────────────────────────
  function injectPackKStyles() {
    if (document.getElementById('pack-k-styles')) return;
    const s = document.createElement('style');
    s.id = 'pack-k-styles';
    s.textContent = `
      /* ─── A1 Onboarding banner ─── */
      .onboarding-banner{
        background:linear-gradient(135deg, rgba(126,217,87,.08), rgba(106,184,255,.05));
        border:1px solid rgba(126,217,87,.35);
        border-radius:var(--r);
        padding:14px 16px 12px;
        margin-bottom:14px;
        position:relative;
        box-shadow:0 0 24px rgba(126,217,87,.06);
      }
      .onboarding-header{display:flex;align-items:center;gap:14px;margin-bottom:10px}
      .onboarding-icon{font-size:30px;line-height:1;filter:drop-shadow(0 0 8px rgba(126,217,87,.4))}
      .onboarding-title{font-size:14px;font-weight:700;color:#7ed957;letter-spacing:.4px;margin-bottom:2px}
      .onboarding-sub{font-size:11px;color:var(--dim)}
      .onboarding-grid{
        display:grid;
        grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));
        gap:6px;
        margin-bottom:8px;
      }
      .onboarding-chip{
        display:flex;align-items:center;gap:8px;
        background:rgba(8,14,26,.7);
        border:1px solid rgba(126,217,87,.25);
        border-radius:6px;
        padding:7px 10px;
        cursor:pointer;
        transition:.15s;
        font-size:11px;
      }
      .onboarding-chip:hover{
        border-color:#7ed957;
        background:rgba(126,217,87,.10);
        transform:translateX(2px);
      }
      .onboarding-chip.done{
        opacity:.55;
        border-color:rgba(126,217,87,.5);
      }
      .onboarding-chip-icon{font-size:14px;line-height:1}
      .onboarding-chip-label{flex:1;color:var(--text);font-weight:600}
      .onboarding-chip-check{color:#7ed957;font-weight:800;font-size:12px}
      .onboarding-footer{
        font-size:10px;color:var(--dim);font-style:italic;
        text-align:center;margin-top:6px;letter-spacing:.2px;
      }
      .onboarding-dismiss{
        position:absolute;top:8px;right:10px;
        background:transparent;border:1px solid var(--border);
        width:22px;height:22px;border-radius:50%;
        font-size:14px;color:var(--dim);
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;line-height:1;transition:.15s;
      }
      .onboarding-dismiss:hover{color:var(--red);border-color:var(--red)}

      /* ─── A3 Level indicator ─── */
      .level-indicator{
        background:rgba(8,14,26,.5);
        border:1px solid rgba(255,255,255,.06);
        border-left:3px solid var(--cyan);
        border-radius:6px;
        padding:8px 14px;
        margin-bottom:12px;
        font-size:12px;
        font-family:var(--font-mono);
      }
      .level-indicator-row{display:flex;align-items:center;gap:10px}
      .level-indicator-icon{font-size:16px;line-height:1;flex-shrink:0}
      .level-indicator-text{color:var(--text);line-height:1.5}
      .level-indicator-text em{color:var(--cyan);font-style:normal;font-weight:600}

      /* ─── B1 Prereq tags ─── */
      .scene-prereq-tag{
        display:inline-flex;align-items:center;gap:5px;
        margin-top:6px;
        padding:3px 8px;
        border-radius:3px;
        font-size:9.5px;
        font-family:var(--font-mono);
        font-weight:600;
        letter-spacing:.04em;
        text-transform:uppercase;
        line-height:1.3;
      }
      .scene-prereq-tag.prereq-ok{
        background:rgba(126,217,87,.12);
        color:#9fda7c;
        border:1px solid rgba(126,217,87,.25);
      }
      .scene-prereq-tag.prereq-warn{
        background:rgba(255,201,77,.10);
        color:#ffc94d;
        border:1px solid rgba(255,201,77,.25);
      }
      .scene-prereq-icon{font-size:10px;line-height:1}

      /* ─── B3 Active campaign card ─── */
      .active-campaign-card{
        background:linear-gradient(135deg, rgba(255,208,112,.10), rgba(106,184,255,.05));
        border:1px solid rgba(255,208,112,.35);
        border-radius:var(--r);
        padding:14px 16px;
        margin-bottom:12px;
        display:flex;align-items:center;gap:14px;
        box-shadow:0 0 18px rgba(255,208,112,.08);
      }
      .active-campaign-icon{
        font-size:32px;flex-shrink:0;line-height:1;
        filter:drop-shadow(0 0 6px rgba(255,208,112,.4));
      }
      .active-campaign-body{flex:1;min-width:0}
      .active-campaign-label{
        display:inline-block;
        font-size:9.5px;font-weight:800;color:#ffc94d;letter-spacing:1.4px;
        font-family:var(--font-mono);margin-bottom:3px;
        background:rgba(255,201,77,.15);padding:2px 7px;border-radius:3px;
      }
      .active-campaign-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px}
      .active-campaign-progress{font-size:11px;color:var(--dim);font-family:var(--font-mono);margin-bottom:6px}
      .active-campaign-progress strong{color:var(--text);font-weight:600}
      .active-campaign-progress-bar{
        height:3px;background:rgba(255,255,255,.08);
        border-radius:2px;overflow:hidden;max-width:280px;
      }
      .active-campaign-progress-fill{
        height:100%;background:linear-gradient(90deg,#ffd070,#ffac3a);
        border-radius:2px;
        transition:width .6s cubic-bezier(.34,1.56,.64,1);
      }
      .active-campaign-action{
        background:rgba(255,201,77,.18);
        border:1px solid rgba(255,201,77,.5);
        color:#ffc94d;
        padding:7px 14px;
        border-radius:6px;
        font-family:var(--font-mono);
        font-weight:800;
        font-size:11px;
        letter-spacing:.4px;
        cursor:pointer;
        transition:.18s;
        flex-shrink:0;
      }
      .active-campaign-action:hover{
        background:rgba(255,201,77,.30);
        transform:translateY(-1px);
        box-shadow:0 4px 14px rgba(255,201,77,.25);
      }

      /* Flash highlight quand on scrolle vers une scène */
      @keyframes scene-card-flash{
        0%,100%{box-shadow:0 0 0 0 rgba(0,229,204,0)}
        25%,75%{box-shadow:0 0 0 4px rgba(0,229,204,.6)}
      }
      .scene-card-flash{animation:scene-card-flash 1.6s ease-in-out}

      /* Mobile tweaks Pack K */
      @media (max-width:640px){
        .onboarding-grid{grid-template-columns:1fr 1fr}
        .active-campaign-card{flex-wrap:wrap}
        .active-campaign-action{width:100%;margin-top:6px}
        .level-indicator{font-size:11px}
      }
    `;
    document.head.appendChild(s);
  }

  // ──────────────────────────────────────────────────────────
  //  BOOT
  // ──────────────────────────────────────────────────────────
  function boot() {
    injectStyles();
    injectPackKStyles();
    installBadgeExtension();
    installInflightTracking();
    installLobbyHook();

    // v2.90 — Pack K B2 : exposer PARCOURS au calcul de suggestions next-step
    // pour que la suggestion #1 priorise la prochaine scène de la campagne en cours.
    try { window.PARCOURS_FOR_NEXTSTEP = PARCOURS; } catch (_) {}

    // If lobby is already rendered, retro-apply
    if (document.querySelector('#scene-grid .scene-card')) {
      applyV3Layer();
    } else {
      // Wait a bit longer for init
      setTimeout(() => {
        if (document.querySelector('#scene-grid .scene-card')) applyV3Layer();
      }, 500);
    }

    // Also reapply when the lobby screen becomes active again
    const observer = new MutationObserver(() => {
      const lobbyScreen = document.getElementById('screen-lobby');
      if (lobbyScreen && lobbyScreen.classList.contains('active')) {
        // v3.X — parcours-section n'existe plus ; on utilise dataset.v3enriched
        // de la filter-bar comme marqueur d'application du layer v3.
        const fb = document.getElementById('lobby-filter-bar');
        if (fb && !fb.dataset.v3enriched) {
          setTimeout(applyV3Layer, 100);
        }
      }
    });
    const root = document.getElementById('screen-lobby') || document.body;
    observer.observe(root, { attributes: true, attributeFilter: ['class'], subtree: true });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 100));
  } else {
    setTimeout(boot, 100);
  }
})();
