// ═══════════════════════════════════════════════════════════════════
// tp-engine-easy.js — CAS-IN Travaux Pratiques (delta v97)
// 4 TP "faciles" : CIDR/subnetting, AES, Cassage de hash, PKI X.509
// Chargé APRÈS tp-engine.js (utilise rand, STATE, GENERATORS, helpers)
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // HELPER : créer une carte QCM 4-choix standard
  // ────────────────────────────────────────────────────────────────
  function buildQCMCard(opts) {
    // opts: { prefix, badge, scenario, choices: [{text, correct, explain}], hintFn }
    const id = opts.prefix;
    const div = document.createElement('div');
    div.className = 'ex-card';
    const choicesHTML = opts.choices.map((c, i) => `
      <button class="ex-choice" data-idx="${i}" id="ch-${id}-${i}">
        <span class="ex-choice-letter">${String.fromCharCode(65+i)}</span>
        <span class="ex-choice-text">${c.text}</span>
      </button>`).join('');

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-${id}">${opts.icon || '🔐'}</div>
        <div class="ex-title">${opts.title}</div>
        <span class="ex-badge easy">${opts.badge || 'easy'}</span>
      </div>
      <div class="ex-scenario">${opts.scenario}</div>
      <div class="ex-choices">${choicesHTML}</div>
      ${opts.hintFn ? `<div style="margin-top:.6rem"><button class="btn-hint" id="btn-hint-${id}">💡 Indice</button></div>` : ''}
      <div class="ex-feedback" id="ex-feedback-${id}"></div>
      <button class="btn-next" id="btn-next-${id}" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    setTimeout(() => {
      opts.choices.forEach((c, i) => {
        const btn = div.querySelector(`#ch-${id}-${i}`);
        if (btn) btn.addEventListener('click', () => handleChoice(id, i, c.correct, c.explain, opts.choices));
      });
      if (opts.hintFn) {
        const hb = div.querySelector(`#btn-hint-${id}`);
        if (hb) hb.addEventListener('click', () => {
          if (typeof markHintUsed === 'function') markHintUsed();
          const fb = document.getElementById(`ex-feedback-${id}`);
          if (fb) { fb.className = 'ex-feedback correct'; fb.innerHTML = `💡 ${opts.hintFn()}`; }
        });
      }
    }, 50);
    return div;
  }

  function handleChoice(prefix, idx, isCorrect, explain, allChoices) {
    const fb = document.getElementById(`ex-feedback-${prefix}`);
    const choiceBtn = document.getElementById(`ch-${prefix}-${idx}`);
    const nextBtn = document.getElementById(`btn-next-${prefix}`);
    if (!fb || !choiceBtn) return;

    if (isCorrect) {
      choiceBtn.classList.add('correct');
      // Disable all
      allChoices.forEach((_, i) => {
        const b = document.getElementById(`ch-${prefix}-${i}`);
        if (b) b.disabled = true;
      });
      fb.className = 'ex-feedback correct';
      fb.innerHTML = `✓ Correct ! ${explain}`;
      const card = choiceBtn.closest('.ex-card');
      if (card) card.classList.add('solved');
      const numEl = document.getElementById(`ex-num-${prefix}`);
      if (numEl) numEl.classList.add('solved');
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (typeof STATE !== 'undefined' && !STATE.hintUsed && typeof incSolved === 'function') {
        incSolved(STATE.cat);
      }
    } else {
      choiceBtn.classList.add('wrong');
      choiceBtn.disabled = true;
      fb.className = 'ex-feedback wrong';
      fb.innerHTML = `✗ ${explain || 'Mauvaise réponse.'}`;
      if (typeof breakStreak === 'function') breakStreak();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 1 : CIDR / Subnetting
  // ════════════════════════════════════════════════════════════════

  function _ipFromInt(n) {
    return [(n>>>24)&255, (n>>>16)&255, (n>>>8)&255, n&255].join('.');
  }
  function _intFromIp(ip) {
    const p = ip.split('.').map(Number);
    return (((p[0]<<24)>>>0) + (p[1]<<16) + (p[2]<<8) + p[3]) >>> 0;
  }
  function _maskFromPrefix(p) {
    return p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
  }
  function _maskToDotted(prefix) {
    return _ipFromInt(_maskFromPrefix(prefix));
  }
  function _isRFC1918(ip) {
    const n = _intFromIp(ip);
    // 10.0.0.0/8 — comparaison unsigned (>>> 0 des deux côtés)
    if (((n & 0xFF000000) >>> 0) === ((10 << 24) >>> 0)) return true;
    // 172.16.0.0/12
    if (((n & 0xFFF00000) >>> 0) === (((172 << 24) | (16 << 16)) >>> 0)) return true;
    // 192.168.0.0/16
    if (((n & 0xFFFF0000) >>> 0) === (((192 << 24) | (168 << 16)) >>> 0)) return true;
    return false;
  }

  function genCIDR() {
    const qType = rand(0, 6);
    const opts = { prefix: 'cidr', icon: '🌐', title: 'CIDR & Subnetting', badge: 'réseau' };

    if (qType === 0) {
      // Nombre d'adresses dans un /X
      const prefix = rand(20, 30);
      const total = Math.pow(2, 32 - prefix);
      const correct = String(total);
      // Distracteurs : 2^(33-p), 2^(31-p), 256 si proche
      const distractors = [
        String(Math.pow(2, 32 - prefix + 1)),  // *2
        String(Math.pow(2, 32 - prefix - 1)),  // /2
        String(total - 2),                      // total - 2 (souvent confondu avec hosts)
      ].filter(d => d !== correct);
      const choices = [
        { text: correct, correct: true, explain: `Un /${prefix} contient 2^(32-${prefix}) = <strong>${total} adresses totales</strong> (réseau + broadcast + ${total-2} hôtes utilisables).` },
        ...distractors.slice(0, 3).map(d => ({
          text: d, correct: false,
          explain: `${d} n'est pas le total. Formule : 2^(32-${prefix}). Attention à ne pas confondre <em>total d'adresses</em> et <em>hôtes utilisables</em> (= total − 2).`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Combien d'adresses au total contient un sous-réseau <strong>/${prefix}</strong> ?`,
        choices,
        hintFn: () => `Formule : 2^(32 − préfixe). Un /${prefix} a 32−${prefix} = ${32-prefix} bits d'hôte.`
      });
    }

    if (qType === 1) {
      // Masque dotted-decimal d'un préfixe
      const prefix = [16, 20, 22, 23, 24, 25, 26, 27, 28, 30][rand(0, 9)];
      const correct = _maskToDotted(prefix);
      // Distracteurs : préfixes proches
      const ds = new Set();
      ds.add(_maskToDotted(prefix + 1));
      ds.add(_maskToDotted(prefix - 1));
      ds.add(_maskToDotted(prefix + 4));
      const distractors = [...ds].filter(d => d !== correct).slice(0, 3);
      const choices = [
        { text: correct, correct: true,
          explain: `Un /${prefix} = ${prefix} bits de réseau. En décimal pointé : <strong>${correct}</strong>. Méthode : convertir chaque octet en binaire (8 bits) et mettre 1 pour les ${prefix} premiers bits.` },
        ...distractors.map(d => ({
          text: d, correct: false,
          explain: `${d} correspond à un autre préfixe. Recalcule : /${prefix} = ${prefix} bits à 1, ${32-prefix} bits à 0.`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel est le <strong>masque en notation décimale pointée</strong> correspondant à un préfixe <strong>/${prefix}</strong> ?`,
        choices,
        hintFn: () => `/${prefix} signifie ${prefix} bits à 1, ${32-prefix} bits à 0. Conversion par octets : par exemple /24 = 11111111.11111111.11111111.00000000 = 255.255.255.0`
      });
    }

    if (qType === 2) {
      // Adresse de broadcast
      const baseOctets = [
        [192, 168, rand(0, 255), 0],
        [10, rand(0, 255), rand(0, 255), 0],
        [172, rand(16, 31), rand(0, 255), 0],
      ];
      const o = baseOctets[rand(0, 2)];
      const prefix = [24, 25, 26, 27, 28][rand(0, 4)];
      // Calcul broadcast
      const net = _intFromIp(o.join('.')) & _maskFromPrefix(prefix);
      const broadcast = (net | (~_maskFromPrefix(prefix) >>> 0)) >>> 0;
      const correct = _ipFromInt(broadcast);
      const netIp = _ipFromInt(net);
      // Distracteurs : netIp (confusion réseau/broadcast), broadcast−1 (dernière hôte), broadcast+1
      const distractors = [
        netIp,
        _ipFromInt((broadcast - 1) >>> 0),
        _ipFromInt((broadcast + 1) >>> 0),
      ].filter(d => d !== correct);
      const choices = [
        { text: correct, correct: true,
          explain: `Adresse réseau : ${netIp}. Broadcast = dernière adresse du sous-réseau = <strong>${correct}</strong>. Méthode : tous les bits d'hôte à 1.` },
        ...distractors.slice(0, 3).map(d => ({
          text: d, correct: false,
          explain: d === netIp ? `${d} est l'adresse <em>réseau</em>, pas le broadcast (tous bits hôte à 0 vs tous à 1).` : `${d} est dans la plage utilisable, mais pas le broadcast qui doit avoir tous les bits d'hôte à 1.`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle est l'adresse de <strong>broadcast</strong> du sous-réseau <strong>${o.join('.')}/${prefix}</strong> ?`,
        choices,
        hintFn: () => `Broadcast = adresse réseau | inverse(masque). Étape 1 : trouver l'adresse réseau (IP AND masque). Étape 2 : remplacer les bits d'hôte par des 1.`
      });
    }

    if (qType === 3) {
      // Hôtes utilisables
      const prefix = [22, 24, 26, 28, 29, 30][rand(0, 5)];
      const total = Math.pow(2, 32 - prefix);
      const usable = total - 2;
      const correct = String(usable);
      const distractors = [String(total), String(usable - 1), String(usable + 1)].filter(d => d !== correct);
      const choices = [
        { text: correct, correct: true,
          explain: `Hôtes utilisables = 2^(32-${prefix}) − 2 = ${total} − 2 = <strong>${usable}</strong>. On retire l'adresse réseau et l'adresse de broadcast (sauf en /31 et /32 — cas particuliers RFC 3021).` },
        ...distractors.slice(0, 3).map(d => ({
          text: d, correct: false,
          explain: parseInt(d) === total ? `${d} est le total d'adresses, pas les utilisables. Il faut soustraire 2 (réseau + broadcast).` : `Recalcule : 2^(32-${prefix}) − 2.`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Combien d'<strong>hôtes utilisables</strong> dans un sous-réseau <strong>/${prefix}</strong> ?`,
        choices,
        hintFn: () => `Formule : 2^(32 − préfixe) − 2. On retire l'adresse réseau (tous bits hôte à 0) et l'adresse broadcast (tous à 1).`
      });
    }

    if (qType === 4) {
      // RFC 1918 ou non
      const candidates = [
        { ip: '10.5.3.42', priv: true, why: '10.0.0.0/8 (Classe A privée)' },
        { ip: '172.16.10.1', priv: true, why: '172.16.0.0/12 (Classe B privée)' },
        { ip: '192.168.1.1', priv: true, why: '192.168.0.0/16 (Classe C privée)' },
        { ip: '172.32.5.1', priv: false, why: 'hors plage 172.16.0.0–172.31.255.255' },
        { ip: '8.8.8.8', priv: false, why: 'Google Public DNS, plage publique' },
        { ip: '52.219.12.1', priv: false, why: 'plage AWS publique' },
        { ip: '169.254.10.5', priv: false, why: 'APIPA (RFC 3927) — link-local, pas RFC 1918' },
        { ip: '100.64.5.5', priv: false, why: 'Carrier-Grade NAT (RFC 6598), pas RFC 1918' },
      ];
      const target = candidates[rand(0, candidates.length - 1)];
      const choices = [
        { text: 'Oui, adresse privée (RFC 1918)', correct: target.priv,
          explain: target.priv ? `<strong>${target.ip}</strong> appartient à ${target.why}.` : `${target.ip} n'est PAS RFC 1918 — ${target.why}.` },
        { text: 'Non, adresse publique routable sur Internet', correct: !target.priv && !target.why.includes('APIPA') && !target.why.includes('Carrier'),
          explain: !target.priv ? `${target.ip} : ${target.why}.` : `${target.ip} est dans une plage RFC 1918 (privée).` },
        { text: 'Non, adresse link-local APIPA (RFC 3927)', correct: target.why.includes('APIPA'),
          explain: target.why.includes('APIPA') ? `Correct : 169.254.0.0/16 = link-local.` : `${target.ip} n'est pas link-local.` },
        { text: 'Non, plage Carrier-Grade NAT (RFC 6598)', correct: target.why.includes('Carrier'),
          explain: target.why.includes('Carrier') ? `Correct : 100.64.0.0/10 = CGN.` : `${target.ip} n'est pas CGN.` },
      ];
      // Garantir au moins une bonne réponse
      if (!choices.some(c => c.correct)) {
        choices[1].correct = true; // fallback "publique"
      }
      return buildQCMCard({
        ...opts,
        scenario: `L'adresse <strong>${target.ip}</strong> appartient-elle à une plage privée RFC 1918 ?`,
        choices: choices.sort(() => Math.random() - 0.5),
        hintFn: () => `RFC 1918 = 10.0.0.0/8, 172.16.0.0/12 (172.16 à 172.31), 192.168.0.0/16. APIPA (169.254/16) et CGN (100.64/10) sont d'autres plages réservées, mais distinctes.`
      });
    }

    if (qType === 5) {
      // Combien de /26 dans un /24 ?
      const big = [22, 23, 24][rand(0, 2)];
      const small = big + rand(2, 4);
      const count = Math.pow(2, small - big);
      const correct = String(count);
      const distractors = [String(count*2), String(Math.max(2, count/2)), String(count+1)].filter(d => d !== correct);
      const choices = [
        { text: correct, correct: true,
          explain: `On ajoute ${small-big} bits de réseau → 2^${small-big} = <strong>${count}</strong> sous-réseaux /${small} dans un /${big}.` },
        ...distractors.slice(0, 3).map(d => ({ text: d, correct: false, explain: `Recalcule : 2^(${small} − ${big}) = 2^${small-big}.` }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Combien de sous-réseaux <strong>/${small}</strong> peut-on créer dans un <strong>/${big}</strong> ?`,
        choices,
        hintFn: () => `Formule : 2^(préfixe_petit − préfixe_grand). Chaque bit supplémentaire de préfixe = ÷2 le sous-réseau.`
      });
    }

    // qType === 6 : adresse réseau d'une IP donnée
    const ipCandidates = [
      { ip: '192.168.10.42', p: 28 },
      { ip: '10.5.32.130', p: 25 },
      { ip: '172.16.100.200', p: 26 },
      { ip: '192.168.5.99', p: 27 },
    ];
    const c = ipCandidates[rand(0, ipCandidates.length - 1)];
    const net = (_intFromIp(c.ip) & _maskFromPrefix(c.p)) >>> 0;
    const correct = _ipFromInt(net);
    const distractors = [
      _ipFromInt((net + 1) >>> 0),  // 1re hôte
      _ipFromInt((net + Math.pow(2, 32-c.p) - 1) >>> 0),  // broadcast
      c.ip,  // l'IP elle-même
    ].filter(d => d !== correct);
    const choices = [
      { text: correct, correct: true,
        explain: `IP ${c.ip} AND masque /${c.p} = adresse réseau <strong>${correct}</strong>. Méthode : convertir le 3e/4e octet de l'IP en binaire et garder les ${c.p % 8 || 8} bits de poids fort.` },
      ...distractors.slice(0, 3).map(d => ({
        text: d, correct: false,
        explain: d === c.ip ? `${d} est l'IP donnée, pas l'adresse réseau. L'adresse réseau a tous les bits d'hôte à 0.` : `${d} fait partie du sous-réseau mais n'est pas l'adresse réseau (qui a tous les bits d'hôte à 0).`
      }))
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Quelle est l'<strong>adresse réseau</strong> de l'IP <strong>${c.ip}/${c.p}</strong> ?`,
      choices,
      hintFn: () => `Adresse réseau = IP AND masque. /${c.p} → masque = ${_maskToDotted(c.p)}. AND bit-à-bit avec l'IP donne l'adresse réseau (bits d'hôte mis à 0).`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 2 : AES (Chiffrement symétrique)
  // ════════════════════════════════════════════════════════════════

  function genAES() {
    const qType = rand(0, 6);
    const opts = { prefix: 'aes', icon: '🔐', title: 'AES — Chiffrement symétrique', badge: 'crypto' };

    if (qType === 0) {
      // Taille de clé
      const variants = [
        { name: 'AES-128', bits: 128, bytes: 16 },
        { name: 'AES-192', bits: 192, bytes: 24 },
        { name: 'AES-256', bits: 256, bytes: 32 },
      ];
      const target = variants[rand(0, 2)];
      const askBytes = Math.random() < 0.5;
      const correctVal = askBytes ? target.bytes : target.bits;
      const unit = askBytes ? 'octets' : 'bits';
      const correct = String(correctVal);
      const others = variants.filter(v => v !== target).map(v => askBytes ? v.bytes : v.bits);
      const choices = [
        { text: correct + ' ' + unit, correct: true,
          explain: `${target.name} utilise une clé de <strong>${target.bits} bits</strong> = ${target.bytes} octets. Le nom du variant = taille de clé.` },
        ...others.map(o => ({
          text: o + ' ' + unit, correct: false,
          explain: `${o} ${unit} = AES-${askBytes ? o*8 : o}. La question portait sur ${target.name}.`
        })),
        { text: (askBytes ? 16 : 128) + ' ' + unit + ' (taille de bloc)', correct: false,
          explain: `Confusion classique : la <em>taille de bloc</em> AES est toujours 128 bits (16 octets) <em>quelle que soit la clé</em>. Mais ici la question porte sur la <em>clé</em> de ${target.name}.`
        }
      ].slice(0, 4).sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle est la taille de la <strong>clé</strong> de <strong>${target.name}</strong> ?`,
        choices,
        hintFn: () => `AES-N : le nombre N est la taille de clé en bits. AES-128 → 128 bits = 16 octets. AES-256 → 256 bits = 32 octets. La taille de <em>bloc</em> est toujours 128 bits.`
      });
    }

    if (qType === 1) {
      // Taille de bloc
      const correct = '128 bits (16 octets)';
      const choices = [
        { text: correct, correct: true,
          explain: `AES a une <strong>taille de bloc fixe de 128 bits</strong> (16 octets), peu importe la longueur de clé (128/192/256). C'est ce qui distingue AES de Rijndael originel qui permettait blocs variables.` },
        { text: '256 bits (32 octets)', correct: false, explain: `Confusion avec AES-256 (taille de clé). Le <em>bloc</em> reste 128 bits.` },
        { text: '64 bits (8 octets)', correct: false, explain: `64 bits = taille de bloc DES/3DES (ancien). AES = 128 bits.` },
        { text: 'Variable selon la clé (128, 192 ou 256)', correct: false, explain: `Rijndael originel le permettait, mais le standard AES (FIPS 197) fixe le bloc à 128 bits.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle est la taille de <strong>bloc</strong> de AES (peu importe la clé) ?`,
        choices,
        hintFn: () => `Standard FIPS 197 (NIST, 2001). AES = bloc 128 bits fixe. Seule la <em>clé</em> varie : 128, 192 ou 256.`
      });
    }

    if (qType === 2) {
      // Nombre de tours
      const variants = [
        { name: 'AES-128', rounds: 10 },
        { name: 'AES-192', rounds: 12 },
        { name: 'AES-256', rounds: 14 },
      ];
      const target = variants[rand(0, 2)];
      const others = variants.filter(v => v !== target).map(v => v.rounds);
      const choices = [
        { text: target.rounds + ' tours', correct: true,
          explain: `${target.name} effectue <strong>${target.rounds} tours</strong>. Mnémo : 10 (128) → 12 (192) → 14 (256). Plus la clé est longue, plus on ajoute de tours.` },
        ...others.map(o => ({ text: o + ' tours', correct: false, explain: `${o} tours = AES-${o === 10 ? 128 : o === 12 ? 192 : 256}.` })),
        { text: '16 tours', correct: false, explain: `AES ne dépasse jamais 14 tours. 16 c'est plus que ce qui est défini par FIPS 197.` },
      ].slice(0, 4).sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Combien de <strong>tours (rounds)</strong> effectue <strong>${target.name}</strong> ?`,
        choices,
        hintFn: () => `Règle : 10 / 12 / 14 tours pour AES-128 / 192 / 256. Chaque tour applique SubBytes, ShiftRows, MixColumns (sauf le dernier), AddRoundKey.`
      });
    }

    if (qType === 3) {
      // Mode ECB sécurité
      const choices = [
        { text: 'Non, le mode ECB révèle des motifs visibles (problème de l\'image du pingouin Tux chiffrée en ECB)', correct: true,
          explain: `<strong>ECB chiffre chaque bloc indépendamment</strong> : deux blocs identiques produisent le même chiffré → fuite de structure. Démonstration classique : image bitmap d'un pingouin chiffrée en ECB reste reconnaissable. Toujours préférer CBC, CTR, ou idéalement GCM (AEAD).` },
        { text: 'Oui, ECB est aussi sûr que CBC tant que la clé est secrète', correct: false,
          explain: `Faux. La confidentialité d'une clé secrète ne suffit pas en ECB : la structure (motifs répétitifs) reste visible dans le chiffré.` },
        { text: 'Oui, à condition d\'utiliser AES-256 et non AES-128', correct: false,
          explain: `La taille de clé ne change rien au problème ECB : c'est le mode opératoire qui est défaillant, pas l'algorithme.` },
        { text: 'Oui, en chiffrant l\'image deux fois (double ECB)', correct: false,
          explain: `Double-encryption ne corrige pas le motif déterministe. Il faut un mode qui randomise (IV ou nonce).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Le mode <strong>ECB</strong> (Electronic Codebook) est-il sûr pour chiffrer une <strong>image</strong> bitmap ?`,
        choices,
        hintFn: () => `ECB = chaque bloc chiffré indépendamment, sans chainage. Deux blocs identiques → même résultat. Image bitmap = beaucoup de blocs identiques (uniformes). Résultat : motifs visibles.`
      });
    }

    if (qType === 4) {
      // GCM apport
      const choices = [
        { text: 'Authentification (intégrité + authenticité) en plus de la confidentialité — AEAD', correct: true,
          explain: `<strong>AES-GCM</strong> est un mode <em>AEAD</em> (Authenticated Encryption with Associated Data). En plus de chiffrer (confidentialité), il produit un <strong>tag d'authentification</strong> (typiquement 128 bits) qui détecte toute modification. Standard : NIST SP 800-38D. Largement utilisé : TLS 1.3, IPsec, SSH.` },
        { text: 'Une clé deux fois plus longue automatiquement', correct: false,
          explain: `Faux. GCM est un mode opératoire, indépendant de la taille de clé. AES-128-GCM, AES-256-GCM existent tous deux.` },
        { text: 'Une résistance aux attaques quantiques', correct: false,
          explain: `Faux. GCM ne résiste pas mieux qu'AES standard à Grover (qui divise la sécurité effective par √). Post-quantique = autre sujet (Kyber, Dilithium...).` },
        { text: 'Une compression automatique du message', correct: false,
          explain: `Faux. AES (et tous ses modes) ne compresse pas — la sortie a la même taille que l'entrée (+ tag + nonce pour GCM).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Qu'apporte le mode <strong>AES-GCM</strong> par rapport à AES-CBC ?`,
        choices,
        hintFn: () => `GCM = Galois/Counter Mode. AEAD : Authenticated Encryption with Associated Data. Le "A" final = authentification — détection de modification du chiffré.`
      });
    }

    if (qType === 5) {
      // IV obligation
      const modes = [
        { name: 'CBC', needsIV: true, ivSize: '16 octets (= taille bloc)' },
        { name: 'CTR', needsIV: true, ivSize: '8-12 octets (nonce)' },
        { name: 'GCM', needsIV: true, ivSize: '12 octets (nonce, recommandé)' },
        { name: 'ECB', needsIV: false, ivSize: 'aucun (ne devrait pas être utilisé)' },
        { name: 'CFB', needsIV: true, ivSize: '16 octets' },
        { name: 'OFB', needsIV: true, ivSize: '16 octets' },
      ];
      const target = modes[rand(0, modes.length - 1)];
      const choices = [
        { text: target.needsIV ? `Oui — IV de ${target.ivSize}` : 'Non — pas d\'IV requis', correct: true,
          explain: target.needsIV ?
            `<strong>${target.name}</strong> nécessite un <strong>IV/nonce de ${target.ivSize}</strong>. L'IV doit être unique (pour CTR/GCM) ou imprévisible (pour CBC) pour garantir la sécurité.` :
            `<strong>${target.name}</strong> n'utilise pas d'IV. C'est aussi pour ça qu'il est déterministe et peu sûr (motifs visibles).` },
        { text: target.needsIV ? 'Non — pas d\'IV requis' : 'Oui — IV de 16 octets', correct: false,
          explain: target.needsIV ? `Faux. ${target.name} requiert un IV/nonce pour randomiser le chiffré.` : `Faux. ${target.name} ne prend pas d'IV.` },
        { text: 'Optionnel — l\'IV améliore la sécurité sans être obligatoire', correct: false,
          explain: `Pour les modes qui en requièrent un (CBC, CTR, GCM…), l'IV est <em>obligatoire</em>. Sans IV, le mode dégénère en ECB.` },
        { text: 'Uniquement avec AES-256, pas AES-128', correct: false,
          explain: `La nécessité d'un IV dépend du <em>mode</em>, pas de la taille de clé.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Le mode <strong>AES-${target.name}</strong> nécessite-t-il un IV (vecteur d'initialisation) ?`,
        choices,
        hintFn: () => `Seul ECB n'utilise pas d'IV (et c'est ce qui le rend inadapté). Tous les autres modes courants (CBC, CTR, CFB, OFB, GCM) requièrent un IV/nonce pour randomiser le chiffré.`
      });
    }

    // qType === 6 : combien de blocs pour un message de N octets
    const sizes = [10, 16, 17, 32, 64, 100, 1024];
    const size = sizes[rand(0, sizes.length - 1)];
    const blocks = Math.ceil(size / 16);
    // PKCS#7 padding : même si size est multiple de 16, on ajoute un bloc complet de padding
    const blocksWithPad = (size % 16 === 0) ? blocks + 1 : blocks;
    const correct = String(blocksWithPad);
    const distractors = [String(blocks), String(blocksWithPad + 1), String(Math.floor(size / 16))].filter(d => d !== correct);
    const choices = [
      { text: correct, correct: true,
        explain: `Message ${size} octets, bloc AES = 16 octets. ${size % 16 === 0 ? `Cas spécial : ${size} est déjà un multiple de 16, mais <strong>PKCS#7 ajoute un bloc complet de padding</strong> pour distinguer la fin → ${blocksWithPad} blocs.` : `${size} / 16 = ${size/16} → on arrondit au supérieur = ${blocks} blocs (le dernier contient le padding PKCS#7).`}` },
      ...distractors.slice(0, 3).map(d => ({
        text: d, correct: false,
        explain: parseInt(d) === blocks && size % 16 === 0 ?
          `${d} blocs si on oublie le padding PKCS#7. Mais quand size est multiple de 16, PKCS#7 ajoute un bloc complet de padding pour signaler la fin.` :
          `Recalcule : ceil(${size} / 16) blocs, +1 si size est multiple de 16 (padding PKCS#7).`
      }))
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Combien de blocs AES (de 16 octets) pour chiffrer un message de <strong>${size} octets</strong> avec padding PKCS#7 ?`,
      choices,
      hintFn: () => `Bloc AES = 16 octets. Formule : ceil(taille / 16). Si la taille est déjà multiple de 16, PKCS#7 ajoute un bloc <em>complet</em> de padding (pour signaler la fin sans ambiguïté).`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 3 : Cassage de hash (Cryptologie → Cassage et attaques)
  // ════════════════════════════════════════════════════════════════

  function genCracking() {
    const qType = rand(0, 6);
    const opts = { prefix: 'crack', icon: '💥', title: 'Cassage de hash', badge: 'crypto' };

    if (qType === 0) {
      // Type d'attaque selon contexte
      const choices = [
        { text: 'Attaque par dictionnaire (wordlist comme rockyou.txt)', correct: true,
          explain: `Une <strong>wordlist</strong> = liste de mots probables. Hashcat <code>-a 0</code> ou John <code>--wordlist=</code>. La rockyou.txt (~14M mots) est la wordlist de référence depuis la fuite RockYou 2009.` },
        { text: 'Attaque brute force pure (toutes combinaisons)', correct: false,
          explain: `Brute force teste <em>toutes</em> les combinaisons (Hashcat <code>-a 3</code>) — beaucoup plus lent qu'un dictionnaire. Utile uniquement pour passwords courts ou très contraints.` },
        { text: 'Attaque par rainbow tables', correct: false,
          explain: `Les rainbow tables sont des tables précalculées de (hash → password). Inefficaces contre les hash <em>salés</em>. Hashcat ne les utilise pas — outil dédié : RainbowCrack.` },
        { text: 'Attaque par collision (deux entrées, même hash)', correct: false,
          explain: `Collision = trouver deux <em>entrées différentes</em> donnant le même hash (cf. SHA-1 SHAttered, 2017). Sans rapport avec cracker un password.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Vous voulez casser des hash MD5 en testant les passwords issus de la fuite RockYou. Quelle attaque utilisez-vous ?`,
        choices,
        hintFn: () => `Dictionnaire = essayer des mots de passe probables (wordlist). Brute force = essayer toutes les combinaisons possibles. Rainbow tables = lookup précalculé (inefficace si salé).`
      });
    }

    if (qType === 1) {
      // Salt et rainbow tables
      const choices = [
        { text: 'Un sel <strong>aléatoire et unique par utilisateur</strong>, stocké en clair avec le hash', correct: true,
          explain: `Avec un sel unique par utilisateur, chaque password produit un hash différent même si deux utilisateurs ont le même mot de passe. Les rainbow tables (précalculées pour un sel <em>fixe</em> ou aucun sel) deviennent inutilisables : il faudrait une table par sel.` },
        { text: 'Augmenter la longueur du mot de passe à 20 caractères', correct: false,
          explain: `La longueur ne neutralise pas les rainbow tables (elles peuvent être grandes). Mais combinée à un sel, c'est encore mieux.` },
        { text: 'Utiliser SHA-512 au lieu de MD5', correct: false,
          explain: `Un hash plus large rend la table plus grosse mais reste vulnérable aux rainbow tables si non salé. La taille du hash n'est pas le facteur clé.` },
        { text: 'Garder le hash secret', correct: false,
          explain: `Mauvaise hypothèse : on doit supposer que le hash sera exfiltré. C'est <em>justement</em> dans ce cas que le sel devient critique.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle mesure rend les <strong>rainbow tables</strong> inefficaces ?`,
        choices,
        hintFn: () => `Rainbow tables = précalcul (hash → password) pour un type de hash donné. Un sel aléatoire <em>par utilisateur</em> oblige à recalculer la table pour chaque sel — économiquement impraticable.`
      });
    }

    if (qType === 2) {
      // Hashcat mode
      const modes = [
        { id: 0, algo: 'MD5' },
        { id: 100, algo: 'SHA-1' },
        { id: 1400, algo: 'SHA-256' },
        { id: 1700, algo: 'SHA-512' },
        { id: 1000, algo: 'NTLM' },
        { id: 3200, algo: 'bcrypt' },
        { id: 22000, algo: 'WPA/WPA2 (PMKID/EAPOL)' },
      ];
      const target = modes[rand(0, modes.length - 1)];
      const others = modes.filter(m => m !== target);
      const distractors = [];
      while (distractors.length < 3 && others.length) {
        distractors.push(others.splice(rand(0, others.length - 1), 1)[0]);
      }
      const choices = [
        { text: target.algo, correct: true,
          explain: `Hashcat <strong>-m ${target.id}</strong> = <strong>${target.algo}</strong>. Hashcat utilise des numéros de mode pour chaque algorithme (voir <code>hashcat --help</code> ou docs hashcat.net).` },
        ...distractors.map(d => ({
          text: d.algo, correct: false,
          explain: `${d.algo} = mode <strong>-m ${d.id}</strong> dans hashcat, pas -m ${target.id}.`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Dans hashcat, <strong>-m ${target.id}</strong> correspond à quel algorithme ?`,
        choices,
        hintFn: () => `Modes hashcat courants : 0 = MD5, 100 = SHA-1, 1000 = NTLM, 1400 = SHA-256, 1700 = SHA-512, 3200 = bcrypt, 22000 = WPA/WPA2.`
      });
    }

    if (qType === 3) {
      // bcrypt vs MD5 lenteur
      const cost = [10, 12, 14][rand(0, 2)];
      const factor = Math.pow(2, cost);
      const correct = `~${factor.toLocaleString('fr-CH').replace(/\u202f/g, ' ')} fois plus lent`;
      const distractors = [
        `~${cost} fois plus lent (linéaire)`,
        `~${factor*10} fois plus lent`,
        `~${Math.floor(factor/2)} fois plus lent`,
      ];
      const choices = [
        { text: correct, correct: true,
          explain: `bcrypt utilise un facteur de coût <em>exponentiel</em> : cost=${cost} signifie 2^${cost} = <strong>${factor} itérations</strong>. Conçu pour rester lent même sur GPU. À comparer aux ~50 GH/s de MD5 sur RTX 4090.` },
        ...distractors.map(d => ({ text: d, correct: false, explain: `bcrypt cost est <strong>exponentiel</strong> : 2^cost, pas linéaire ni cost × N.` }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Un hash <strong>bcrypt avec cost=${cost}</strong> est combien de fois plus lent qu'un MD5 ?`,
        choices,
        hintFn: () => `bcrypt cost est exponentiel : nombre d'itérations = 2^cost. cost=12 → 4'096 itérations. C'est l'idée centrale des "slow hashes" : ralentir le cassage.`
      });
    }

    if (qType === 4) {
      // KDF moderne recommandée
      const choices = [
        { text: 'Argon2id (vainqueur PHC 2015) ou scrypt — protègent CPU + mémoire', correct: true,
          explain: `<strong>Argon2id</strong> (RFC 9106, 2021) est recommandé par OWASP, NIST SP 800-63B. Variantes : Argon2d (anti-GPU), Argon2i (anti-side-channel), Argon2id (les deux). Alternatives : <strong>scrypt</strong>, <strong>bcrypt</strong>, <strong>PBKDF2</strong> (le plus ancien). MD5/SHA-1/SHA-256 simple = pas un KDF, trop rapides.` },
        { text: 'SHA-256 itéré 1000 fois', correct: false,
          explain: `Approche naïve. PBKDF2-SHA256 fait ça correctement (avec sel + nonce + format standardisé), mais 1000 itérations c'est trop peu en 2026. OWASP recommande ≥600 000.` },
        { text: 'MD5 doublé (MD5(MD5(password)))', correct: false,
          explain: `Mauvaise idée : MD5 est cassé (collisions), et doubler ne ralentit pas significativement. Utiliser un vrai KDF.` },
        { text: 'AES-256 du password comme clé', correct: false,
          explain: `AES n'est pas un KDF — c'est un chiffrement par bloc. Pour dériver une clé d'un password, utiliser PBKDF2/scrypt/Argon2.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle fonction de dérivation de clé (KDF) est <strong>recommandée en 2026</strong> pour stocker des mots de passe ?`,
        choices,
        hintFn: () => `KDF moderne = lent ET memory-hard (utilise beaucoup de RAM, anti-GPU). Argon2id (vainqueur Password Hashing Competition 2015) est la référence actuelle.`
      });
    }

    if (qType === 5) {
      // Identifier un hash par sa longueur
      const samples = [
        { hash: 'e10adc3949ba59abbe56e057f20f883e', algo: 'MD5', len: 32, bits: 128 },
        { hash: '7c4a8d09ca3762af61e59520943dc26494f8941b', algo: 'SHA-1', len: 40, bits: 160 },
        { hash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', algo: 'SHA-256', len: 64, bits: 256 },
        { hash: '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', algo: 'bcrypt', len: 60, bits: 184 },
        { hash: '8846F7EAEE8FB117AD06BDD830B7586C', algo: 'NTLM', len: 32, bits: 128 },
      ];
      const target = samples[rand(0, samples.length - 1)];
      const others = samples.filter(s => s.algo !== target.algo);
      const distractors = others.slice(0, 3).map(s => s.algo);
      const choices = [
        { text: target.algo, correct: true,
          explain: `Longueur = ${target.len} ${target.algo === 'bcrypt' ? 'caractères au format <code>$2y$cost$salt+hash</code>' : 'caractères hexadécimaux'}. <strong>${target.algo}</strong> produit ${target.bits} bits${target.algo === 'NTLM' ? ' (même longueur que MD5 — contexte Windows nécessaire pour les distinguer)' : ''}.` },
        ...distractors.map(d => {
          const s = samples.find(x => x.algo === d);
          return { text: d, correct: false, explain: `${d} ferait ${s.len} caractères (${s.bits} bits)${d === 'NTLM' && target.algo === 'MD5' ? ' — même longueur que MD5, indiscernable sans contexte' : ''}.` };
        })
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel algorithme a probablement produit ce hash ?<br><code style="color:var(--cyan);word-break:break-all;font-size:.7rem;display:block;margin-top:.4rem;padding:.4rem;background:var(--bg);border-radius:4px">${target.hash}</code>`,
        choices,
        hintFn: () => `MD5 = 32 hex. SHA-1 = 40 hex. SHA-256 = 64 hex. SHA-512 = 128 hex. NTLM = 32 hex (= MD5, indiscernables sans contexte). bcrypt commence par $2a$, $2b$ ou $2y$.`
      });
    }

    // qType === 6 : John the Ripper vs Hashcat
    const choices = [
      { text: 'Hashcat est principalement GPU (CUDA/OpenCL), John the Ripper est principalement CPU', correct: true,
        explain: `<strong>Hashcat</strong> est optimisé GPU (NVIDIA via CUDA, AMD via OpenCL) — typiquement 100×–1000× plus rapide qu'un CPU pour MD5/SHA. <strong>John the Ripper</strong> est historiquement CPU mais a une version "Jumbo" avec support GPU. Les deux utilisent dictionnaires, brute force, masks, rules.` },
      { text: 'John the Ripper est GPU, Hashcat est CPU', correct: false,
        explain: `Inversé. C'est Hashcat qui est principalement GPU.` },
      { text: 'Ils sont identiques, juste deux noms pour le même outil', correct: false,
        explain: `Deux outils distincts, créés indépendamment. Hashcat (Jens Steube, 2009). John the Ripper (Solar Designer, 1996).` },
      { text: 'Hashcat ne supporte que les hashes Windows, John tous les autres', correct: false,
        explain: `Faux. Hashcat supporte ~400 modes (Linux/Windows/Mac, WiFi, Office, ZIP, KeePass, etc.).` },
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Quelle est la <strong>différence principale</strong> entre Hashcat et John the Ripper ?`,
      choices,
      hintFn: () => `Hashcat (2009, Jens Steube) = GPU first. John the Ripper (1996, Solar Designer) = CPU first. Les deux supportent dictionnaire, brute force, masks et règles.`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 4 : PKI / Certificats X.509
  // ════════════════════════════════════════════════════════════════

  function genPKI() {
    const qType = rand(0, 6);
    const opts = { prefix: 'pki', icon: '📜', title: 'PKI & Certificats X.509', badge: 'crypto' };

    if (qType === 0) {
      // CN
      const choices = [
        { text: 'Le <strong>Common Name</strong> — typiquement le FQDN du serveur (ex: <code>www.example.ch</code>)', correct: true,
          explain: `Le <strong>CN (Common Name)</strong> identifie le sujet du certificat. Pour un cert TLS, c'est traditionnellement le FQDN principal. Depuis 2017 (politique CA/B Forum), les navigateurs <em>ignorent</em> le CN pour la validation et ne regardent que le SAN (Subject Alternative Name).` },
        { text: 'Le nom de la CA qui a signé le certificat', correct: false,
          explain: `Le nom de la CA émettrice est dans le champ <strong>Issuer</strong>, pas dans le CN du sujet.` },
        { text: 'Le numéro de série unique du certificat', correct: false,
          explain: `Le numéro de série est dans le champ <strong>Serial Number</strong> (séparé du CN).` },
        { text: 'L\'algorithme de signature (ex: SHA-256 with RSA)', correct: false,
          explain: `L'algo de signature est dans <strong>Signature Algorithm</strong>, pas dans le CN.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Dans un certificat X.509, à quoi correspond le champ <strong>CN</strong> du Subject ?`,
        choices,
        hintFn: () => `Le sujet (Subject) contient CN, O (Organization), OU, L (Locality), ST (State), C (Country). Pour un cert TLS, le CN est traditionnellement le FQDN, mais les navigateurs modernes utilisent le SAN.`
      });
    }

    if (qType === 1) {
      // SAN
      const choices = [
        { text: '<strong>Subject Alternative Name</strong> — liste de FQDN/IP/email couverts par le certificat', correct: true,
          explain: `Le <strong>SAN</strong> (OID 2.5.29.17) liste tous les noms couverts par le certificat : DNS, IP, email, URI. Indispensable pour un cert multi-domaine (ex: <code>example.ch, www.example.ch, api.example.ch</code>). Depuis 2017 (RFC 6125 + politique CA/B Forum), les navigateurs ignorent le CN et exigent un SAN.` },
        { text: 'Subject Authority Name — le nom de l\'autorité émettrice', correct: false,
          explain: `Faux acronyme inventé. La CA émettrice est dans le champ <strong>Issuer</strong>, pas SAN.` },
        { text: 'Secure Algorithm Name — l\'algorithme de chiffrement TLS négocié', correct: false,
          explain: `Inventé. L'algorithme TLS est négocié à l'établissement de la session, pas stocké dans le cert.` },
        { text: 'Signature Authority Number — un identifiant unique de la signature', correct: false,
          explain: `Inventé. La signature numérique est dans <strong>Signature Value</strong>.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Que signifie le champ <strong>SAN</strong> dans un certificat X.509 ?`,
        choices,
        hintFn: () => `SAN = Subject Alternative Name. Permet à un certificat de couvrir plusieurs domaines/IP/emails. OID 2.5.29.17. Critique depuis que les navigateurs ignorent le CN (2017+).`
      });
    }

    if (qType === 2) {
      // CA root self-signed
      const choices = [
        { text: 'Oui, une CA root signe son propre certificat (self-signed)', correct: true,
          explain: `Une <strong>CA root est par définition self-signed</strong> : son certificat racine est signé avec sa propre clé privée. La confiance vient de l'inclusion manuelle dans le <em>trust store</em> du système (Windows, macOS, Linux distros, Mozilla, etc.) — pas d'une autre CA au-dessus.` },
        { text: 'Non, une CA root est toujours signée par une autorité supérieure', correct: false,
          explain: `Faux. Par définition, il n'y a rien au-dessus d'une CA <em>root</em>. Si elle était signée par autre chose, ce ne serait pas une racine.` },
        { text: 'Non, le cert root n\'est jamais signé — seulement empreinté', correct: false,
          explain: `Faux. Le cert root <em>est</em> signé numériquement, par sa propre clé privée (self-signed). C'est la signature qui prouve qu'il n'a pas été altéré.` },
        { text: 'Oui mais uniquement les CA gouvernementales', correct: false,
          explain: `Faux. Toutes les CA root sont self-signed, qu'elles soient commerciales (DigiCert, Let's Encrypt), gouvernementales (SwissSign), ou privées (entreprise).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Une <strong>CA racine</strong> (root) signe-t-elle son propre certificat ?`,
        choices,
        hintFn: () => `Hiérarchie PKI : Root CA → Intermediate CA → certificat final (end-entity). La racine est self-signed. La confiance vient du fait que son cert est pré-installé dans les trust stores.`
      });
    }

    if (qType === 3) {
      // Durée max cert TLS public 2026
      const choices = [
        { text: '398 jours (depuis septembre 2020, politique CA/B Forum)', correct: true,
          explain: `Depuis le <strong>1er septembre 2020</strong>, le <em>CA/Browser Forum</em> limite les certs TLS publiquement de confiance à <strong>398 jours</strong> de validité. Apple a poussé cette mesure (initiée par Safari) pour forcer la rotation, limiter l'impact de fuites de clé, et fluidifier l'adoption d'algorithmes nouveaux.` },
        { text: '825 jours (ancien plafond de 2018-2020)', correct: false,
          explain: `825 jours était le plafond entre mars 2018 et août 2020. Désormais 398 jours pour les nouveaux certs.` },
        { text: '5 ans (1825 jours)', correct: false,
          explain: `Ancien plafond avant 2015. Plus autorisé depuis longtemps pour les certs publiquement de confiance.` },
        { text: 'Pas de limite, dépend de la CA', correct: false,
          explain: `Faux. Pour les certs reconnus par les navigateurs (Mozilla, Apple, Microsoft, Chrome trust stores), la limite est uniforme à 398 jours.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle est la <strong>durée de validité maximale</strong> d'un certificat TLS publiquement de confiance en 2026 ?`,
        choices,
        hintFn: () => `Politique CA/B Forum (CA/Browser Forum). Évolution : 5 ans (avant 2015) → 39 mois (2015) → 27 mois (2018) → 13 mois ≈ 398 jours (2020+). Un nouveau projet vise 47 jours d'ici 2029.`
      });
    }

    if (qType === 4) {
      // Algo signature courant 2026
      const choices = [
        { text: '<strong>SHA-256 with RSA</strong> ou <strong>ECDSA P-256 (SHA-256)</strong>', correct: true,
          explain: `Les algorithmes courants en 2026 : <strong>RSA-2048/3072 + SHA-256</strong> (encore majoritaire) et <strong>ECDSA P-256 + SHA-256</strong> (plus performant, certs plus petits). RSA-4096 ou ECDSA P-384 pour les usages haute sécurité.` },
        { text: 'MD5 with RSA', correct: false,
          explain: `MD5 est cassé pour les signatures depuis 2008 (collisions Marc Stevens). Interdit dans les certs publics depuis 2012 par Mozilla/Microsoft.` },
        { text: 'SHA-1 with RSA', correct: false,
          explain: `SHA-1 déprécié dans les certs publics depuis 2017 (SHAttered, Google/CWI). Aucune CA publique ne le signe plus.` },
        { text: 'DES-CBC', correct: false,
          explain: `DES est un chiffrement par bloc, pas une signature. Et largement obsolète (clé 56 bits cassée trivialement).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel <strong>algorithme de signature</strong> est utilisé sur un certificat TLS moderne en 2026 ?`,
        choices,
        hintFn: () => `Signature courante : SHA-256 with RSA-2048+ ou ECDSA P-256 with SHA-256. SHA-1 et MD5 sont dépréciés. Post-quantique (Dilithium, etc.) en phase d'adoption mais pas déployé en production.`
      });
    }

    if (qType === 5) {
      // OCSP vs CRL
      const choices = [
        { text: '<strong>OCSP</strong> = requête en ligne par cert (réponse signée par la CA). <strong>CRL</strong> = liste complète des certs révoqués téléchargée périodiquement.', correct: true,
          explain: `<strong>OCSP</strong> (Online Certificate Status Protocol, RFC 6960) : le client envoie le serial d'un cert au répondeur OCSP de la CA → réponse signée "good/revoked/unknown". <strong>CRL</strong> (Certificate Revocation List, RFC 5280) : liste complète des serials révoqués, téléchargée et cachée par le client. OCSP-Stapling : le serveur attache la réponse OCSP au handshake TLS (latence ↓, vie privée ↑).` },
        { text: 'OCSP et CRL font la même chose, juste deux noms différents', correct: false,
          explain: `Faux. Mécanismes distincts complémentaires. OCSP = on-demand par cert. CRL = liste complète prétéléchargée.` },
        { text: 'OCSP révoque les certs, CRL les renouvelle', correct: false,
          explain: `Aucun des deux ne révoque ni ne renouvelle : ils <em>vérifient le statut de révocation</em>. La révocation se fait via le CRL Distribution Point côté CA.` },
        { text: 'OCSP est pour les certs RSA, CRL pour les certs ECDSA', correct: false,
          explain: `Faux. Les deux protocoles sont agnostiques à l'algo de signature du cert.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle est la <strong>différence entre OCSP et CRL</strong> ?`,
        choices,
        hintFn: () => `Vérifier qu'un cert n'a pas été révoqué. CRL = télécharger la liste complète (lourd). OCSP = demander cert par cert au répondeur de la CA (latence). OCSP-Stapling améliore les deux : le serveur joint la réponse au handshake.`
      });
    }

    // qType === 6 : Key Usage
    const choices = [
      { text: '<strong>Key Usage</strong> (et Extended Key Usage) — définit à quoi sert la clé publique', correct: true,
        explain: `<strong>Key Usage</strong> (OID 2.5.29.15) liste les usages permis : Digital Signature, Key Encipherment, Data Encipherment, Key Agreement, Cert Sign, CRL Sign, etc. <strong>Extended Key Usage</strong> (OID 2.5.29.37) précise : Server Authentication (1.3.6.1.5.5.7.3.1), Client Auth (.2), Code Signing (.3), Email Protection (.4)…` },
      { text: 'Subject Alternative Name', correct: false,
        explain: `SAN liste les noms couverts (DNS, IP, email), pas les usages permis de la clé.` },
      { text: 'Basic Constraints', correct: false,
        explain: `Basic Constraints (2.5.29.19) indique si le cert est une CA (<code>CA:TRUE</code>) ou non, et la profondeur max de la chaîne. Pas les usages cryptographiques.` },
      { text: 'Subject Key Identifier', correct: false,
        explain: `SKI (2.5.29.14) est un hash de la clé publique, utilisé pour matcher l'<em>Issuer Key Identifier</em> du cert enfant. Pas les usages.` },
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Quelle extension X.509 indique <strong>à quoi peut servir la clé publique</strong> (signature, chiffrement, etc.) ?`,
      choices,
      hintFn: () => `Key Usage (2.5.29.15) = capacités cryptographiques permises. Extended Key Usage (2.5.29.37) = usages applicatifs (TLS server, code signing, etc.). Une CA aura "Certificate Sign + CRL Sign", un cert TLS server aura "Digital Signature + Key Encipherment".`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // Enregistrement dans GENERATORS (require tp-engine.js chargé avant)
  // ════════════════════════════════════════════════════════════════
  if (typeof window !== 'undefined' && window.GENERATORS) {
    window.GENERATORS.cidr = genCIDR;
    window.GENERATORS.aes = genAES;
    window.GENERATORS.cracking = genCracking;
    window.GENERATORS.pki = genPKI;
  } else if (typeof GENERATORS !== 'undefined') {
    GENERATORS.cidr = genCIDR;
    GENERATORS.aes = genAES;
    GENERATORS.cracking = genCracking;
    GENERATORS.pki = genPKI;
  }

  // Exporter pour console / debug
  if (typeof window !== 'undefined') {
    window.genCIDR = genCIDR;
    window.genAES = genAES;
    window.genCracking = genCracking;
    window.genPKI = genPKI;
  }
})();
