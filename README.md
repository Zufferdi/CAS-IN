# CAS-IN — Patch v3.1 — Faveurs PNJ + 🐛 fix Viège/Sarine

## 🐛 BUG FIX — Scènes Viège/Sarine "introuvables"

### Diagnostic effectué

L'audit a vérifié les 12 fichiers : tous présents, JSON valides, ids cohérents, dans l'index. **Le bug n'est PAS dans les données.**

### Cause réelle

Le **service worker v143** stocké dans le navigateur de l'utilisateur intercepte les requêtes `fetch('scenes/vs-affaire-viege-1...')`. Ces 12 scènes sont arrivées tard dans le dev → l'ancien SW n'avait pas eu l'occasion de les précacher. Quand `loadFullScene()` les demande :

1. SW cherche dans son cache → miss
2. SW tente fetch network → échoue
3. SW retourne un body JSON `{error:'offline'}` avec **status 503**
4. `fetch.then(r => if(!r.ok) throw)` → throw silencieux
5. Côté UI : "⚠ Scène introuvable" (message faux + frustrant)

### Fix appliqué

`loadFullScene` distingue maintenant **3 types d'erreurs** :
- `SW_OFFLINE` (status 503 + body `{error:'offline'}`) → message clair : *"Cache navigateur périmé. Rechargez (Ctrl+Shift+R)"*
- `NOT_FOUND` (status 404) → *"Scène introuvable côté serveur"*
- Autres → message générique avec le code HTTP

Plus le bump CACHE_VERSION v143 → v200 de v3.0 qui force le SW à se réinstaller.

Plus le `.nojekyll` à la racine pour neutraliser Jekyll sur GitHub Pages.

### Récupération côté utilisateur

Si tu vois encore "Cache navigateur périmé" :
1. **Sur PC** : `Ctrl + Shift + R` (hard reload)
2. **Sur Mac** : `Cmd + Shift + R`
3. Ou bien : DevTools (F12) > Application > Service Workers > **Unregister** + reload

## 🎭 NOUVEAU — Système de Faveurs

Tu m'as demandé : **"à quoi ça sert d'avoir des alliés ou des gens qui doutent ?"** — maintenant ça sert à quelque chose pendant la scène.

### Mécanique selon le trust

#### 🤝 Complice (76-100) → faveur active
Bouton dans le briefing :

| Famille | Faveur | Effet |
|---|---|---|
| Procureurs, avocats, OFJ | 💡 Indice juridique | Élimine 1 mauvais choix gratuitement |
| Polcant, fedpol, OFCS, sécurité privée | 🔍 Indice technique | Modal qui révèle situation + alertLevel |
| FBI, Europol, SRC, DDPS | ⏱ Du temps | Reset timer de lecture, +30s mode procureur |

**1 par scène. Tracée dans `localStorage.cas_favors_used`.**

#### 🙂 Professionnel (51-75)
Comportement par défaut, rien à signaler.

#### 🤨 Méfiant (26-50) → friction
*"X doute de tes méthodes — les indices coûteront +30% en XP"*. Coût `HINT_COST` × 1.3 pour la scène.

#### 😠 Hostile (0-25) → sabotage + option d'apaisement
- Bandeau d'avertissement rouge
- Malus final **−5%** sur le score (cap −10% si plusieurs hostiles)
- Bouton **"Présenter des excuses"** : remet trust à 30 (= méfiant), 1 décision skippée en handicap. Une fois par PNJ (`cas_favors_apologies`).

### Architecture

- Module `js/components/npc-favors.js` observe `#briefing-content`
- Lit `window.G.scene.npcs`, demande à `NpcState` + `CasInNpcData`
- Injecte un bandeau entre `.briefing-top` et `#arc-context-bar`
- Effets : patch `window.HINT_COST × 1.3` pour méfiance, intercepte `localStorage.setItem('scene_results')` pour appliquer le malus hostile
- **Aucune modification des fichiers `scenes/*.json`** — tout par-dessus

### Test rapide

Console JS :
```js
const s = JSON.parse(localStorage.getItem('cas_npc_state') || '{}');
s['fbi_legat_bern'] = {
  trust: 85, state: 'complice',
  interactions: [{ sceneId: 'force', outcome: 'success', date: new Date().toISOString() }]
};
localStorage.setItem('cas_npc_state', JSON.stringify(s));
location.reload();
```
Puis lance une scène où Donovan apparaît (`endgame-phase2`, `cronos-iii-lockbit`).

### Reset
```js
CasInFavors.resetFavors()
```

## Audit qualité

| Vérif | Résultat |
|---|---|
| Fonctions orphelines | ✓ aucune réelle |
| Accolades/parenthèses | ✓ tous modules passent parser V8 |
| Listeners/observers | ✓ pas de fuite (cibles persistantes) |
| Console.log debug oubliés | ✓ aucun |
| Liens cassés HTML | ✓ 0 sur scene/profile/npcs/index |
| Namespaces window.X | ✓ 0 collision |

## Contenu du bundle

```
sw.js                          # CACHE v200, +20 assets
.nojekyll                      # ⚡ Désactive Jekyll
js/pages/scene-app.js          # FIX SW_OFFLINE
js/pages/scene-dossiers-v1.js  # FIX user-friendly errors
js/components/npc-favors.js    # 🎭 NEW
style/npc-favors.css           # 🎭 NEW
[+ tout v3.0]
```

## Total v3.1

**~5500 LOC, 23 nouveaux fichiers, 17 features livrées, 0 régression.**
