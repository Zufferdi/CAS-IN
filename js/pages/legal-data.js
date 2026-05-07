// ═══════════════════════════════════════════════════════════════
// legal-data.js — Articles juridiques CH / EU (référence DFIR)
// Page : legal.html
// ~30 articles parmi les plus invoqués dans les scènes/quiz CAS-IN.
//
// AVERTISSEMENT : Cette référence est strictement pédagogique.
// Les textes sont résumés/abrégés ; pour toute application réelle,
// se référer aux sources officielles (admin.ch, eur-lex.europa.eu)
// et consulter un juriste.
// ═══════════════════════════════════════════════════════════════
window.REF_CONFIG = {

  pageId:    'legal',
  emoji:     '⚖️',
  title:     'Articles juridiques',
  subtitle:  'Suisse · Europe · International',
  description: "Articles de loi régulièrement invoqués en investigation numérique : Code pénal CH, CPP, LSCPT, LPD révisée, EIMP, RGPD, Convention de Budapest. Pédagogique — pas un substitut au texte officiel.",

  filters: [
    { id: 'code',     label: 'Code / Loi',  kind: 'select', autoOptions: true },
    { id: 'domain',   label: 'Domaine',     kind: 'select', autoOptions: true },
    { id: 'level',    label: 'Niveau',      kind: 'select', autoOptions: true },
    { id: 'q',        label: 'Recherche',   kind: 'text',   placeholder: 'ex: surveillance, données, entraide...' }
  ],

  columns: [
    { id: 'code',     label: 'Code',     kind: 'badge', sortable: true,
      badgeMap: { 'CP':'red', 'CPP':'orange', 'LSCPT':'gold', 'LPD':'cyan',
                  'LMSI':'purple', 'LRens':'purple', 'EIMP':'blue',
                  'RGPD':'green', 'NIS2':'green', 'Budapest':'cyan' } },
    { id: 'article',  label: 'Article',  kind: 'mono',  sortable: true },
    { id: 'name',     label: 'Intitulé', kind: 'bold',  sortable: true },
    { id: 'domain',   label: 'Domaine',  kind: 'tag',   sortable: true },
    { id: 'level',    label: 'Niveau',   kind: 'tag',   sortable: true }
  ],

  detail: {
    titleField: 'name',
    callout: d => d.warning ? { tone: 'gold', html: `<b>⚠ Attention :</b> ${d.warning}` } : null,
    grid: [
      { label: 'Code / Loi',     field: 'code' },
      { label: 'Article',        render: d => `<span class="ref-mono">${d.article}</span>` },
      { label: 'Domaine',        field: 'domain' },
      { label: 'Niveau',         field: 'level' },
      { label: 'Source officielle', render: d => d.officialUrl
          ? `<a href="${d.officialUrl}" target="_blank" rel="noopener">${d.officialUrl}</a>`
          : '<span class="ref-dim">—</span>' }
    ],
    description: 'description',
    sections: [
      { label: "Conditions d'application", field: 'conditions' },
      { label: 'Application en pratique',  field: 'practice' },
      { label: 'Jurisprudence / cas',      field: 'jurisprudence' },
      { label: 'Articles liés',            field: 'links', kind: 'list' }
    ],
    notes: 'notes',
    related: 'related'
  },

  search: {
    fields: ['article', 'name', 'description', 'conditions',
             'practice', 'jurisprudence', 'code', 'domain']
  },

  data: [

    // ── CODE PÉNAL (CP) ──────────────────────────────────
    {
      code: 'CP', article: 'Art. 143', name: 'Soustraction de données',
      domain: 'Cybercrime', level: 'CH-fédéral',
      officialUrl: 'https://www.fedlex.admin.ch/eli/cc/54/757_781_799',
      description: "Quiconque, sans dessein d'enrichissement, soustrait pour lui-même ou pour un tiers des données enregistrées ou transmises électroniquement, contre lesquelles l'ayant droit s'est protégé, est puni d'une peine privative de liberté de 3 ans au plus ou d'une peine pécuniaire.",
      conditions: "<b>Cumulatif :</b> (1) données enregistrées/transmises électroniquement ; (2) protégées (mot de passe, chiffrement, ACL — la simple absence de droit ne suffit pas) ; (3) soustraction (= prise de connaissance non autorisée) ; (4) <b>sans</b> dessein d'enrichissement (sinon Art. 147).",
      practice: "Vol de données, exfiltration, espionnage industriel non motivé par enrichissement direct. La protection peut être technique <i>ou</i> juridique (NDA explicite + access control).",
      jurisprudence: "ATF 145 IV 185 : la protection technique doit être <i>actuelle et non triviale à contourner</i>.",
      links: ['Art. 143bis CP (accès indu)', 'Art. 144bis CP (détérioration de données)', 'Art. 162 CP (secret commercial)']
    },
    {
      code: 'CP', article: 'Art. 143bis', name: 'Accès indu à un système informatique',
      domain: 'Cybercrime', level: 'CH-fédéral',
      description: "Quiconque s'introduit sans droit, au moyen d'un dispositif de transmission de données, dans un système informatique appartenant à autrui et spécialement protégé contre tout accès, est, sur plainte, puni d'une peine privative de liberté de 3 ans au plus ou d'une peine pécuniaire.",
      conditions: "(1) Système informatique d'autrui ; (2) <b>spécialement protégé</b> contre tout accès (firewall, password) ; (3) introduction sans droit ; (4) sur plainte (infraction poursuivie d'office si circonstances aggravantes).",
      practice: "Hacking au sens classique. Différent de 143 (focus sur les <i>données</i>) : 143bis vise l'<i>accès</i> au système, sans nécessairement extraire des données.",
      jurisprudence: "TF 6B_456/2007 : le contournement d'un mot de passe trivial reste un accès indu. Mais l'absence de toute protection = pas d'infraction.",
      warning: "Sur <b>plainte</b> sauf circonstance aggravante. Important pour les CISO qui découvrent une intrusion."
    },
    {
      code: 'CP', article: 'Art. 144bis', name: 'Détérioration de données',
      domain: 'Cybercrime', level: 'CH-fédéral',
      description: "Quiconque, sans droit, modifie, efface ou met hors d'usage des données enregistrées ou transmises électroniquement ou de toute autre manière, est, sur plainte, puni d'une peine privative de liberté de 3 ans au plus ou d'une peine pécuniaire. La diffusion de logiciels malveillants est punie par le ch. 2.",
      conditions: "Modification, effacement, mise hors d'usage. Couvre <b>ransomware</b> (chiffrement = mise hors d'usage), wipers, sabotage logique.",
      practice: "Base légale principale pour poursuivre une attaque ransomware en Suisse (combiné avec 143/143bis).",
      links: ['Art. 144 CP (dommages à la propriété)', 'Art. 147 CP (utilisation frauduleuse d\'ordinateur)']
    },
    {
      code: 'CP', article: 'Art. 147', name: "Utilisation frauduleuse d'un ordinateur",
      domain: 'Cybercrime', level: 'CH-fédéral',
      description: "Quiconque, dans le dessein de se procurer ou de procurer à un tiers un enrichissement illégitime, influence un processus électronique de traitement ou de transmission de données par utilisation de données incorrectes, incomplètes ou indues, ou de tout autre procédé non autorisé, et provoque ainsi un transfert d'actifs au préjudice d'autrui...",
      conditions: "(1) Dessein d'enrichissement illégitime ; (2) influence sur traitement automatisé ; (3) transfert d'actifs au préjudice d'autrui.",
      practice: "Fraude au paiement, BEC (Business Email Compromise) avec virement détourné, manipulation de résultats automatisés. Différent de 143 (ce dernier exige PAS de dessein d'enrichissement).",
      jurisprudence: "BEC fraud : ATF 129 IV 315.",
      links: ['Art. 146 CP (escroquerie classique)', 'Art. 143 CP (soustraction de données)']
    },
    {
      code: 'CP', article: 'Art. 156', name: 'Extorsion et chantage',
      domain: 'Cybercrime', level: 'CH-fédéral',
      description: "Quiconque, dans le dessein de se procurer ou de procurer à un tiers un enrichissement illégitime, détermine une personne à des actes préjudiciables à ses intérêts pécuniaires ou à ceux d'un tiers, en usant de violence ou en la menaçant d'un dommage sérieux...",
      practice: "<b>Base ransomware modern :</b> double extorsion (chiffrement + menace de publication des données = chantage par l'embarras / dommage). Souvent invoqué combiné à 144bis.",
      jurisprudence: "Cas ransomware Suisse : Vétroz (Akira), Xplain — qualification 156 + 144bis."
    },
    {
      code: 'CP', article: 'Art. 179novies', name: 'Soustraction de données personnelles',
      domain: 'Données personnelles', level: 'CH-fédéral',
      description: "Quiconque soustrait d'un fichier des données personnelles sensibles, qui ne sont pas librement accessibles, est, sur plainte, puni d'une peine pécuniaire.",
      conditions: "Données <b>sensibles</b> au sens LPD (santé, opinions politiques, religieuses, vie sexuelle, mesures sociales, sphère intime).",
      practice: "Complète Art. 143 CP pour spécifiquement protéger les données sensibles."
    },
    {
      code: 'CP', article: 'Art. 179quater', name: "Violation du domaine secret ou privé au moyen d'un appareil de prise de vue",
      domain: 'Surveillance', level: 'CH-fédéral',
      description: "Quiconque, sans le consentement de la personne intéressée, observe avec un appareil de prise de vue ou fixe sur un porteur d'images un fait qui relève du domaine secret de cette personne ou qui n'est pas à la portée de chacun...",
      practice: "Caméras cachées, surveillance vidéo non déclarée. Pertinent en investigation OSINT/perquisition pour bornes de la collecte.",
      jurisprudence: "Drones : ATF 144 II 70."
    },
    {
      code: 'CP', article: 'Art. 197', name: 'Pornographie',
      domain: 'Contenu illicite', level: 'CH-fédéral',
      description: "Réprime la pornographie illicite ; <b>chiffre 4</b> punit spécifiquement les actes pédopornographiques (peine privative de liberté jusqu'à 5 ans).",
      practice: "Cadre des analyses NCMEC, perquisitions, extractions mobiles. Compétences cantonales sauf gravité ou réseau.",
      warning: "Manipulation des médias : seulement par autorité habilitée. La mise en place de chain of custody stricte est <i>impérative</i>.",
      links: ['Art. 197 ch. 4 CP', 'Art. 197 ch. 5 CP (consultation)']
    },
    {
      code: 'CP', article: 'Art. 251', name: 'Faux dans les titres',
      domain: 'Preuve numérique', level: 'CH-fédéral',
      description: "Création/utilisation de titres falsifiés. Inclut documents électroniques signés, factures PDF altérées, contrats numériques.",
      practice: "Pertinent pour métadonnées Office, signatures PDF, manipulations EXIF dans une preuve produite en justice.",
      links: ['Art. 110 al. 4 CP (définition du titre)']
    },
    {
      code: 'CP', article: 'Art. 273', name: 'Service de renseignements économiques',
      domain: 'Espionnage', level: 'CH-fédéral',
      description: "Espionnage économique au profit d'un État étranger, organisation étrangère ou entreprise privée à l'étranger.",
      practice: "Cas APT/sponsoring étatique avec exfiltration de données à dimension stratégique. Compétence MPC (Ministère public de la Confédération)."
    },

    // ── CODE DE PROCÉDURE PÉNALE (CPP) ───────────────────
    {
      code: 'CPP', article: 'Art. 139', name: 'Principes — administration des preuves',
      domain: 'Preuve numérique', level: 'CH-fédéral',
      description: "Les autorités pénales mettent en œuvre tous les moyens de preuve licites qui, selon l'état des connaissances scientifiques et l'expérience, sont propres à établir la vérité.",
      practice: "Base légale de la quasi-totalité des analyses forensiques. Permet d'invoquer ACPO, NIST, ISO 27037 comme normes de référence."
    },
    {
      code: 'CPP', article: 'Art. 141', name: "Preuves obtenues illégalement — conditions d'exclusion",
      domain: 'Preuve numérique', level: 'CH-fédéral',
      description: "Définit la nullité des preuves obtenues illégalement. Distinction : (al. 1) preuves <b>absolument inexploitables</b> (interdiction grave) vs (al. 2) <b>balance des intérêts</b> (cas moins grave).",
      conditions: "Al. 1 : moyens prohibés (torture, manipulation), procédure ne respectant pas les conditions de validité (ex: surveillance sans autorisation TMC). Al. 2 : intérêt à la poursuite vs gravité de la violation.",
      practice: "<b>Article CRITIQUE</b> en DFIR. Une acquisition non documentée, sans hash, sans chain of custody, peut tomber sous 141. Toujours documenter, hasher, témoin si possible.",
      warning: "Conséquence d'une preuve écartée : pas seulement la preuve principale mais aussi tous ses fruits (effet domino).",
      jurisprudence: "ATF 138 IV 169 (théorie du fruit de l'arbre empoisonné, application restreinte en CH).",
      links: ['Art. 140 CPP (méthodes prohibées)', 'Art. 158 CPP (information aux droits)']
    },
    {
      code: 'CPP', article: 'Art. 197', name: "Principes des mesures de contrainte",
      domain: 'Procédure', level: 'CH-fédéral',
      description: "Conditions générales : (a) base légale ; (b) soupçon suffisant ; (c) but ne pouvant être atteint par mesure moins sévère ; (d) proportionnalité.",
      practice: "Test universel pour toute mesure de contrainte (perquisition, séquestre, surveillance). À justifier dans tout PV / requête."
    },
    {
      code: 'CPP', article: 'Art. 269', name: 'Surveillance de la correspondance par poste et télécommunication',
      domain: 'Surveillance', level: 'CH-fédéral',
      description: "Conditions de la surveillance temps réel. Soupçon de crime grave (catalogue Art. 269 al. 2 CPP), absence de moyen moins intrusif. <b>Autorisation TMC obligatoire</b>.",
      practice: "Interception live, géolocalisation active. Distincte de la surveillance rétroactive (Art. 273) et des données secondaires (Art. 273 al. 2).",
      warning: "Délais stricts : autorisation TMC dans les 24h. Toute data acquise avant autorisation = inexploitable.",
      links: ['Art. 269bis (IMSI catcher)', 'Art. 269ter (Govware, déchiffrement)', 'Art. 273 CPP (rétroactif)']
    },
    {
      code: 'CPP', article: 'Art. 269ter', name: 'Govware (logiciel de surveillance)',
      domain: 'Surveillance', level: 'CH-fédéral',
      description: "Permet l'introduction d'un logiciel de surveillance dans un système informatique pour intercepter des communications chiffrées avant chiffrement (E2E).",
      conditions: "Crimes graves (catalogue), mesures alternatives épuisées, autorisation TMC + Conseil fédéral. Très restrictif.",
      practice: "Rare en pratique. Cadre légal du 'Staatstrojaner' suisse.",
      jurisprudence: "Critiques constitutionnelles (proportionnalité, IT-Grundrecht)."
    },
    {
      code: 'CPP', article: 'Art. 273', name: 'Surveillance rétroactive des données accessoires',
      domain: 'Surveillance', level: 'CH-fédéral',
      description: "Demande des données accessoires (qui a communiqué avec qui, quand, où — pas le contenu) déjà collectées par les opérateurs.",
      conditions: "Délai de conservation 6 mois (sera 12 mois). Soupçons d'infractions du catalogue. Autorisation TMC.",
      practice: "Source DFIR très utilisée : géolocalisation a posteriori (cell-ID), partenaires de communication, IMSI/IMEI. Différent du contenu (Art. 269)."
    },
    {
      code: 'CPP', article: 'Art. 282', name: "Observation",
      domain: 'Surveillance', level: 'CH-fédéral',
      description: "Observation secrète de personnes ou d'objets dans des lieux publics ou accessibles au public. <b>Pas</b> d'autorisation TMC (procureur direct).",
      practice: "OSINT en lieu public, surveillance physique, observation de profils sociaux publics. Frontière fine avec investigation secrète (Art. 285a)."
    },
    {
      code: 'CPP', article: 'Art. 309', name: "Ouverture d'instruction",
      domain: 'Procédure', level: 'CH-fédéral',
      description: "Le ministère public ouvre une instruction lorsqu'il existe des soupçons suffisants laissant présumer qu'une infraction a été commise.",
      practice: "Marque le passage d'investigation policière (Art. 306 CPP) à instruction MP avec garanties procédurales renforcées."
    },

    // ── LSCPT (Loi fédérale sur la surveillance correspondance) ──
    {
      code: 'LSCPT', article: 'Art. 8', name: "Données obligatoires (Service SCPT)",
      domain: 'Surveillance', level: 'CH-fédéral',
      description: "Énumère les données que les fournisseurs de services de télécommunication (FST) doivent fournir : identification, localisation, données accessoires, contenu sur ordre.",
      practice: "Cadre opérationnel des demandes SCPT — base technique des Art. 269-273 CPP."
    },
    {
      code: 'LSCPT', article: 'Art. 12', name: "Catégories de fournisseurs",
      domain: 'Surveillance', level: 'CH-fédéral',
      description: "FST = obligation complète. <b>Fournisseurs de services de communication dérivés</b> (chats, mail, VPN suisses) = obligations limitées en fonction de la taille.",
      practice: "Détermine qui peut être contraint à donner accès. Threema, Proton — soumis à LSCPT en tant que FSCD.",
      warning: "Distinction technique souvent débattue (le chiffrement E2E peut empêcher la livraison de contenu utile)."
    },

    // ── LPD RÉVISÉE (entrée en vigueur 09.2023) ──────────
    {
      code: 'LPD', article: 'Art. 5', name: "Définitions",
      domain: 'Données personnelles', level: 'CH-fédéral',
      officialUrl: 'https://www.fedlex.admin.ch/eli/cc/2022/491',
      description: "Définit : (a) données personnelles ; (b) données sensibles (santé, religion, opinion, race, génétique, biométrique unique) ; (e) profilage à risque élevé.",
      practice: "Toute analyse forensique sur des données personnelles est concernée. Définition large : adresse IP = donnée personnelle si rattachable.",
      links: ['Art. 6 LPD (principes)', 'Art. 24 LPD (notification de violation)']
    },
    {
      code: 'LPD', article: 'Art. 24', name: "Annonce des violations de la sécurité des données",
      domain: 'Notification', level: 'CH-fédéral',
      description: "Obligation d'annoncer au PFPDT les violations de sécurité conduisant à un risque élevé pour la personnalité ou les droits fondamentaux des personnes concernées.",
      conditions: "<b>Risque élevé</b> requis (pas toute violation). Personnes concernées informées si nécessaire à leur protection.",
      practice: "Equivalent suisse de l'Art. 33 RGPD mais <b>seuil plus élevé</b> et <b>pas de délai 72h fixe</b>. À déclencher dès que l'IR confirme l'incident.",
      warning: "Pas de pénalité directe pour défaut d'annonce, MAIS combinée à Art. 60-65 LPD."
    },
    {
      code: 'LPD', article: 'Art. 60', name: "Sanctions pénales — violation des devoirs d'information",
      domain: 'Données personnelles', level: 'CH-fédéral',
      description: "Amende jusqu'à 250'000 CHF pour violation intentionnelle des devoirs d'information, de transmission, ou de devoirs particuliers.",
      practice: "<b>Sanction sur la personne physique responsable</b>, pas l'entreprise. Important pour DPO/DSI.",
      warning: "Seuil plus bas que RGPD (4% CA mondial) mais sanction <b>personnelle</b> en CH."
    },

    // ── EIMP (Entraide internationale en matière pénale) ──
    {
      code: 'EIMP', article: 'Art. 1', name: "Champ d'application",
      domain: 'Entraide', level: 'CH-international',
      description: "Régit l'entraide pénale internationale : extradition, autres actes d'entraide, délégation de la poursuite, exécution de décisions.",
      practice: "Base légale unique pour MLAT (mutual legal assistance treaty). Tout demande d'évidence numérique à l'étranger passe par EIMP."
    },
    {
      code: 'EIMP', article: 'Art. 28', name: "Conditions de l'extradition",
      domain: 'Entraide', level: 'CH-international',
      description: "Extradition possible pour infraction punie de >1 an de privation de liberté dans les 2 États.",
      practice: "Pertinent pour cybercrime transnational (ransomware, fraude) avec auteur localisé à l'étranger."
    },
    {
      code: 'EIMP', article: 'Art. 80', name: "Demande d'entraide accessoire",
      domain: 'Entraide', level: 'CH-international',
      description: "Procédure d'exécution d'une commission rogatoire étrangère (recueil de données, perquisition, séquestre).",
      practice: "Cas standard : autorité étrangère demande à la Suisse de saisir des données (cloud, FSCD). Délai souvent long (3-12 mois)."
    },

    // ── RGPD (UE) ─────────────────────────────────────────
    {
      code: 'RGPD', article: 'Art. 33', name: "Notification d'une violation à l'autorité de contrôle",
      domain: 'Notification', level: 'EU',
      officialUrl: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
      description: "Le responsable du traitement notifie la violation à l'autorité de contrôle compétente dans les <b>72 heures</b> suivant la prise de connaissance, sauf si elle n'est pas susceptible d'engendrer un risque pour les droits et libertés des personnes physiques.",
      conditions: "<b>72h</b> = délai strict. Si dépassement, justifier les motifs.",
      practice: "Pression majeure sur les IR transfrontaliers (filiales UE d'entreprises CH). Comparer avec LPD Art. 24 (pas de délai fixe).",
      warning: "Sanction pour défaut de notification : Art. 83 al. 4 RGPD = <b>2% du CA mondial</b> (catégorie basse) ou <b>10M €</b>."
    },
    {
      code: 'RGPD', article: 'Art. 32', name: "Sécurité du traitement",
      domain: 'Données personnelles', level: 'EU',
      description: "Mesures techniques et organisationnelles appropriées pour garantir un niveau de sécurité adapté au risque (chiffrement, pseudonymisation, résilience, restauration).",
      practice: "Base d'évaluation post-incident : la mesure était-elle 'appropriée' ? Critère de jugement de la responsabilité."
    },
    {
      code: 'RGPD', article: 'Art. 83', name: "Conditions générales pour imposer des amendes administratives",
      domain: 'Sanctions', level: 'EU',
      description: "Sanctions jusqu'à <b>20M € ou 4% du CA mondial annuel</b> (catégorie haute), ou <b>10M € ou 2% du CA</b> (catégorie basse).",
      practice: "Levier d'enforcement. Sert d'argument économique pour les conseils d'administration."
    },

    // ── CONVENTION DE BUDAPEST ───────────────────────────
    {
      code: 'Budapest', article: 'Art. 16', name: "Conservation rapide de données informatiques stockées",
      domain: 'Entraide', level: 'International',
      description: "Convention sur la cybercriminalité du Conseil de l'Europe (2001). Conservation rapide ('preservation order') de données par opérateurs en attendant procédure formelle.",
      practice: "Mécanisme de gel rapide entre États signataires (>60 États dont CH, USA). Pivot pour preuves volatiles cloud."
    },
    {
      code: 'Budapest', article: 'Art. 18', name: "Injonction de produire des données",
      domain: 'Entraide', level: 'International',
      description: "Permet aux autorités d'enjoindre la production de données par opérateur, y compris transfrontalière (avec conditions).",
      practice: "Coopération avec providers (Google, Microsoft) — pivots vers Cloud Act US si serveurs US."
    },

    // ── NIS2 (UE 2022) ────────────────────────────────────
    {
      code: 'NIS2', article: 'Art. 23', name: "Notification d'incident — entités essentielles/importantes",
      domain: 'Notification', level: 'EU',
      description: "Notification incident significatif au CSIRT national : <b>early warning 24h</b>, <b>notification complète 72h</b>, <b>rapport final 1 mois</b>.",
      practice: "S'applique aux entités essentielles UE. Hôpitaux, énergie, eau, transport, infrastructure numérique. CH non concernée directement, mais filiales UE oui.",
      warning: "Délais cumulatifs et plus contraignants que RGPD."
    }

  ]
};
