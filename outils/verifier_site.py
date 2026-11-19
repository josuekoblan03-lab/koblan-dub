"""Contrôles du site Koblan Dub avant déploiement.

1. aucune mention du projet d'origine dans les fichiers publiés ;
2. chaque ressource locale référencée par index.html / style.css existe ;
3. chaque lien de téléchargement de la Release répond, et sa taille = fichier local.

Usage : python -I outils/verifier_site.py [--sans-reseau]
"""
import pathlib
import re
import sys
import urllib.request

RACINE = pathlib.Path(__file__).resolve().parent.parent
# fichiers fabriques de la version publiee (v1.1) ; s'ils ont ete supprimes apres publication,
# la taille n'est pas comparee (« non verifiable »), ce n'est pas un echec
LOCAL = pathlib.Path(r"C:\koblan_build\koblan11\installateur\sortie")
INTERDITS = re.compile(r"pyvideotrans|jianchang|videotrans", re.I)
TEXTES = (".html", ".css", ".js", ".md", ".txt", ".svg", ".json")
IGNORES = {"outils", ".git", ".vercel", "node_modules"}

echecs = []

# 1. mentions interdites (les bibliothèques minifiées tierces sont exclues)
for f in RACINE.rglob("*"):
    if not f.is_file() or set(f.relative_to(RACINE).parts) & IGNORES:
        continue
    if f.suffix in TEXTES and "assets\\js" not in str(f):
        if INTERDITS.search(f.read_text(encoding="utf-8", errors="ignore")):
            echecs.append(f"mention interdite dans {f.relative_to(RACINE)}")

# 2. ressources locales
html = (RACINE / "index.html").read_text(encoding="utf-8")
css = (RACINE / "style.css").read_text(encoding="utf-8")
refs = set(re.findall(r'(?:src|href)="((?:assets/|style|main)[^"#]+)', html))
refs |= {r.split(" ")[0] for s in re.findall(r'srcset="([^"]+)"', html) for r in s.split(", ")}
fonts_css = (RACINE / "assets" / "fonts" / "fonts.css").read_text(encoding="utf-8")
refs |= {"assets/fonts/" + u for u in re.findall(r"url\('([^']+)'\)", fonts_css)}
for r in sorted(refs):
    if not (RACINE / r).exists():
        echecs.append(f"ressource absente : {r}")
print(f"{len(refs)} ressources locales vérifiées")

# 3. Release GitHub
if "--sans-reseau" not in sys.argv:
    liens = re.findall(r'href="(https://github\.com/[^"]+/releases/download/[^"]+)"', html)
    for url in liens:
        nom = url.rsplit("/", 1)[1]
        try:
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "verif-site"})
            with urllib.request.urlopen(req, timeout=30) as r:
                taille = int(r.headers.get("Content-Length", -1))
        except Exception as e:  # noqa: BLE001
            echecs.append(f"lien KO {nom} : {e}")
            continue
        attendu = (LOCAL / nom).stat().st_size if (LOCAL / nom).exists() else None
        etat = "OK" if attendu is None or taille == attendu else f"TAILLE {taille} != {attendu}"
        if attendu is None:
            print(f"  {nom} : fichier local absent, taille non verifiable")
        if etat != "OK":
            echecs.append(f"{nom} : {etat}")
        print(f"  {nom}: {taille} octets {etat}")

if echecs:
    print("ECHECS :")
    for e in echecs:
        print("  -", e)
    sys.exit(1)
print("Tout est bon.")
