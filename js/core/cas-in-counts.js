// ═══════════════════════════════════════════════════════════════
// cas-in-counts.js — Compteurs dynamiques à partir de counts.json
//
// Fonctionnement :
//   1. Au chargement, fetch /counts.json (mis à jour par la CI à chaque push)
//   2. Remplace le contenu de chaque [data-count="KEY"] par la valeur correspondante
//   3. Gère les templates [data-count-fmt="KEY questions"] pour des phrases complètes
//
// Clés disponibles dans counts.json :
//   - questions, themes, fiches, scenes, tp_categories, updated
//
// Exemples d'usage dans le HTML :
//   <span data-count="questions">1439</span>
//   <span data-count-fmt="{questions} questions · {fiches} fiches">…</span>
//
// Le fallback (texte déjà dans le HTML) reste visible si counts.json
// est inaccessible, donc aucune régression.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // Résolution du chemin vers counts.json selon la profondeur
  function countsUrl() {
    const depth = (window.location.pathname.match(/\//g) || []).length - 1;
    return (depth > 1 ? '../'.repeat(depth - 1) : './') + 'counts.json';
  }

  function formatNumber(n) {
    // Formate avec espace fine comme séparateur (norme fr : 1 439)
    try {
      return Number(n).toLocaleString('fr-CH').replace(/\u202f/g, ' ');
    } catch {
      return String(n);
    }
  }

  function applyCounts(counts) {
    // data-count="KEY" : remplace le textContent
    document.querySelectorAll('[data-count]').forEach(function (el) {
      const key = el.getAttribute('data-count');
      if (counts[key] != null) {
        const formatted = el.hasAttribute('data-count-raw')
          ? String(counts[key])
          : formatNumber(counts[key]);
        el.textContent = formatted;
      }
    });

    // data-count-fmt="{key1} mots {key2} autres"
    document.querySelectorAll('[data-count-fmt]').forEach(function (el) {
      const template = el.getAttribute('data-count-fmt');
      const rendered = template.replace(/\{([a-z_]+)\}/g, function (_, key) {
        return counts[key] != null ? formatNumber(counts[key]) : '?';
      });
      el.textContent = rendered;
    });

    // Support des meta tags (SEO / OG)
    document.querySelectorAll('meta[data-count-fmt]').forEach(function (el) {
      const template = el.getAttribute('data-count-fmt');
      const rendered = template.replace(/\{([a-z_]+)\}/g, function (_, key) {
        return counts[key] != null ? String(counts[key]) : '?';
      });
      el.setAttribute('content', rendered);
    });

    // Dispatch un event custom pour que d'autres modules puissent réagir
    try {
      window.dispatchEvent(new CustomEvent('casin:counts', { detail: counts }));
    } catch {}
  }

  async function loadAndApply() {
    try {
      const resp = await fetch(countsUrl(), { cache: 'no-cache' });
      if (!resp.ok) return;
      const counts = await resp.json();
      applyCounts(counts);
    } catch (e) {
      // Silencieux : fallback = valeurs hardcodées restent affichées
    }
  }

  // Exposer en tant que CasInCounts (lecture optionnelle)
  window.CasInCounts = { reload: loadAndApply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndApply);
  } else {
    loadAndApply();
  }
})();
