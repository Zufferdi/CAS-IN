/* ═══════════════════════════════════════════════════════════════
 * cas-in-npc-data.js — v2.98 (refacto A3)
 *
 * Centralise le chargement de data/npcs.json. Auparavant 3+ modules
 * fetchaient ce fichier de leur côté (npcs.html, profile-relations,
 * etc.) → fetches redondants, code dupliqué, pas de cache mémoire.
 *
 * Expose :
 *   await window.CasInNpcData.load()           → renvoie tous les PNJ
 *   window.CasInNpcData.get(npcId)             → PNJ ou null
 *   window.CasInNpcData.getAll()               → dict ou null (sync)
 *   window.CasInNpcData.findInScene(sceneId)   → [...PNJ apparaissant dedans]
 *   window.CasInNpcData.getInstitutionFamily(npcId)
 *                                              → id de famille ou null
 *
 * Cache mémoire single-flight : fetch lancé une seule fois même
 * si N modules appellent load() en parallèle.
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.CasInNpcData) return;

  let _data = null;          // { npcs: {...} } une fois chargé
  let _loadPromise = null;
  let _familyCache = null;   // {npc_id: family_id}

  // Familles institutionnelles — partagé avec profile-relations.js
  // (dupliqué ici pour découpler, mais centralisable plus tard)
  const FAMILIES = [
    { id: 'fedpol',     pattern: /\bfedpol\b/i },
    { id: 'mpc',        pattern: /\bMPC\b|Ministère public de la Conf|Ministère public.*Confédération/i },
    { id: 'mp_cant',    pattern: /Ministère public.*(Vaud|Genève|Fribourg|Valais|Berne|Zurich|Tessin|canton)/i },
    { id: 'polcant',    pattern: /Police cantonale|Polcant|Kantonspolizei|KAPO/i },
    { id: 'ofcs',       pattern: /\bOFCS\b|GovCERT|cybersécurité.*OFCS/i },
    { id: 'ofj',        pattern: /\bOFJ\b|Office fédéral de la justice/i },
    { id: 'finma',      pattern: /\bFINMA\b/i },
    { id: 'src',        pattern: /\bSRC\b|Service de renseignement/i },
    { id: 'ddps',       pattern: /\bDDPS\b|armée suisse|armasuisse/i },
    { id: 'pfpdt',      pattern: /\bPFPDT\b|Préposé.*données/i },
    { id: 'europol',    pattern: /Interpol|Europol|Eurojust|J-CAT/i },
    { id: 'fbi',        pattern: /\bFBI\b|United States|ambassade.*États-Unis/i },
    { id: 'foreign',    pattern: /\bBKA\b|\bANSSI\b|Carabinieri|DGSI|DDA Milano|BSI/i },
    { id: 'avocat',     pattern: /avocat|étude.*&|Anwaltskammer|barreau/i },
    { id: 'prive_sec',  pattern: /Compass Security|Kudelski|ImmuniWeb|Mandiant|cybersécurité.*SA/i },
    { id: 'prive_tech', pattern: /Logitech|Swisscom|UBS|BancaStato|Kantonalbank|Postfinance|Credit Suisse/i },
    { id: 'acad',       pattern: /EPFL|ETHZ|UNIFR|UNINE|UNIL|HSG|HES-SO/i },
    { id: 'sante',      pattern: /CHUV|Insel|Triemli|HUG|hôpital|hopital|\bEMS\b/i },
    { id: 'cicr',       pattern: /\bCICR\b|Croix-Rouge|ONU/i },
  ];

  async function load() {
    if (_data) return _data.npcs || {};
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
      try {
        const r = await fetch('data/npcs.json');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        _data = await r.json();
        // Pré-calcul du family cache
        const npcs = _data.npcs || {};
        _familyCache = {};
        Object.keys(npcs).forEach(id => {
          const inst = (npcs[id] && npcs[id].institution) || '';
          let fid = null;
          for (const f of FAMILIES) {
            if (f.pattern.test(inst)) { fid = f.id; break; }
          }
          _familyCache[id] = fid;
        });
        return npcs;
      } catch (e) {
        console.warn('[cas-in-npc-data] fetch failed:', e);
        _data = { npcs: {} };
        _familyCache = {};
        return {};
      }
    })();

    return _loadPromise;
  }

  function getAll() { return _data && _data.npcs ? _data.npcs : null; }
  function get(npcId) {
    const all = getAll();
    return all ? (all[npcId] || null) : null;
  }
  function findInScene(sceneId) {
    const all = getAll();
    if (!all) return [];
    const res = [];
    Object.keys(all).forEach(id => {
      const apps = all[id].appearances;
      if (Array.isArray(apps) && apps.includes(sceneId)) {
        res.push({ id, ...all[id] });
      }
    });
    return res;
  }
  function getInstitutionFamily(npcId) {
    if (!_familyCache) return null;
    return _familyCache[npcId] || null;
  }

  window.CasInNpcData = {
    load,
    get,
    getAll,
    findInScene,
    getInstitutionFamily,
    FAMILIES,
  };
})();
