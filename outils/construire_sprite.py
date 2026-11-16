"""Assemble les icônes Phosphor duotone (assets/icons/*.svg) en un seul sprite assets/icones.svg.

La couche secondaire (opacity 0.2) prend la couleur --ico-2 et l'opacité --ico-o,
réglables depuis le CSS (les variables traversent l'ombre de <use>).
"""
import pathlib
import re

RACINE = pathlib.Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "assets" / "icons"

symboles = []
for svg in sorted(DOSSIER.glob("*.svg")):
    texte = svg.read_text(encoding="utf-8")
    vue = re.search(r'viewBox="([^"]+)"', texte).group(1)
    corps = re.search(r"<svg[^>]*>(.*)</svg>", texte, re.S).group(1)
    corps = corps.replace('opacity="0.2"', 'style="fill:var(--ico-2,currentColor);opacity:var(--ico-o,.2)"')
    symboles.append(f'<symbol id="i-{svg.stem}" viewBox="{vue}">{corps}</symbol>')

sprite = '<svg xmlns="http://www.w3.org/2000/svg">' + "".join(symboles) + "</svg>\n"
(RACINE / "assets" / "icones.svg").write_text(sprite, encoding="utf-8")
print(len(symboles), "icônes ->", RACINE / "assets" / "icones.svg")
