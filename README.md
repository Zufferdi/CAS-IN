# 🔍 Quiz CAS-IN — Investigation Numérique

Application web de révision pour le **Certificate of Advanced Studies en Investigation Numérique (CAS-IN)**. Déployée automatiquement via GitHub Pages à chaque push sur `main`.

🌐 **Accès direct :** [https://zufferdi.github.io/CAS-IN/](https://zufferdi.github.io/CAS-IN/)

---

## 📚 Contenu des questions

Plus de **1200 questions** à choix multiples couvrant l'ensemble des modules du CAS-IN :

| Thème | Description |
|---|---|
| **RÉSEAUX** | Modèle OSI, TCP/IP, ARP, DNS, BGP, VLANs, protocoles |
| **FAT** | Structures FAT12/16/32/exFAT, suppression, récupération |
| **NTFS** | MFT, attributs, journaux, ADS, VSS, timestamps |
| **FILESYSTEMS** | EXT2/3/4, HFS+, APFS, secteurs, clusters, MBR/GPT |
| **FORENSIQUE** | Méthodologie, chaîne de conservation, acquisitions, anti-forensique |
| **CRYPTO** | AES, RSA, TLS, hachage, BitLocker, VeraCrypt, PKI |
| **WINDOWS** | Registre, artefacts (Prefetch, LNK, ShellBags), Event Logs |
| **OUTILS** | Autopsy, X-Ways, Volatility, Wireshark, FTK, KAPE, CyberChef… |
| **PROGRAMMES** | Cellebrite, YARA, Ghidra, Metasploit, Plaso, Chainsaw… |
| **X-WAYS** | Workflow, Volume Snapshot, recherches, carving, rapports |
| **OSINT** | Opérateurs Google, Maltego, Tor, Dark Web, métadonnées |
| **DROIT** | CPP suisse, expertises, perquisitions, entraide internationale (EIMP) |

Les questions sont de trois niveaux : **Facile** (1 pt) · **Moyen** (2 pts) · **Difficile** (3 pts).

---

## 🏗️ Structure du projet

```
CAS-IN/
├── index.html          # Application principale (quiz interactif)
├── questions.js        # Base de questions (format JS/JSON)
├── Quizz CASIN.htm     # Version alternative standalone
└── .github/workflows/  # Déploiement automatique GitHub Pages
```

---

## 🚀 Déploiement local

Aucune installation requise. L'application fonctionne entièrement côté client (HTML + JS vanilla).

```bash
git clone https://github.com/Zufferdi/CAS-IN.git
cd CAS-IN
# Ouvrir index.html dans un navigateur
open index.html
```

> **Note :** Pour charger `questions.js` via `fetch()`, un serveur HTTP local peut être nécessaire sur certains navigateurs en raison des restrictions CORS.
>
> ```bash
> python3 -m http.server 8080
> # puis ouvrir http://localhost:8080
> ```

---

## ➕ Ajouter ou modifier des questions

Les questions sont stockées dans `questions.js` sous forme d'un tableau JSON. Chaque question suit cette structure :

```json
{
  "theme": "FORENSIQUE",
  "diff": "medium",
  "q": "Qu'est-ce que le file carving ?",
  "opts": [
    "Une technique de chiffrement",
    "La récupération de fichiers par leurs signatures binaires",
    "Un outil de copie de disques",
    "Un format d'image forensique"
  ],
  "answers": [1],
  "type": "single",
  "expl": "Le <strong>file carving</strong> consiste à récupérer des fichiers depuis un flux brut en détectant les magic bytes, sans s'appuyer sur le système de fichiers."
}
```

### Champs obligatoires

| Champ | Valeurs possibles | Description |
|---|---|---|
| `theme` | `RÉSEAUX`, `FAT`, `NTFS`, `FILESYSTEMS`, `FORENSIQUE`, `CRYPTO`, `WINDOWS`, `OUTILS`, `PROGRAMMES`, `X-WAYS`, `OSINT`, `DROIT` | Catégorie de la question |
| `diff` | `easy`, `medium`, `hard` | Niveau de difficulté |
| `q` | chaîne de texte | Énoncé de la question |
| `opts` | tableau de 3–5 chaînes | Options de réponse |
| `answers` | tableau d'indices (ex: `[1]` ou `[0,2]`) | Index des bonnes réponses dans `opts` |
| `type` | `single` ou `multi` | Une ou plusieurs réponses correctes |
| `expl` | chaîne HTML | Explication affichée après validation (balises `<strong>`, `<code>` acceptées) |

### Règles de rédaction

- Les **longueurs des options** doivent être comparables — éviter que la réponse correcte soit systématiquement la plus longue.
- Toujours inclure une **explication** (`expl`) : c'est la valeur pédagogique principale.
- Pour les questions `multi`, indiquer `"type": "multi"` et lister tous les indices corrects dans `answers`.
- Les **balises HTML** sont acceptées dans `expl` : `<strong>`, `<em>`, `<code>`.

### Workflow pour contribuer

```bash
# 1. Cloner et créer une branche
git checkout -b add-questions-osint

# 2. Éditer questions.js (ajouter les nouvelles questions dans le tableau)

# 3. Vérifier la syntaxe JSON
python3 -c "import json; data=open('questions.js').read(); \
  json.loads(data[data.index('['): data.rindex(']')+1]); print('OK')"

# 4. Pousser et créer une Pull Request
git add questions.js
git commit -m "feat: ajout de 15 questions OSINT niveau hard"
git push origin add-questions-osint
```

---

## 📄 Licence

Usage pédagogique interne — CAS-IN, HE-Arc.

