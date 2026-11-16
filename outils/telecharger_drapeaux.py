"""Télécharge les drapeaux ronds Circle Flags (MIT, HatScripts) dans assets/drapeaux.

Les fichiers flags/language/<code>.svg sont souvent des liens symboliques Git dont le contenu
est juste « ../fr.svg » : on suit le lien vers le vrai drapeau.
Usage : python -I outils/telecharger_drapeaux.py
"""
import pathlib
import urllib.request

VERSION = "2.8.0"
BASE = f"https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@{VERSION}/"
DOSSIER = pathlib.Path(__file__).resolve().parent.parent / "assets" / "drapeaux"

# nom du fichier local -> chemin dans le dépôt
DRAPEAUX = {code: f"flags/language/{code}.svg" for code in (
    "fr en es pt de it nl ar zh ja ko hi bn ur fa tr ru uk pl cs hu el sv he th vi id ms fil kk").split()}
DRAPEAUX["zh-tw"] = "flags/tw.svg"   # chinois traditionnel (code de l'app : zh-tw)
DRAPEAUX["yue"] = "flags/hk.svg"     # cantonais


def lire(chemin):
    with urllib.request.urlopen(urllib.request.Request(BASE + chemin, headers={"User-Agent": "koblan-dub-site"}), timeout=60) as r:
        return r.read().decode("utf-8")


DOSSIER.mkdir(parents=True, exist_ok=True)
for ancien in DOSSIER.glob("*.svg"):
    ancien.unlink()
for nom, chemin in DRAPEAUX.items():
    texte = lire(chemin)
    sauts = 0
    while not texte.lstrip().startswith("<") and sauts < 3:   # lien symbolique : suivre
        cible = (pathlib.PurePosixPath(chemin).parent / texte.strip()).as_posix()
        parties = []
        for p in cible.split("/"):
            if p == "..":
                parties.pop()
            elif p != ".":
                parties.append(p)
        chemin = "/".join(parties)
        texte = lire(chemin)
        sauts += 1
    assert texte.lstrip().startswith("<svg"), f"{nom} : pas un SVG ({chemin})"
    (DOSSIER / f"{nom}.svg").write_text(texte, encoding="utf-8")
    print(f"{nom:6} <- {chemin} ({len(texte)} octets)")
(DOSSIER / "LICENCE-circle-flags.txt").write_text(
    "Drapeaux : Circle Flags par HatScripts, https://github.com/HatScripts/circle-flags\n"
    f"Version {VERSION}, licence MIT.\n\n" + lire("LICENSE.md"), encoding="utf-8")
