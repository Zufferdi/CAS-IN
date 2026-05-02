/* CAS-IN — Moteur de recherche fiches v2
 * ---------------------------------------
 * Niveau N1 + N2 + N3 :
 *   - tokens FR/EN avec stopwords
 *   - normalisation accents + casse
 *   - synonymes FR ↔ EN bidirectionnels
 *   - INDEXATION du contenu réel des fiches (sections, commandes, termes)
 *   - scoring pondéré par champ (title > section title > commande > terme > corps)
 *   - fuzzy matching Levenshtein pour fautes de frappe
 *
 * API exposée :
 *   window.CASSearch.normalize(s)
 *   window.CASSearch.tokenize(s)
 *   window.CASSearch.expandSynonyms(token)
 *   window.CASSearch.matchCard(query, card)        — pour filtrage page index
 *   window.CASSearch.searchCards(query)            — filtrage cards page index
 *   window.CASSearch.searchIndex(query, opts)      — recherche full-text dans l'index
 *   window.CASSearch.loadIndex(url)                — Promise<bool>
 *   window.CASSearch.indexLoaded()                 — bool
 *   window.CASSearch.STOPWORDS, SYNONYMS
 *
 * v2.0 — 2026-05-02
 */
(function () {
  'use strict';

  const STOPWORDS = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux', 'à', 'a',
    'en', 'et', 'ou', 'où', 'ni', 'or', 'car', 'mais', 'sur', 'par', 'pour',
    'dans', 'sans', 'avec', 'avant', 'après', 'sous',
    'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
    'me', 'te', 'se', 'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son',
    'comment', 'pourquoi', 'quand', 'qui', 'que', 'quoi', 'quel', 'quelle',
    'quels', 'quelles', 'est', 'sont', 'ai', 'as', 'avons', 'avez', 'ont',
    'être', 'avoir', 'faire', 'aller', 'voir', 'savoir', 'pouvoir',
    'peut', 'dois', 'doit', 'fait', 'va', 'vais', 'vient', 'sait',
    'plus', 'moins', 'très', 'tres', 'peu', 'aussi', 'donc',
    'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'from',
    'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'what', 'why', 'how', 'when', 'where', 'who', 'which', 'whose',
    'fiche', 'fiches', 'cas', 'cas-in', 'casin',
  ]);

  const SYNONYMS = {
    'ram': ['memoire', 'memory', 'vive'],
    'memoire': ['ram', 'memory'], 'memory': ['ram', 'memoire'], 'vive': ['ram', 'memoire'],
    'browser': ['navigateur', 'navigateurs'],
    'navigateur': ['browser'], 'navigateurs': ['browser', 'navigateur'],
    'forensique': ['forensic', 'forensics'],
    'forensic': ['forensique'], 'forensics': ['forensique'],
    'mobile': ['smartphone', 'telephone', 'phone', 'ios', 'android'],
    'smartphone': ['mobile', 'telephone'], 'telephone': ['mobile', 'smartphone'],
    'phone': ['telephone', 'mobile'],
    'fs': ['filesystem', 'systeme'], 'filesystem': ['fs', 'systeme'],
    'systeme': ['system'], 'system': ['systeme'],
    'log': ['logs', 'journal', 'journalisation'],
    'logs': ['log', 'journal'], 'journal': ['log', 'logs'],
    'journalisation': ['log', 'logs', 'journal'],
    'network': ['reseau', 'reseaux'], 'reseau': ['network'], 'reseaux': ['network'],
    'acquisition': ['collecte', 'extraction'],
    'collecte': ['acquisition'], 'extraction': ['acquisition'],
    'exif': ['metadata', 'metadonnees', 'meta'],
    'metadata': ['exif', 'metadonnees'], 'metadonnees': ['exif', 'metadata'],
    'carving': ['recupere', 'recuperer', 'recover', 'recovery', 'undelete', 'supprime', 'supprimes'],
    'recupere': ['carving'], 'recuperer': ['carving'],
    'recover': ['carving', 'recuperer'], 'recovery': ['carving'],
    'supprime': ['deleted', 'undelete', 'carving'],
    'supprimes': ['deleted', 'undelete', 'carving'],
    'deleted': ['supprime', 'supprimes', 'undelete'],
    'undelete': ['deleted', 'carving'],
    'registre': ['registry', 'reg'], 'registry': ['registre', 'reg'],
    'disque': ['drive', 'disk', 'disques'], 'disques': ['disque', 'drive'],
    'disk': ['disque', 'drive'], 'drive': ['disque', 'disk'],
    'hash': ['hachage', 'empreinte'], 'hachage': ['hash'], 'empreinte': ['hash'],
    'chiffrement': ['encryption', 'crypto'], 'encryption': ['chiffrement'],
    'crypto': ['chiffrement', 'encryption'],
    'email': ['courriel', 'mail', 'courrier'], 'courriel': ['email', 'mail'],
    'mail': ['email', 'courriel'],
    'cloud': ['nuage', 'm365', 'azure', 'aws'], 'nuage': ['cloud'],
    'malware': ['malveillant', 'virus'], 'malveillant': ['malware'],
    'timeline': ['chronologie', 'frise'], 'chronologie': ['timeline'],
    'investigation': ['enquete'], 'enquete': ['investigation'],
    'preuve': ['evidence'], 'evidence': ['preuve'], 'preuves': ['evidence', 'preuve'],
    'incident': ['ir'], 'ir': ['incident'], 'response': ['ir', 'incident', 'reponse'],
    'reponse': ['response'],
    'rapport': ['report'], 'report': ['rapport'], 'rapports': ['report'],
    'container': ['conteneur', 'docker', 'kubernetes', 'k8s'],
    'conteneur': ['container'], 'k8s': ['kubernetes', 'container'],
    'tls': ['ssl', 'https'], 'ssl': ['tls'], 'https': ['http', 'tls'],
    'osint': ['renseignement', 'intelligence'], 'renseignement': ['osint'],
    'darkweb': ['tor', 'onion'], 'tor': ['darkweb', 'onion'],
    'pcap': ['network', 'capture', 'wireshark'], 'capture': ['pcap'],
  };

  function normalize(s) {
    if (!s) return '';
    return s
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, ' ')
      .replace(/[^a-z0-9\s\-_$]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(s) {
    const norm = normalize(s);
    if (!norm) return [];
    return norm
      .split(/\s+/)
      .filter(t => t.length > 0)
      .filter(t => !STOPWORDS.has(t))
      .filter(t => t.length >= 2 || /^[0-9]+$/.test(t));
  }

  function expandSynonyms(token) {
    const out = [token];
    if (SYNONYMS[token]) for (const syn of SYNONYMS[token]) out.push(syn);
    return out;
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    if (Math.abs(a.length - b.length) > 3) return 99;
    let prev = new Array(b.length + 1);
    let curr = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      [prev, curr] = [curr, prev];
    }
    return prev[b.length];
  }

  function matchCard(query, card) {
    const tokens = tokenize(query);
    if (tokens.length === 0) return true;
    const cardText = normalize(card.textContent + ' ' + (card.dataset.keywords || ''));
    for (const token of tokens) {
      const variants = expandSynonyms(token);
      const matched = variants.some(v => cardText.includes(v));
      if (!matched) return false;
    }
    return true;
  }

  function searchCards(query) {
    const cards = document.querySelectorAll('.fiche-card');
    const visible = [];
    cards.forEach(card => {
      const isMatch = matchCard(query, card);
      card.classList.toggle('hidden', !isMatch);
      if (isMatch) visible.push(card);
    });
    document.querySelectorAll('.fiche-category').forEach(cat => {
      const visibleCount = cat.querySelectorAll('.fiche-card:not(.hidden)').length;
      cat.style.display = visibleCount ? '' : 'none';
    });
    return visible;
  }

  // ─── Index full-text ───
  let _index = null;
  let _indexLoading = null;

  function loadIndex(url) {
    if (_index) return Promise.resolve(true);
    if (_indexLoading) return _indexLoading;
    url = url || autoIndexURL();
    _indexLoading = fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        _index = data;
        _index.fiches.forEach(f => {
          f._normTitle = normalize(f.title);
          f._normDesc = normalize(f.desc || '');
          f.sections.forEach(s => {
            s._normTitle = normalize(s.title);
            s._normText = normalize(s.text || '');
            s._normCommands = (s.commands || []).map(c => normalize(c));
            s._normTerms = (s.terms || []).map(t => normalize(t));
          });
        });
        return true;
      })
      .catch(err => {
        console.warn('[CASSearch] Index non chargé :', err.message);
        _indexLoading = null;
        return false;
      });
    return _indexLoading;
  }

  // Heuristique : URL relative vers data/search-index.json depuis n'importe quelle page
  function autoIndexURL() {
    // Si on est dans /fiches/ → ../data/search-index.json
    // Si on est à la racine → data/search-index.json
    const path = window.location.pathname;
    if (path.includes('/fiches/')) return '../data/search-index.json';
    return 'data/search-index.json';
  }

  function indexLoaded() {
    return !!_index;
  }

  function searchIndex(query, opts) {
    opts = opts || {};
    const limit = opts.limit || 20;
    const fuzzy = opts.fuzzy !== false;
    const minScore = opts.minScore || 1;

    if (!_index) return [];

    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    const expandedTokens = tokens.map(t => expandSynonyms(t));
    const results = [];

    for (const fiche of _index.fiches) {
      let score = 0;
      const matchedTokens = new Set();
      let snippet = '';
      let snippetSection = null;
      let bestSectionScore = 0;

      // Title fiche (poids 10)
      for (let ti = 0; ti < expandedTokens.length; ti++) {
        for (const v of expandedTokens[ti]) {
          if (fiche._normTitle.includes(v)) {
            score += 10;
            matchedTokens.add(ti);
            if (new RegExp('\\b' + escapeRegex(v) + '\\b').test(fiche._normTitle)) {
              score += 5;
            }
            break;
          }
        }
      }

      // Desc fiche (poids 2)
      for (let ti = 0; ti < expandedTokens.length; ti++) {
        for (const v of expandedTokens[ti]) {
          if (fiche._normDesc.includes(v)) {
            score += 2;
            matchedTokens.add(ti);
            break;
          }
        }
      }

      // Sections
      for (const section of fiche.sections) {
        let sectionScore = 0;
        const sectionMatched = new Set();

        for (let ti = 0; ti < expandedTokens.length; ti++) {
          for (const v of expandedTokens[ti]) {
            if (section._normTitle && section._normTitle.includes(v)) {
              sectionScore += 5; sectionMatched.add(ti); break;
            }
          }
          for (const v of expandedTokens[ti]) {
            if (section._normCommands.some(c => c.includes(v))) {
              sectionScore += 4; sectionMatched.add(ti); break;
            }
          }
          for (const v of expandedTokens[ti]) {
            if (section._normTerms.some(t => t.includes(v))) {
              sectionScore += 3; sectionMatched.add(ti); break;
            }
          }
          for (const v of expandedTokens[ti]) {
            if (section._normText && section._normText.includes(v)) {
              sectionScore += 1; sectionMatched.add(ti); break;
            }
          }
        }

        if (sectionMatched.size === expandedTokens.length && sectionScore > 0) {
          sectionScore *= 2;
        }

        if (sectionScore > 0) {
          for (const t of sectionMatched) matchedTokens.add(t);
          score += sectionScore;
          if (sectionScore > bestSectionScore) {
            bestSectionScore = sectionScore;
            snippetSection = section;
            snippet = makeSnippet(section.text || '', tokens, expandedTokens);
          }
        }
      }

      // Fuzzy fallback
      if (fuzzy && matchedTokens.size === 0) {
        for (let ti = 0; ti < tokens.length; ti++) {
          const token = tokens[ti];
          for (const word of fiche._normTitle.split(/\s+/)) {
            if (word.length >= 4 && levenshtein(token, word) <= Math.min(2, Math.floor(token.length / 3))) {
              score += 3;
              matchedTokens.add(ti);
              break;
            }
          }
        }
      }

      if (score >= minScore && matchedTokens.size > 0) {
        if (matchedTokens.size === tokens.length) score *= 1.5;

        results.push({
          file: fiche.file,
          title: fiche.title,
          desc: fiche.desc,
          icon: fiche.icon,
          category: fiche.category,
          score: Math.round(score * 10) / 10,
          snippet: snippet || (fiche.desc || ''),
          snippetSection: snippetSection ? snippetSection.title : '',
          snippetSectionId: snippetSection ? snippetSection.id : '',
          matchedTokens: matchedTokens.size,
          totalTokens: tokens.length,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  function makeSnippet(text, tokens, expandedTokens) {
    if (!text) return '';
    const norm = normalize(text);
    let bestPos = -1;

    for (let ti = 0; ti < expandedTokens.length; ti++) {
      for (const v of expandedTokens[ti]) {
        const pos = norm.indexOf(v);
        if (pos >= 0 && (bestPos === -1 || pos < bestPos)) bestPos = pos;
      }
    }

    if (bestPos === -1) {
      return text.length > 180 ? text.slice(0, 180) + '…' : text;
    }

    const start = Math.max(0, bestPos - 60);
    const end = Math.min(text.length, bestPos + 140);
    let snippet = text.slice(start, end);
    if (start > 0) snippet = '…' + snippet;
    if (end < text.length) snippet = snippet + '…';
    return snippet;
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function updateResultCounter(query, visibleCount) {
    let counter = document.getElementById('search-result-counter');
    const totalCount = document.querySelectorAll('.fiche-card').length;

    if (!counter) {
      counter = document.createElement('div');
      counter.id = 'search-result-counter';
      counter.style.cssText = 'text-align:center;font-size:.78rem;color:var(--dim);margin:.4rem 0 1rem;font-family:var(--mono)';
      const wrap = document.querySelector('.search-wrap');
      if (wrap && wrap.parentNode) {
        wrap.parentNode.insertBefore(counter, wrap.nextSibling);
      }
    }

    if (!query || !query.trim()) {
      counter.textContent = '';
      counter.style.display = 'none';
      return;
    }

    counter.style.display = '';
    if (visibleCount === 0) {
      counter.innerHTML = `Aucun résultat pour <code style="color:var(--gold)">${escapeHTML(query)}</code> · <a href="#" id="clear-search" style="color:var(--cyan)">effacer</a> ou <kbd style="background:var(--surface2);padding:1px 5px;border-radius:3px;border:1px solid var(--border);font-size:.7rem">⌘K</kbd> pour la recherche full-text`;
      const clear = counter.querySelector('#clear-search');
      if (clear) clear.addEventListener('click', e => {
        e.preventDefault();
        const input = document.getElementById('search');
        if (input) { input.value = ''; input.dispatchEvent(new Event('input')); }
      });
    } else if (visibleCount === totalCount) {
      counter.textContent = `${totalCount} fiches`;
    } else {
      counter.innerHTML = `${visibleCount} / ${totalCount} fiches · <kbd style="background:var(--surface2);padding:1px 5px;border-radius:3px;border:1px solid var(--border);font-size:.7rem">⌘K</kbd> recherche full-text`;
    }
  }

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function initIndexPage() {
    const input = document.getElementById('search');
    if (!input) return;

    let timer = null;
    function handleInput() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const q = input.value;
        const visible = searchCards(q);
        updateResultCounter(q, visible.length);
      }, 60);
    }

    input.removeAttribute('oninput');
    input.addEventListener('input', handleInput);

    window.filterFiches = function () {
      const q = input.value;
      const visible = searchCards(q);
      updateResultCounter(q, visible.length);
    };

    document.addEventListener('keydown', e => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  function init() {
    initIndexPage();
    loadIndex().then(loaded => {
      if (loaded) console.log('[CASSearch] Index full-text chargé :', _index.fiches_count, 'fiches');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CASSearch = {
    normalize, tokenize, expandSynonyms, levenshtein,
    matchCard, searchCards, searchIndex,
    loadIndex, indexLoaded,
    STOPWORDS, SYNONYMS,
  };
})();
