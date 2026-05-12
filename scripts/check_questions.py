#!/usr/bin/env python3
"""
check_questions.py — Qualité du fichier data/questions.json du quiz CAS-IN.

Usage :
    python3 check_questions.py data/questions.json                 # rapport seul
    python3 check_questions.py data/questions.json --fix           # écrit questions.cleaned.json
    python3 check_questions.py data/questions.json --fix --out foo.json

Détecte :
  - champs requis manquants ou vides
  - opts trop courts, vides, ou dupliqués à l'intérieur d'une question
  - answers hors bornes, vide, ou incohérent avec type (single/multi)
  - questions exactement dupliquées (même q + mêmes opts)
  - questions quasi-dupliquées (similarité texte > 90%)
  - HTML mal formé dans expl_ok / expl_ko
  - thèmes ou chapitres avec variantes de casse/accents suggérant une typo
  - stats par thème / difficulté / type / chapitre

Avec --fix, génère un fichier nettoyé :
  - doublons exacts supprimés
  - whitespace normalisé
  - type ajusté si une question 'single' a plusieurs answers (passée en 'multi')
"""
import sys, json, re, argparse, hashlib, unicodedata
from collections import Counter, defaultdict
from difflib import SequenceMatcher

REQ = ["theme", "diff", "q", "opts", "answers", "type"]
DIFFS = {"easy", "medium", "hard"}
TYPES = {"single", "multi"}


# ────────────────────────────────────────────────────────────────
# Utilities
# ────────────────────────────────────────────────────────────────
def norm(s: str) -> str:
    """Lowercase, strip accents, collapse whitespace — for fuzzy comparison."""
    if not isinstance(s, str):
        return ""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def qhash(q: dict) -> str:
    """Exact-duplicate key : question text + sorted opts."""
    base = norm(q.get("q", "")) + "||" + "|".join(sorted(norm(o) for o in q.get("opts", [])))
    return hashlib.md5(base.encode()).hexdigest()


def check_html(s: str) -> list[str]:
    """Simple unclosed-tag check for <strong>, <em>, <code>."""
    if not isinstance(s, str):
        return []
    issues = []
    for tag in ("strong", "em", "code", "br"):
        if tag == "br":
            continue  # self-closing OK
        opens = len(re.findall(rf"<{tag}\b[^>]*>", s, re.I))
        closes = len(re.findall(rf"</{tag}\s*>", s, re.I))
        if opens != closes:
            issues.append(f"<{tag}>: {opens} ouv. / {closes} ferm.")
    return issues


# ────────────────────────────────────────────────────────────────
# Validation per-question
# ────────────────────────────────────────────────────────────────
def validate(q: dict, idx: int) -> list[str]:
    errors = []

    # Required fields
    for k in REQ:
        if k not in q:
            errors.append(f"champ manquant : {k}")
        elif isinstance(q[k], str) and not q[k].strip():
            errors.append(f"champ vide : {k}")
        elif isinstance(q[k], list) and not q[k]:
            errors.append(f"liste vide : {k}")
    if errors:
        return errors

    # Types & enums
    if q["diff"] not in DIFFS:
        errors.append(f"diff invalide : {q['diff']!r} (attendu {DIFFS})")
    if q["type"] not in TYPES:
        errors.append(f"type invalide : {q['type']!r} (attendu {TYPES})")

    # Opts
    opts = q["opts"]
    if not isinstance(opts, list):
        errors.append("opts doit être une liste")
    else:
        if len(opts) < 2:
            errors.append(f"opts trop courts : {len(opts)} option(s), minimum 2")
        # v2.85 — UI étendue à 7 options max (était 5). Le rendu utilise
        # String.fromCharCode(65+i) ⇒ A..G. Au-delà : warning.
        if len(opts) > 7:
            errors.append(f"opts trop longs : {len(opts)} options, UI prévue pour max 7")
        # Empty option
        for i, o in enumerate(opts):
            if not isinstance(o, str) or not o.strip():
                errors.append(f"option #{i} vide ou non-string")
        # Duplicate options inside same question
        # v2.85 — Comparaison case-sensitive (était case-insensitive). Évite
        # les faux positifs sur des questions où la casse fait sens
        # (ex: 'ABC' vs 'abc' pour un test ASCII).
        seen = {}
        for i, o in enumerate(opts):
            n = (o or "").strip()
            if n in seen:
                errors.append(f"option #{i} dupliquée avec #{seen[n]}")
            else:
                seen[n] = i

    # Answers
    ans = q["answers"]
    if not isinstance(ans, list):
        errors.append("answers doit être une liste")
    elif not ans:
        errors.append("answers vide (au moins 1 bonne réponse requise)")
    else:
        for a in ans:
            if not isinstance(a, int) or a < 0 or a >= len(opts):
                errors.append(f"answers contient un index hors bornes : {a} (opts de taille {len(opts)})")
        if len(set(ans)) != len(ans):
            errors.append("answers contient des doublons")
        # Consistency with type
        if q["type"] == "single" and len(ans) > 1:
            errors.append(f"type='single' mais {len(ans)} bonnes réponses (devrait être 'multi')")
        if q["type"] == "multi" and len(ans) == 1:
            errors.append("type='multi' mais une seule bonne réponse (souvent une erreur — passer en 'single' ?)")

    # Explanations
    has_ok = bool((q.get("expl_ok") or "").strip())
    has_ko = bool((q.get("expl_ko") or "").strip())
    has_legacy = bool((q.get("expl") or "").strip())
    if not (has_ok or has_ko or has_legacy):
        errors.append("aucune explication (expl_ok / expl_ko / expl)")

    for field in ("expl_ok", "expl_ko", "expl"):
        if field in q:
            html_issues = check_html(q[field])
            for h in html_issues:
                errors.append(f"HTML mal formé dans {field} : {h}")

    return errors


# ────────────────────────────────────────────────────────────────
# Global checks across the dataset
# ────────────────────────────────────────────────────────────────
def find_exact_duplicates(questions):
    """Returns list of (indices_list) for each duplicate group."""
    groups = defaultdict(list)
    for i, q in enumerate(questions):
        groups[qhash(q)].append(i)
    return [v for v in groups.values() if len(v) > 1]


def find_near_duplicates(questions, threshold=0.90):
    """Pairs of questions with very similar question text (not already exact dups)."""
    # Only compare within the same theme for O(n²) on smaller partitions
    by_theme = defaultdict(list)
    for i, q in enumerate(questions):
        by_theme[q.get("theme", "")].append(i)

    pairs = []
    exact_keys = {qhash(q) for q in questions}
    # We want near but not exact — re-hash
    for theme, indices in by_theme.items():
        texts = [norm(questions[i].get("q", "")) for i in indices]
        for a in range(len(indices)):
            for b in range(a + 1, len(indices)):
                ia, ib = indices[a], indices[b]
                if qhash(questions[ia]) == qhash(questions[ib]):
                    continue  # handled by exact duplicates
                ratio = SequenceMatcher(None, texts[a], texts[b]).ratio()
                if ratio >= threshold:
                    pairs.append((ia, ib, ratio))
    return pairs


def detect_theme_typos(questions):
    """Groups theme variants by normalized form to catch 'OSINT' vs 'Osint' etc."""
    groups = defaultdict(set)
    for q in questions:
        t = q.get("theme", "")
        groups[norm(t)].add(t)
    return {k: sorted(v) for k, v in groups.items() if len(v) > 1}


def detect_chapter_typos(questions):
    groups = defaultdict(set)
    for q in questions:
        c = q.get("chapter", "")
        if c:
            groups[norm(c)].add(c)
    return {k: sorted(v) for k, v in groups.items() if len(v) > 1}


# ────────────────────────────────────────────────────────────────
# Reporting
# ────────────────────────────────────────────────────────────────
def stats(questions):
    by_theme = Counter(q.get("theme", "?") for q in questions)
    by_diff = Counter(q.get("diff", "?") for q in questions)
    by_type = Counter(q.get("type", "?") for q in questions)
    by_chapter = Counter(q.get("chapter", "?") for q in questions)
    return by_theme, by_diff, by_type, by_chapter


def main():
    parser = argparse.ArgumentParser(description="Contrôle qualité du JSON des questions CAS-IN")
    parser.add_argument("input", help="chemin du fichier JSON")
    parser.add_argument("--fix", action="store_true", help="écrit un fichier nettoyé")
    parser.add_argument("--out", help="chemin de sortie si --fix (défaut : questions.cleaned.json)")
    parser.add_argument("--threshold", type=float, default=0.90,
                        help="seuil de similarité pour détection de quasi-doublons (défaut 0.90)")
    args = parser.parse_args()

    try:
        with open(args.input, encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Fichier introuvable : {args.input}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ JSON invalide : {e}")
        sys.exit(1)

    if not isinstance(data, list):
        print("❌ Le JSON de plus haut niveau doit être un tableau de questions.")
        sys.exit(1)

    total = len(data)
    print(f"═══ Rapport sur {args.input}")
    print(f"    {total} questions")
    print()

    # Per-question validation
    all_errors = []
    for i, q in enumerate(data):
        errs = validate(q, i)
        if errs:
            all_errors.append((i, q, errs))

    if all_errors:
        print(f"⚠️  {len(all_errors)} question(s) avec anomalies :")
        for i, q, errs in all_errors[:30]:
            qpreview = (q.get("q", "") or "")[:80].replace("\n", " ")
            print(f"  [#{i}] {qpreview!r}")
            for e in errs:
                print(f"      → {e}")
        if len(all_errors) > 30:
            print(f"  … ({len(all_errors) - 30} autre(s) non affichées)")
    else:
        print("✅ Toutes les questions ont une structure valide.")
    print()

    # Exact duplicates
    dup_groups = find_exact_duplicates(data)
    if dup_groups:
        print(f"⚠️  {len(dup_groups)} groupe(s) de doublons exacts :")
        for g in dup_groups[:15]:
            print(f"  indices {g} → {data[g[0]].get('q', '')[:80]!r}")
        if len(dup_groups) > 15:
            print(f"  … ({len(dup_groups) - 15} autre(s))")
    else:
        print("✅ Aucun doublon exact.")
    print()

    # Near duplicates
    near = find_near_duplicates(data, args.threshold)
    if near:
        print(f"⚠️  {len(near)} paire(s) de quasi-doublons (similarité ≥ {args.threshold}) :")
        for ia, ib, r in near[:15]:
            print(f"  #{ia} ↔ #{ib}  ({r:.0%})")
            print(f"    A: {data[ia].get('q', '')[:90]!r}")
            print(f"    B: {data[ib].get('q', '')[:90]!r}")
        if len(near) > 15:
            print(f"  … ({len(near) - 15} autre(s))")
    else:
        print(f"✅ Aucun quasi-doublon détecté (seuil {args.threshold}).")
    print()

    # Theme typos
    theme_typos = detect_theme_typos(data)
    if theme_typos:
        print(f"⚠️  Variantes de casse/accents dans les thèmes :")
        for k, variants in theme_typos.items():
            print(f"  → {variants}")
    else:
        print("✅ Thèmes : pas de variantes suspectes.")
    print()

    # Chapter typos
    ch_typos = detect_chapter_typos(data)
    if ch_typos:
        print(f"⚠️  Variantes dans les chapitres :")
        for k, variants in list(ch_typos.items())[:10]:
            print(f"  → {variants}")
        if len(ch_typos) > 10:
            print(f"  … ({len(ch_typos) - 10} autre(s))")
    else:
        print("✅ Chapitres : pas de variantes suspectes.")
    print()

    # Stats
    by_theme, by_diff, by_type, by_chapter = stats(data)
    print("═══ Statistiques")
    print(f"  Difficulté : {dict(by_diff)}")
    print(f"  Type       : {dict(by_type)}")
    print(f"  Thèmes ({len(by_theme)}) :")
    for t, n in by_theme.most_common():
        print(f"    {n:>4}  {t}")
    print(f"  Chapitres distincts : {len(by_chapter)}")

    # ──────────────────────────────────────────
    # Cleaning pass
    # ──────────────────────────────────────────
    if args.fix:
        out_path = args.out or "questions.cleaned.json"
        print()
        print(f"═══ Nettoyage → {out_path}")

        seen_hashes = set()
        cleaned = []
        removed_dups = 0
        fixed_types = 0
        fixed_strip = 0

        for q in data:
            # strip trailing/leading whitespace on strings
            for key in ("q", "theme", "chapter", "expl", "expl_ok", "expl_ko"):
                if key in q and isinstance(q[key], str):
                    new = q[key].strip()
                    if new != q[key]:
                        q[key] = new
                        fixed_strip += 1
            if "opts" in q and isinstance(q["opts"], list):
                new_opts = []
                for o in q["opts"]:
                    new_opts.append(o.strip() if isinstance(o, str) else o)
                q["opts"] = new_opts

            # normalize type vs answers
            if q.get("type") == "single" and isinstance(q.get("answers"), list) and len(q["answers"]) > 1:
                q["type"] = "multi"
                fixed_types += 1

            # drop exact duplicates
            h = qhash(q)
            if h in seen_hashes:
                removed_dups += 1
                continue
            seen_hashes.add(h)
            cleaned.append(q)

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(cleaned, f, ensure_ascii=False, indent=2)

        print(f"  {removed_dups} doublon(s) exact(s) retiré(s)")
        print(f"  {fixed_types} type 'single'→'multi' corrigé(s)")
        print(f"  {fixed_strip} champ(s) whitespace-trimmé(s)")
        print(f"  {len(cleaned)} questions écrites ({(1 - len(cleaned)/total)*100:.1f}% de réduction)")

    print()
    status = "⚠️  Anomalies détectées" if (all_errors or dup_groups) else "✅ Tout est propre"
    print(status)


if __name__ == "__main__":
    main()
