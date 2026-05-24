// ═══════════════════════════════════════════════════════════════════
// tp-engine-rsa.js — CAS-IN TP delta v104
// TP "RSA — Chiffrement asymétrique" (1 TP, 3 niveaux progressifs)
//   A — Lecture : extraire la taille de clé depuis un PEM / output openssl
//   B — Calcul  : déchiffrer un petit message RSA (n, e, c → m)
//   C — Identifier : reconnaître les composants d'une clé (n, e, d, p, q)
// Chargé APRÈS tp-engine.js (utilise rand, STATE, helpers communs)
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // HELPERS partagés (autonomes — pas de dépendance externe)
  // ────────────────────────────────────────────────────────────────
  function buildPracticeCard(opts) {
    const id = opts.prefix;
    const div = document.createElement('div');
    div.className = 'ex-card';

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-${id}">${opts.icon || '🔓'}</div>
        <div class="ex-title">${opts.title}</div>
        <span class="ex-badge easy">${opts.badge || 'pratique'}</span>
      </div>
      <div class="ex-scenario">${opts.question}</div>
      <div style="margin:.7rem 0">${opts.artefactHTML}</div>
      <div class="ex-input-row" style="flex-wrap:wrap;gap:8px">
        ${opts.inputLabel ? `<span class="ex-input-label">${opts.inputLabel}</span>` : ''}
        <input class="ex-input" id="inp-${id}" placeholder="${opts.placeholder || ''}" autocomplete="off" spellcheck="false" >
        <button class="btn-hint" id="btn-hint1-${id}" type="button">💡 Méthode</button>
        <button class="btn-hint" id="btn-hint2-${id}" type="button" disabled style="opacity:.4">💡💡 Où regarder</button>
        <button class="btn-hint" id="btn-hint3-${id}" type="button" disabled style="opacity:.4">💡💡💡 Réponse</button>
        <button class="btn-validate" id="btn-validate-${id}" type="button">Valider ✓</button>
        <button class="btn-next" id="btn-next-${id}" type="button" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-${id}"></div>
    `;

    setTimeout(() => {
      const inp = div.querySelector(`#inp-${id}`);
      const fb  = div.querySelector(`#ex-feedback-${id}`);
      const nextBtn = div.querySelector(`#btn-next-${id}`);
      const valBtn  = div.querySelector(`#btn-validate-${id}`);
      const normalize = opts.normalize || (v => v.trim().toLowerCase().replace(/\s+/g, ''));

      function validate() {
        if (!inp || !fb) return;
        const got = normalize(inp.value);
        const exp = normalize(opts.expected);
        const ok  = got === exp;

        if (ok) {
          inp.className = 'ex-input correct';
          valBtn.disabled = true;
          nextBtn.style.display = 'inline-block';
          const card = inp.closest('.ex-card');
          if (card) card.className = 'ex-card solved';
          const numEl = document.getElementById(`ex-num-${id}`);
          if (numEl) numEl.className = 'ex-num solved';
          fb.className = 'ex-feedback correct';
          fb.innerHTML = `✓ Correct ! ${opts.explain || ''}`;
          if (typeof STATE !== 'undefined' && !STATE.hintUsed && typeof incSolved === 'function') {
            incSolved(STATE.cat);
          }
        } else {
          inp.className = 'ex-input wrong';
          fb.className = 'ex-feedback wrong';
          fb.innerHTML = `✗ "<code>${escapeHTML(inp.value)}</code>" incorrect. Utilise les indices progressifs ou réessaie.`;
          if (typeof breakStreak === 'function') breakStreak();
          setTimeout(() => { if (inp) inp.className = 'ex-input'; }, 700);
        }
      }

      function showHint(level) {
        if (typeof markHintUsed === 'function') markHintUsed();
        if (!fb || !opts.hints || !opts.hints[level-1]) return;
        fb.className = 'ex-feedback correct';
        const labels = ['Méthode', 'Où regarder', 'Réponse étape par étape'];
        fb.innerHTML = `💡 <strong>Niveau ${level} — ${labels[level-1]}</strong><br>${opts.hints[level-1]}`;
        if (level < 3) {
          const next = div.querySelector(`#btn-hint${level+1}-${id}`);
          if (next) { next.disabled = false; next.style.opacity = '1'; }
        }
        const cur = div.querySelector(`#btn-hint${level}-${id}`);
        if (cur) cur.style.opacity = '.4';
      }

      div.querySelector(`#btn-hint1-${id}`).addEventListener('click', () => showHint(1));
      div.querySelector(`#btn-hint2-${id}`).addEventListener('click', () => showHint(2));
      div.querySelector(`#btn-hint3-${id}`).addEventListener('click', () => showHint(3));
      valBtn.addEventListener('click', validate);
      nextBtn.addEventListener('click', () => { if (typeof newExercise === 'function') newExercise(); });
      if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
    }, 50);

    return div;
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function renderTextBlock(text, opts) {
    opts = opts || {};
    const title = opts.title || '';
    const highlights = opts.highlights || [];
    const lines = text.split('\n').map(line => {
      let cls = '';
      for (const h of highlights) {
        if (line.includes(h.match)) {
          cls = `background:rgba(126,192,255,.08);border-left:3px solid var(${h.color || '--cyan'});padding-left:.4rem;display:block;margin-left:-.4rem`;
          break;
        }
      }
      return `<div style="${cls}">${escapeHTML(line) || '&nbsp;'}</div>`;
    });
    return `
      <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch">
        ${title ? `<div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">${title}</div>` : ''}
        <pre style="margin:0;padding:.7rem .8rem;font-family:var(--mono);font-size:.78rem;line-height:1.5;color:var(--text);overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:pre">${lines.join('')}</pre>
      </div>
    `;
  }

  // ────────────────────────────────────────────────────────────────
  // Calculs RSA pédagogiques (petits nombres pour rester lisible)
  // ────────────────────────────────────────────────────────────────
  // Renvoie le plus grand commun diviseur (Euclide)
  function _gcd(a, b) {
    while (b !== 0) { [a, b] = [b, a % b]; }
    return a;
  }

  // Algorithme d'Euclide étendu : trouve x tel que (e * x) ≡ 1 (mod phi)
  function _modInverse(e, phi) {
    let [old_r, r] = [e, phi];
    let [old_s, s] = [1, 0];
    while (r !== 0) {
      const q = Math.floor(old_r / r);
      [old_r, r] = [r, old_r - q * r];
      [old_s, s] = [s, old_s - q * s];
    }
    if (old_r !== 1) return null; // pas inversible
    return ((old_s % phi) + phi) % phi;
  }

  // Exponentiation modulaire rapide (base^exp mod m)
  function _modPow(base, exp, m) {
    if (m === 1) return 0;
    let result = 1;
    base = base % m;
    while (exp > 0) {
      if (exp & 1) result = (result * base) % m;
      exp = exp >> 1;
      base = (base * base) % m;
    }
    return result;
  }

  // Petits couples (p, q) premiers utilisés pour les exercices niveau B
  // n = p*q reste < 1000 pour rester accessible mentalement
  const RSA_SMALL_PRIMES = [
    { p: 11, q: 13, n: 143,  phi: 120 },
    { p: 13, q: 17, n: 221,  phi: 192 },
    { p: 17, q: 19, n: 323,  phi: 288 },
    { p: 19, q: 23, n: 437,  phi: 396 },
    { p: 23, q: 29, n: 667,  phi: 616 },
    { p: 29, q: 31, n: 899,  phi: 840 }
  ];

  // Petits exposants e standards (coprime avec phi)
  function _pickE(phi) {
    const candidates = [3, 5, 7, 11, 13, 17, 65537];
    for (const e of candidates.sort(() => Math.random() - 0.5)) {
      if (e < phi && _gcd(e, phi) === 1) return e;
    }
    return 65537;
  }

  // ────────────────────────────────────────────────────────────────
  // Générateur de PEM réaliste (clé publique RSA-2048)
  // ────────────────────────────────────────────────────────────────
  function _genPubKeyPEM(keyBits) {
    // Générer du base64 random plausible (longueur dépend de la taille)
    const lengthMap = { 1024: 216, 2048: 392, 3072: 564, 4096: 736 };
    const totalLen = lengthMap[keyBits] || 392;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let body = '';
    for (let i = 0; i < totalLen; i++) body += chars[Math.floor(Math.random() * 64)];
    // Découper en lignes de 64 chars
    const lines = [];
    for (let i = 0; i < body.length; i += 64) lines.push(body.slice(i, i + 64));
    return '-----BEGIN PUBLIC KEY-----\n' + lines.join('\n') + '\n-----END PUBLIC KEY-----';
  }

  // Générateur d'output `openssl rsa -text -noout -pubin` réaliste
  function _genOpensslRsaText(keyBits, eValue) {
    // Modulus = (keyBits/8) octets en hex, groupés par 15 bytes/ligne avec :
    const nBytes = keyBits / 8;
    const hexChars = '0123456789abcdef';
    let modulusHex = '';
    for (let i = 0; i < nBytes; i++) {
      modulusHex += hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)];
    }
    // Format openssl : "00:" suivi de paires "xx:" séparées par retours ligne
    const pairs = ['00'];
    for (let i = 0; i < modulusHex.length; i += 2) pairs.push(modulusHex.slice(i, i + 2));
    const lines = [];
    let curLine = '    ';
    for (const pair of pairs) {
      if (curLine.length + 3 > 75) {
        lines.push(curLine);
        curLine = '    ' + pair + ':';
      } else {
        curLine += pair + ':';
      }
    }
    if (curLine.trim().length > 0) lines.push(curLine.replace(/:$/, ''));

    return `Public-Key: (${keyBits} bit)
Modulus:
${lines.slice(0, 8).join('\n')}
    [... truncated for display, ${nBytes} bytes total ...]
Exponent: ${eValue} (0x${eValue.toString(16)})`;
  }

  // ════════════════════════════════════════════════════════════════
  // TP RSA — 3 niveaux
  // ════════════════════════════════════════════════════════════════

  function genRSA() {
    const level = rand(0, 2);
    const opts = { prefix: 'rsa', icon: '🔓', title: 'RSA — Chiffrement asymétrique' };

    // ── Niveau A : extraire la taille de clé depuis un output openssl ──
    if (level === 0) {
      const keyBits = [1024, 2048, 3072, 4096][rand(0, 3)];
      const eValue = [3, 65537][rand(0, 1)];
      const opensslOutput = _genOpensslRsaText(keyBits, eValue);

      const artefactHTML = renderTextBlock(opensslOutput, {
        title: 'Output : openssl rsa -in pubkey.pem -pubin -text -noout',
        highlights: [{ match: 'Public-Key:', color: '--cyan' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici le résultat de <code>openssl rsa -text -noout -pubin</code> sur une clé publique RSA. <strong>Quelle est la taille de la clé en bits</strong> ?`,
        inputLabel: 'Bits :',
        placeholder: '2048',
        expected: String(keyBits),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `La taille de clé RSA est affichée dans la première ligne, sous la forme <code>Public-Key: (N bit)</code>. C'est aussi la taille en bits du modulus N.`,
          `Cherche la ligne <code>Public-Key:</code>. Le nombre entre parenthèses est ta réponse.`,
          `Taille = <strong>${keyBits} bits</strong> (= ${keyBits/8} octets pour le modulus). Exposant public e = ${eValue} (${eValue === 65537 ? 'F4, valeur standard' : 'petit exposant — rare en pratique'}).`
        ],
        explain: `Clé RSA-<strong>${keyBits}</strong>. Tailles recommandées en 2026 : RSA-2048 (acceptable jusqu'à 2030), RSA-3072 (post-quantique recommandé), RSA-4096 (paranoïaque). Toute clé ≤ 1024 bits est obsolète depuis 2014 (NIST SP 800-131A).`
      });
    }

    // ── Niveau B : déchiffrer un petit message RSA (m = c^d mod n) ──
    if (level === 1) {
      const primes = RSA_SMALL_PRIMES[rand(0, RSA_SMALL_PRIMES.length - 1)];
      const { p, q, n, phi } = primes;
      const e = _pickE(phi);
      const d = _modInverse(e, phi);

      // Choisir un message m dans [2, n-1] (et qui ne soit pas multiple de p ou q pour éviter les cas dégénérés)
      let m;
      let attempts = 0;
      do {
        m = rand(2, Math.min(n - 1, 60));
        attempts++;
      } while ((m % p === 0 || m % q === 0) && attempts < 20);

      const c = _modPow(m, e, n);

      const artefactHTML = renderTextBlock(
`Clé publique reçue de l'expéditeur :
  n = ${n}      (= p × q où p=${p}, q=${q})
  e = ${e}

Message chiffré intercepté :
  c = ${c}

L'expéditeur t'a partagé sa clé privée d :
  d = ${d}      (= e⁻¹ mod φ(n), où φ(n) = (p-1)(q-1) = ${phi})

Formule de déchiffrement RSA :
  m = c^d mod n`,
        {
          title: 'Scénario : déchiffrement RSA pédagogique (petits nombres)',
          highlights: [{ match: 'm = c^d', color: '--gold' }]
        }
      );

      return buildPracticeCard({
        ...opts,
        badge: 'calcul',
        artefactHTML,
        question: `<strong>Déchiffre le message</strong>. Applique la formule <code>m = c^d mod n</code> avec les valeurs données. Le résultat est un nombre entier entre 2 et n-1.<br><span style="color:var(--dim);font-size:.85rem">Astuce : utilise une calculatrice ou Python (<code>pow(${c}, ${d}, ${n})</code>).</span>`,
        inputLabel: 'm =',
        placeholder: String(m),
        expected: String(m),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `La formule RSA pour déchiffrer : <code>m = c^d mod n</code> (exponentiation modulaire). Comme c et d sont grands, calcule progressivement avec <code>mod n</code> à chaque étape.`,
          `Tu peux utiliser <code>pow(${c}, ${d}, ${n})</code> en Python — équivalent à <code>${c}^${d} mod ${n}</code>. Ou faire à la main par étapes : <code>${c}² mod ${n}</code>, puis carrer à nouveau, etc. (square-and-multiply).`,
          `<code>${c}^${d} mod ${n}</code> = <strong>${m}</strong>. C'est le clair original. Note que <code>m^e mod n = c</code> dans l'autre sens (chiffrement).`
        ],
        explain: `Clair = <strong>${m}</strong>. Calcul : ${c}^${d} mod ${n} = ${m}. C'est l'essence de RSA — la clé privée d permet de "défaire" l'opération faite avec la clé publique e. <strong>En vrai</strong> : n fait 2048 bits (~617 chiffres décimaux), m est un padded plaintext (PKCS#1 v1.5 ou OAEP), pas une valeur brute.`
      });
    }

    // ── Niveau C : identifier le composant d'une clé privée (n, e, d, p, q, dmp1, dmq1, iqmp) ──
    {
      const components = [
        {
          label: 'modulus',
          name: 'n',
          desc: 'Modulus (= produit p × q, partagé entre clé publique et privée)',
          aliases: ['n', 'modulus', 'modulo', 'modulus n', 'n modulus']
        },
        {
          label: 'publicExponent',
          name: 'e',
          desc: 'Public Exponent (généralement 65537, paire avec n forme la clé publique)',
          aliases: ['e', 'public exponent', 'publicexponent', 'exposant public', 'exp public', 'e publicexponent']
        },
        {
          label: 'privateExponent',
          name: 'd',
          desc: 'Private Exponent (= e⁻¹ mod φ(n), secret — déchiffre les messages)',
          aliases: ['d', 'private exponent', 'privateexponent', 'exposant privé', 'exposant prive', 'exp privé', 'exp prive']
        },
        {
          label: 'prime1',
          name: 'p',
          desc: 'Premier nombre premier (p), facteur secret de n',
          aliases: ['p', 'prime1', 'prime 1', 'premier 1', 'premier p', 'facteur p']
        },
        {
          label: 'prime2',
          name: 'q',
          desc: 'Deuxième nombre premier (q), facteur secret de n',
          aliases: ['q', 'prime2', 'prime 2', 'premier 2', 'premier q', 'facteur q']
        }
      ];
      const comp = components[rand(0, components.length - 1)];

      // Générer un output "openssl rsa -text -noout" complet avec le composant ciblé
      const otherComps = components.filter(c => c !== comp);
      // Construire un dump réaliste avec les noms openssl
      const dumpLines = [
        'Private-Key: (2048 bit, 2 primes)',
        'modulus:',
        '    00:c4:38:b7:1a:9f:e6:42:0b:1c:8d:7e:4a:62:3f:',
        '    [... 256 bytes total, 2048 bits ...]',
        'publicExponent: 65537 (0x10001)',
        'privateExponent:',
        '    00:a5:9b:f1:e2:3c:48:6d:9b:75:81:24:8a:0f:b3:',
        '    [... 256 bytes ...]',
        'prime1:',
        '    00:e3:c9:7a:42:11:b8:9c:5d:8f:23:71:6a:4d:08:',
        '    [... 128 bytes ...]',
        'prime2:',
        '    00:d7:b6:81:53:fe:0a:cc:62:9e:54:39:12:4b:7f:',
        '    [... 128 bytes ...]',
        'exponent1:',
        '    [... 128 bytes — d mod (p-1) ...]',
        'exponent2:',
        '    [... 128 bytes — d mod (q-1) ...]',
        'coefficient:',
        '    [... 128 bytes — q^(-1) mod p, optimisation CRT ...]'
      ];

      const artefactHTML = renderTextBlock(dumpLines.join('\n'), {
        title: 'Output : openssl rsa -in private.key -text -noout',
        highlights: [{ match: comp.label + ':', color: '--purple' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Voici la sortie complète d'une clé privée RSA. Le composant surligné est <code>${comp.label}</code>. <strong>Quel est le nom mathématique standard</strong> de ce composant (1 lettre, comme dans les formules RSA) ?`,
        inputLabel: 'Nom :',
        placeholder: 'n',
        expected: comp.name,
        normalize: v => {
          const norm = v.trim().toLowerCase().replace(/[éè]/g, 'e').replace(/\s+/g, ' ');
          // Vérifier contre tous les alias
          for (const alias of comp.aliases) {
            if (norm === alias.toLowerCase()) return comp.name;
          }
          return norm;
        },
        hints: [
          `RSA utilise 5 valeurs principales : <code>n</code> (modulus), <code>e</code> (exposant public), <code>d</code> (exposant privé), <code>p</code> et <code>q</code> (les 2 nombres premiers tels que n = p×q).`,
          `Le champ openssl <code>${comp.label}</code> correspond à : ${comp.desc}.`,
          `<code>${comp.label}</code> = <strong>${comp.name}</strong>. ${comp.desc}`
        ],
        explain: `<strong>${comp.label} → ${comp.name}</strong>. ${comp.desc}. Note : openssl stocke aussi <code>exponent1 = d mod (p-1)</code>, <code>exponent2 = d mod (q-1)</code> et <code>coefficient = q⁻¹ mod p</code> pour accélérer le déchiffrement via le Théorème des restes chinois (CRT — environ 4× plus rapide).`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Enregistrement dans GENERATORS
  // ════════════════════════════════════════════════════════════════
  if (typeof window !== 'undefined' && window.GENERATORS) {
    window.GENERATORS.rsa = genRSA;
  } else if (typeof GENERATORS !== 'undefined') {
    GENERATORS.rsa = genRSA;
  }
  if (typeof window !== 'undefined') {
    window.genRSA = genRSA;
  }
})();
