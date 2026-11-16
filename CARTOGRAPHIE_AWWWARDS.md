# Cartographie : ce qui fait gagner un site sur Awwwards

Étude menée le 2026-11-16 pour le site de Koblan Dub. Sources en bas de page.

## 1. Comment le jury note

| Critère | Poids | Ce que ça veut dire concrètement |
|---|---|---|
| Design | 40 % | typographie, mise en page, couleur, direction artistique |
| Usabilité | 30 % | chargement rapide, navigation claire, **mobile irréprochable** |
| Créativité | 20 % | un concept **original**, pas une tendance recopiée |
| Contenu | 10 % | un texte réel et utile, pas du remplissage |

- Au moins 18 jurés ; les 3 notes les plus éloignées de la moyenne sont retirées.
- Mention honorable à partir de 6,5/10 ; le meilleur score du jour = Site of the Day (SOTD).
- Le **Developer Award** (au-dessus de 7) note : animations/transitions, performance (WPO), responsive, accessibilité, SEO/sémantique, balisage.
- Design + usabilité = 70 % : **un site beau mais lent ou cassé sur téléphone plafonne à la mention.**

## 2. Lauréats récents étudiés

| Site | Prix | Ce qui le distingue | Technos |
|---|---|---|---|
| **Oryzo AI** (Lusion), avril 2026 | SOTD + SOTM | « récit produit cinématographique » : un objet banal (un dessous-de-verre) traité comme un film ; transitions 3D → 2D → 3D, pied de page en particules interactives ; **2 couleurs** (#100904 / #FF8539) | WebGL, Three.js, GSAP |
| **Lando Norris** (OFF+BRAND), nov. 2025 | SOTD, SOTY 2025 | interactions par gestes, visuels audacieux ; **2 couleurs** (#D2FF00 / #111112) ; 8,60 en animations | WebGL, GSAP, Webflow |
| **Igloo Inc** (abeto), 2024 | SOTY 2024 | défilement infini, transitions ; 9,60 en animations mais 6,60 en accessibilité | 3D, animation |
| **Cleo AI** (OddCommon), mai 2026 | SOTD | appli d'IA financière « ultra-moderne, très peu bancaire » ; storytelling + visualisation de données, **sans 3D lourde** | React, Next.js, Framer |
| **iyO** (étude de cas Awwwards) | — | appareil audio : **le son est rendu visible** (figures de Chladni en particules, des mots se forment puis se dissolvent) ; nombre de particules **réduit selon l'appareil** pour tenir 60 i/s | WebGL |

Constats communs : **une palette de 2 couleurs** (3 au plus), **un seul concept** porté jusqu'au bout, des animations de très haut niveau, et l'accessibilité reste le point faible de presque tous (c'est là qu'on peut faire mieux qu'eux).

## 3. Les ressorts, un par un

1. **Concept en une phrase.** Si l'idée ne tient pas en une phrase, le jury ne la ressent pas. Un seul « moment signature » autour duquel tout le site est construit ; on coupe les idées concurrentes (la retenue fait sérieux).
2. **Le défilement raconte.** Sections épinglées (`pin`) et animations liées au défilement (`scrub`) : c'est le visiteur qui règle le rythme. Réglages courants : Lenis `duration: 1.1`, ScrollTrigger `scrub: 1`, `ease: "none"` pour ce qui suit le défilement.
3. **Typographie géante et cinétique.** Titres découpés en lettres ou en mots (SplitText) qui se révèlent en cascade ; le texte devient l'image principale.
4. **Une boucle d'animation unique.** Lenis piloté par le ticker de GSAP ; ScrollTrigger mis à jour à chaque défilement ; le canvas éventuel tourne dans la même boucle.
5. **Micro-interactions.** Curseur personnalisé, boutons « magnétiques », états au survol et au focus : peu coûteux, très payants sur la finition perçue.
6. **Transitions de matière.** Déformations, masques (`clip-path`), passages 3D↔2D, **seulement quand ils servent le concept** (sinon c'est du bruit).
7. **Préchargement court.** Une intro de plusieurs secondes est une pénalité d'usabilité, pas de la direction artistique.
8. **Performance.** N'animer que `transform` et `opacity` ; monter le canvas/WebGL uniquement quand il est visible et le mettre en pause hors écran ; plafonner la densité de pixels à 2 ; LCP < 2,5 s ; 60 i/s sur un appareil moyen ; **adapter la charge à l'appareil** (iyO).
9. **Accessibilité.** Toute animation décorative est désactivée sous `prefers-reduced-motion` ; focus visibles ; contrastes suffisants.
10. **Mobile.** Un site cassé sur téléphone ne dépasse pas la mention honorable.
11. **Boîte à outils.** GSAP (ScrollTrigger, SplitText, ScrambleText…) est **entièrement gratuit**, plugins compris, depuis son rachat par Webflow ; Lenis pour le défilement fluide ; Three.js uniquement si le concept l'exige.

## 4. Ce qu'on en tire pour Koblan Dub

- **Phrase-concept :** « Une voix qui change de langue sous vos yeux. »
- **Moment signature :** une phrase anglaise géante qui, au défilement, se brouille lettre par lettre et se recompose en français, pendant que l'onde dorée du logo « parle ».
- **Palette stricte :** noir `#000000` + or `#EBD698`, rouge `#B12B28` réservé aux actions (Télécharger) et au signal « REC ».
- **Pas de WebGL lourd :** le PC de Christ n'a pas de carte graphique (WebGL rendu par le processeur, trompeur). L'onde est dessinée en **Canvas 2D** (léger, fluide partout), le reste en CSS/GSAP. Charge adaptée à l'appareil, pause hors écran.
- **Usabilité d'abord (70 % de la note) :** bouton Télécharger toujours visible, contenu lisible sans animation, version calme sous `reduced-motion`, téléphone testé à 390 px.
- **Notre avantage :** l'accessibilité, point faible des lauréats ; on la soigne (navigation clavier, focus, contrastes, sous-titres de la démo).

## Sources

- [Awwwards : méthode d'évaluation](https://www.awwwards.com/about-evaluation/)
- [Awwwards : Sites of the Month](https://www.awwwards.com/websites/sites_of_the_month/)
- [Oryzo AI (Lusion)](https://www.awwwards.com/sites/oryzo-ai), [Lando Norris (OFF+BRAND)](https://www.awwwards.com/sites/lando-norris), [Igloo Inc (abeto)](https://www.awwwards.com/sites/igloo-inc), [Cleo AI (OddCommon)](https://www.awwwards.com/sites/cleo-ai)
- [Étude de cas iyO, l'ordinateur audio](https://www.awwwards.com/iyo-case-study-selling-the-worlds-first-audio-computer.html)
- [Hon Tran : construire un site primé](https://www.hontran.dev/blog/how-to-build-an-award-winning-portfolio-site)
- [Webflow : GSAP devient 100 % gratuit](https://webflow.com/blog/gsap-becomes-free)
- [Codrops : architecture de Trionn (GSAP, Three.js, Lenis, Web Audio)](https://tympanus.net/codrops/?p=117096)
