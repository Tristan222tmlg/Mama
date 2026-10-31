#!/usr/bin/env python3
"""Packt die gebaute Vorschau (site/_site, VORSCHAU=1) in eine einzige HTML-Datei.

Aufruf aus site/: rm -rf _site && VORSCHAU=1 npx @11ty/eleventy
                 python3 tools/vorschau/einzeldatei.py ziel.html

Alle Seiten stehen als Abschnitte in einem Dokument, Bilder und Schriften sind
eingebettet. Mit JavaScript zeigt die Datei immer nur eine Seite (Navigation
über #anker), ohne JavaScript stehen alle Seiten untereinander.
"""

import base64
import html
import pathlib
import re
import sys

SITE = pathlib.Path(__file__).resolve().parents[2] / "_site"
ZIEL = pathlib.Path(sys.argv[1])

SEITEN = [
    ("index.html", "start"), ("online-programm.html", "online-programm"), ("online-abend.html", "online-abend"),
    ("ueber-mich.html", "ueber-mich"), ("pflanzen-und-tiere.html", "pflanzen-und-tiere"), ("fragen.html", "fragen"),
    ("kontakt.html", "kontakt"), ("impressum.html", "impressum"), ("datenschutz.html", "datenschutz"),
]
SCHLUESSEL = {datei: k for datei, k in SEITEN}
MIME = {".webp": "image/webp", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2"}


def data_uri(pfad):
    pfad = SITE / pfad
    return "data:%s;base64,%s" % (MIME[pfad.suffix], base64.b64encode(pfad.read_bytes()).decode("ascii"))


def ziel(href, k):
    """Link der Website -> Anker in der Einzeldatei."""
    if href.startswith("#i-"):
        return href
    if href.startswith("#"):
        return "#%s-%s" % (k, href[1:]) if k else href
    m = re.match(r"^(index\.html|\./|[a-z0-9-]+\.html)(?:#(.*))?$", href)
    if not m:
        return href
    datei = "index.html" if m.group(1) == "./" else m.group(1)
    if datei not in SCHLUESSEL:
        return href
    s = SCHLUESSEL[datei]
    return "#%s-%s" % (s, m.group(2)) if m.group(2) else "#seite-" + s


def links(teil, k):
    teil = re.sub(r'href="([^"]*)"', lambda m: 'href="%s"' % ziel(m.group(1), k), teil)
    # Ziele, die grafik.js erst beim Klick einsetzt (Trabanten auf der Startseite)
    return re.sub(r'data-ziel="([^"]*)"', lambda m: 'data-ziel="%s"' % ziel(m.group(1), k), teil)


def ids(teil, k):
    teil = re.sub(r'\sid="([^"]+)"', lambda m: ' id="%s-%s"' % (k, m.group(1)), teil)
    teil = re.sub(r'\sfor="([^"]+)"', lambda m: ' for="%s-%s"' % (k, m.group(1)), teil)
    teil = re.sub(r'\saria-labelledby="([^"]+)"', lambda m: ' aria-labelledby="%s"' % " ".join("%s-%s" % (k, t) for t in m.group(1).split()), teil)
    teil = re.sub(r'\saria-describedby="([^"]+)"', lambda m: ' aria-describedby="%s"' % " ".join("%s-%s" % (k, t) for t in m.group(1).split()), teil)
    teil = re.sub(r'\sdata-eintrag="([^"]+)"', lambda m: ' data-eintrag="pflanzen-und-tiere-%s"' % m.group(1), teil)
    return teil


def bild(m):
    """<picture> -> ein <img> mit eingebettetem WebP."""
    p = m.group(0)
    quelle = re.search(r'<source type="image/webp" srcset="([^"]+)"(?: sizes="([^"]+)")?', p)
    img = re.search(r"<img ([^>]*)>", p).group(1)
    alt = re.search(r'alt="([^"]*)"', img).group(1)
    breite = int(re.search(r'width="(\d+)"', img).group(1))
    hoehe = int(re.search(r'height="(\d+)"', img).group(1))
    kandidaten = []
    for teil in quelle.group(1).split(","):
        bits = teil.strip().split()
        kandidaten.append((int(bits[1][:-1]) if len(bits) > 1 else breite, bits[0]))
    wunsch = 400 if quelle.group(2) == "8rem" else 800
    passend = [c for c in kandidaten if c[0] <= wunsch] or kandidaten[:1]
    w, datei = max(passend)
    return '<img src="%s" alt="%s" width="%d" height="%d" decoding="async">' % (data_uri(datei), alt, w, round(w * hoehe / breite))


def inhalt(datei, k):
    text = (SITE / datei).read_text(encoding="utf-8")
    main = re.search(r'<main id="inhalt" tabindex="-1">(.*?)</main>', text, re.S).group(1)
    titel = html.unescape(re.search(r"<title>(.*?)</title>", text).group(1))
    main = re.sub(r"<picture>.*?</picture>", bild, main, flags=re.S)
    main = re.sub(r'<img src="(assets/logo/[^"]+)"', lambda m: '<img src="%s"' % data_uri(m.group(1)), main)
    # Steckbrief: kein Link auf eine Bilddatei, das Bild steht groß da
    main = re.sub(r'<a href="bilder/[^"]+-1200\.jpeg">(<img [^>]+>)</a>', r"\1", main)
    main = main.replace(" Antippen zum Vergrößern.", "")
    # Formulare: nichts abschicken
    main = re.sub(r'<form class="formular" action="[^"]*" method="post">', '<form class="formular">', main)
    main = main.replace('<button type="submit">', '<button type="button" class="vorschau-knopf">')
    main = links(ids(main, k), k)
    return '<div class="seite" id="seite-%s" data-titel="%s">%s</div>' % (k, html.escape(titel, quote=True), main)


def css():
    text = (SITE / "assets/css/style.css").read_text(encoding="utf-8")
    text = re.sub(r'url\("\.\./fonts/([^"]+)"\)', lambda m: 'url("%s")' % data_uri("assets/fonts/" + m.group(1)), text)
    return text + """
/* Einzeldatei */
.seite + .seite { border-top: 0.5rem solid var(--moos); }
.js-einzeln .seite { display: none; border-top: 0; }
.js-einzeln .seite.aktiv { display: block; }
.steckbrief { display: block; }
.steckbrief img { width: 100%; max-width: 24rem; }
.steckbrief figcaption { margin-top: 0.6rem; }
"""


SKRIPT = """
(function () {
  var wurzel = document.documentElement;
  wurzel.classList.add("js-einzeln");
  var seiten = [].slice.call(document.querySelectorAll(".seite"));
  var aktuell = null;
  function zeigen() {
    var id = decodeURIComponent(location.hash.slice(1));
    var ziel = id ? document.getElementById(id) : null;
    var seite = ziel && ziel.closest ? ziel.closest(".seite") : null;
    if (ziel && !seite && aktuell) { ziel.focus(); return; }
    seite = seite || document.getElementById("seite-start");
    aktuell = seite;
    seiten.forEach(function (s) { s.classList.toggle("aktiv", s === seite); });
    document.querySelector(".kopf").classList.toggle("dunkel-kopf", seite.id === "seite-start");
    var menue = document.getElementById("menue");
    if (menue && menue.matches && menue.matches(":popover-open")) menue.hidePopover();
    [].forEach.call(document.querySelectorAll(".kopf a"), function (a) {
      if (a.getAttribute("href") === "#" + seite.id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = seite.getAttribute("data-titel");
    if (ziel && ziel !== seite) ziel.scrollIntoView(); else window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", zeigen);
  zeigen();
  document.addEventListener("click", function (e) {
    var knopf = e.target.closest ? e.target.closest(".vorschau-knopf") : null;
    if (!knopf) return;
    var form = knopf.form;
    if (form.querySelector(".vorschau-hinweis")) return;
    var p = document.createElement("p");
    p.className = "vorschau-hinweis";
    p.setAttribute("role", "status");
    p.textContent = "In dieser Vorschau wird nichts verschickt. Auf der fertigen Website kommt die Nachricht per E-Mail bei Sabine an.";
    form.appendChild(p);
  });
})();
"""


def main():
    start = (SITE / "index.html").read_text(encoding="utf-8")
    unterseite = (SITE / "fragen.html").read_text(encoding="utf-8")
    kopf = re.search(r'<header class="kopf">.*?</header>', unterseite, re.S).group(0)
    symbole = re.search(r'<svg class="symbole".*?</svg>', start, re.S).group(0)
    grafik = (SITE / "assets/js/grafik.js").read_text(encoding="utf-8")
    kopf = re.sub(r'\saria-current="page"', "", kopf)
    kopf = re.sub(r'<img src="(assets/logo/[^"]+)"', lambda m: '<img src="%s"' % data_uri(m.group(1)), links(kopf, None))
    fuss = re.search(r'<footer class="fuss">.*?</footer>', start, re.S).group(0)
    fuss = fuss.replace(' loading="lazy"', "")
    fuss = re.sub(r'<img src="(assets/logo/[^"]+)"', lambda m: '<img src="%s"' % data_uri(m.group(1)), links(fuss, None))
    teile = "\n".join(inhalt(d, k) for d, k in SEITEN)
    dokument = (
        '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>Bessere Welt ergärtnern – Vorschau</title>\n"
        '<link rel="icon" href="%s">\n<style>\n%s\n</style>\n</head>\n<body>\n'
        '%s\n<a class="sprung" href="#inhalt">Zum Inhalt</a>\n'
        '<p class="vorschau-band">Vorschau: Die Formulare schicken hier nichts ab. Gelb markiert ist, was noch fehlt.</p>\n'
        '%s\n<main id="inhalt" tabindex="-1">\n%s\n</main>\n%s\n<script>%s\n%s</script>\n</body>\n</html>\n'
        % (data_uri("favicon.svg"), css(), symbole, kopf, teile, fuss, SKRIPT, grafik)
    )
    ZIEL.write_text(dokument, encoding="utf-8")
    print("%s  %.2f MB" % (ZIEL, ZIEL.stat().st_size / 1e6))


if __name__ == "__main__":
    main()
