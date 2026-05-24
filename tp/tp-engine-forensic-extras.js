// ═══════════════════════════════════════════════════════════════════
// tp-engine-forensic-extras.js — CAS-IN TP delta v109
// 3 TP : Acquisition & Préservation, LLM/IA & Deepfakes, Google Dorks
// 3 niveaux progressifs par TP, modèle standard v101-v108
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // HELPERS partagés (identiques aux autres engines)
  // ────────────────────────────────────────────────────────────────
  function buildPracticeCard(opts) {
    const id = opts.prefix;
    const div = document.createElement('div');
    div.className = 'ex-card';

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-${id}">${opts.icon || '🔧'}</div>
        <div class="ex-title">${opts.title}</div>
        <span class="ex-badge easy">${opts.badge || 'pratique'}</span>
      </div>
      <div class="ex-scenario">${opts.question}</div>
      <div style="margin:.7rem 0">${opts.artefactHTML}</div>
      <div class="ex-input-row" style="flex-wrap:wrap;gap:8px">
        ${opts.inputLabel ? `<span class="ex-input-label">${opts.inputLabel}</span>` : ''}
        <input class="ex-input" id="inp-${id}" placeholder="${opts.placeholder || ''}" autocomplete="off" spellcheck="false">
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
        const ok = got === exp;

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

  // Générer un hash factice (réaliste mais aléatoire)
  function _randomHex(len) {
    const chars = '0123456789abcdef';
    let s = '';
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 16)];
    return s;
  }

  // ════════════════════════════════════════════════════════════════
  // TP 1 : ACQUISITION & PRÉSERVATION
  // ════════════════════════════════════════════════════════════════

  const ACQ_DEVICES = [
    { src: '/dev/sdb',     desc: 'disque dur USB saisi sur scène',     size: '500 GB',  fs: 'NTFS' },
    { src: '/dev/sdc1',    desc: 'partition d\'un poste suspect',      size: '256 GB',  fs: 'ext4' },
    { src: '/dev/disk3s1', desc: 'volume APFS d\'un MacBook saisi',    size: '512 GB',  fs: 'APFS' },
    { src: '/dev/mmcblk0', desc: 'carte SD saisie chez le suspect',    size: '32 GB',   fs: 'FAT32' },
    { src: '/dev/sdd',     desc: 'clé USB déposée par un témoin',      size: '128 GB',  fs: 'exFAT' },
    { src: '/dev/nvme0n1', desc: 'SSD M.2 démonté d\'un PC fixe',      size: '1 TB',    fs: 'NTFS' }
  ];

  function genAcquisition() {
    const level = rand(0, 2);
    const opts = { prefix: 'acq', icon: '🔬', title: 'Acquisition & Préservation' };

    // ── Niveau A : extraire le hash final d'un dump dcfldd ──
    if (level === 0) {
      const dev = ACQ_DEVICES[rand(0, ACQ_DEVICES.length - 1)];
      const alg = ['md5', 'sha256'][rand(0, 1)];
      const hashLen = alg === 'md5' ? 32 : 64;
      const hash = _randomHex(hashLen);
      const blocks = rand(800000, 2000000);
      const speed = (rand(60, 180)).toFixed(1);

      const output = `# Acquisition du ${dev.desc}
# Source : ${dev.src} (${dev.size}, ${dev.fs})
# Outil  : dcfldd avec calcul de hash en flux

$ sudo dcfldd if=${dev.src} of=/mnt/preuve/image.dd hash=${alg} hashlog=hash.log bs=4M

${blocks} blocks (${(blocks * 4 / 1024).toFixed(0)} MB) written
${(blocks * 4 / 1024 / parseFloat(speed) / 60).toFixed(1)} min elapsed (${speed} MB/s)

# Contenu de hash.log :
Total (${alg}): ${hash}

# Acquisition terminée. Empreinte d'intégrité disponible.`;

      const artefactHTML = renderTextBlock(output, {
        title: 'Acquisition forensique avec dcfldd',
        highlights: [{ match: 'Total (', color: '--cyan' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici la sortie d'une acquisition forensique avec <code>dcfldd</code> (variante de <code>dd</code> qui calcule le hash en flux pendant la copie). <strong>Quel est le hash ${alg.toUpperCase()}</strong> de l'image acquise ?`,
        inputLabel: 'Hash :',
        placeholder: alg === 'md5' ? 'abcdef0123456789...' : '0123456789abcdef...',
        expected: hash,
        normalize: v => v.trim().toLowerCase().replace(/\s/g, ''),
        hints: [
          `Le hash final est dans le fichier <code>hash.log</code> généré par <code>dcfldd</code>. Cherche la ligne commençant par <code>Total</code>.`,
          `La ligne <code>Total (${alg}): ...</code> contient l'empreinte. Recopie les ${hashLen} caractères hex.`,
          `Hash ${alg.toUpperCase()} = <code style="word-break:break-all">${hash}</code>`
        ],
        explain: `Hash ${alg.toUpperCase()} = <strong style="word-break:break-all">${hash}</strong>. <code>dcfldd</code> est la version forensique de <code>dd</code> — il calcule le hash <em>pendant</em> la copie (un seul passage du disque). Ce hash sera comparé à un re-hash de l'image après pour prouver l'intégrité (chain of custody).`
      });
    }

    // ── Niveau B : comparer 2 hashs (avant/après acquisition) ──
    if (level === 1) {
      const dev = ACQ_DEVICES[rand(0, ACQ_DEVICES.length - 1)];
      const alg = ['md5', 'sha256'][rand(0, 1)];
      const hashLen = alg === 'md5' ? 32 : 64;
      const hashSource = _randomHex(hashLen);
      // 70% des cas : intègre (hashs identiques). 30% : altéré.
      const intact = Math.random() < 0.7;
      const hashImage = intact ? hashSource : _randomHex(hashLen);
      const expected = intact ? 'oui' : 'non';

      const output = `# Vérification d'intégrité d'une acquisition forensique

## 1. Hash de la SOURCE (avant copie, sur ${dev.src}) :
$ sudo ${alg}sum ${dev.src}
${hashSource}  ${dev.src}

## 2. Hash de l'IMAGE COPIÉE (après copie, sur disque de preuve) :
$ ${alg}sum /mnt/preuve/image.dd
${hashImage}  /mnt/preuve/image.dd

## 3. Vérification :
$ diff <(echo ${hashSource}) <(echo ${hashImage})
${intact ? '(aucune sortie — les fichiers sont identiques)' : '< ' + hashSource + '\n---\n> ' + hashImage}`;

      const artefactHTML = renderTextBlock(output, {
        title: 'Vérification d\'intégrité (chaîne de possession)',
        highlights: [
          { match: '## 1. Hash de la SOURCE', color: '--cyan' },
          { match: '## 2. Hash de l\'IMAGE', color: '--gold' }
        ]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `On vient de comparer le hash ${alg.toUpperCase()} du <strong>support source</strong> (avant copie) avec celui de <strong>l'image acquise</strong> (après copie). <strong>L'acquisition est-elle intègre</strong> ?<br><span style="color:var(--dim);font-size:.85rem">Réponse : <code>oui</code> ou <code>non</code>.</span>`,
        inputLabel: 'Intègre :',
        placeholder: 'oui',
        expected,
        normalize: v => {
          const s = v.trim().toLowerCase().replace(/[éè]/g, 'e');
          if (['oui','yes','y','o','intact','integre','ok','vrai','true','identique','egal'].includes(s)) return 'oui';
          if (['non','no','n','altere','altered','corrompu','different','differ','faux','false','ko'].includes(s)) return 'non';
          return s;
        },
        hints: [
          `Pour valider l'intégrité d'une acquisition, on compare le hash <strong>avant</strong> (source physique) et <strong>après</strong> (image copiée). S'ils sont identiques, la copie est intègre — sinon, la preuve est potentiellement altérée et inutilisable au tribunal.`,
          `Compare les 2 hashs caractère par caractère, ou regarde la sortie de <code>diff</code>. ${intact ? 'Aucune différence affichée = identiques.' : 'Différences visibles = hashs différents.'}`,
          `${intact
            ? `Les 2 hashs sont <strong>identiques</strong>. L'acquisition est <strong>intègre</strong>. Réponse : <strong>oui</strong>.`
            : `Les 2 hashs <strong>diffèrent</strong>. L'acquisition est <strong>compromise</strong> — il faut recommencer ou documenter l'incident. Réponse : <strong>non</strong>.`}`
        ],
        explain: intact
          ? `Hashs identiques → acquisition <strong>intègre</strong>. La preuve peut être utilisée. Le hash est calculé sur l'image avant chaque utilisation pour prouver qu'elle n'a pas été modifiée depuis la saisie. C'est le fondement de la chaîne de possession.`
          : `Hashs <strong>différents</strong> → acquisition <strong>compromise</strong>. Causes possibles : secteurs défectueux sur le support source pendant la copie, absence de write-blocker, erreur matérielle. Action : documenter l'incident, ré-acquérir avec un nouveau matériel, ou marquer la preuve comme "altérée" dans le PV.`
      });
    }

    // ── Niveau C : chaîne de possession — trouver l'heure de la rupture ──
    {
      // Construire une chaîne avec un événement anormal
      const day = ['2025-09-12', '2025-10-04', '2026-01-22', '2026-03-08'][rand(0, 3)];

      // Heure de la saisie (matin)
      const seizeH = rand(8, 10);
      const seizeM = rand(0, 59);
      // Heure d'acquisition (1-3h après)
      const acqH = seizeH + 1 + rand(0, 2);
      const acqM = rand(0, 59);
      // Heure de transmission (laboratoire) — soit fin d'aprèm, soit lendemain
      const transH = (acqH + 2 + rand(0, 5)) % 24;
      const transM = rand(0, 59);
      // Heure de l'incident (la rupture)
      const breakH = transH + 1 + rand(0, 3);
      const breakM = rand(0, 59);
      // Heure de récupération
      const recoverH = (breakH + 2) % 24;
      const recoverM = rand(0, 59);

      const fmtHM = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      const tBreak = fmtHM(breakH, breakM);
      const tSeize = fmtHM(seizeH, seizeM);
      const tAcq = fmtHM(acqH, acqM);
      const tTrans = fmtHM(transH, transM);
      const tRecover = fmtHM(recoverH, recoverM);

      const officers = ['Inspecteur Dubois', 'Inspecteur Martin', 'Inspectrice Bernard', 'Sergente Müller', 'Lieutenant Favre'];
      const techs = ['Expert Schmid', 'Experte Roth', 'Technicien Costa', 'Technicienne Vogel'];
      const off1 = officers[rand(0, officers.length-1)];
      const off2 = officers[rand(0, officers.length-1)];
      const tech1 = techs[rand(0, techs.length-1)];
      const tech2 = techs[rand(0, techs.length-1)];

      const log = `# Procès-verbal — Chaîne de possession
# Pièce : Disque dur 500 GB (scellé 2025-${rand(1,9)}${rand(0,9)}-${rand(100,999)})

[${day} ${tSeize}] SAISIE
  → ${off1} saisit le disque sur la scène (perquisition).
  → Disque mis sous scellé n°SC-${rand(2000, 9999)}, photographié, signé.

[${day} ${tAcq}] ACQUISITION FORENSIQUE
  → ${tech1} ouvre le scellé en présence d'${off1}.
  → Acquisition avec write-blocker Tableau T356789iu, dcfldd, hash SHA-256.
  → Image stockée sur disque de preuve dédié.
  → Disque source remis sous nouveau scellé n°SC-${rand(2000, 9999)}.

[${day} ${tTrans}] TRANSMISSION AU LABORATOIRE
  → ${off2} transporte le disque scellé du commissariat au laboratoire central.
  → Signature de remise contre signature de réception (formulaire FR-082).

[${day} ${tBreak}] *** INCIDENT ***
  → Disque trouvé hors scellé sur un bureau du laboratoire.
  → Aucune signature de manipulation entre transmission et découverte.
  → Personne ne reconnaît avoir ouvert le scellé.

[${day} ${tRecover}] RÉCUPÉRATION
  → Disque re-scellé n°SC-${rand(2000, 9999)} par ${tech2}.
  → Incident documenté, valeur probante du disque remise en question.`;

      const artefactHTML = renderTextBlock(log, {
        title: 'PV — Chaîne de possession',
        highlights: [{ match: '*** INCIDENT ***', color: '--red' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Voici un PV documentant la chaîne de possession d'une pièce à conviction. <strong>À quelle heure</strong> la chaîne a-t-elle été <strong>rompue</strong> (= scellé trouvé ouvert sans signature) ?<br><span style="color:var(--dim);font-size:.85rem">Format attendu : <code>HH:MM</code> (24h).</span>`,
        inputLabel: 'Heure :',
        placeholder: '14:30',
        expected: tBreak,
        normalize: v => v.trim().replace(/[^0-9:]/g, ''),
        hints: [
          `La chaîne de possession est rompue quand un scellé est ouvert sans signature ou trace documentée. Cherche un événement explicitement marqué comme <code>INCIDENT</code> ou anomalie.`,
          `L'entrée notée <code>*** INCIDENT ***</code> indique l'instant où le scellé a été trouvé ouvert. Recopie l'heure entre crochets sur cette ligne.`,
          `La rupture s'est produite à <strong>${tBreak}</strong> — disque trouvé hors scellé sans signature de manipulation préalable.`
        ],
        explain: `Rupture à <strong>${tBreak}</strong>. Conséquence : la valeur probante du disque est compromise. Le tribunal pourra exclure cette pièce en tant qu'élément à charge, ou exiger une justification (vidéosurveillance du laboratoire, témoignages). Les bonnes pratiques exigent : scellé numéroté + signature à chaque manipulation + log nominatif + caméras au laboratoire.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 2 : LLM / IA GÉNÉRATIVE & DEEPFAKES
  // ════════════════════════════════════════════════════════════════

  const AI_TOOLS = [
    { software: 'Stable Diffusion XL 1.0',                 short: 'stable diffusion',     prompt: true },
    { software: 'Midjourney v6',                           short: 'midjourney',           prompt: true },
    { software: 'DALL-E 3',                                short: 'dall-e',               prompt: true },
    { software: 'Adobe Firefly 2',                         short: 'firefly',              prompt: false },
    { software: 'Flux.1 [dev]',                            short: 'flux',                 prompt: true },
    { software: 'Leonardo AI v2',                          short: 'leonardo',             prompt: true }
  ];

  function genLLMDeepfake() {
    const level = rand(0, 2);
    const opts = { prefix: 'llm', icon: '🤖', title: 'LLM/IA & Deepfakes' };

    // ── Niveau A : EXIF d'image IA → identifier le générateur ──
    if (level === 0) {
      const tool = AI_TOOLS[rand(0, AI_TOOLS.length - 1)];
      const promptText = tool.prompt ? [
        'A serene mountain landscape with a swiss chalet at sunset',
        'Cyberpunk hacker silhouette, neon lights, rain, 4k',
        'Photorealistic portrait of an elderly man, dramatic lighting',
        'Abstract digital art, fractal patterns, deep blue'
      ][rand(0, 3)] : null;
      const seed = rand(100000, 999999);
      const steps = [20, 25, 30, 50][rand(0, 3)];

      const output = `ExifTool Version Number         : 12.76
File Name                       : suspect_image_${rand(1000, 9999)}.png
File Size                       : ${(rand(1, 4)).toFixed(1)} MB
File Type                       : PNG
MIME Type                       : image/png
Image Width                     : 1024
Image Height                    : 1024
Bit Depth                       : 8
Color Type                      : RGB with Alpha
Software                        : ${tool.software}${promptText ? `
Parameters                      : ${promptText}
Negative prompt                 : ugly, blurry, low quality, watermark
Steps                           : ${steps}
Sampler                         : DPM++ 2M Karras
CFG Scale                       : 7
Seed                            : ${seed}
Size                            : 1024x1024
Model hash                      : ${_randomHex(10)}` : ''}
File Inode Change Date/Time     : 2026:03:14 16:42:08+01:00
File Modification Date/Time     : 2026:03:14 16:42:09+01:00`;

      const artefactHTML = renderTextBlock(output, {
        title: 'Output : exiftool image_suspect.png',
        highlights: [{ match: 'Software', color: '--cyan' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici la sortie de <code>exiftool</code> sur une image récupérée chez un suspect. <strong>Quel outil IA générative a créé cette image</strong> ? (Champ <code>Software</code>, donne juste le nom court — par exemple <code>midjourney</code> ou <code>stable diffusion</code>.)`,
        inputLabel: 'Outil :',
        placeholder: 'stable diffusion',
        expected: tool.short,
        normalize: v => v.trim().toLowerCase()
          .replace(/[éè]/g, 'e')
          .replace(/[\-_.]/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/\b(xl|v\d+|sdxl|sd|3|2|1\.0|\[dev\]|dev|ai)\b/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
        hints: [
          `Les images générées par IA exposent souvent leur outil dans le champ EXIF <code>Software</code>. Cherche cette ligne dans la sortie.`,
          `Ligne <code>Software : ${tool.software}</code>. Le nom court (sans version) est ce qui t'intéresse.`,
          `Outil = <strong>${tool.short}</strong>. ${tool.prompt ? `Présence du champ <code>Parameters</code> avec un prompt = signature très forte d'image IA.` : `Adobe Firefly inscrit son origine dans EXIF mais sans prompt visible.`}`
        ],
        explain: `Outil détecté : <strong>${tool.software}</strong>. ${tool.prompt ? `Les paramètres (prompt, seed, steps, CFG scale) sont écrits par défaut dans le PNG de Stable Diffusion / ComfyUI / WebUI A1111 — utiliser <code>exiftool -Parameters</code> pour les extraire systématiquement.` : `Adobe Firefly inscrit son origine dans le manifeste C2PA (voir niveau C).`} Combiné à une analyse de cohérence visuelle (mains à 6 doigts, anomalies de symétrie), c'est un signal fort d'image générée.`
      });
    }

    // ── Niveau B : caractères Unicode invisibles dans un texte → détection ──
    if (level === 1) {
      // Construire un texte avec ou sans watermark Unicode
      const phrases = [
        'Bonjour, suite à votre demande, je vous confirme notre rendez-vous demain à 14h.',
        'Le rapport d\'expertise est joint à ce message. N\'hésitez pas si questions.',
        'Cher Monsieur, je vous prie d\'agréer mes salutations distinguées.',
        'Merci de votre disponibilité. Je reste à votre écoute pour la suite.'
      ];
      const baseText = phrases[rand(0, phrases.length - 1)];

      // 60% des cas : avec watermark Unicode. 40% : sans (texte humain).
      const hasWatermark = Math.random() < 0.6;
      let displayText, hexLines, expected;
      if (hasWatermark) {
        // Insérer des zero-width spaces (\u200B), zero-width non-joiner (\u200C), zero-width joiner (\u200D)
        const wmChars = ['\u200B', '\u200C', '\u200D'];
        // Insérer 5 caractères invisibles à des positions aléatoires
        const chars = baseText.split('');
        for (let i = 0; i < 5; i++) {
          const pos = rand(10, chars.length - 1);
          chars.splice(pos, 0, wmChars[rand(0, 2)]);
        }
        displayText = chars.join('');
        expected = 'oui';
      } else {
        displayText = baseText;
        expected = 'non';
      }

      // Pour la visualisation pédagogique : afficher une vue "hex" qui montre les caractères invisibles
      // En tenant compte du fait qu'on ne peut pas vraiment les afficher → on les remplace dans la vue hex par leur code
      let visualHex = '';
      const codepoints = [];
      for (const c of displayText) {
        const cp = c.codePointAt(0);
        codepoints.push(cp);
      }
      // Compter les caractères "invisibles" Unicode courants (zero-width et BOM)
      const invisibleCount = codepoints.filter(cp =>
        cp === 0x200B || cp === 0x200C || cp === 0x200D || cp === 0xFEFF || cp === 0x2060
      ).length;

      const hexPreview = codepoints.slice(0, 60).map(cp => {
        const isInvisible = cp === 0x200B || cp === 0x200C || cp === 0x200D || cp === 0xFEFF || cp === 0x2060;
        if (isInvisible) return `<span style="background:rgba(255,64,96,.2);color:var(--red);padding:1px 3px;border-radius:3px;font-weight:700">U+${cp.toString(16).toUpperCase().padStart(4, '0')}</span>`;
        if (cp < 0x20 || cp > 0x7E) return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
        return String.fromCodePoint(cp);
      }).join('');

      const stats = `Longueur affichée :     ${displayText.length} caractères
Longueur ASCII pure :   ${displayText.replace(/[\u200B\u200C\u200D\uFEFF\u2060]/g, '').length} caractères
Caractères invisibles : ${invisibleCount} détecté(s)`;

      const artefactHTML = `
<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:.7rem">
  <div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">Texte tel qu'affiché (copier-coller depuis l'email suspect)</div>
  <div style="padding:.8rem 1rem;font-family:var(--mono);font-size:.85rem;line-height:1.6;color:var(--text);word-wrap:break-word">${escapeHTML(displayText)}</div>
</div>

<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch">
  <div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">Vue avancée : 60 premiers code points Unicode</div>
  <div style="padding:.8rem 1rem;font-family:var(--mono);font-size:.85rem;line-height:2;color:var(--text);word-break:break-all">${hexPreview}${codepoints.length > 60 ? '<span style="color:var(--dim)"> ...</span>' : ''}</div>
  <div style="padding:.5rem .8rem;font-family:var(--mono);font-size:.75rem;color:var(--dim);border-top:1px solid var(--border);white-space:pre">${stats}</div>
</div>`;

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Le texte ci-dessus a été récupéré d'un email suspect. La 1<sup>re</sup> vue est ce que voit le destinataire. La 2<sup>e</sup> vue affiche les code points Unicode (en rouge = caractères "invisibles" : U+200B, U+200C, U+200D, U+FEFF, U+2060). <strong>Ce texte contient-il un watermark/stéganographie via caractères invisibles</strong> ?<br><span style="color:var(--dim);font-size:.85rem">Réponse : <code>oui</code> ou <code>non</code>.</span>`,
        inputLabel: 'Watermark :',
        placeholder: 'oui',
        expected,
        normalize: v => {
          const s = v.trim().toLowerCase().replace(/[éè]/g, 'e');
          if (['oui','yes','y','o','present','watermarked','marque','marquage','marqué','vrai','true','suspect'].includes(s)) return 'oui';
          if (['non','no','n','aucun','propre','normal','humain','clean','faux','false'].includes(s)) return 'non';
          return s;
        },
        hints: [
          `Les watermarks LLM (OpenAI, Google) et les attaques stéganographiques utilisent des caractères Unicode <strong>invisibles à l'œil</strong> mais détectables par leurs code points : U+200B (zero-width space), U+200C (ZWNJ), U+200D (ZWJ), U+FEFF (BOM), U+2060 (word joiner).`,
          `Compare la <strong>longueur affichée</strong> avec la <strong>longueur ASCII pure</strong>. Si elles diffèrent, des caractères invisibles sont présents. La 2<sup>e</sup> vue les colore en rouge.`,
          hasWatermark
            ? `Ce texte contient <strong>${invisibleCount}</strong> caractères invisibles → <strong>watermark présent</strong>. Réponse : <strong>oui</strong>.`
            : `Aucun caractère invisible détecté (longueurs identiques, pas de rouge dans la vue hex) → texte propre. Réponse : <strong>non</strong>.`
        ],
        explain: hasWatermark
          ? `<strong>Watermark détecté</strong> (${invisibleCount} caractères Unicode invisibles). Outils de détection : <code>python -c "for c in text: print(hex(ord(c)))"</code> ou <a href="https://www.diffchecker.com/diff">DiffChecker</a> qui révèle ces caractères. Usages malveillants : exfiltration discrète, traçage de leaks internes, fingerprinting d'auteur.`
          : `Aucun watermark détecté — texte composé uniquement de caractères ASCII et Unicode visibles standards. C'est probablement un texte humain ou un LLM sans watermark (la plupart des modèles open-source n'en mettent pas par défaut).`
      });
    }

    // ── Niveau C : manifest C2PA → identifier le générateur d'image IA ──
    {
      const tools = [
        { name: 'Adobe Photoshop',     producer: 'Adobe Inc.',        sig: 'adobe.com', ai: false },
        { name: 'Adobe Firefly',       producer: 'Adobe Inc.',        sig: 'firefly.adobe.com', ai: true,  model: 'Adobe Firefly Image 3' },
        { name: 'Microsoft Designer',  producer: 'Microsoft Corp.',   sig: 'designer.microsoft.com', ai: true, model: 'DALL-E 3' },
        { name: 'OpenAI ChatGPT',      producer: 'OpenAI L.L.C.',     sig: 'openai.com', ai: true,  model: 'DALL-E 3 (gpt-4o)' },
        { name: 'BBC News',            producer: 'BBC',               sig: 'bbc.co.uk', ai: false },
        { name: 'Leica M11-P',         producer: 'Leica Camera AG',   sig: 'leica-camera.com', ai: false }
      ];
      const tool = tools[rand(0, tools.length - 1)];

      const manifest = `{
  "active_manifest": "${_randomHex(8)}",
  "manifests": {
    "${_randomHex(8)}": {
      "claim_generator": "${tool.name}/${tool.ai ? '2025.10' : '2024.7'}",
      "claim_generator_info": [
        {
          "name": "${tool.name}",
          "version": "${rand(2024, 2026)}.${rand(1, 12)}.${rand(1, 30)}",
          "producer": "${tool.producer}"
        }
      ],
      "assertions": [
        {
          "label": "c2pa.actions",
          "data": {
            "actions": [
              {
                "action": "${tool.ai ? 'c2pa.created' : 'c2pa.edited'}",
                "softwareAgent": "${tool.name}"${tool.ai ? `,
                "digitalSourceType": "trainedAlgorithmicMedia"` : ''}
              }
            ]
          }
        }${tool.ai ? `,
        {
          "label": "c2pa.ingredients",
          "data": {
            "title": "AI-generated content",
            "format": "image/png",
            "documentId": "${_randomHex(32)}",
            "metadata": {
              "model": "${tool.model}",
              "trainingMined": true
            }
          }
        }` : ''}
      ],
      "signature_info": {
        "issuer": "${tool.sig}",
        "time": "2026-03-14T16:42:08Z",
        "cert_chain": "${_randomHex(8)}..."
      }
    }
  }
}`;

      const artefactHTML = renderTextBlock(manifest, {
        title: 'Manifeste C2PA extrait avec : c2patool image.jpg --detailed',
        highlights: [
          { match: '"claim_generator"', color: '--cyan' },
          { match: 'digitalSourceType', color: '--purple' }
        ]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Le standard <strong>C2PA</strong> (Coalition for Content Provenance and Authenticity — Adobe, Microsoft, BBC, Sony, OpenAI...) inscrit dans les images un manifeste signé indiquant leur origine. Voici le manifeste extrait d'une image. <strong>Cette image a-t-elle été générée par IA ou produite par un humain/appareil</strong> ?<br><span style="color:var(--dim);font-size:.85rem">Réponse attendue : <code>ia</code>, <code>ai</code>, <code>humain</code> ou <code>camera</code>.</span>`,
        inputLabel: 'Origine :',
        placeholder: 'ia',
        expected: tool.ai ? 'ia' : 'humain',
        normalize: v => {
          const s = v.trim().toLowerCase().replace(/[éè]/g, 'e');
          if (['ia','ai','generee','generated','generative','llm','synthetic','synthetique','machine'].includes(s)) return 'ia';
          if (['humain','human','camera','appareil','photo','natif','original','manual'].includes(s)) return 'humain';
          return s;
        },
        hints: [
          `Le champ-clé est <code>digitalSourceType</code> dans la section <code>assertions</code>. Selon le standard C2PA, <code>"trainedAlgorithmicMedia"</code> = contenu IA, <code>"digitalCapture"</code> = appareil photo, absence = édition humaine classique.`,
          `Inspecte aussi <code>claim_generator</code> et l'<code>action</code>. <code>c2pa.created</code> + <code>trainedAlgorithmicMedia</code> = création IA. <code>c2pa.edited</code> = retouche humaine d'une image existante.`,
          tool.ai
            ? `<code>digitalSourceType: "trainedAlgorithmicMedia"</code> + <code>action: "c2pa.created"</code> + <code>claim_generator: "${tool.name}"</code> = <strong>image générée par IA</strong> (${tool.model || 'modèle d\'IA générative'}).`
            : `Pas de <code>digitalSourceType: "trainedAlgorithmicMedia"</code>. <code>claim_generator: "${tool.name}"</code> = ${tool.name === 'Leica M11-P' ? 'image capturée par un appareil photo (Leica intègre le C2PA nativement depuis 2023)' : tool.name.includes('Photoshop') ? 'image éditée par un humain dans Photoshop' : 'contenu produit par un humain'}.`
        ],
        explain: tool.ai
          ? `<strong>Image IA</strong> générée par <code>${tool.name}</code> (${tool.model}). Le standard C2PA, supporté par Adobe, Microsoft, OpenAI, Google et BBC, signe cryptographiquement l'origine du contenu — falsifier le manifeste invalide la signature. Outil : <code>c2patool</code> (open-source).`
          : `<strong>Image humaine</strong>. Origine : ${tool.name}. Le manifeste C2PA prouve la provenance avec une signature liée à un certificat racine de confiance. Pour les investigations, c'est devenu un standard de vérification d'authenticité (déployé chez BBC, Reuters, AFP depuis 2024).`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 3 : GOOGLE DORKS
  // ════════════════════════════════════════════════════════════════

  function genDorks() {
    const level = rand(0, 2);
    const opts = { prefix: 'dorks', icon: '🔎', title: 'Google Dorks — OSINT' };

    // ── Niveau A : dork donnée → identifier l'opérateur clé ──
    if (level === 0) {
      const dorks = [
        { dork: 'site:bcv.ch filetype:pdf', target: 'site',     desc: 'limite la recherche au domaine bcv.ch (et sous-domaines)' },
        { dork: 'intitle:"index of" backup', target: 'intitle', desc: 'cherche le motif dans le titre de la page' },
        { dork: 'inurl:admin login.php',     target: 'inurl',   desc: 'cherche le motif dans l\'URL de la page' },
        { dork: 'filetype:xlsx confidential', target: 'filetype', desc: 'limite aux fichiers du type donné (Excel ici)' },
        { dork: 'cache:example.com',         target: 'cache',   desc: 'affiche la version en cache de Google (peut révéler du contenu supprimé)' },
        { dork: 'ext:log password',          target: 'ext',     desc: 'limite aux fichiers avec l\'extension donnée (variante de filetype)' },
        { dork: 'related:example.com',       target: 'related', desc: 'trouve des sites similaires (peut révéler des structures partenaires)' },
        { dork: 'intext:"password" filetype:txt', target: 'intext', desc: 'cherche le motif dans le corps de la page' }
      ];
      const d = dorks[rand(0, dorks.length - 1)];

      const artefactHTML = renderTextBlock(
`# Dork Google récupérée dans un guide OSINT :

  ${d.dork}

# Cette dork combine au moins un opérateur Google avancé.
# Question : identifie l'opérateur principal utilisé.`,
        {
          title: 'Dork Google',
          highlights: [{ match: d.dork, color: '--cyan' }]
        }
      );

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici une dork Google trouvée dans un guide OSINT. <strong>Quel est l'opérateur Google avancé principal utilisé</strong> ? (Donne juste le nom de l'opérateur, sans les <code>:</code>.)`,
        inputLabel: 'Opérateur :',
        placeholder: 'site',
        expected: d.target,
        normalize: v => v.trim().toLowerCase().replace(/[:.]/g, '').replace(/\s/g, ''),
        hints: [
          `Les opérateurs Google avancés ont la forme <code>operateur:argument</code>. Les plus courants : <code>site:</code>, <code>filetype:</code>, <code>ext:</code>, <code>intitle:</code>, <code>inurl:</code>, <code>intext:</code>, <code>cache:</code>, <code>related:</code>.`,
          `Dans <code>${d.dork}</code>, le mot juste avant le <code>:</code> est l'opérateur. Si plusieurs opérateurs, regarde le premier ou le plus restrictif.`,
          `Opérateur principal = <strong>${d.target}</strong>. ${d.desc}.`
        ],
        explain: `<code>${d.target}:</code> → ${d.desc}. ${d.target === 'site' ? 'Très utilisé pour cartographier l\'attaque surface d\'une organisation.' : d.target === 'filetype' || d.target === 'ext' ? 'Crucial pour trouver des documents sensibles oubliés en ligne (PDF, XLSX, BAK, LOG, SQL).' : d.target === 'intitle' || d.target === 'inurl' ? 'Utile pour trouver des interfaces d\'admin ou des listing de répertoires exposés.' : d.target === 'cache' ? 'Permet de voir des contenus que l\'admin a tenté de supprimer.' : d.target === 'related' ? 'Pivote sur une organisation à partir d\'un site connu.' : 'Cible des chaînes spécifiques dans le contenu visible.'}`
      });
    }

    // ── Niveau B : construire une dork à partir d'un objectif ──
    if (level === 1) {
      const scenarios = [
        {
          objective: 'Trouver tous les fichiers PDF du domaine <code>bcv.ch</code>',
          expected: 'site:bcv.ch filetype:pdf',
          aliases: ['site:bcv.ch filetype:pdf', 'filetype:pdf site:bcv.ch', 'site:bcv.ch ext:pdf', 'ext:pdf site:bcv.ch']
        },
        {
          objective: 'Trouver des pages avec "confidentiel" dans le titre, sur tout site .ch',
          expected: 'intitle:"confidentiel" site:.ch',
          aliases: ['intitle:"confidentiel" site:.ch', 'site:.ch intitle:"confidentiel"', 'intitle:confidentiel site:.ch', 'site:.ch intitle:confidentiel']
        },
        {
          objective: 'Trouver des fichiers de configuration .conf contenant le mot "password"',
          expected: 'filetype:conf intext:password',
          aliases: ['filetype:conf intext:password', 'intext:password filetype:conf', 'ext:conf intext:password', 'intext:password ext:conf']
        },
        {
          objective: 'Trouver des interfaces d\'administration avec "admin" dans l\'URL et "login" sur la page, sur le site unil.ch',
          expected: 'site:unil.ch inurl:admin intext:login',
          aliases: ['site:unil.ch inurl:admin intext:login', 'inurl:admin intext:login site:unil.ch', 'site:unil.ch intext:login inurl:admin']
        },
        {
          objective: 'Trouver des listings de répertoires Apache (la page commence par "Index of /")',
          expected: 'intitle:"index of"',
          aliases: ['intitle:"index of"', 'intitle:"index of /"', 'intitle:index of']
        },
        {
          objective: 'Trouver des fichiers Excel .xlsx mentionnant "salaire" sur tout site .admin.ch',
          expected: 'site:admin.ch filetype:xlsx intext:salaire',
          aliases: ['site:admin.ch filetype:xlsx intext:salaire', 'site:.admin.ch filetype:xlsx intext:salaire', 'filetype:xlsx site:admin.ch intext:salaire']
        }
      ];
      const s = scenarios[rand(0, scenarios.length - 1)];

      const artefactHTML = renderTextBlock(
`# Objectif OSINT :
${s.objective}

# Construis la dork Google qui permet de réaliser cet objectif.
# Utilise les opérateurs avancés au besoin : site:, filetype:, intitle:,
# intext:, inurl:, ext:, cache:, etc.

# Exemple d'usage d'une dork : tu la copie-colle directement
# dans la barre de recherche Google ou DuckDuckGo.`,
        {
          title: 'Objectif OSINT',
          highlights: [{ match: '# Objectif OSINT', color: '--gold' }]
        }
      );

      return buildPracticeCard({
        ...opts,
        badge: 'construction',
        artefactHTML,
        question: s.objective.replace(/<\/?code>/g, '') + ' — <strong>Construis la dork Google appropriée</strong>.<br><span style="color:var(--dim);font-size:.85rem">Plusieurs ordres d\'opérateurs sont acceptés. Format : <code>operateur:valeur autre_operateur:valeur</code>.</span>',
        inputLabel: 'Dork :',
        placeholder: 'site:example.com filetype:pdf',
        expected: s.expected,
        normalize: v => {
          // Normaliser : minuscules, espaces simplifiés, tri des termes alphabétiquement (ordre des opérateurs flexible)
          const norm = v.trim().toLowerCase().replace(/\s+/g, ' ').replace(/['"]/g, '"');
          // Vérifier contre tous les alias
          for (const a of s.aliases) {
            const aNorm = a.trim().toLowerCase().replace(/\s+/g, ' ').replace(/['"]/g, '"');
            // Comparaison directe
            if (norm === aNorm) return s.expected.toLowerCase().replace(/\s+/g, ' ');
            // Comparaison après tri alphabétique des tokens (ordre flexible)
            const sortedNorm = norm.split(' ').sort().join(' ');
            const sortedA = aNorm.split(' ').sort().join(' ');
            if (sortedNorm === sortedA) return s.expected.toLowerCase().replace(/\s+/g, ' ');
          }
          return norm;
        },
        hints: [
          `Identifie les <strong>3 contraintes</strong> de l'objectif : (1) sur quel domaine ? → <code>site:</code> ; (2) quel type de fichier ? → <code>filetype:</code> ; (3) quel mot-clé ? → <code>intext:</code> ou texte libre.`,
          `Combine les opérateurs séparés par des espaces. L'ordre des opérateurs n'a pas d'importance pour Google. Exemple : <code>site:X filetype:Y motcle</code>.`,
          `Dork attendue : <code>${s.expected}</code>`
        ],
        explain: `Dork : <code>${s.expected}</code>. Les Google Dorks sont l'OSINT le plus accessible — aucun outil spécialisé, juste la connaissance des opérateurs avancés. Référence : <a href="https://www.exploit-db.com/google-hacking-database">Google Hacking Database (GHDB)</a> maintenue par OffSec.`
      });
    }

    // ── Niveau C : dork complexe multi-opérateurs → identifier l'intention ──
    {
      const dorks = [
        {
          dork: 'site:gov.ch filetype:xlsx intext:"numero AVS" -site:public.gov.ch',
          intent: 'fuite_donnees',
          aliases: ['fuite donnees', 'fuite de donnees', 'fuite donnée', 'fuite données', 'data leak', 'data breach', 'leak', 'fuite', 'fuite de donnees personnelles', 'donnees personnelles', 'données personnelles', 'rgpd']
        },
        {
          dork: 'inurl:wp-admin filetype:php -inurl:wp-content',
          intent: 'recherche_admin',
          aliases: ['recherche admin', 'admin panel', 'panel admin', 'interface admin', 'admin', 'login admin', 'recherche d\'admin', 'recherche d admin', 'admin wp', 'wordpress admin', 'panneau admin']
        },
        {
          dork: 'intitle:"index of" "backup.sql" -site:github.com',
          intent: 'backup_expose',
          aliases: ['backup expose', 'backup exposé', 'backup exposes', 'sauvegarde expose', 'sauvegarde exposée', 'backup sql', 'sql leak', 'dump sql', 'dump base de donnees', 'fichier sauvegarde', 'fichier de sauvegarde']
        },
        {
          dork: 'site:linkedin.com/in "Directeur" "Banque" "Geneve"',
          intent: 'reconnaissance_cible',
          aliases: ['reconnaissance cible', 'reconnaissance', 'recon', 'profilage', 'profilage cible', 'cible personne', 'identifier cible', 'identification cible', 'linkedin recon', 'profilage osint', 'identification personne', 'recon personne']
        },
        {
          dork: 'filetype:log inurl:"error_log" intext:"mysql_connect"',
          intent: 'fuite_credentials',
          aliases: ['fuite credentials', 'fuite identifiants', 'credentials leak', 'credentials exposés', 'mots de passe', 'identifiants', 'creds', 'fuite mots de passe', 'fuite mdp', 'mysql creds', 'credentials db']
        },
        {
          dork: 'intext:"-----BEGIN RSA PRIVATE KEY-----" filetype:txt -site:rfc-editor.org',
          intent: 'fuite_cles',
          aliases: ['fuite cles', 'fuite clés', 'fuite cles privees', 'fuite clés privées', 'cles privees exposees', 'clés privées exposées', 'private keys', 'leak keys', 'rsa keys', 'cles ssh', 'clés ssh']
        }
      ];
      const d = dorks[rand(0, dorks.length - 1)];

      const artefactHTML = renderTextBlock(
`# Dork avancée à analyser :

  ${d.dork}

# Cette dork combine plusieurs opérateurs :
#   - inclusion (operateur:valeur)
#   - exclusion (-operateur:valeur ou -mot)
#   - termes en guillemets (chaîne exacte)
#
# Question : que cherche concrètement l'utilisateur de cette dork ?`,
        {
          title: 'Dork Google avancée — analyse d\'intention',
          highlights: [{ match: d.dork, color: '--purple' }]
        }
      );

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Cette dork combine plusieurs opérateurs avancés. <strong>Quelle est l'intention principale</strong> de celui qui la lance ?<br><span style="color:var(--dim);font-size:.85rem">Réponse en 2-3 mots. Exemples : <code>fuite données</code>, <code>recherche admin</code>, <code>backup exposé</code>, <code>reconnaissance cible</code>, <code>fuite credentials</code>, <code>fuite clés</code>.</span>`,
        inputLabel: 'Intention :',
        placeholder: 'fuite données',
        expected: d.intent.replace(/_/g, ' '),
        normalize: v => {
          const norm = v.trim().toLowerCase()
            .replace(/[éè]/g, 'e')
            .replace(/[\-_]/g, ' ')
            .replace(/\s+/g, ' ');
          // Vérifier contre les alias
          for (const a of d.aliases) {
            const aNorm = a.toLowerCase().replace(/[éè]/g, 'e').replace(/[\-_]/g, ' ').replace(/\s+/g, ' ');
            if (norm === aNorm) return d.intent.replace(/_/g, ' ');
          }
          return norm;
        },
        hints: [
          `Décompose la dork en 3 parties : (1) sur quel <strong>périmètre</strong> on cherche (<code>site:</code>, <code>inurl:</code>) ; (2) quel <strong>type de fichier ou page</strong> (<code>filetype:</code>, <code>intitle:</code>) ; (3) quel <strong>contenu sensible</strong> est ciblé (<code>intext:</code> avec un mot-clé révélateur).`,
          `${d.intent === 'fuite_donnees' ? 'Une dork cherchant des fichiers Excel sur des sites gouvernementaux avec des numéros AVS = cherche une fuite de données personnelles.' :
            d.intent === 'recherche_admin' ? 'Une dork cherchant des fichiers PHP dans /wp-admin = cherche des panneaux d\'admin WordPress mal protégés.' :
            d.intent === 'backup_expose' ? 'Une dork cherchant "backup.sql" dans un listing de répertoire = cherche des sauvegardes de base de données accidentellement exposées.' :
            d.intent === 'reconnaissance_cible' ? 'Une dork LinkedIn ciblant un poste précis + une localisation = cherche à identifier des personnes spécifiques (recon avant phishing ciblé).' :
            d.intent === 'fuite_credentials' ? 'Une dork cherchant des logs d\'erreurs MySQL = cherche des credentials de base de données accidentellement loggués.' :
            'Une dork cherchant le motif "-----BEGIN RSA PRIVATE KEY-----" = cherche des clés privées RSA accidentellement publiées en ligne.'}`,
          `Intention : <strong>${d.intent.replace(/_/g, ' ')}</strong>. ${d.intent === 'fuite_donnees' ? 'Méthodologie OSINT classique pour identifier des fuites RGPD.' : d.intent === 'recherche_admin' ? 'Premier pas pour attaquer un site WordPress.' : d.intent === 'backup_expose' ? 'Très courant en bug bounty.' : d.intent === 'reconnaissance_cible' ? 'Recon avant social engineering ciblé.' : d.intent === 'fuite_credentials' ? 'Fuite involontaire — souvent dans des forums de support.' : 'Fuite catastrophique — souvent commit accidentel.'}`
        ],
        explain: `Intention : <strong>${d.intent.replace(/_/g, ' ')}</strong>. ${d.intent === 'fuite_donnees' ? 'Les dorks ciblant des données personnelles sensibles (AVS, NIP, IBAN, dossiers médicaux) sont utilisées tant par les attaquants (revente sur le darkweb) que par les défenseurs (audit RGPD interne).' : d.intent === 'recherche_admin' ? 'Phase de reconnaissance pour ciblage WordPress. À combiner avec WPScan ensuite.' : d.intent === 'backup_expose' ? 'Cause #1 de fuites massives : un dump SQL "backup.sql" dans une URL accessible = toute la base exposée. Toujours vérifier avec <code>wget</code> avant de remonter au client.' : d.intent === 'reconnaissance_cible' ? 'Phase amont d\'une attaque par spear-phishing ou pretexting. Mitigation : éviter les profils LinkedIn ultra-détaillés pour les cibles à haute valeur (CFO, RSSI...).' : d.intent === 'fuite_credentials' ? 'Erreurs PHP exposées sur le web avec mysql_connect en clair = credentials base + IP exposés. Toujours désactiver <code>display_errors</code> en production.' : 'Fuite catastrophique de clé privée RSA — généralement un fichier <code>.bak</code> ou <code>config.txt</code> oublié. À éviter : commit accidentel sur GitHub (utiliser <code>git-secrets</code> + scan régulier).'}`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Enregistrement dans GENERATORS
  // ════════════════════════════════════════════════════════════════
  if (typeof window !== 'undefined' && window.GENERATORS) {
    window.GENERATORS.acquisition = genAcquisition;
    window.GENERATORS.llm         = genLLMDeepfake;
    window.GENERATORS.dorks       = genDorks;
  } else if (typeof GENERATORS !== 'undefined') {
    GENERATORS.acquisition = genAcquisition;
    GENERATORS.llm         = genLLMDeepfake;
    GENERATORS.dorks       = genDorks;
  }
  if (typeof window !== 'undefined') {
    window.genAcquisition = genAcquisition;
    window.genLLMDeepfake = genLLMDeepfake;
    window.genDorks       = genDorks;
  }
})();
