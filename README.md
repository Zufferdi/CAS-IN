# Refactor fiches/index — Résumé des changements

## 📦 Livrables

### 1. Script `scripts/build_index.py` (modifié)
**Remplace intégralement l'ancien.** Apporte :

- **Ordre pédagogique en 9 modules** (Fondamentaux → Droit → Méthodo → FS → Windows → Autres OS → Réseaux → Crypto → Outils)
- **Nouvelle catégorie `fondamentaux`** pour `encodage.html` et `disques.html`
- **Tri intra-catégorie** (`INTRA_CATEGORY_ORDER`) — les fiches suivent maintenant une progression logique au sein de chaque module, pas l'alphabet
- **Overrides d'icônes** (`ICON_OVERRIDES`) — corrige sans éditer les fiches les icônes texte du type "FAT12", "NTFS", "EXT" qui cassaient la mise en page (→ 📀, 🗄, 🐧…)
- **Overrides de descriptions** (`DESC_OVERRIDES`) — comble les descriptions vides pour uniformiser la hauteur des cartes
- **Overrides de tags** (`TAG_OVERRIDES`) — garantit qu'une carte a toujours un tag court
- **Badge numéro de module** (01–09) devant chaque catégorie pour visualiser la progression
- **Cartes uniformes** — `min-height` sur le nom (2 lignes) et la description (3 lignes) → plus de hauteurs irrégulières
- **Compteur dynamique** — le nombre de modules affiché dans le header s'adapte automatiquement au nombre de catégories non-vides

### 2. Quatre nouvelles fiches dans `fiches/`

| Fiche | Module | Tag | Contenu |
|---|---|---|---|
| `messagerie_im.html` | 📡 Réseaux & Communications | IM · E2EE | WhatsApp, Signal, Telegram · SQLCipher · LSCPT · art. 269/273/280 CPP |
| `cryptomonnaies.html` | 🔐 Cryptologie & Sécurité | Bitcoin · Blockchain | UTXO · Ethereum · wallets · mixers · Chainalysis · FINMA/LBA · saisie art. 263 CPP |
| `chiffrement_volumes.html` | 🔐 Cryptologie & Sécurité | BitLocker · LUKS | BitLocker/FileVault/LUKS/VeraCrypt · TPM sniffing · cold boot · art. 90 CPP |
| `usb_forensique.html` | 🪟 Artefacts Windows | USBSTOR | USBSTOR · setupapi · Event Logs · MountPoints2 · mapping user · macOS/Linux |

Chaque fiche est **self-contained** (styles inline), contient une `<meta name="description">`, un breadcrumb cliquable avec `href="index.html#cat-X"` (détection Méthode 1, la plus fiable), un `<span class="fiche-tag">` caché pour que le script le récupère, et suit la charte graphique des fiches existantes.

## 🚀 Déploiement

1. **Remplacer** `scripts/build_index.py` par le nouveau
2. **Ajouter** les 4 fichiers `fiches/*.html` au dépôt
3. **Commit + push** — la GitHub Action `sync-fiches-index.yml` régénérera automatiquement `fiches/index.html` avec les 53 fiches dans les 9 modules
4. **Vérifier** dans l'onglet Actions que le build passe (il affichera `✅ index.html régénéré — 53 fiches · 9 modules.`)

## 🎯 Résultat attendu

- Total : **53 fiches** (49 existantes + 4 nouvelles)
- Modules : **9** (progression pédagogique numérotée 01–09)
- Toutes les fiches détectées sans fallback (0 fallback dans les stats)
- Icônes et descriptions uniformes
- Tri intra-catégorie logique (plus d'ordre alphabétique aveugle)

## 🔧 Maintenance future

Pour ajuster l'ordre ou corriger une icône/description **sans toucher aux fiches** :

- **Réorganiser un module** : éditer la liste dans `INTRA_CATEGORY_ORDER[cat_id]` du script
- **Corriger une icône** : ajouter `"fichier.html": "🎯"` dans `ICON_OVERRIDES`
- **Combler une description** : ajouter l'entrée dans `DESC_OVERRIDES` — ne s'applique que si la fiche n'a PAS de `<meta name="description">`
- **Ajouter un tag** : idem dans `TAG_OVERRIDES` — ne s'applique que si la fiche n'a PAS de `.fiche-tag` ou `.tag`

Pour **ajouter une nouvelle fiche** :

1. Créer `fiches/nom_fiche.html` avec au minimum :
   - `<title>Nom — CAS-IN Forensique</title>`
   - `<meta name="description" content="…">`
   - Breadcrumb avec `<a href="index.html#cat-CATEGORIE">…</a>`
   - `<div class="badge">🎯 Texte</div>` (emoji en premier pour l'icône)
   - `<span class="fiche-tag">Tag court</span>` (caché via CSS si besoin)
2. L'ajouter dans `INTRA_CATEGORY_ORDER` à la bonne position pédagogique
3. Push → la CI régénère l'index

Le script est conçu pour être tolérant : même si un breadcrumb/meta manque, les overrides comblent le manque et aucune fiche ne se retrouve en "outilsDFIR" par défaut (à condition que son filename contienne un keyword connu).
