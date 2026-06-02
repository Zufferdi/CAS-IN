/**
 * cas-in-debrief-renderer.js — Rendu du champ `debrief` des scènes
 *
 * CONTEXTE
 * ────────
 * 394 scènes sur 399 ont `debrief` en string (paragraphe d'analyse).
 * 5 scènes utilisent un format plus riche : `{ lessons: [], references: [] }`
 *   - drone-laufenburg-swissgrid-aargau
 *   - mini-natels-prison-pochwies
 *   - src-fonctionnaire-russe-kaspersky
 *   - handala-hack-iran-rhne-stryker
 *   - cyber-justicier-vigilante-fr
 *
 * Sans ce module, le code legacy fait `${scene.debrief}` qui sérialise
 * mal un dict en "[object Object]".
 *
 * API
 * ───
 *   window.CasInDebrief.render(debrief)  → string HTML safe
 *
 * Accepte :
 *   - string  → renvoie le HTML tel quel (compatibilité legacy)
 *   - dict { lessons?: [], references?: [] } → liste pédagogique formatée
 *   - null/undefined/array → '' (rien)
 *
 * v142 — 2026-05-31
 */
(function () {
  'use strict';

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Rend une liste d'items, en autorisant le HTML inline déjà présent
   * (les scènes contiennent <strong>, <em>, emojis Unicode).
   *
   * On NE peut PAS échapper le HTML ici car les leçons contiennent déjà
   * du markup voulu. Les données venant du JSON sont fournies par les
   * auteurs CAS-IN, pas par des utilisateurs → trust safe.
   */
  function renderList(items, ariaLabel) {
    if (!Array.isArray(items) || items.length === 0) return '';
    const lis = items.map(function (it) {
      // Si l'item n'est pas une string, on stringifie proprement
      const text = typeof it === 'string' ? it : escHtml(JSON.stringify(it));
      return '<li>' + text + '</li>';
    }).join('');
    return '<ul aria-label="' + escHtml(ariaLabel || '') + '">' + lis + '</ul>';
  }

  /**
   * Rend un debrief de scène en HTML.
   * Retourne une string vide si rien à rendre.
   */
  function render(debrief) {
    if (debrief == null) return '';

    // Format legacy : string
    if (typeof debrief === 'string') {
      const trimmed = debrief.trim();
      if (!trimmed) return '';
      return trimmed; // HTML déjà autorisé pour compat
    }

    // Format riche : { lessons, references }
    if (typeof debrief === 'object' && !Array.isArray(debrief)) {
      const parts = [];
      const lessons = debrief.lessons || debrief.leçons;
      const refs = debrief.references || debrief.refs || debrief.références;

      if (Array.isArray(lessons) && lessons.length > 0) {
        parts.push(
          '<div class="debrief-block debrief-lessons">' +
            '<h4 class="debrief-block-title">🎓 Leçons à retenir</h4>' +
            renderList(lessons, 'Leçons à retenir') +
          '</div>'
        );
      }

      if (Array.isArray(refs) && refs.length > 0) {
        parts.push(
          '<div class="debrief-block debrief-references">' +
            '<h4 class="debrief-block-title">📚 Références</h4>' +
            renderList(refs, 'Références') +
          '</div>'
        );
      }

      // Tolérance : autres clés inconnues → on les ignore silencieusement
      // (préférable à afficher [object Object])
      return parts.join('');
    }

    // Type imprévu (array, number…) → string vide pour ne rien casser
    return '';
  }

  // Exposer l'API
  window.CasInDebrief = {
    render: render,
    // Helper bool pour vérifier si quelque chose à afficher
    hasContent: function (debrief) {
      if (debrief == null) return false;
      if (typeof debrief === 'string') return debrief.trim().length > 0;
      if (typeof debrief === 'object' && !Array.isArray(debrief)) {
        const l = debrief.lessons || debrief.leçons || [];
        const r = debrief.references || debrief.refs || debrief.références || [];
        return (Array.isArray(l) && l.length > 0) || (Array.isArray(r) && r.length > 0);
      }
      return false;
    }
  };
})();
