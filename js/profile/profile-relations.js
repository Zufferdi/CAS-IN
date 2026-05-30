// ═══════════════════════════════════════════════════════════════
// profile-relations.js — v2.95 (Relations enrichies)
//
// Section "Relations PNJ" sur profile.html
//
// Évolution par rapport à v2.71 :
//   1. Compteurs étendus : + factions touchées, + arcs en cours
//   2. 🔥 Rencontres récentes (5 derniers PNJ par date d'interaction)
//   3. 🎯 Arcs en cours (lit window.NpcArcs pour proposer la prochaine scène)
//   4. 🏛 Réputation par faction (trust moyen agrégé par institution)
//   5. Cercle proche (top 5 complices, existant)
//   6. À reconstruire (top 5 hostiles/méfiants, existant)
//   7. 🎓 Quêtes réseau (3 quêtes pédagogiques avec progression)
//
// L'API publique reste rétro-compatible :
//   window.ProfileRelations.render()
//   window.ProfileRelations.rebuild()
//   window.ProfileRelations.reset()
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  
  // v132g — Résolution path data/ correcte depuis n'importe quelle page
  // (fix régression v131c sur les fetches relatifs depuis pages/, fiches/, etc.)
  function _dataUrl(rel) {
    if (typeof window !== 'undefined' && window.CasInUtils && typeof window.CasInUtils.dataUrl === 'function') {
      return window.CasInUtils.dataUrl(rel);
    }
    const clean = String(rel || '').replace(/^\.?\/?(data\/)?/, '');
    const path = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '/';
    const m = path.match(/^(.*?\/CAS-IN\/|\/)(.*)$/);
    if (!m) return './data/' + clean;
    const slashCount = (m[2].match(/\//g) || []).length;
    const prefix = slashCount > 0 ? '../'.repeat(slashCount) : './';
    return prefix + 'data/' + clean;
  }

let NPC_DATA = null;
  let NPC_FAMILY_CACHE = null;

  // ─── Familles institutionnelles (pour la jauge "Réputation par faction") ───
  // Ordre = ordre d'affichage. Le pattern est matché contre le champ
  // npc.institution. Les PNJ qui ne matchent aucun pattern sont rangés
  // dans la pseudo-faction "Autres" (non affichée si vide).
  const FAMILIES = [
    { id: 'fedpol',     label: 'fedpol',           icon: '🏛',  pattern: /\bfedpol\b/i },
    { id: 'mpc',        label: 'MPC',              icon: '⚖️',  pattern: /\bMPC\b|Ministère public de la Conf|Ministère public.*Confédération/i },
    { id: 'mp_cant',    label: 'MP cantonaux',     icon: '⚖️',  pattern: /Ministère public.*(Vaud|Genève|Fribourg|Valais|Berne|Zurich|Tessin|canton)/i },
    { id: 'polcant',    label: 'Polices cantonales',icon: '👮', pattern: /Police cantonale|Polcant|Kantonspolizei|KAPO/i },
    { id: 'ofcs',       label: 'OFCS / GovCERT',   icon: '🛡',  pattern: /\bOFCS\b|GovCERT|cybersécurité.*OFCS/i },
    { id: 'ofj',        label: 'OFJ',              icon: '📜',  pattern: /\bOFJ\b|Office fédéral de la justice/i },
    { id: 'finma',      label: 'FINMA',            icon: '🏦',  pattern: /\bFINMA\b/i },
    { id: 'src',        label: 'SRC',              icon: '🕴',  pattern: /\bSRC\b|Service de renseignement/i },
    { id: 'ddps',       label: 'DDPS / armée',     icon: '🪖',  pattern: /\bDDPS\b|armée suisse|armasuisse/i },
    { id: 'pfpdt',      label: 'PFPDT',            icon: '🛡',  pattern: /\bPFPDT\b|Préposé.*données/i },
    { id: 'europol',    label: 'Interpol/Europol', icon: '🌐',  pattern: /Interpol|Europol|Eurojust|J-CAT/i },
    { id: 'fbi',        label: 'FBI / US',         icon: '🇺🇸', pattern: /\bFBI\b|United States|ambassade.*États-Unis/i },
    { id: 'foreign',    label: 'Forces étrangères',icon: '🌍',  pattern: /\bBKA\b|\bANSSI\b|Carabinieri|DGSI|DDA Milano|BSI/i },
    { id: 'avocat',     label: 'Défense (avocats)',icon: '🧑‍⚖️',pattern: /avocat|étude.*&|Anwaltskammer|barreau/i },
    { id: 'prive_sec',  label: 'Privé sécurité',   icon: '🔐',  pattern: /Compass Security|Kudelski|ImmuniWeb|Mandiant|cybersécurité.*SA/i },
    { id: 'prive_tech', label: 'Privé tech / finance',icon: '🏢',pattern: /Logitech|Swisscom|UBS|BancaStato|Kantonalbank|Postfinance|Credit Suisse/i },
    { id: 'acad',       label: 'Académique',       icon: '🎓',  pattern: /EPFL|ETHZ|UNIFR|UNINE|UNIL|HSG|HES-SO/i },
    { id: 'sante',      label: 'Santé',            icon: '🏥',  pattern: /CHUV|Insel|Triemli|HUG|hôpital|hopital|\bEMS\b/i },
    { id: 'cicr',       label: 'CICR / ONG',       icon: '🕊',  pattern: /\bCICR\b|Croix-Rouge|ONU/i },
  ];

  // Total des familles "à toucher" pour la quête Carnet d'adresses (8 majeures)
  const ADDRESSBOOK_TARGET_FAMILIES = ['fedpol', 'mpc', 'mp_cant', 'polcant',
                                       'ofcs', 'europol', 'avocat', 'prive_sec'];

  // ─── Helpers ───────────────────────────────────────────────────
  async function loadNpcData() {
    if (NPC_DATA) return NPC_DATA;
    try {
      const r = await fetch(_dataUrl('npcs.json'));
      const d = await r.json();
      NPC_DATA = d.npcs || {};
      window.NPC_DATA = NPC_DATA;
      return NPC_DATA;
    } catch (e) {
      console.warn('[profile-relations] cannot load npcs.json', e);
      return null;
    }
  }

  function computeFamilyCache(npcData) {
    if (NPC_FAMILY_CACHE) return NPC_FAMILY_CACHE;
    const cache = {};
    Object.keys(npcData || {}).forEach(id => {
      const inst = (npcData[id] && npcData[id].institution) || '';
      let famId = null;
      for (const f of FAMILIES) {
        if (f.pattern.test(inst)) { famId = f.id; break; }
      }
      cache[id] = famId; // peut être null
    });
    NPC_FAMILY_CACHE = cache;
    return cache;
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }

  function trustColor(trust) {
    if (trust <= 25) return '#dc3c46';
    if (trust <= 50) return '#e68232';
    if (trust <= 75) return '#dcc832';
    return '#32b464';
  }

  // ─── Données dérivées ──────────────────────────────────────────
  function getEncounteredEnriched(npcData) {
    if (!window.NpcState) return [];
    const ids = window.NpcState.getEncountered() || [];
    return ids.map(id => {
      const data = window.NpcState.get(id);
      const npc = npcData[id];
      // Dernière interaction = max(date) du tableau interactions
      let lastDate = null;
      if (data && Array.isArray(data.interactions)) {
        for (const it of data.interactions) {
          if (it.date && it.date !== '(rétroactif)' && (!lastDate || it.date > lastDate)) {
            lastDate = it.date;
          }
        }
      }
      return { id, data, npc, lastDate };
    }).filter(x => x.npc);
  }

  function getRecentEncounters(enriched, n) {
    return enriched
      .filter(x => x.lastDate)
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
      .slice(0, n);
  }

  function getFactionsTouched(enriched, familyCache) {
    const set = new Set();
    enriched.forEach(x => { const f = familyCache[x.id]; if (f) set.add(f); });
    return set;
  }

  function getFactionReputation(enriched, familyCache) {
    // Pour chaque famille, calcule : count rencontrés, trust moyen
    const acc = {};
    enriched.forEach(x => {
      const f = familyCache[x.id];
      if (!f) return;
      if (!acc[f]) acc[f] = { count: 0, trustSum: 0 };
      acc[f].count++;
      acc[f].trustSum += (x.data && typeof x.data.trust === 'number') ? x.data.trust : 50;
    });
    // Retourne un tableau ordonné selon FAMILIES
    return FAMILIES.map(fam => {
      const a = acc[fam.id];
      if (!a) return null;
      return {
        ...fam,
        count: a.count,
        avgTrust: Math.round(a.trustSum / a.count),
      };
    }).filter(Boolean);
  }

  function getActiveArcs(npcData, results) {
    // Lit window.NpcArcs (préférence pour cas-in-arcs.js qui expose getAllArcs)
    if (!window.NpcArcs || typeof window.NpcArcs.getAllArcs !== 'function') return [];
    const allArcs = window.NpcArcs.getAllArcs();
    const active = allArcs.filter(arc => {
      const p = arc.progress;
      return p && p.target > 0 && p.current > 0 && p.current < p.target;
    });
    // Tri : % d'avancement décroissant
    active.sort((a, b) => {
      const pa = a.progress.current / a.progress.target;
      const pb = b.progress.current / b.progress.target;
      return pb - pa;
    });
    // Enrichit avec la prochaine scène
    return active.map(arc => {
      const nextStage = arc.stages.find(s => !(arc.progress.completedSceneIds || []).includes(s.scene_id));
      return { ...arc, nextStage };
    });
  }

  function getCompletedArcsCount() {
    if (!window.NpcArcs || typeof window.NpcArcs.getAllArcs !== 'function') return 0;
    return window.NpcArcs.getAllArcs().filter(a => a.progress && a.progress.current >= a.progress.target && a.progress.target > 0).length;
  }

  function getResults() {
    try { return JSON.parse(localStorage.getItem('scene_results') || '{}'); }
    catch { return {}; }
  }

  function getSceneTitle(sceneId) {
    if (typeof window.SCENES === 'object' && Array.isArray(window.SCENES)) {
      const s = window.SCENES.find(s => s && s.id === sceneId);
      if (s && s.title) return s.title;
    }
    return sceneId;
  }

  // ─── Renderers ─────────────────────────────────────────────────
  function renderHeroStats(counts, total, factionsTouchedCount, activeArcsCount, completedArcsCount) {
    return `
      <div class="rel-summary">
        <div class="rel-stat"><span class="rel-stat-icon">🤝</span><span class="rel-stat-val">${counts.complice}</span><span class="rel-stat-label">Complices</span></div>
        <div class="rel-stat"><span class="rel-stat-icon">🙂</span><span class="rel-stat-val">${counts['professionnel']}</span><span class="rel-stat-label">Pro.</span></div>
        <div class="rel-stat"><span class="rel-stat-icon">🤨</span><span class="rel-stat-val">${counts['méfiant']}</span><span class="rel-stat-label">Méfiants</span></div>
        <div class="rel-stat"><span class="rel-stat-icon">😠</span><span class="rel-stat-val">${counts.hostile}</span><span class="rel-stat-label">Hostiles</span></div>
        <div class="rel-stat"><span class="rel-stat-icon">📊</span><span class="rel-stat-val">${total}</span><span class="rel-stat-label">Rencontrés</span></div>
        <div class="rel-stat rel-stat-arc"><span class="rel-stat-icon">🏛</span><span class="rel-stat-val">${factionsTouchedCount}<span class="rel-stat-val-max">/${FAMILIES.length}</span></span><span class="rel-stat-label">Factions</span></div>
        <div class="rel-stat rel-stat-arc"><span class="rel-stat-icon">🎯</span><span class="rel-stat-val">${activeArcsCount}</span><span class="rel-stat-label">Arcs actifs</span></div>
        <div class="rel-stat rel-stat-arc"><span class="rel-stat-icon">🏆</span><span class="rel-stat-val">${completedArcsCount}</span><span class="rel-stat-label">Arcs bouclés</span></div>
      </div>
    `;
  }

  function renderRecent(recent, npcData) {
    if (recent.length === 0) return '';
    const items = recent.map(x => {
      const npc = x.npc;
      const name = npc.name || x.id;
      const role = (npc.role || '').split('—')[0].trim();
      const trust = x.data.trust;
      const state = x.data.state;
      return `
        <a href="npcs.html#npc=${encodeURIComponent(x.id)}" class="rel-recent-item">
          <span class="rel-recent-icon">${npc.icon || '👤'}</span>
          <div class="rel-recent-body">
            <div class="rel-recent-name">${escapeHTML(name)}</div>
            <div class="rel-recent-role">${escapeHTML(role)}</div>
          </div>
          <div class="rel-recent-state">
            <span class="rel-recent-state-emoji">${window.NpcState.stateIcon(state)}</span>
            <span class="rel-recent-trust" style="color:${trustColor(trust)}">${trust}</span>
          </div>
          <div class="rel-recent-date">${formatDateRel(x.lastDate)}</div>
        </a>
      `;
    }).join('');
    return `
      <div class="rel-section">
        <h4 class="rel-section-title">🔥 Rencontres récentes</h4>
        <div class="rel-recent-list">${items}</div>
      </div>
    `;
  }

  function formatDateRel(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const days = Math.floor(diffMs / 86400000);
      if (days <= 0) return "auj.";
      if (days === 1) return "hier";
      if (days < 7) return days + 'j';
      if (days < 30) return Math.floor(days / 7) + 'sem';
      return Math.floor(days / 30) + 'mo';
    } catch { return dateStr; }
  }

  function renderActiveArcs(arcs) {
    if (arcs.length === 0) return '';
    const items = arcs.slice(0, 5).map(arc => {
      const pct = Math.round((arc.progress.current / arc.progress.target) * 100);
      const nextSceneTitle = arc.nextStage ? getSceneTitle(arc.nextStage.scene_id) : '';
      const nextSceneId = arc.nextStage ? arc.nextStage.scene_id : '';
      const nextHTML = nextSceneId
        ? `<a class="rel-arc-next" href="scene.html#scene=${encodeURIComponent(nextSceneId)}" title="Lancer la prochaine scène">
             ▶ ${escapeHTML(nextSceneTitle)}
           </a>`
        : '';
      return `
        <div class="rel-arc-item">
          <span class="rel-arc-icon">${arc.icon || '👤'}</span>
          <div class="rel-arc-body">
            <div class="rel-arc-title">${escapeHTML(arc.title)}</div>
            <div class="rel-arc-progress">
              <div class="rel-arc-bar"><div class="rel-arc-bar-fill" style="width:${pct}%"></div></div>
              <span class="rel-arc-count">${arc.progress.current}/${arc.progress.target}</span>
            </div>
            ${nextHTML}
          </div>
        </div>
      `;
    }).join('');
    const seeMore = arcs.length > 5
      ? `<div class="rel-arc-more">+ ${arcs.length - 5} autres arcs en cours · <a href="#" onclick="document.getElementById('profile-tab-distinctions').click();return false">voir l'onglet Distinctions →</a></div>`
      : '';
    return `
      <div class="rel-section">
        <h4 class="rel-section-title">🎯 Arcs en cours — relancer la prochaine scène</h4>
        <div class="rel-arc-list">${items}</div>
        ${seeMore}
      </div>
    `;
  }

  function renderFactions(reputation) {
    if (reputation.length === 0) return '';
    const items = reputation.map(f => {
      const color = trustColor(f.avgTrust);
      return `
        <div class="rel-faction" title="${f.count} PNJ rencontrés · trust moyen ${f.avgTrust}/100">
          <div class="rel-faction-head">
            <span class="rel-faction-icon">${f.icon}</span>
            <span class="rel-faction-label">${escapeHTML(f.label)}</span>
            <span class="rel-faction-count">${f.count}</span>
          </div>
          <div class="rel-faction-bar">
            <div class="rel-faction-bar-fill" style="width:${f.avgTrust}%;background:${color}"></div>
          </div>
          <div class="rel-faction-trust" style="color:${color}">${f.avgTrust}<span class="rel-faction-trust-max">/100</span></div>
        </div>
      `;
    }).join('');
    return `
      <div class="rel-section">
        <h4 class="rel-section-title">🏛 Réputation par faction</h4>
        <div class="rel-faction-grid">${items}</div>
      </div>
    `;
  }

  function renderTopAllies(enriched, npcData) {
    const complices = enriched
      .filter(x => x.data.state === 'complice')
      .sort((a, b) => b.data.trust - a.data.trust)
      .slice(0, 5);
    if (complices.length === 0) return '';
    const items = complices.map(x => `
      <a href="npcs.html#npc=${encodeURIComponent(x.id)}" class="rel-item">
        <span class="rel-item-icon">${x.npc.icon || '👤'}</span>
        <div class="rel-item-body">
          <div class="rel-item-name">${escapeHTML(x.npc.name || x.id)}</div>
          <div class="rel-item-role">${escapeHTML((x.npc.role || '').split('—')[0].trim())}</div>
        </div>
        <div class="rel-item-trust">${x.data.trust}/100</div>
      </a>
    `).join('');
    return `
      <div class="rel-section">
        <h4 class="rel-section-title">🤝 Cercle proche</h4>
        <div class="rel-list">${items}</div>
      </div>
    `;
  }

  function renderToRebuild(enriched) {
    const hostiles = enriched
      .filter(x => x.data.state === 'hostile' || x.data.state === 'méfiant')
      .sort((a, b) => a.data.trust - b.data.trust)
      .slice(0, 5);
    if (hostiles.length === 0) return '';
    const items = hostiles.map(x => {
      const color = trustColor(x.data.trust);
      return `
        <a href="npcs.html#npc=${encodeURIComponent(x.id)}" class="rel-item">
          <span class="rel-item-icon">${x.npc.icon || '👤'}</span>
          <div class="rel-item-body">
            <div class="rel-item-name">${escapeHTML(x.npc.name || x.id)}</div>
            <div class="rel-item-role">${escapeHTML((x.npc.role || '').split('—')[0].trim())}</div>
          </div>
          <div class="rel-item-trust" style="color:${color}">${x.data.trust}/100</div>
        </a>
      `;
    }).join('');
    return `
      <div class="rel-section">
        <h4 class="rel-section-title">⚠ Relations à reconstruire</h4>
        <div class="rel-list">${items}</div>
      </div>
    `;
  }

  function renderQuests(counts, factionsTouched, completedArcs) {
    // 3 quêtes
    const quests = [
      {
        icon: '🎯',
        title: 'Cercle rapproché',
        desc: '5 complices à atteindre',
        current: counts.complice,
        target: 5,
      },
      {
        icon: '📇',
        title: "Carnet d'adresses",
        desc: 'Rencontrer un PNJ dans chacune des 8 factions majeures',
        current: ADDRESSBOOK_TARGET_FAMILIES.filter(fid => factionsTouched.has(fid)).length,
        target: ADDRESSBOOK_TARGET_FAMILIES.length,
      },
      {
        icon: '🏆',
        title: "Veneur d'arcs",
        desc: '3 arcs narratifs à boucler intégralement',
        current: completedArcs,
        target: 3,
      },
    ];
    const items = quests.map(q => {
      const pct = Math.min(100, Math.round((q.current / q.target) * 100));
      const done = q.current >= q.target;
      return `
        <div class="rel-quest-item ${done ? 'rel-quest-done-item' : ''}">
          <span class="rel-quest-icon">${done ? '✓' : q.icon}</span>
          <div class="rel-quest-body">
            <div class="rel-quest-title">${escapeHTML(q.title)} <span class="rel-quest-count">${q.current}/${q.target}</span></div>
            <div class="rel-quest-desc">${escapeHTML(q.desc)}</div>
            <div class="rel-quest-bar-wrap"><div class="rel-quest-bar" style="width:${pct}%"></div></div>
          </div>
        </div>
      `;
    }).join('');
    return `
      <div class="rel-section">
        <h4 class="rel-section-title">🎓 Quêtes réseau</h4>
        <div class="rel-quests-grid">${items}</div>
      </div>
    `;
  }

  function renderFooterActions() {
    return `
      <div class="rel-actions">
        <a href="npcs.html" class="rel-link">Voir tous les personnages →</a>
        <button class="rel-reset-btn" onclick="ProfileRelations.reset()">↻ Réinitialiser les relations</button>
      </div>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="rel-empty">
        <div class="rel-empty-icon">🤝</div>
        <p>Aucune relation établie pour l'instant.</p>
        <p class="rel-empty-sub">Joue des scénarios pour construire ton réseau.</p>
        ${window.Mastery ? '<button class="rel-rebuild-btn" onclick="ProfileRelations.rebuild()">⚡ Reconstruire depuis ma progression</button>' : ''}
      </div>`;
  }

  // ─── Render principal ─────────────────────────────────────────
  async function render() {
    const container = document.getElementById('npc-relations-section-body');
    if (!container) return;

    if (!window.NpcState) {
      container.innerHTML = '<p style="color:var(--text-muted)">Module NpcState non chargé.</p>';
      return;
    }

    await loadNpcData();
    const npcData = NPC_DATA || {};
    const familyCache = computeFamilyCache(npcData);

    const enriched = getEncounteredEnriched(npcData);
    if (enriched.length === 0) {
      container.innerHTML = renderEmptyState();
      return;
    }

    const counts = window.NpcState.getCounts();
    const total = enriched.length;
    const recent = getRecentEncounters(enriched, 5);
    const reputation = getFactionReputation(enriched, familyCache);
    const factionsTouched = getFactionsTouched(enriched, familyCache);
    const activeArcs = getActiveArcs(npcData);
    const completedArcs = getCompletedArcsCount();

    container.innerHTML = [
      renderHeroStats(counts, total, factionsTouched.size, activeArcs.length, completedArcs),
      renderRecent(recent, npcData),
      renderActiveArcs(activeArcs),
      renderFactions(reputation),
      renderTopAllies(enriched, npcData),
      renderToRebuild(enriched),
      renderQuests(counts, factionsTouched, completedArcs),
      renderFooterActions(),
    ].join('');
  }

  // ─── Actions ───────────────────────────────────────────────────
  function rebuild() {
    if (!window.NpcState || !window.NpcState.rebuildFromMastery) return;
    const result = window.NpcState.rebuildFromMastery();
    if (result) {
      alert(`✓ Reconstruit : ${result.scenes} scènes traitées, ${result.npcs} PNJ avec relations établies.`);
      // Invalide le cache famille (au cas où data/npcs.json a changé)
      NPC_FAMILY_CACHE = null;
      render();
    } else {
      alert('Reconstruction impossible — données Mastery manquantes.');
    }
  }

  function resetRelations() {
    if (!confirm('Réinitialiser toutes les relations PNJ ? Toutes tes relations actuelles seront effacées.')) return;
    if (window.NpcState && window.NpcState.reset) {
      window.NpcState.reset();
      render();
    }
  }

  // ─── API publique ─────────────────────────────────────────────
  window.ProfileRelations = {
    render,
    rebuild,
    reset: resetRelations,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    setTimeout(render, 100);
  }
})();
