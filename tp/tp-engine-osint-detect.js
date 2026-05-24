// ═══════════════════════════════════════════════════════════════════
// tp-engine-osint-detect.js — CAS-IN TP delta v103 (REFONTE PRATIQUE)
// 4 TP "OSINT & Détection" : EXIF, DNS, Sigma, C2
// Chaque TP a 3 niveaux progressifs A → B → C
// Artefact concret (output exiftool/dig/YAML/timeline) + input + 3 indices
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
        <div class="ex-num" id="ex-num-${id}">${opts.icon || '🔍'}</div>
        <div class="ex-title">${opts.title}</div>
        <span class="ex-badge easy">${opts.badge || 'pratique'}</span>
      </div>
      <div class="ex-scenario">${opts.question}</div>
      <div style="margin:.7rem 0">${opts.artefactHTML}</div>
      <div class="ex-input-row" style="flex-wrap:wrap;gap:8px">
        ${opts.inputLabel ? `<span class="ex-input-label">${opts.inputLabel}</span>` : ''}
        <input class="ex-input" id="inp-${id}" placeholder="${opts.placeholder || ''}" autocomplete="off" spellcheck="false" style="width:100%;max-width:340px;font-family:var(--mono);min-height:40px;box-sizing:border-box">
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
      <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg)">
        ${title ? `<div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">${title}</div>` : ''}
        <pre style="margin:0;padding:.7rem .8rem;font-family:var(--mono);font-size:.78rem;line-height:1.5;color:var(--text);overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:pre">${lines.join('')}</pre>
      </div>
    `;
  }

  // ════════════════════════════════════════════════════════════════
  // TP 1 : EXIF — Output exiftool
  // ════════════════════════════════════════════════════════════════

  const CAMERAS = [
    { make: 'Canon',    model: 'EOS 5D Mark IV',     soft: 'Adobe Camera Raw 13.4' },
    { make: 'Nikon',    model: 'D850',                soft: 'Adobe Photoshop CC 2024' },
    { make: 'Sony',     model: 'ILCE-7M3',            soft: 'Lightroom Classic 12.5' },
    { make: 'Apple',    model: 'iPhone 14 Pro',       soft: 'iOS 17.4.1' },
    { make: 'Google',   model: 'Pixel 8',             soft: 'Android 14' },
    { make: 'Samsung',  model: 'SM-S908B',            soft: 'Samsung Camera 1.0' },
    { make: 'Fujifilm', model: 'X-T5',                soft: 'Capture One 23' },
    { make: 'OnePlus',  model: '11',                  soft: 'OxygenOS 14' }
  ];

  function _genExifOutput(opts) {
    opts = opts || {};
    const cam = opts.camera || CAMERAS[0];
    const lines = [
      'ExifTool Version Number         : 12.76',
      `File Name                       : ${opts.fileName || 'IMG_4821.jpg'}`,
      `File Size                       : ${(rand(2, 8)).toFixed(1)} MB`,
      `File Modification Date/Time     : ${opts.modifyDate || '2025:09:12 14:23:47+02:00'}`,
      'File Type                       : JPEG',
      'MIME Type                       : image/jpeg',
      `Make                            : ${cam.make}`,
      `Camera Model Name               : ${cam.model}`,
      `Software                        : ${opts.software || cam.soft}`,
      `Date/Time Original              : ${opts.dateOriginal || '2025:09:12 14:23:47'}`,
      `Modify Date                     : ${opts.modifyDateMeta || opts.dateOriginal || '2025:09:12 14:23:47'}`,
      `Exposure Time                   : 1/${[125, 250, 500, 1000][rand(0,3)]}`,
      `F Number                        : ${[1.8, 2.8, 4.0, 5.6][rand(0,3)]}`,
      `ISO                             : ${[100, 200, 400, 800][rand(0,3)]}`,
    ];
    if (opts.gps) {
      lines.push(`GPS Latitude                    : ${opts.gps.latStr}`);
      lines.push(`GPS Latitude Ref                : ${opts.gps.latRef}`);
      lines.push(`GPS Longitude                   : ${opts.gps.lonStr}`);
      lines.push(`GPS Longitude Ref               : ${opts.gps.lonRef}`);
      lines.push(`GPS Position                    : ${opts.gps.latStr} ${opts.gps.latRef}, ${opts.gps.lonStr} ${opts.gps.lonRef}`);
    }
    if (opts.extraLines) lines.push(...opts.extraLines);
    return lines.join('\n');
  }

  // Décimal → DMS string "46 deg 31' 04.32\""
  function _decimalToDMS(dec) {
    const abs = Math.abs(dec);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = ((minFloat - min) * 60).toFixed(2);
    return `${deg} deg ${String(min).padStart(2,'0')}' ${sec}"`;
  }

  function genEXIF() {
    const level = rand(0, 2);
    const opts = { prefix: 'exif', icon: '🖼️', title: 'EXIF — Lecture exiftool' };

    // ── Niveau A : extraire le Make (fabricant) ──
    if (level === 0) {
      const cam = CAMERAS[rand(0, CAMERAS.length - 1)];
      const exifOutput = _genExifOutput({ camera: cam });

      const artefactHTML = renderTextBlock(exifOutput, {
        title: 'Output : exiftool IMG_4821.jpg',
        highlights: [{ match: 'Make ', color: '--cyan' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici la sortie de <code>exiftool</code> sur une photo trouvée sur un poste. <strong>Quel est le fabricant de l'appareil</strong> qui a pris la photo (champ <code>Make</code>) ?`,
        inputLabel: 'Make :',
        placeholder: 'Canon',
        expected: cam.make,
        normalize: v => v.trim().toLowerCase(),
        hints: [
          `Le fabricant est dans le champ <code>Make</code> du tag EXIF. Cherche cette ligne dans la sortie.`,
          `Repère la ligne commençant par <code>Make</code> suivie de <code>:</code>. La valeur est ce qui suit.`,
          `Champ <code>Make = ${cam.make}</code>. Modèle complet : <code>${cam.model}</code>.`
        ],
        explain: `Fabricant <strong>${cam.make}</strong>, modèle <code>${cam.model}</code>. Combiné au numéro de série (si présent : <code>SerialNumber</code>), c'est un pivot OSINT puissant — l'identifiant unique du boîtier.`
      });
    }

    // ── Niveau B : extraire la latitude en décimal depuis le GPS DMS ──
    if (level === 1) {
      const cam = CAMERAS[rand(0, CAMERAS.length - 1)];
      // Coordonnées GPS plausibles (Suisse ou Europe)
      const latDeg = rand(45, 48);
      const latMin = rand(10, 55);
      const latSec = rand(0, 59) + Math.random();
      const latDec = latDeg + latMin / 60 + latSec / 3600;
      const latStr = `${latDeg} deg ${String(latMin).padStart(2,'0')}' ${latSec.toFixed(2)}"`;
      const lonDeg = rand(5, 10);
      const lonMin = rand(10, 55);
      const lonSec = (rand(0, 5990) / 100);
      const lonStr = `${lonDeg} deg ${String(lonMin).padStart(2,'0')}' ${lonSec.toFixed(2)}"`;

      const exifOutput = _genExifOutput({
        camera: cam,
        gps: { latStr, latRef: 'N', lonStr, lonRef: 'E' }
      });

      const artefactHTML = renderTextBlock(exifOutput, {
        title: 'Output : exiftool photo.jpg',
        highlights: [
          { match: 'GPS Latitude  ', color: '--gold' },
          { match: 'GPS Latitude Ref', color: '--gold' }
        ]
      });

      // Réponse attendue : latitude en décimal arrondie à 4 chiffres
      const latDecRounded = latDec.toFixed(4);

      return buildPracticeCard({
        ...opts,
        badge: 'calcul',
        artefactHTML,
        question: `La photo a des coordonnées GPS. <strong>Convertis la latitude DMS en décimal</strong> (4 chiffres après la virgule). Formule : <code>deg + min/60 + sec/3600</code>.`,
        inputLabel: 'Latitude :',
        placeholder: '46.5179',
        expected: latDecRounded,
        normalize: v => {
          const n = parseFloat(v.trim().replace(',', '.'));
          return isNaN(n) ? v.trim() : n.toFixed(4);
        },
        hints: [
          `Pour convertir DMS → décimal : <code>degrés + minutes/60 + secondes/3600</code>. L'hémisphère N/S/E/W détermine le signe (N et E = positif).`,
          `Lis : <code>${latDeg} deg ${latMin}' ${latSec.toFixed(2)}"</code>. Calcule <code>${latDeg} + ${latMin}/60 + ${latSec.toFixed(2)}/3600</code>.`,
          `${latDeg} + ${(latMin/60).toFixed(6)} + ${(latSec/3600).toFixed(6)} ≈ <strong>${latDecRounded}</strong> (Latitude Ref = N donc positif).`
        ],
        explain: `Latitude = <strong>${latDecRounded}°</strong> N. Coordonnées GPS dans les EXIF = jackpot OSINT (géolocalisation au mètre). À croiser avec Google Maps / OpenStreetMap pour confirmer le lieu.`
      });
    }

    // ── Niveau C : détecter une édition par incohérence timestamps + Software ──
    {
      const cam = CAMERAS[rand(0, CAMERAS.length - 1)];
      // Date originale + date de modif postérieure + software d'édition
      const editingSoftware = ['Adobe Photoshop 24.7', 'GIMP 2.10', 'Lightroom Classic 13.0', 'Affinity Photo 2'][rand(0,3)];
      const dateOrig = '2024:11:15 09:32:14';
      const dateModifMeta = '2025:03:22 18:47:09';

      const exifOutput = _genExifOutput({
        camera: cam,
        dateOriginal: dateOrig,
        modifyDateMeta: dateModifMeta,
        software: editingSoftware
      });

      const artefactHTML = renderTextBlock(exifOutput, {
        title: 'Output : exiftool suspect.jpg',
        highlights: [
          { match: 'Software', color: '--purple' },
          { match: 'Date/Time Original', color: '--purple' },
          { match: 'Modify Date', color: '--purple' }
        ]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Examine attentivement les champs <code>Software</code>, <code>Date/Time Original</code> et <code>Modify Date</code>. <strong>Cette photo a-t-elle été éditée après la prise de vue</strong> ?<br><span style="color:var(--dim);font-size:.85rem">Réponse attendue : <code>oui</code> ou <code>non</code>.</span>`,
        inputLabel: 'Édité :',
        placeholder: 'oui',
        expected: 'oui',
        normalize: v => {
          const s = v.trim().toLowerCase().replace(/[éè]/g, 'e');
          if (['oui','yes','y','o','edited','edite','modifié','modifie','vrai','true'].includes(s)) return 'oui';
          if (['non','no','n','original','intact','pas','false','faux'].includes(s)) return 'non';
          return s;
        },
        hints: [
          `Deux indices d'édition : (1) <code>Modify Date</code> &gt; <code>Date/Time Original</code> (écart de plusieurs mois/jours), (2) <code>Software</code> mentionne un éditeur (Photoshop, GIMP, Lightroom…) plutôt qu'un firmware d'appareil.`,
          `Compare : <code>Date/Time Original = ${dateOrig}</code> vs <code>Modify Date = ${dateModifMeta}</code>. Et <code>Software = ${editingSoftware}</code>.`,
          `<code>Modify Date</code> est postérieure de plusieurs mois à <code>Date/Time Original</code>, ET le <code>Software</code> est <strong>${editingSoftware}</strong> (éditeur d'image). Réponse : <strong>oui</strong>, la photo a été éditée.`
        ],
        explain: `Photo éditée. Triade d'indices : (1) Modify Date &gt; Date/Time Original (${dateModifMeta} vs ${dateOrig}), (2) Software = <code>${editingSoftware}</code> (éditeur, pas firmware). Si le tag <code>Software</code> avait été <code>${cam.soft}</code> seulement, c'aurait été un export d'appareil natif.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 2 : DNS — Output dig
  // ════════════════════════════════════════════════════════════════

  const DNS_DOMAINS = [
    { name: 'example.com',  ips: ['93.184.216.34'],   mx: ['mail.example.com'] },
    { name: 'unil.ch',      ips: ['130.223.225.18'],  mx: ['smtp1.unil.ch', 'smtp2.unil.ch'] },
    { name: 'bcv.ch',       ips: ['194.6.131.10'],    mx: ['mx.bcv.ch'] },
    { name: 'swisscom.ch',  ips: ['195.186.245.16'],  mx: ['mx-mta1.bluewin.ch'] },
    { name: 'admin.ch',     ips: ['162.23.130.122'],  mx: ['relay.admin.ch'] },
    { name: 'epfl.ch',      ips: ['128.178.222.108'], mx: ['mail-relay.epfl.ch'] }
  ];

  function _genDigOutput(opts) {
    opts = opts || {};
    const domain = opts.domain;
    const type = opts.type || 'A';
    const records = opts.records || [];
    const lines = [
      `; <<>> DiG 9.18.12-1+ubuntu0.22.04.4-Ubuntu <<>> ${domain.name} ${type}`,
      ';; global options: +cmd',
      ';; Got answer:',
      `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ${rand(10000, 65000)}`,
      ';; flags: qr rd ra; QUERY: 1, ANSWER: ' + records.length + ', AUTHORITY: 0, ADDITIONAL: 1',
      '',
      ';; QUESTION SECTION:',
      `;${domain.name}.${' '.repeat(Math.max(1, 30 - domain.name.length))}IN${' '.repeat(6)}${type}`,
      '',
      ';; ANSWER SECTION:',
      ...records.map(r => `${domain.name}.${' '.repeat(Math.max(1, 30 - domain.name.length))}3600${' '.repeat(2)}IN${' '.repeat(6)}${type}${' '.repeat(6)}${r}`),
      '',
      `;; Query time: ${rand(2, 80)} msec`,
      ';; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)',
      `;; WHEN: ${new Date().toUTCString()}`,
      ';; MSG SIZE  rcvd: ' + (60 + records.length * 30)
    ];
    return lines.join('\n');
  }

  function genOSINTDNS() {
    const level = rand(0, 2);
    const opts = { prefix: 'osintdns', icon: '🌐', title: 'DNS — Lecture dig' };

    // ── Niveau A : extraire l'IP d'un A record ──
    if (level === 0) {
      const dom = DNS_DOMAINS[rand(0, DNS_DOMAINS.length - 1)];
      const ip = dom.ips[0];
      const digOutput = `$ dig +short ${dom.name} A\n${ip}`;

      const artefactHTML = renderTextBlock(digOutput, {
        title: `Commande : dig +short ${dom.name} A`,
        highlights: [{ match: ip, color: '--cyan' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `On a interrogé le DNS pour <code>${dom.name}</code> avec <code>dig +short</code>. <strong>Quelle est l'adresse IPv4 qui héberge ce domaine</strong> ?`,
        inputLabel: 'IP :',
        placeholder: '93.184.216.34',
        expected: ip,
        normalize: v => v.trim().replace(/\s/g, ''),
        hints: [
          `<code>dig +short</code> renvoie uniquement les valeurs des records, sans l'en-tête verbeuse. Pour un A record (IPv4), c'est l'adresse IP.`,
          `La sortie ne contient qu'une seule ligne avec l'IP demandée.`,
          `IP = <strong>${ip}</strong>. C'est ce que ton navigateur résout quand tu tapes <code>${dom.name}</code>.`
        ],
        explain: `<code>${dom.name}</code> → <strong>${ip}</strong>. Pour le reverse : <code>dig -x ${ip}</code> (donne le PTR). Pour creuser : <code>dig +trace ${dom.name}</code> remonte la chaîne depuis les racines.`
      });
    }

    // ── Niveau B : extraire le nom du MX record ──
    if (level === 1) {
      const dom = DNS_DOMAINS[rand(0, DNS_DOMAINS.length - 1)];
      const mxRecords = dom.mx.map((mx, i) => `${10 * (i+1)} ${mx}.`);
      const digOutput = _genDigOutput({
        domain: dom,
        type: 'MX',
        records: mxRecords
      });

      const artefactHTML = renderTextBlock(digOutput, {
        title: `Commande : dig MX ${dom.name}`,
        highlights: [{ match: ';; ANSWER SECTION:', color: '--gold' }, { match: ' MX ', color: '--gold' }]
      });

      // Premier MX (priorité la plus basse = la plus haute)
      const expectedMX = dom.mx[0];

      return buildPracticeCard({
        ...opts,
        badge: 'extraction',
        artefactHTML,
        question: `<strong>Quel est le serveur de messagerie principal</strong> (priorité la plus basse = la plus haute) du domaine <code>${dom.name}</code> ?<br><span style="color:var(--dim);font-size:.85rem">Sans le point final.</span>`,
        inputLabel: 'MX :',
        placeholder: 'mail.example.com',
        expected: expectedMX,
        normalize: v => v.trim().toLowerCase().replace(/\.$/, ''),
        hints: [
          `Dans la section <code>ANSWER SECTION</code>, chaque ligne MX a le format : <code>domaine. TTL IN MX &lt;priorité&gt; &lt;hostname&gt;</code>. La priorité la plus basse = serveur principal.`,
          `Cherche la ligne avec <code>IN MX 10 ...</code> (priorité 10 = la plus prioritaire dans cet output).`,
          `MX principal = <strong>${expectedMX}</strong>. Priorité 10 (la plus basse parmi les MX listés = serveur préféré).`
        ],
        explain: `MX principal de <code>${dom.name}</code> : <strong>${expectedMX}</strong>. Convention : priorité <em>basse</em> = utilisé en premier. ${dom.mx.length > 1 ? 'Les autres MX sont fallback en cas d\'indisponibilité du principal.' : ''} Investigation : croiser avec SPF/DMARC pour valider la légitimité.`
      });
    }

    // ── Niveau C : compter les IPs autorisées par un SPF record ──
    {
      const dom = DNS_DOMAINS[rand(0, DNS_DOMAINS.length - 1)];
      // SPF record avec ip4:X.X.X.X/N
      const spfPrefix = [24, 28, 29, 30][rand(0, 3)];
      const spfIPbase = [
        '195.186.245', '194.6.131', '128.178.222', '212.224.215', '94.142.241'
      ][rand(0, 4)];
      const spfIP = `${spfIPbase}.0`;
      // Nombre d'IPs dans le bloc CIDR
      const totalIPs = Math.pow(2, 32 - spfPrefix);

      const spfRecord = `"v=spf1 ip4:${spfIP}/${spfPrefix} include:_spf.google.com -all"`;
      const digOutput = _genDigOutput({
        domain: dom,
        type: 'TXT',
        records: [spfRecord]
      });

      const artefactHTML = renderTextBlock(digOutput, {
        title: `Commande : dig TXT ${dom.name}`,
        highlights: [
          { match: 'v=spf1', color: '--purple' },
          { match: ' TXT ', color: '--purple' }
        ]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'calcul',
        artefactHTML,
        question: `Le SPF record contient un bloc <code>ip4:${spfIP}/${spfPrefix}</code>. <strong>Combien d'adresses IPv4 ce bloc CIDR couvre-t-il</strong> ?<br><span style="color:var(--dim);font-size:.85rem">(Total brut, sans soustraire network/broadcast.)</span>`,
        inputLabel: 'Nombre :',
        placeholder: '256',
        expected: String(totalIPs),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `Un bloc CIDR <code>/N</code> contient <code>2^(32-N)</code> adresses IPv4 (y compris adresse réseau et broadcast).`,
          `Ici N=${spfPrefix}, donc 2^(32-${spfPrefix}) = 2^${32-spfPrefix}.`,
          `2^${32-spfPrefix} = <strong>${totalIPs}</strong> adresses IP autorisées par ce bloc SPF.`
        ],
        explain: `Bloc <code>/${spfPrefix}</code> = <strong>${totalIPs} IPs</strong> (= 2^${32-spfPrefix}). Le SPF dit "ces ${totalIPs} IPs sont autorisées à envoyer du mail depuis ${dom.name}". ${spfPrefix >= 28 ? 'Plage étroite, OK opérationnellement.' : 'Plage très large — audit recommandé.'} Outils : <code>spfquery</code>, <code>mxtoolbox.com/spf</code>.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 3 : Sigma — Règles YAML à compléter
  // ════════════════════════════════════════════════════════════════

  function genSigma() {
    const level = rand(0, 2);
    const opts = { prefix: 'sigma', icon: '🛡️', title: 'Sigma — Compléter une règle YAML' };

    // ── Niveau A : niveau de sévérité (level:) à deviner depuis le contexte ──
    if (level === 0) {
      const scenarios = [
        {
          name: 'Mimikatz exec detected',
          desc: 'Detects execution of mimikatz.exe — credential dumping tool',
          ttp: 'attack.t1003.001',
          tactic: 'attack.credential_access',
          level: 'critical'
        },
        {
          name: 'Rare scheduled task with random name',
          desc: 'Scheduled task with high-entropy random name (potential persistence)',
          ttp: 'attack.t1053.005',
          tactic: 'attack.persistence',
          level: 'high'
        },
        {
          name: 'Office spawning cmd.exe',
          desc: 'Microsoft Office (Word/Excel) spawning cmd.exe — possible macro abuse',
          ttp: 'attack.t1059.003',
          tactic: 'attack.execution',
          level: 'high'
        },
        {
          name: 'New service installed',
          desc: 'Audit : a new Windows service was installed (informational, may be benign)',
          ttp: 'attack.t1543.003',
          tactic: 'attack.persistence',
          level: 'medium'
        },
        {
          name: 'Successful logon outside business hours',
          desc: 'Successful logon (4624) between 22:00 and 06:00 — may need review',
          ttp: 'attack.t1078',
          tactic: 'attack.initial_access',
          level: 'low'
        }
      ];
      const s = scenarios[rand(0, scenarios.length - 1)];
      const yaml = `title: ${s.name}
id: ${'01234567-89ab-cdef-0123-456789abcdef'.split('').map(c => c === '0' || c === '1' ? c : '0123456789abcdef'[rand(0,15)]).join('').slice(0,8)}-...
status: experimental
description: ${s.desc}
author: CAS-IN
date: 2025/09/12
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4688
    Image|endswith: '\\suspicious_binary.exe'
  condition: selection
tags:
  - ${s.ttp}
  - ${s.tactic}
falsepositives:
  - Legitimate admin activity
level: ???`;

      const artefactHTML = renderTextBlock(yaml, {
        title: 'Règle Sigma — détection.yml',
        highlights: [
          { match: 'description:', color: '--cyan' },
          { match: 'level:', color: '--cyan' }
        ]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Cette règle Sigma a son champ <code>level</code> manquant (<code>???</code>). En te basant sur la <code>description</code> et le tag MITRE, <strong>quel niveau de sévérité</strong> est le plus approprié ?<br><span style="color:var(--dim);font-size:.85rem">Valeurs Sigma : <code>informational</code> / <code>low</code> / <code>medium</code> / <code>high</code> / <code>critical</code></span>`,
        inputLabel: 'level :',
        placeholder: 'high',
        expected: s.level,
        normalize: v => v.trim().toLowerCase(),
        hints: [
          `Sigma définit 5 niveaux croissants : <code>informational</code> &lt; <code>low</code> &lt; <code>medium</code> &lt; <code>high</code> &lt; <code>critical</code>. Le choix dépend de l'<strong>impact si vrai positif</strong> ET de la <strong>confiance</strong>.`,
          `Ici : "${s.desc}". Cherche dans les conventions Sigma — un acte de credential dump (Mimikatz) = critical ; une persistence inhabituelle = high ; un audit informatif = medium ; une simple anomalie horaire = low.`,
          `Réponse : <strong>${s.level}</strong>. Critère : <code>${s.name}</code> = ${s.level === 'critical' ? 'malveillance certaine et impact maximal' : s.level === 'high' ? 'forte suspicion de malveillance' : s.level === 'medium' ? 'observation à investiguer' : 'signal faible / faux positifs probables'}.`
        ],
        explain: `<strong>level: ${s.level}</strong>. Règle pratique : <code>critical</code> = action malveillante claire (Mimikatz, ransomware enum) ; <code>high</code> = pattern d'attaque ; <code>medium</code> = audit/observation ; <code>low</code> = anomalie possible mais nombreux faux positifs.`
      });
    }

    // ── Niveau B : numéro d'EventID à compléter ──
    if (level === 1) {
      const eventScenarios = [
        { id: 4624, what: 'Successful logon — track user logons' },
        { id: 4625, what: 'Failed logon — detect brute force' },
        { id: 4634, what: 'Logoff — track session end' },
        { id: 4648, what: 'Logon with explicit credentials (runas) — privilege misuse' },
        { id: 4672, what: 'Special privileges assigned — admin token usage' },
        { id: 4688, what: 'Process creation — detect suspicious binaries' },
        { id: 4720, what: 'New user account created — persistence detection' },
        { id: 4732, what: 'User added to local security-enabled group — privilege escalation' }
      ];
      const evt = eventScenarios[rand(0, eventScenarios.length - 1)];
      const yaml = `title: ${evt.what.split('—')[0].trim()}
status: stable
description: ${evt.what}
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: ???
  condition: selection
level: medium`;

      const artefactHTML = renderTextBlock(yaml, {
        title: 'Règle Sigma — détection.yml',
        highlights: [
          { match: 'description:', color: '--gold' },
          { match: 'EventID:', color: '--gold' }
        ]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'extraction',
        artefactHTML,
        question: `La règle a son <code>EventID</code> manquant. En te basant sur la <code>description</code>, <strong>quel Event ID Windows Security</strong> faut-il mettre ?`,
        inputLabel: 'EventID :',
        placeholder: '4624',
        expected: String(evt.id),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `Les Event IDs Security Windows les plus courants : 4624 (logon réussi), 4625 (logon échoué), 4634 (logoff), 4648 (logon explicite), 4672 (privilèges spéciaux), 4688 (process create), 4720 (user créé), 4732 (ajout groupe).`,
          `Description : "${evt.what}". Cherche dans la liste celui qui correspond exactement.`,
          `EventID = <strong>${evt.id}</strong> (= ${evt.what.split('—')[0].trim()}).`
        ],
        explain: `<strong>EventID: ${evt.id}</strong> — ${evt.what}. Source : journal <code>Security</code> sur Windows. Visualisable avec <code>Get-WinEvent -LogName Security -FilterHashtable @{Id=${evt.id}}</code> en PowerShell.`
      });
    }

    // ── Niveau C : technique MITRE ATT&CK à compléter ──
    {
      const techniques = [
        { id: 't1059.001', name: 'PowerShell', desc: 'Detects suspicious PowerShell command (EncodedCommand, IEX, DownloadString)' },
        { id: 't1003.001', name: 'LSASS Memory', desc: 'Detects access to LSASS process memory (credential dumping via Mimikatz, ProcDump)' },
        { id: 't1547.001', name: 'Registry Run Keys', desc: 'Detects new entries in Run/RunOnce registry keys (persistence)' },
        { id: 't1218.011', name: 'Rundll32', desc: 'Detects suspicious rundll32.exe usage (signed binary proxy execution)' },
        { id: 't1053.005', name: 'Scheduled Task', desc: 'Detects scheduled task creation with schtasks.exe (persistence/execution)' },
        { id: 't1071.001', name: 'Web Protocols', desc: 'Detects HTTP/HTTPS traffic to known C2 infrastructure (command and control)' }
      ];
      const t = techniques[rand(0, techniques.length - 1)];
      const yaml = `title: ${t.name} suspicious activity
description: ${t.desc}
logsource:
  product: windows
  service: sysmon
detection:
  selection:
    EventID: 1
    Image|endswith: '\\powershell.exe'
  condition: selection
tags:
  - attack.???
  - attack.execution
level: high`;

      const artefactHTML = renderTextBlock(yaml, {
        title: 'Règle Sigma — détection.yml',
        highlights: [
          { match: 'description:', color: '--purple' },
          { match: 'attack.???', color: '--purple' },
          { match: 'title:', color: '--purple' }
        ]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `La règle a son tag MITRE ATT&CK incomplet (<code>attack.???</code>). En te basant sur le <code>title</code> et la <code>description</code>, <strong>quel identifiant de technique MITRE</strong> faut-il mettre ?<br><span style="color:var(--dim);font-size:.85rem">Format : <code>tXXXX</code> ou <code>tXXXX.YYY</code> (minuscules, sans préfixe attack.)</span>`,
        inputLabel: 'Technique :',
        placeholder: 't1059.001',
        expected: t.id,
        normalize: v => v.trim().toLowerCase().replace(/^attack\./, '').replace(/\s/g, ''),
        hints: [
          `Le tag MITRE suit le format <code>attack.tXXXX</code> (technique) ou <code>attack.tXXXX.YYY</code> (sous-technique). Cherche dans <a href="https://attack.mitre.org">attack.mitre.org</a> par mot-clé du titre.`,
          `Title : "${t.name}". C'est une technique nommée dans la matrice ATT&CK Enterprise — pense au domaine concerné (execution, credential access, persistence, etc.).`,
          `<strong>${t.id}</strong> = ${t.name}. URL : <code>attack.mitre.org/techniques/${t.id.toUpperCase().replace('.', '/')}/</code>`
        ],
        explain: `Tag MITRE : <strong>attack.${t.id}</strong> (${t.name}). Bonne pratique Sigma : toujours tagger avec ATT&CK pour mesurer la couverture détection via ATT&CK Navigator (heatmap).`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 4 : C2 — Timeline beaconing
  // ════════════════════════════════════════════════════════════════

  function _genBeaconTimeline(opts) {
    opts = opts || {};
    const count = opts.count || 5;
    const sleepSec = opts.sleepSec || 60;
    const jitterPct = opts.jitterPct || 0;
    const srcIP = opts.srcIP || '10.10.50.42';
    const dstIP = opts.dstIP || '185.220.101.42';

    const lines = [];
    lines.push(`Source : ${srcIP}    Destination : ${dstIP}:443    Protocol : TLS\n`);
    lines.push('Timestamp                Bytes_out   Bytes_in   Duration');
    lines.push('────────────────────────────────────────────────────────');

    let t = new Date();
    t.setSeconds(0, 0);
    t.setMinutes(rand(0, 59));
    t.setHours(rand(8, 18));

    for (let i = 0; i < count; i++) {
      const jitter = jitterPct ? Math.floor(sleepSec * jitterPct / 100 * (Math.random() * 2 - 1)) : 0;
      const interval = i === 0 ? 0 : sleepSec + jitter;
      t = new Date(t.getTime() + interval * 1000);
      const tsStr = t.toISOString().replace('T', ' ').slice(0, 19);
      const bytesOut = rand(180, 240);
      const bytesIn = rand(450, 620);
      const duration = (Math.random() * 0.3 + 0.05).toFixed(2);
      lines.push(`${tsStr}      ${bytesOut.toString().padStart(4)}        ${bytesIn.toString().padStart(4)}       ${duration}s`);
    }
    return lines.join('\n');
  }

  function genC2() {
    const level = rand(0, 2);
    const opts = { prefix: 'c2', icon: '🎯', title: 'C2 — Analyse de beaconing' };

    // ── Niveau A : intervalle moyen entre 2 connexions (sans jitter) ──
    if (level === 0) {
      const sleepSec = [30, 60, 90, 120][rand(0, 3)];
      const timeline = _genBeaconTimeline({ count: 5, sleepSec, jitterPct: 0 });

      const artefactHTML = renderTextBlock(timeline, {
        title: 'Connexions vers IP externe — extrait Zeek conn.log',
        highlights: [{ match: '────', color: '--cyan' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici 5 connexions consécutives d'un poste interne vers une IP externe. <strong>Quel est l'intervalle entre 2 connexions consécutives</strong> (en secondes) ?`,
        inputLabel: 'Intervalle (s) :',
        placeholder: '60',
        expected: String(sleepSec),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `Pour calculer l'intervalle : soustraire 2 timestamps consécutifs. Tous les intervalles sont identiques ici (pas de jitter).`,
          `Compare les timestamps des lignes 1 et 2 (ou 2 et 3). La différence en secondes est constante.`,
          `Intervalle = <strong>${sleepSec} secondes</strong>. Pattern de beaconing classique — une connexion toutes les ${sleepSec}s, taille constante des paquets.`
        ],
        explain: `Intervalle = <strong>${sleepSec}s</strong>. Régularité absolue + tailles de paquets stables = signature de beacon C2. Détection : <code>rita</code> (Active Countermeasures), <code>capa</code>, ou analyse statistique des intervalles dans Zeek.`
      });
    }

    // ── Niveau B : extraire le sleep central avec jitter ──
    if (level === 1) {
      const sleepSec = [60, 90, 120][rand(0, 2)];
      const jitterPct = [10, 20, 30][rand(0, 2)];
      const timeline = _genBeaconTimeline({ count: 6, sleepSec, jitterPct });

      const artefactHTML = renderTextBlock(timeline, {
        title: 'Connexions périodiques — analyse forensique',
        highlights: [{ match: '────', color: '--gold' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'calcul',
        artefactHTML,
        question: `Cette fois les intervalles varient — le beacon utilise du jitter. Les intervalles oscillent autour d'une valeur centrale (le <code>sleep</code> configuré). <strong>Quel est ce sleep central</strong> (en secondes, arrondi au plus proche multiple de 10) ?<br><span style="color:var(--dim);font-size:.85rem">Astuce : calcule la moyenne des intervalles, puis arrondis.</span>`,
        inputLabel: 'Sleep (s) :',
        placeholder: '60',
        expected: String(sleepSec),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `Calcule chaque intervalle entre 2 lignes consécutives, fais la moyenne, et arrondis au multiple de 10 le plus proche. La moyenne convergera vers le sleep configuré (en théorie de probabilités : la valeur attendue d'un uniforme [s-j, s+j] est s).`,
          `Avec un jitter de ±${jitterPct}%, les intervalles oscillent entre ${Math.floor(sleepSec*(1-jitterPct/100))} et ${Math.floor(sleepSec*(1+jitterPct/100))} secondes. Le sleep central est au milieu.`,
          `Sleep configuré = <strong>${sleepSec}s</strong> avec jitter ±${jitterPct}%. Détection : RITA mesure le coefficient de variation et identifie le beacon malgré le jitter.`
        ],
        explain: `Sleep = <strong>${sleepSec}s</strong>, jitter = ±${jitterPct}%. Le jitter rend la détection naïve (intervalle fixe) inefficace, mais l'analyse statistique des intervalles reste robuste. Cobalt Strike, Sliver, Mythic permettent tous de configurer sleep+jitter dans leur profil Malleable C2.`
      });
    }

    // ── Niveau C : identifier le type de trafic (beaconing) ──
    {
      const scenarios = [
        {
          sleepSec: 60,
          jitterPct: 0,
          label: 'beaconing',
          aliases: ['beaconing', 'beacon', 'c2 beaconing', 'periodic c2'],
          desc: 'Intervalle constant + tailles de paquets fixes + IP externe peu connue → C2 beaconing certain.'
        },
        {
          sleepSec: 1,
          jitterPct: 100,
          label: 'normal',
          aliases: ['normal', 'legitimate', 'browsing', 'web browsing', 'légitime'],
          desc: 'Intervalles aléatoires + tailles très variables = navigation web humaine ordinaire.'
        },
        {
          sleepSec: 0.3,
          jitterPct: 0,
          label: 'streaming',
          aliases: ['streaming', 'video', 'flux'],
          desc: 'Très haute fréquence + paquets gros (vidéo) = flux streaming (YouTube, Netflix, Twitch).'
        }
      ];
      const s = scenarios[rand(0, scenarios.length - 1)];

      // Pour le scénario streaming/normal, on génère un timeline différent
      let timeline;
      if (s.label === 'beaconing') {
        timeline = _genBeaconTimeline({ count: 6, sleepSec: 60, jitterPct: 0 });
      } else if (s.label === 'normal') {
        // intervalles très variables, tailles variables
        const lines = [];
        lines.push('Source : 10.10.50.42    Destination : variable    Protocol : HTTPS\n');
        lines.push('Timestamp                Bytes_out   Bytes_in   Duration   Dst_host');
        lines.push('────────────────────────────────────────────────────────────────────');
        const hosts = ['www.20min.ch', 'fonts.googleapis.com', 'cdn.jsdelivr.net', 'api.weather.com', 'images.unsplash.com', 'analytics.google.com'];
        let t = new Date(); t.setHours(14, 0, 0, 0);
        for (let i = 0; i < 6; i++) {
          t = new Date(t.getTime() + rand(2, 90) * 1000);
          const tsStr = t.toISOString().replace('T', ' ').slice(0, 19);
          const bo = rand(200, 1500); const bi = rand(500, 80000);
          lines.push(`${tsStr}      ${bo.toString().padStart(4)}      ${bi.toString().padStart(6)}      ${(Math.random()*2).toFixed(2)}s   ${hosts[rand(0,hosts.length-1)]}`);
        }
        timeline = lines.join('\n');
      } else { // streaming
        const lines = [];
        lines.push('Source : 10.10.50.42    Destination : 142.250.74.46:443 (youtube.com)    Protocol : HTTPS/QUIC\n');
        lines.push('Timestamp                Bytes_out   Bytes_in   Duration');
        lines.push('────────────────────────────────────────────────────────');
        let t = new Date(); t.setHours(20, 30, 0, 0);
        for (let i = 0; i < 6; i++) {
          t = new Date(t.getTime() + rand(100, 500));
          const ms = t.toISOString().replace('T', ' ').slice(0, 19) + '.' + String(t.getMilliseconds()).padStart(3,'0');
          const bo = rand(100, 300); const bi = rand(50000, 250000);
          lines.push(`${ms}    ${bo.toString().padStart(4)}      ${bi.toString().padStart(6)}      0.05s`);
        }
        timeline = lines.join('\n');
      }

      const artefactHTML = renderTextBlock(timeline, {
        title: 'Trafic réseau — analyse de pattern',
        highlights: [{ match: '────', color: '--purple' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Analyse ce trafic réseau. Considère la <strong>régularité des intervalles</strong>, la <strong>taille des paquets</strong>, et la <strong>destination</strong>. <strong>Quel type de trafic</strong> est-ce ?<br><span style="color:var(--dim);font-size:.85rem">Réponse attendue parmi : <code>beaconing</code>, <code>normal</code>, <code>streaming</code></span>`,
        inputLabel: 'Type :',
        placeholder: 'beaconing',
        expected: s.label,
        normalize: v => {
          const norm = v.trim().toLowerCase().replace(/[éè]/g, 'e').replace(/[\s_-]/g, '');
          for (const alias of s.aliases) {
            const aliasNorm = alias.toLowerCase().replace(/[éè]/g, 'e').replace(/[\s_-]/g, '');
            if (norm === aliasNorm) return s.label;
          }
          return norm;
        },
        hints: [
          `Le trafic légitime humain (web browsing) a des intervalles très variables et des destinations multiples. Le streaming a une seule destination + gros bytes_in. Le beaconing C2 a un intervalle régulier + petits paquets + une destination peu connue.`,
          `Observe : ${s.label === 'beaconing' ? 'intervalle constant ~60s, tailles fixes, une seule destination externe' : s.label === 'normal' ? 'intervalles très variables (de 2s à 90s), tailles très variables, destinations multiples' : 'très haute fréquence (<1s), gros paquets entrants (vidéo), une seule destination (YouTube)'}.`,
          `Pattern = <strong>${s.label}</strong>. ${s.desc}`
        ],
        explain: `Trafic <strong>${s.label}</strong>. ${s.desc} Les outils de détection beaconing (RITA, Zeek, suricata) utilisent ces critères : régularité (coefficient de variation), entropie des destinations, ratio bytes_out/in.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Enregistrement dans GENERATORS
  // ════════════════════════════════════════════════════════════════
  if (typeof window !== 'undefined' && window.GENERATORS) {
    window.GENERATORS.exif     = genEXIF;
    window.GENERATORS.osintdns = genOSINTDNS;
    window.GENERATORS.sigma    = genSigma;
    window.GENERATORS.c2       = genC2;
  } else if (typeof GENERATORS !== 'undefined') {
    GENERATORS.exif     = genEXIF;
    GENERATORS.osintdns = genOSINTDNS;
    GENERATORS.sigma    = genSigma;
    GENERATORS.c2       = genC2;
  }

  if (typeof window !== 'undefined') {
    window.genEXIF     = genEXIF;
    window.genOSINTDNS = genOSINTDNS;
    window.genSigma    = genSigma;
    window.genC2       = genC2;
  }
})();
