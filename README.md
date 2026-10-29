# Bessere Welt ergärtnern — Website

Statische Website (reines HTML/CSS/JS, kein Build-Schritt nötig) für
Sabine Schröder-Gravendycks Biodiversitätsberatung.

> **Version 2** (mit Logo, Pflanzen-Finder, Blühkalender und Journal) liegt in
> [`v2/`](v2/README.md). Dieser Hauptordner enthält Version 1.

## Lokal ansehen

Einfach `index.html` im Browser öffnen, oder z. B.:

```
python3 -m http.server 8000
```

und dann `http://localhost:8000` aufrufen.

## Struktur

- `index.html` — Startseite
- `ueber-mich.html` — Über mich / Werdegang
- `angebot.html` — Leistungen
- `pflanzenwelt.html` — Pflanzenporträts (bisher: Moschusmalve als Beispiel)
- `kontakt.html` — Kontakt
- `impressum.html`, `datenschutz.html` — rechtliche Pflichtseiten (Platzhalter)
- `assets/css/style.css` — gesamtes Design (Farbpalette: Grüntöne + Blau + Weiß, nach Sabines eigener Beschreibung)
- `assets/js/main.js` — Menü, Header-Verhalten, sanfte Einblend-Animationen
- `assets/img/` — Bildmaterial
- `assets/fonts/` — selbst gehostete Schriften (Fraunces + Inter, Latin-Subset).
  Werden **lokal** ausgeliefert, keine Verbindung zu Google Fonts — DSGVO-freundlich.

## Design

Editorial-Look: großformatige Fotos, Serifen-Display-Schrift (Fraunces) mit
klarer Grotesk (Inter), eigene Linien-Icons (SVG, keine Emojis), Farbwelt aus
mehreren Grüntönen plus warmem Papierton, Blau und Weiß. Reines HTML/CSS/JS.

## Offene Punkte, bevor die Seite live gehen kann

1. **Weitere Porträtfotos von Sabine wären gut.** Ein rundes Profilbild ist
   auf `ueber-mich.html` bereits eingebunden (`assets/img/sabine-portrait.jpg`),
   aber nur 200×200px — zu klein für die beiden großen Rechteck-Plätze
   ("Foto: Sabine im Garten / bei der Arbeit") auf derselben Seite. Für die
   braucht es noch höher aufgelöste Fotos von ihr. Alle anderen bisher
   erhaltenen Naturfotos (Akelei, Kuckuckslichtnelke, Große Sternmiere,
   Hauhechel-Bläuling, Rotschopfige Sandbiene, Grashüpfer, Kirschen sowie
   das Moschusmalve-Pflanzenporträt) sind bereits eingebunden — verteilt auf
   Startseite, Angebot und die Foto-Galerie auf `pflanzenwelt.html`.
2. **Kontaktdaten.** E-Mail-Adresse, Telefonnummer und Einzugsgebiet in
   `kontakt.html` sind Platzhalter.
3. **Impressum/Datenschutz.** Rechtlich in Deutschland Pflicht — beide
   Seiten sind bewusst als Platzhalter markiert und müssen mit echten
   Angaben (Anschrift, ggf. USt-IdNr., Hosting-Anbieter) gefüllt werden.
4. **Kontaktformular.** Sendet aktuell noch keine Mails. Braucht entweder
   einen Formular-Dienst (z. B. Formspree, Netlify Forms) oder ein kleines
   Backend. Der „Jetzt schreiben“-Button daneben funktioniert schon als
   mailto-Link.
5. **Domain-Entscheidung.** In den Dokumenten tauchten zwei Namen auf:
   „Bessere Welt ergärtnern“ (aktueller Name, hier verwendet) und
   „florafauna.pro“ (ältere Domain). Falls florafauna.pro weiterleben soll,
   ggf. als Weiterleitung einrichten.
6. **Weitere Pflanzenporträts.** Das Format (Steckbrief-Icons + Foto +
   Insekten-Bezug) ist als Content-Vorlage etabliert — weitere folgen, sobald
   mehr Material da ist.
