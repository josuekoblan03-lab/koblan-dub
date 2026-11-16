/* Koblan Dub : la voix qui change de langue.
   Une seule boucle d'animation (le ticker de GSAP) pilote Lenis, ScrollTrigger et l'onde. */
(function () {
  "use strict";

  var racine = document.documentElement;
  racine.classList.add("js");

  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointeurFin = window.matchMedia("(pointer: fine)").matches;
  var ESPACE = String.fromCharCode(160);
  var GLYPHES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#%&*+=?<>/";

  if (!window.gsap) return; // sans bibliothèque, la page reste lisible en français
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- défilement fluide ---------- */
  var lenis = null;
  if (!reduit && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var cible = document.querySelector(id);
      if (!cible || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(id === "#haut" ? 0 : cible, { offset: id === "#haut" ? 0 : -64 });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- la phrase qui change de langue ---------- */
  // anglais → espagnol → allemand → portugais → français : la voix change de langue à chaque étape
  var LANGUES = ["Voix originale, anglais", "Doublée en espagnol", "Doublée en allemand", "Doublée en portugais", "Doublée en français"];
  var ETAPES = LANGUES.length - 1;
  var lignes = Array.prototype.map.call(document.querySelectorAll(".voix__ligne"), function (el, li) {
    var textes = el.dataset.l.split("|");
    var n = Math.max.apply(null, textes.map(function (t) { return t.length; }));
    el.textContent = "";
    el.setAttribute("aria-hidden", "true");
    var cases = [];
    for (var i = 0; i < n; i++) {
      var s = document.createElement("span");
      s.className = "c";
      el.appendChild(s);
      cases.push(s);
    }
    return { textes: textes, n: n, cases: cases, li: li };
  });

  function lettre(c) { return (c === undefined || c === " ") ? ESPACE : c; }

  // p global (0..1) → étape k (passage de la langue k à k+1) et avancement local q (0..1)
  function decouper(p) {
    var x = Math.min(p, 0.99999) * ETAPES;
    var k = Math.floor(x);
    return { k: k, q: p >= 1 ? 1 : x - k };
  }
  // dans une étape, la tête de lecture traverse la phrase entre DEBUT et DEBUT + COURSE
  var DEBUT = 0.05, COURSE = 0.62, FONDU = 0.2;
  function seuil(L, i) { return DEBUT + ((i + L.li * 1.5) / (L.n + 3)) * COURSE; }
  function etatDe(index) { return index === 0 ? "src" : "cible"; }

  var dernier = -1;
  function rendre(p) {
    if (Math.abs(p - dernier) < 0.0015) return;
    dernier = p;
    var d = decouper(p);
    lignes.forEach(function (L) {
      var avant = L.textes[d.k], apres = L.textes[d.k + 1];
      for (var i = 0; i < L.n; i++) {
        var q = (d.q - seuil(L, i)) / FONDU, etat, c;
        if (q <= 0) { etat = etatDe(d.k); c = avant[i]; }
        else if (q >= 1) { etat = etatDe(d.k + 1); c = apres[i]; }
        else {
          etat = "bruit";
          var cible = apres[i];
          c = (cible === undefined || cible === " ") ? " " : GLYPHES.charAt((Math.random() * GLYPHES.length) | 0);
        }
        var s = L.cases[i], ch = lettre(c);
        if (s.textContent !== ch) s.textContent = ch;
        if (s.dataset.e !== etat) s.dataset.e = etat;
      }
    });
  }

  /* ---------- timecode et langue ---------- */
  var tc = document.querySelector(".piste__tc");
  var langue = document.querySelector(".piste__langue");
  function deuxChiffres(v) { return (v < 10 ? "0" : "") + v; }
  function horodatage(ms) {
    var s = Math.floor(ms / 1000), r = Math.floor(ms % 1000);
    return "00:00:" + deuxChiffres(s) + "," + ("00" + r).slice(-3);
  }
  function majPiste(p) {
    var debut = 1200 + Math.round(p * 5400);
    tc.textContent = horodatage(debut) + " --> " + horodatage(debut + 2600);
    var d = decouper(p);
    var texte = LANGUES[d.q > DEBUT + COURSE / 2 ? d.k + 1 : d.k];
    if (langue.textContent !== texte) langue.textContent = texte;
  }

  /* ---------- l'onde : barres arrondies comme le logo, la barre rouge balaie ---------- */
  var toile = document.querySelector(".onde");
  var ctx = toile.getContext("2d");
  var W = 0, H = 0;
  var etat = { p: 0, intro: reduit ? 1 : 0, visible: true };

  function taille() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = toile.clientWidth; H = toile.clientHeight;
    toile.width = Math.round(W * dpr); toile.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function barre(x, h, l) {
    var y = (H - h) / 2, r = l / 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, l, h, r);
    else ctx.rect(x, y, l, h);
    ctx.fill();
  }

  function dessiner(t) {
    ctx.clearRect(0, 0, W, H);
    var pas = W < 640 ? 7 : 9, l = Math.max(3, Math.round(pas * 0.5));
    var n = Math.floor(W / pas);
    var balayage = Math.min(1, Math.max(0, (decouper(etat.p).q - DEBUT) / (COURSE + FONDU / 2)));
    var xRouge = balayage * (W - l);
    for (var i = 0; i < n; i++) {
      var x = i * pas;
      var env = Math.pow(Math.sin(Math.PI * (i + 0.5) / n), 0.55);
      var fr = x < xRouge;
      var a = fr
        ? 0.3 + 0.7 * Math.abs(Math.sin(i * 0.17 + t * 1.3) * Math.sin(i * 0.031 - t * 0.6))
        : 0.18 + 0.82 * Math.abs(Math.sin(i * 0.43 + t * 2.4) * Math.cos(i * 0.09 + t * 1.1));
      var h = Math.max(l, (H - 4) * env * a * etat.intro);
      ctx.fillStyle = fr ? "#EBD698" : "rgba(156, 138, 85, 0.55)";
      barre(x, h, l);
    }
    ctx.fillStyle = "#B12B28";
    barre(xRouge, (H - 4) * Math.max(0.35, etat.intro), l + 1);
  }

  taille();
  window.addEventListener("resize", function () { taille(); if (reduit) dessiner(0); });

  if (reduit) {
    etat.p = 1;
    rendre(1); majPiste(1); dessiner(0);
  } else {
    rendre(0); majPiste(0);
    new IntersectionObserver(function (e) { etat.visible = e[0].isIntersecting; }).observe(toile);
    gsap.ticker.add(function (temps) { if (etat.visible) dessiner(temps); });

    // entrée orchestrée : une seule séquence au chargement
    var toutes = [];
    lignes.forEach(function (L) { toutes = toutes.concat(L.cases); });
    gsap.from(toutes, { yPercent: 105, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.018, delay: 0.15 });
    gsap.to(etat, { intro: 1, duration: 1.6, ease: "power3.out", delay: 0.35 });
    gsap.from(".piste, .accueil__pied", { opacity: 0, y: 16, duration: 0.9, ease: "power3.out", delay: 0.7, stagger: 0.1 });

    // l'accueil reste épinglé pendant que la voix change de langue
    ScrollTrigger.create({
      trigger: ".accueil",
      start: "top top",
      end: "+=260%",
      pin: ".accueil__scene",
      scrub: true,
      onUpdate: function (self) {
        etat.p = self.progress;
        rendre(self.progress);
        majPiste(self.progress);
      }
    });

    /* ---------- l'atelier s'approche ---------- */
    gsap.fromTo(".atelier__cadre", { scale: 0.9 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: ".atelier__cadre", start: "top 95%", end: "top 35%", scrub: true }
    });

    /* ---------- chaque mode se remplit comme un clip sur la timeline ---------- */
    gsap.utils.toArray(".mode").forEach(function (m) {
      gsap.fromTo(m.querySelector(".clip__remplissage"), { scaleX: 0.04 }, {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: m, start: "top 88%", end: "top 40%", scrub: true }
      });
    });
  }

  /* ---------- démo : notre bouton lance la vidéo, puis les contrôles du lecteur prennent le relais ---------- */
  var cadreDemo = document.querySelector(".demo__cadre");
  if (cadreDemo) {
    var video = cadreDemo.querySelector("video");
    video.controls = false; // sans JavaScript, le lecteur garde ses contrôles
    cadreDemo.querySelector(".demo__lecture").addEventListener("click", function () {
      cadreDemo.classList.add("lancee");
      video.controls = true;
      video.play();
      video.focus();
    });
  }

  /* ---------- « Tout télécharger » : les 4 fichiers, l'un après l'autre ---------- */
  var boutonTout = document.getElementById("tout-telecharger");
  var etatTout = document.getElementById("tout-etat");
  if (boutonTout) {
    boutonTout.addEventListener("click", function () {
      var liens = Array.prototype.map.call(document.querySelectorAll(".fichier"), function (a) { return a.href; });
      boutonTout.disabled = true;
      etatTout.textContent = "Lancement des 4 téléchargements… Si votre navigateur demande d'autoriser plusieurs téléchargements, cliquez sur Autoriser.";
      liens.forEach(function (url, i) {
        setTimeout(function () {
          var a = document.createElement("a");
          a.href = url; a.rel = "noopener"; a.style.display = "none";
          document.body.appendChild(a); a.click(); a.remove();
          if (i === liens.length - 1) {
            etatTout.textContent = "Les 4 téléchargements sont lancés. Quand ils sont tous terminés, ouvrez KoblanDub-Setup.exe depuis votre dossier Téléchargements.";
            boutonTout.disabled = false;
          }
        }, i * 1500);
      });
    });
  }

  /* ---------- les langues s'allument une à une au défilement ---------- */
  if (!reduit) {
    var noms = document.querySelectorAll(".langues__liste li");
    ScrollTrigger.create({
      // tout est allumé dès que la liste entière est à l'écran : un drapeau gris ne doit pas faire croire à une langue absente
      trigger: ".langues__liste", start: "top 92%", end: "bottom 98%", scrub: true,
      onUpdate: function (self) {
        var allumes = Math.round(self.progress * noms.length);
        noms.forEach(function (li, i) { li.classList.toggle("allume", i < allumes); });
      }
    });
  }

  /* ---------- curseur et boutons aimantés (souris uniquement) ---------- */
  if (pointeurFin && !reduit) {
    var curseur = document.querySelector(".curseur");
    racine.classList.add("curseur-actif");
    var xC = gsap.quickTo(curseur, "x", { duration: 0.35, ease: "power3" });
    var yC = gsap.quickTo(curseur, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("pointermove", function (e) {
      if (!racine.classList.contains("curseur-vu")) {
        gsap.set(curseur, { x: e.clientX, y: e.clientY });
        racine.classList.add("curseur-vu");
      }
      xC(e.clientX); yC(e.clientY);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { racine.classList.remove("curseur-vu"); });
    document.querySelectorAll("a, button, summary").forEach(function (el) {
      el.addEventListener("pointerenter", function () { curseur.classList.add("sur-lien"); });
      el.addEventListener("pointerleave", function () { curseur.classList.remove("sur-lien"); });
    });

    document.querySelectorAll(".aimant").forEach(function (b) {
      var xB = gsap.quickTo(b, "x", { duration: 0.4, ease: "power3" });
      var yB = gsap.quickTo(b, "y", { duration: 0.4, ease: "power3" });
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        xB((e.clientX - r.left - r.width / 2) * 0.25);
        yB((e.clientY - r.top - r.height / 2) * 0.35);
      });
      b.addEventListener("pointerleave", function () { xB(0); yB(0); });
    });
  }
})();
