/* ═══════════════════════════════════════════════════════════════
 * npc-favors.js — v3.1 (RELATIONS QUI MORDENT)
 *
 * Donne un effet mécanique au système de trust avec les PNJ.
 *
 *   🤝 Complice (76-100) → faveur active (1 par scène)
 *      • Procureurs/MP        → 💡 Indice juridique (élimine 1 mauvais choix gratuitement)
 *      • Forensics/PolCant    → 🔍 Indice technique (révèle un détail caché)
 *      • fedpol/FBI/Europol   → ⏱ Du temps (reset timer lecture, +30s en mode procureur)
 *
 *   🙂 Professionnel (51-75) → comportement par défaut, rien à faire
 *
 *   🤨 Méfiant (26-50) → friction
 *      • Indices payants coûtent +30% en XP (HINT_COST × 1.3)
 *
 *   😠 Hostile (0-25) → sabotage actif
 *      • Banner "X prépare un rapport contre toi"
 *      • Malus final -5% sur le score
 *      • Option "Présenter des excuses" : consomme 1 décision (skip),
 *        remet trust à 30 = méfiant
 *
 * Pas de modification du contenu des scènes (`scenes/*.json`).
 * Tout fonctionne par-dessus via DOM observation + monkey-patch léger.
 *
 * Persistance :
 *   localStorage.cas_favors_used = { 'scene-id': 'favor-type' }
 *      → garde trace des faveurs déjà utilisées pour ne pas en re-proposer
 *        si on rejoue la scène depuis le briefing
 *   localStorage.cas_favors_apologies = ['hostile_npc_id_1', ...]
 *      → trace les excuses présentées (pour ne pas re-débloquer "présenter excuses"
 *        si on rejoue après s'être déjà excusé)
 *
 * Dépendances :
 *   - window.NpcState (trust + state)
 *   - window.CasInNpcData (famille institutionnelle)
 *   - window.G.scene (scène en cours, exposé par scene-app.js)
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__casInNpcFavors) return;
  window.__casInNpcFavors = true;

  const LS_USED      = 'cas_favors_used';
  const LS_APOLOGIES = 'cas_favors_apologies';

  // ─── Mapping famille → type de faveur ────────────────────────
  const FAMILY_TO_FAVOR = {
    // Procureurs et juristes
    'mpc':        'legal',
    'mp_cant':    'legal',
    'ofj':        'legal',
    'avocat':     'legal',
    'pfpdt':      'legal',
    // Techniques / forensiques
    'polcant':    'tech',
    'fedpol':     'tech',  // mixte mais souvent ops
    'ofcs':       'tech',
    'prive_sec':  'tech',
    'foreign':    'tech',
    // Contexte / coordination
    'europol':    'context',
    'fbi':        'context',
    'src':        'context',
    'ddps':       'context',
    'finma':      'context',
    'cicr':       'context',
    // Autres : pas de faveur spécifique → on défaut à 'tech' qui est le plus généraliste
    'prive_tech': 'tech',
    'acad':      'tech',
    'sante':     'tech',
  };

  const FAVOR_DEFS = {
    legal:   { icon: '💡', label: 'Indice juridique', desc: 'Élimine 1 mauvais choix gratuitement sur la prochaine décision' },
    tech:    { icon: '🔍', label: 'Indice technique', desc: 'Révèle un détail caché du briefing' },
    context: { icon: '⏱',  label: 'Du temps',        desc: 'Réinitialise le timer de lecture (+30s en mode procureur)' },
  };

  // ─── Helpers LS ──────────────────────────────────────────────
  function lsGetObj(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  }
  function lsSetObj(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch { /* noop */ }
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  function getCurrentScene() {
    return window.G && window.G.scene;
  }

  function getNpcIds(scene) {
    if (!scene || !Array.isArray(scene.npcs)) return [];
    return scene.npcs.map(n => typeof n === 'string' ? n : (n && n.id)).filter(Boolean);
  }

  // Pour une scène donnée, agrège les PNJ par état et propose les faveurs/effets
  function analyzeScene(scene) {
    const npcIds = getNpcIds(scene);
    const result = {
      complices: [],  // [{id, name, icon, favorType, defLabel}]
      hostiles: [],
      mefiants: [],
    };
    if (!window.NpcState || !window.CasInNpcData) return result;

    const npcData = window.CasInNpcData.getAll() || {};
    npcIds.forEach(id => {
      const state = window.NpcState.get(id);
      if (!state || !state.interactions || state.interactions.length === 0) return; // jamais rencontré
      const info = npcData[id] || {};
      const family = window.CasInNpcData.getInstitutionFamily(id);
      const favorType = FAMILY_TO_FAVOR[family] || 'tech';
      const entry = {
        id, family, favorType,
        name: info.name || id,
        icon: info.icon || '👤',
        trust: state.trust,
      };
      if (state.state === 'complice') result.complices.push(entry);
      else if (state.state === 'hostile') result.hostiles.push(entry);
      else if (state.state === 'méfiant') result.mefiants.push(entry);
    });
    return result;
  }

  // ─── Render UI dans le briefing ──────────────────────────────
  function renderBanner(analysis, sceneId) {
    if (analysis.complices.length === 0 && analysis.hostiles.length === 0 && analysis.mefiants.length === 0) {
      return null;
    }

    const usedMap = lsGetObj(LS_USED, {});
    const usedFavor = usedMap[sceneId];
    const apologies = new Set(lsGetObj(LS_APOLOGIES, []));

    const blocks = [];

    // 🤝 Complices : faveurs offertes
    if (analysis.complices.length > 0) {
      const buttons = analysis.complices.map(c => {
        const def = FAVOR_DEFS[c.favorType];
        const disabled = usedFavor ? 'disabled' : '';
        return `
          <button class="favor-btn favor-btn-${c.favorType}" data-favor-npc="${escapeHTML(c.id)}" data-favor-type="${c.favorType}" ${disabled}>
            <span class="favor-btn-icon">${def.icon}</span>
            <span class="favor-btn-body">
              <span class="favor-btn-action">${escapeHTML(def.label)}</span>
              <span class="favor-btn-by">via ${escapeHTML(c.icon)} ${escapeHTML(c.name)}</span>
            </span>
          </button>
        `;
      }).join('');
      const usedNote = usedFavor
        ? `<div class="favor-used-note">✓ Faveur déjà utilisée sur cette scène (${escapeHTML(FAVOR_DEFS[usedFavor]?.label || usedFavor)})</div>`
        : `<div class="favor-hint">Une seule faveur par scène. Recharge à la prochaine scène réussie ≥80%.</div>`;
      blocks.push(`
        <div class="favor-block favor-block-complices">
          <div class="favor-block-title">🤝 Faveurs disponibles</div>
          <div class="favor-buttons">${buttons}</div>
          ${usedNote}
        </div>
      `);
    }

    // 😠 Hostiles : warning + excuses
    if (analysis.hostiles.length > 0) {
      const items = analysis.hostiles.map(h => {
        const alreadyApologized = apologies.has(h.id);
        const apologyBtn = alreadyApologized
          ? `<span class="favor-apology-done">Excuses présentées</span>`
          : `<button class="favor-apology-btn" data-apology-npc="${escapeHTML(h.id)}" title="Consomme 1 décision (skippée) mais ramène à 30 = méfiant">Présenter des excuses</button>`;
        return `
          <div class="favor-hostile-item">
            <span class="favor-hostile-icon">${escapeHTML(h.icon)}</span>
            <div class="favor-hostile-body">
              <div class="favor-hostile-name">${escapeHTML(h.name)}</div>
              <div class="favor-hostile-desc">vous est hostile (trust ${h.trust}) — malus final −5%</div>
            </div>
            ${apologyBtn}
          </div>
        `;
      }).join('');
      blocks.push(`
        <div class="favor-block favor-block-hostiles">
          <div class="favor-block-title">😠 Hostilité</div>
          ${items}
        </div>
      `);
    }

    // 🤨 Méfiants : information seulement
    if (analysis.mefiants.length > 0) {
      const names = analysis.mefiants.map(m => `${m.icon} ${escapeHTML(m.name)}`).join(', ');
      blocks.push(`
        <div class="favor-block favor-block-mefiants">
          <div class="favor-block-title">🤨 Méfiance</div>
          <div class="favor-mefiant-desc">
            ${names} ${analysis.mefiants.length > 1 ? 'doutent' : 'doute'} de vos méthodes —
            les indices coûteront +30% en XP.
          </div>
        </div>
      `);
    }

    const wrap = document.createElement('div');
    wrap.className = 'favors-banner';
    wrap.id = 'favors-banner';
    wrap.innerHTML = `
      <div class="favors-banner-header">
        <span class="favors-banner-icon">🎭</span>
        <span class="favors-banner-title">Relations en jeu</span>
      </div>
      <div class="favors-banner-content">
        ${blocks.join('')}
      </div>
    `;
    return wrap;
  }

  // ─── Application des effets ─────────────────────────────────
  function applyMefianceHintCost() {
    // Augmente le HINT_COST pour cette scène uniquement
    // (on monkey-patch useHint en wrappant le calcul de coût)
    if (window.__favors_hintPatched) return;
    window.__favors_hintPatched = true;
    // On se contente d'augmenter HINT_COST global pour la session.
    // Au reset, on remet en place via reset.
    if (typeof window.HINT_COST === 'number') {
      window.__favors_origHintCost = window.HINT_COST;
      window.HINT_COST = Math.round(window.HINT_COST * 1.3);
    }
  }
  function resetMefianceHintCost() {
    if (window.__favors_hintPatched && typeof window.__favors_origHintCost === 'number') {
      window.HINT_COST = window.__favors_origHintCost;
      window.__favors_hintPatched = false;
    }
  }

  function applyHostilityMalus(npcCount) {
    // Marque la scène pour qu'à la finalisation, on retire 5% par hostile (cap 10%)
    window.__favors_pendingMalus = Math.min(npcCount * 5, 10);
  }

  // Hook : interception du finalScore via wrap de la fonction finalize
  function installScoreHook() {
    if (window.__favors_scoreHookInstalled) return;
    if (typeof window.finishScene !== 'function' && typeof window.finalizeScene !== 'function') {
      // pas trouvé — on essaie une autre voie : storage event
      return;
    }
    window.__favors_scoreHookInstalled = true;
    // Stratégie alternative non-invasive : écouter `scene_results` setItem
    // et patcher le pct juste après l'écriture.
    const origSet = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      if (key === 'scene_results' && window.__favors_pendingMalus) {
        try {
          const parsed = JSON.parse(value);
          const scene = getCurrentScene();
          if (scene && scene.id && parsed[scene.id]) {
            const before = parsed[scene.id].pct;
            const malus = window.__favors_pendingMalus;
            parsed[scene.id].pct = Math.max(0, before - malus);
            parsed[scene.id].__hostility_malus = malus;
            value = JSON.stringify(parsed);
            console.log('[favors] hostility malus applied:', malus, '% (was', before, ', now', parsed[scene.id].pct, ')');
            window.__favors_pendingMalus = 0;
          }
        } catch (e) { /* noop */ }
      }
      return origSet(key, value);
    };
  }

  // ─── Actions des boutons ─────────────────────────────────────
  function useFavor(npcId, favorType) {
    const scene = getCurrentScene();
    if (!scene) return;
    const usedMap = lsGetObj(LS_USED, {});
    if (usedMap[scene.id]) {
      showToast('⚠ Faveur déjà utilisée sur cette scène');
      return;
    }
    // Appliquer l'effet
    if (favorType === 'legal') {
      // Indice gratuit sur la prochaine décision
      window.__favors_freeHint = true;
      showToast('💡 Indice juridique offert pour la prochaine décision');
      // Tag la scène
      usedMap[scene.id] = favorType;
      lsSetObj(LS_USED, usedMap);
    } else if (favorType === 'tech') {
      // Révèle un détail caché : on affiche le champ "alertLevel" en gros + steps[0].situation
      const detail = scene.steps && scene.steps[0] && scene.steps[0].situation;
      const alertLvl = scene.alertLevel;
      showRevealModal(detail, alertLvl);
      usedMap[scene.id] = favorType;
      lsSetObj(LS_USED, usedMap);
    } else if (favorType === 'context') {
      // Reset timer lecture si visible
      const timer = document.getElementById('reading-timer');
      if (timer) {
        // Trigger un reset visuel
        if (typeof window.resetReadingTimer === 'function') {
          window.resetReadingTimer();
        }
      }
      showToast('⏱ Tu reprends ton souffle. +30s sur les timers.');
      usedMap[scene.id] = favorType;
      lsSetObj(LS_USED, usedMap);
    }
    // Rerender du panel pour griser les boutons
    rerenderBanner();
  }

  function presentApology(npcId) {
    if (!window.NpcState) return;
    const apologies = new Set(lsGetObj(LS_APOLOGIES, []));
    if (apologies.has(npcId)) return;
    // Trace : on ne peut s'excuser qu'une fois par PNJ
    apologies.add(npcId);
    lsSetObj(LS_APOLOGIES, Array.from(apologies));
    // Bump le trust à 30 (au-dessus de hostile, juste méfiant)
    const state = window.NpcState.get(npcId);
    if (state && state.trust < 30) {
      // Pas d'API publique pour set direct → simuler un outcome neutre
      // Lecture, modification, écriture
      try {
        const all = JSON.parse(localStorage.getItem('cas_npc_state') || '{}');
        if (all[npcId]) {
          all[npcId].trust = 30;
          all[npcId].state = 'méfiant';
          all[npcId].interactions = all[npcId].interactions || [];
          all[npcId].interactions.push({
            sceneId: getCurrentScene()?.id || 'apology',
            outcome: 'apology',
            delta: 30 - state.trust,
            date: new Date().toISOString(),
          });
          localStorage.setItem('cas_npc_state', JSON.stringify(all));
        }
      } catch (e) { console.warn('[favors] apology write failed:', e); }
    }
    showToast('🙏 Excuses présentées. Tu ne perds plus de score pour cette personne.');
    // Skip une décision : marque G pour qu'un step soit consommé
    window.__favors_skipNextDecision = true;
    rerenderBanner();
  }

  function showRevealModal(situation, alertLevel) {
    // Modal léger pour "indice technique"
    const existing = document.getElementById('favor-reveal-modal');
    if (existing) existing.remove();
    const m = document.createElement('div');
    m.className = 'favor-reveal-overlay';
    m.id = 'favor-reveal-modal';
    m.innerHTML = `
      <div class="favor-reveal-box">
        <button class="favor-reveal-close" aria-label="Fermer">×</button>
        <div class="favor-reveal-icon">🔍</div>
        <div class="favor-reveal-title">Indice technique</div>
        <div class="favor-reveal-body">
          ${alertLevel ? `<p class="favor-reveal-alert"><strong>${escapeHTML(alertLevel)}</strong></p>` : ''}
          ${situation ? `<p>${escapeHTML(situation)}</p>` : '<p>Pas de détail caché supplémentaire pour cette scène.</p>'}
        </div>
      </div>
    `;
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('open'));
    const close = () => { m.classList.remove('open'); setTimeout(() => m.remove(), 200); };
    m.querySelector('.favor-reveal-close').addEventListener('click', close);
    m.addEventListener('click', e => { if (e.target === m) close(); });
  }

  function showToast(text) {
    if (typeof window.showToast === 'function') {
      window.showToast(text);
    } else {
      // Mini-fallback
      const t = document.createElement('div');
      t.className = 'favors-toast';
      t.textContent = text;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    }
  }

  // ─── Render principal ──────────────────────────────────────
  let _currentSceneId = null;
  function rerenderBanner() {
    const scene = getCurrentScene();
    if (!scene) return;
    const analysis = analyzeScene(scene);
    const existing = document.getElementById('favors-banner');
    if (existing) existing.remove();
    const banner = renderBanner(analysis, scene.id);
    if (!banner) return;
    const briefingContent = document.getElementById('briefing-content');
    if (!briefingContent) return;
    const briefingTop = briefingContent.querySelector('.briefing-top');
    if (briefingTop && briefingTop.parentNode) {
      // Insertion après briefing-top, AVANT arc-context-bar si présent
      const arcBar = briefingContent.querySelector('#arc-context-bar');
      const ref = arcBar || briefingTop.nextSibling;
      briefingTop.parentNode.insertBefore(banner, ref);
    } else {
      briefingContent.insertBefore(banner, briefingContent.firstChild);
    }
    bindBannerEvents(banner);
  }

  function bindBannerEvents(banner) {
    banner.querySelectorAll('[data-favor-npc]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const npc = btn.dataset.favorNpc;
        const type = btn.dataset.favorType;
        useFavor(npc, type);
      });
    });
    banner.querySelectorAll('[data-apology-npc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const npc = btn.dataset.apologyNpc;
        presentApology(npc);
      });
    });
  }

  // À l'arrivée d'une nouvelle scène, appliquer les effets passifs
  function onSceneStart(scene) {
    if (!scene || !scene.id) return;
    if (_currentSceneId === scene.id) return; // déjà initialisé
    _currentSceneId = scene.id;

    const analysis = analyzeScene(scene);

    // Effets passifs
    resetMefianceHintCost();  // reset au cas où
    if (analysis.mefiants.length > 0) {
      applyMefianceHintCost();
    }
    if (analysis.hostiles.length > 0) {
      applyHostilityMalus(analysis.hostiles.length);
    } else {
      window.__favors_pendingMalus = 0;
    }
    installScoreHook();

    rerenderBanner();
  }

  // ─── Boot ──────────────────────────────────────────────────
  function install() {
    const briefingContent = document.getElementById('briefing-content');
    if (!briefingContent) return;

    // Observer : à chaque rerender du briefing (startScene écrase innerHTML)
    const obs = new MutationObserver(() => {
      clearTimeout(install._t);
      install._t = setTimeout(() => {
        const scene = getCurrentScene();
        if (scene) onSceneStart(scene);
      }, 80);
    });
    obs.observe(briefingContent, { childList: true });

    // Et au cas où une scène est déjà en cours
    const scene = getCurrentScene();
    if (scene) onSceneStart(scene);
  }

  function waitAndInstall(retries = 50) {
    if (document.getElementById('briefing-content')) {
      // Aussi attendre que NpcState et CasInNpcData soient prêts
      if (window.NpcState && window.CasInNpcData) {
        window.CasInNpcData.load().then(install);
        return;
      }
    }
    if (retries <= 0) return;
    setTimeout(() => waitAndInstall(retries - 1), 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(waitAndInstall, 300));
  } else {
    setTimeout(waitAndInstall, 300);
  }

  // API publique
  window.CasInFavors = {
    rerender: rerenderBanner,
    analyzeScene,
    FAMILY_TO_FAVOR,
    FAVOR_DEFS,
    resetFavors: () => {
      try {
        localStorage.removeItem(LS_USED);
        localStorage.removeItem(LS_APOLOGIES);
      } catch (_) {}
    },
  };

  console.log('[favors] v3.1 loaded');
})();
