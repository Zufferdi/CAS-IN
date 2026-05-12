/* ═══════════════════════════════════════════════════════════════
 * npc-arcs.js — OBSOLETE depuis v2.94
 *
 * ⚠ Ce fichier a été remplacé par js/core/cas-in-arcs.js qui fournit
 * la même API (window.NpcArcs) et plus encore (getAllArcs, evalAndUnlock,
 * getArcMeta, ARC_TO_ACHIEVEMENT, etc.).
 *
 * Le présent stub conserve l'historique mais ne fait plus rien. Il évite
 * uniquement de casser d'éventuelles inclusions `<script src=...>`
 * legacy qui n'auraient pas été nettoyées.
 *
 * À supprimer définitivement dans une version future (v3.0+) une fois
 * tu es sûr qu'aucune page ne le référence plus.
 *
 * Pour vérifier qu'aucune page n'inclut encore ce fichier :
 *   grep -rn "components/npc-arcs" --include="*.html" .
 *
 * Pour rejouer la logique d'arc post-scène, le module qui la fait
 * désormais est js/core/cas-in-arcs.js via evalAndUnlock() — appelé
 * automatiquement après chaque scène par scene-app.js et lors du
 * chargement du profil par cas-in-arcs.js lui-même.
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  console.warn('[npc-arcs.js] DEPRECATED — utilise js/core/cas-in-arcs.js à la place.');
  // Ne pas écraser window.NpcArcs s'il a été défini par cas-in-arcs.js
  if (window.NpcArcs) return;
  // Fallback inerte pour ne rien casser si chargé seul
  window.NpcArcs = {
    load: () => Promise.resolve(),
    getAllArcs: () => [],
    getProgress: () => null,
    evalAndUnlock: () => [],
    getArcMeta: () => null,
  };
})();
