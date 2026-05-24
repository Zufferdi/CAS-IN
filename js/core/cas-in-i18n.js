/**
 * cas-in-i18n.js — Internationalisation (Niveau I, scaffolding v94)
 *
 * STATUT : INFRASTRUCTURE SEULE — pas de traduction du catalogue de scènes.
 * Les 322 scènes restent en français suisse (langue éditoriale d'origine).
 * Ce module fournit la mécanique pour traduire l'UI (boutons, titres,
 * sections, messages système) en DE/IT/EN ultérieurement.
 *
 * Architecture :
 *   • Fichiers locales : data/i18n/{fr,de,it,en}.json
 *   • Détection auto : localStorage.cas_locale, sinon navigator.language, sinon 'fr'
 *   • API : window.CASi18n.t('key.path', fallback?)
 *   • Substitution data-i18n : <span data-i18n="ui.button.save">Enregistrer</span>
 *     → le texte est remplacé au boot par la traduction locale
 *   • Substitution data-i18n-attr : <button data-i18n-attr="aria-label:ui.aria.close">×</button>
 *
 * v94 ne fournit que la locale 'fr' complète (extraite du code) et des
 * stubs vides pour de/it/en. Les versions futures peupleront ces stubs.
 *
 * v1.0 — 2026-05-23 (delta v94, Niveau I scaffolding)
 */
(function () {
  'use strict';

  const SUPPORTED_LOCALES = ['fr', 'de', 'it', 'en'];
  const DEFAULT_LOCALE = 'fr';

  let _locale = DEFAULT_LOCALE;
  let _strings = {};
  let _loadPromise = null;

  // ─── Détection locale ───
  function detectLocale() {
    try {
      const stored = localStorage.getItem('cas_locale');
      if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
    } catch (_) {}
    // navigator.language : 'fr-CH', 'de-CH', 'it-CH', 'en-US' → on extrait fr/de/it/en
    const navLang = (navigator.language || navigator.userLanguage || 'fr').toLowerCase().split('-')[0];
    if (SUPPORTED_LOCALES.includes(navLang)) return navLang;
    return DEFAULT_LOCALE;
  }

  // ─── Chargement strings ───
  function loadStrings(locale) {
    if (_loadPromise) return _loadPromise;
    _loadPromise = fetch('data/i18n/' + locale + '.json')
      .then(r => {
        if (!r.ok) throw new Error('locale ' + locale + ' not found');
        return r.json();
      })
      .then(strings => { _strings = strings || {}; })
      .catch(err => {
        console.warn('[i18n] load failed for ' + locale + ', falling back to fr', err);
        _strings = {};
        if (locale !== DEFAULT_LOCALE) {
          return fetch('data/i18n/' + DEFAULT_LOCALE + '.json')
            .then(r => r.json())
            .then(strings => { _strings = strings || {}; });
        }
      });
    return _loadPromise;
  }

  // ─── Lookup key.path ───
  function get(path) {
    if (!path) return null;
    const parts = path.split('.');
    let cur = _strings;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else return null;
    }
    return typeof cur === 'string' ? cur : null;
  }

  function t(key, fallback) {
    const v = get(key);
    return v !== null ? v : (fallback || key);
  }

  // ─── Application aux éléments data-i18n ───
  function applyToDOM(root) {
    root = root || document;
    // Text content
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = get(key);
      if (translation !== null) {
        el.textContent = translation;
      }
    });
    // Attribute (format: "attr:key,attr2:key2")
    root.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const spec = el.getAttribute('data-i18n-attr');
      spec.split(',').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (!attr || !key) return;
        const translation = get(key);
        if (translation !== null) {
          el.setAttribute(attr, translation);
        }
      });
    });
  }

  // ─── Setter locale (manuel) ───
  async function setLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      console.warn('[i18n] unsupported locale', locale);
      return false;
    }
    _locale = locale;
    try { localStorage.setItem('cas_locale', locale); } catch (_) {}
    document.documentElement.setAttribute('lang', locale);
    _loadPromise = null;
    _strings = {};
    await loadStrings(locale);
    applyToDOM();
    // v95 — émettre un événement pour que les modules re-rendent leur UI dynamique
    try {
      window.dispatchEvent(new CustomEvent('cas-locale-changed', { detail: { locale: locale } }));
    } catch (_) {}
    return true;
  }

  // ─── Init au boot ───
  async function init() {
    _locale = detectLocale();
    document.documentElement.setAttribute('lang', _locale);
    await loadStrings(_locale);
    applyToDOM();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── API publique ───
  window.CASi18n = {
    t,
    get: t,
    setLocale,
    getLocale: () => _locale,
    getSupportedLocales: () => SUPPORTED_LOCALES.slice(),
    applyToDOM
  };
})();
