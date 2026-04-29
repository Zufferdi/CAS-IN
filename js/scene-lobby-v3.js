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
  ];

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
  let parcoursPanelOpen = false;

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
      /* ── Continuer ── */
      .continue-card{
        background:linear-gradient(135deg, rgba(0,229,204,.10), rgba(106,184,255,.06));
        border:1px solid var(--cyan);
        border-radius:var(--r);
        padding:14px 16px;
        margin-bottom:12px;
        display:flex;align-items:center;gap:14px;
        cursor:pointer;
        transition:.2s;
        position:relative;
        box-shadow:0 0 24px rgba(0,229,204,.10);
      }
      .continue-card:hover{transform:translateY(-1px);box-shadow:0 0 32px rgba(0,229,204,.20)}
      .continue-card-icon{font-size:32px;flex-shrink:0;line-height:1;filter:drop-shadow(0 0 8px rgba(0,229,204,.5))}
      .continue-card-body{flex:1;min-width:0}
      .continue-card-label{font-size:10px;font-weight:700;color:var(--cyan);letter-spacing:1.5px;font-family:var(--font-mono);margin-bottom:3px}
      .continue-card-title{font-size:15px;font-weight:600;color:var(--text);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .continue-card-meta{font-size:11px;color:var(--dim);font-family:var(--font-mono)}
      .continue-card-action{font-size:11px;color:var(--cyan);font-weight:700;letter-spacing:.5px;flex-shrink:0;font-family:var(--font-mono)}
      .continue-card-dismiss{
        position:absolute;top:8px;right:8px;
        font-size:14px;color:var(--dim);
        background:transparent;border:1px solid var(--border);
        width:22px;height:22px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;line-height:1;
        transition:.15s;
      }
      .continue-card-dismiss:hover{color:var(--red);border-color:var(--red)}

      /* ── Parcours panel ── */
      .parcours-section{
        background:var(--surface);
        border:1px solid var(--border);
        border-radius:var(--r);
        margin-bottom:10px;
        overflow:hidden;
      }
      .parcours-header{
        display:flex;align-items:center;justify-content:space-between;
        padding:12px 14px;cursor:pointer;
        user-select:none;
      }
      .parcours-header:hover{background:var(--surface2)}
      .parcours-title{font-size:13px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:8px}
      .parcours-count{font-size:10px;color:var(--dim);font-family:var(--font-mono);font-weight:700}
      .parcours-chevron{font-size:11px;color:var(--dim);transition:.2s}
      .parcours-section.open .parcours-chevron{transform:rotate(180deg)}
      .parcours-grid{
        display:none;
        padding:0 14px 14px;
        gap:8px;
        grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));
      }
      .parcours-section.open .parcours-grid{display:grid}
      .parcours-card{
        background:var(--surface2);
        border:1px solid var(--border);
        border-radius:8px;
        padding:11px 12px;
        cursor:pointer;
        transition:.15s;
        position:relative;
      }
      .parcours-card:hover{border-color:var(--cyan);transform:translateY(-1px);background:rgba(0,229,204,.04)}
      .parcours-card.active{border-color:var(--cyan);background:rgba(0,229,204,.08);box-shadow:0 0 0 1px var(--cyan)}
      .parcours-card.completed{border-color:var(--green)}
      .parcours-card.completed::after{
        content:'✓';position:absolute;top:6px;right:8px;
        color:var(--green);font-size:12px;font-weight:700;
      }
      .parcours-card-icon{font-size:22px;margin-bottom:6px;line-height:1}
      .parcours-card-title{font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px;line-height:1.3}
      .parcours-card-desc{font-size:10px;color:var(--dim);line-height:1.4;margin-bottom:7px;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .parcours-card-progress{
        display:flex;align-items:center;gap:6px;
        font-size:9px;color:var(--dim);font-family:var(--font-mono);font-weight:700
      }
      .parcours-progress-bar{flex:1;height:3px;background:var(--border);border-radius:2px;overflow:hidden}
      .parcours-progress-fill{height:100%;background:var(--cyan);transition:width .4s}
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

    section.innerHTML = `
      <div class="parcours-header" id="parcours-header">
        <span class="parcours-title">📚 Parcours pédagogiques</span>
        <span style="display:flex;align-items:center;gap:10px">
          <span class="parcours-count">${completedParcours} / ${PARCOURS.length} complétés</span>
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
    });

    const grid = section.querySelector('#parcours-grid');
    PARCOURS.forEach(p => {
      const validScenes = p.scenes.filter(id => validIds.has(id));
      const done = validScenes.filter(id => saved[id]).length;
      const total = validScenes.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const isComplete = done === total && total > 0;

      const card = document.createElement('div');
      card.className = 'parcours-card' +
        (activeParcoursId === p.id ? ' active' : '') +
        (isComplete ? ' completed' : '');
      card.dataset.parcoursId = p.id;
      card.innerHTML = `
        <div class="parcours-card-icon">${p.icon}</div>
        <div class="parcours-card-title">${p.title}</div>
        <div class="parcours-card-desc">${p.desc}</div>
        <div class="parcours-card-progress">
          <span>${done}/${total}</span>
          <div class="parcours-progress-bar"><div class="parcours-progress-fill" style="width:${pct}%"></div></div>
          <span>${pct}%</span>
        </div>
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
        <span class="parcours-active-text">Parcours actif : <strong>${p.title}</strong></span>
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
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // Update count label
    const lbl = document.getElementById('lobby-filter-count');
    if (lbl && (activeParcoursId || activeAtmosphere)) {
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

  // ──────────────────────────────────────────────────────────
  //  BOOT
  // ──────────────────────────────────────────────────────────
  function boot() {
    injectStyles();
    installBadgeExtension();
    installInflightTracking();
    installLobbyHook();

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
        if (!document.getElementById('parcours-section')) {
          setTimeout(applyV3Layer, 100);
        }
      }
    });
    const root = document.getElementById('screen-lobby') || document.body;
    observer.observe(root, { attributes: true, attributeFilter: ['class'], subtree: true });

    console.log('[lobby-v3] ✓ Lobby UX v3 attached');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 100));
  } else {
    setTimeout(boot, 100);
  }
})();
